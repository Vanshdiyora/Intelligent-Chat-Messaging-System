import torch
import torch.nn as nn
import math


class PositionalEncoding(nn.Module):
    """Sinusoidal positional encoding."""

    def __init__(self, d_model: int, max_len: int = 512, dropout: float = 0.1):
        super().__init__()
        self.dropout = nn.Dropout(dropout)
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)  # (1, max_len, d_model)
        self.register_buffer('pe', pe)

    def forward(self, x):
        x = x + self.pe[:, :x.size(1)]
        return self.dropout(x)


class Encoder(nn.Module):
    """Transformer Encoder for Seq2Seq Smart Reply model."""

    def __init__(self, vocab_size: int, embed_dim: int, hidden_dim: int, num_heads: int = 4,
                 num_layers: int = 2, dropout: float = 0.1, pretrained_embeddings=None):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        if pretrained_embeddings is not None:
            self.embedding.weight = nn.Parameter(torch.tensor(pretrained_embeddings, dtype=torch.float32))
            self.embedding.weight.requires_grad = True
        self.embed_proj = nn.Linear(embed_dim, hidden_dim)
        self.pos_encoding = PositionalEncoding(hidden_dim, dropout=dropout)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_dim, nhead=num_heads,
            dim_feedforward=hidden_dim * 4, dropout=dropout, batch_first=True
        )
        self.transformer_encoder = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        pad_mask = (x == 0)
        embedded = self.dropout(self.embedding(x))
        embedded = self.embed_proj(embedded)
        embedded = self.pos_encoding(embedded)
        encoder_outputs = self.transformer_encoder(embedded, src_key_padding_mask=pad_mask)
        return encoder_outputs, pad_mask


class Decoder(nn.Module):
    """Transformer Decoder with cross-attention for Seq2Seq Smart Reply model."""

    def __init__(self, vocab_size: int, embed_dim: int, hidden_dim: int, num_heads: int = 4,
                 num_layers: int = 2, dropout: float = 0.1, pretrained_embeddings=None):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        if pretrained_embeddings is not None:
            self.embedding.weight = nn.Parameter(torch.tensor(pretrained_embeddings, dtype=torch.float32))
            self.embedding.weight.requires_grad = True
        self.embed_proj = nn.Linear(embed_dim, hidden_dim)
        self.pos_encoding = PositionalEncoding(hidden_dim, dropout=dropout)
        decoder_layer = nn.TransformerDecoderLayer(
            d_model=hidden_dim, nhead=num_heads,
            dim_feedforward=hidden_dim * 4, dropout=dropout, batch_first=True
        )
        self.transformer_decoder = nn.TransformerDecoder(decoder_layer, num_layers=num_layers)
        self.fc_out = nn.Linear(hidden_dim, vocab_size)
        self.dropout = nn.Dropout(dropout)

    def forward(self, trg, encoder_outputs, src_pad_mask=None):
        trg_pad_mask = (trg == 0)
        trg_len = trg.shape[1]
        causal_mask = nn.Transformer.generate_square_subsequent_mask(trg_len).to(trg.device)
        embedded = self.dropout(self.embedding(trg))
        embedded = self.embed_proj(embedded)
        embedded = self.pos_encoding(embedded)
        output = self.transformer_decoder(
            embedded, encoder_outputs,
            tgt_mask=causal_mask,
            tgt_key_padding_mask=trg_pad_mask,
            memory_key_padding_mask=src_pad_mask
        )
        return self.fc_out(output)


class Seq2SeqModel(nn.Module):
    """Seq2Seq model with Transformer encoder-decoder and multi-head attention for smart reply generation."""

    def __init__(self, vocab_size: int, embed_dim: int = 100, hidden_dim: int = 256, num_heads: int = 4,
                 num_layers: int = 2, dropout: float = 0.1, pretrained_embeddings=None):
        super().__init__()
        self.encoder = Encoder(vocab_size, embed_dim, hidden_dim, num_heads, num_layers, dropout, pretrained_embeddings)
        self.decoder = Decoder(vocab_size, embed_dim, hidden_dim, num_heads, num_layers, dropout, pretrained_embeddings)
        self.vocab_size = vocab_size

    def forward(self, src, trg, teacher_forcing_ratio: float = 0.5):
        batch_size = trg.shape[0]

        encoder_outputs, src_pad_mask = self.encoder(src)

        # Decoder input: shift right [SOS, t1, ..., tN-1]
        decoder_input = trg[:, :-1]
        decoder_output = self.decoder(decoder_input, encoder_outputs, src_pad_mask)
        # decoder_output: (batch, trg_len-1, vocab)

        # Pad position 0 with zeros to keep shape (batch, trg_len, vocab) for training loop compat
        pad = torch.zeros(batch_size, 1, self.vocab_size).to(src.device)
        outputs = torch.cat([pad, decoder_output], dim=1)
        return outputs
