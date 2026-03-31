import torch
import torch.nn as nn


class Encoder(nn.Module):
    """LSTM Encoder for Seq2Seq Smart Reply model."""

    def __init__(self, vocab_size: int, embed_dim: int, hidden_dim: int, num_layers: int = 1, dropout: float = 0.1):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, num_layers=num_layers, batch_first=True, dropout=dropout if num_layers > 1 else 0)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        embedded = self.dropout(self.embedding(x))
        outputs, (hidden, cell) = self.lstm(embedded)
        return outputs, hidden, cell


class Decoder(nn.Module):
    """LSTM Decoder for Seq2Seq Smart Reply model."""

    def __init__(self, vocab_size: int, embed_dim: int, hidden_dim: int, num_layers: int = 1, dropout: float = 0.1):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, num_layers=num_layers, batch_first=True, dropout=dropout if num_layers > 1 else 0)
        self.fc_out = nn.Linear(hidden_dim, vocab_size)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x, hidden, cell):
        embedded = self.dropout(self.embedding(x.unsqueeze(1)))
        output, (hidden, cell) = self.lstm(embedded, (hidden, cell))
        prediction = self.fc_out(output.squeeze(1))
        return prediction, hidden, cell


class Seq2SeqModel(nn.Module):
    """Seq2Seq model with LSTM encoder-decoder for smart reply generation."""

    def __init__(self, vocab_size: int, embed_dim: int = 128, hidden_dim: int = 256, num_layers: int = 2, dropout: float = 0.1):
        super().__init__()
        self.encoder = Encoder(vocab_size, embed_dim, hidden_dim, num_layers, dropout)
        self.decoder = Decoder(vocab_size, embed_dim, hidden_dim, num_layers, dropout)
        self.vocab_size = vocab_size

    def forward(self, src, trg, teacher_forcing_ratio: float = 0.5):
        batch_size = trg.shape[0]
        trg_len = trg.shape[1]

        outputs = torch.zeros(batch_size, trg_len, self.vocab_size).to(src.device)
        _, hidden, cell = self.encoder(src)

        input_token = trg[:, 0]  # <SOS> token

        for t in range(1, trg_len):
            output, hidden, cell = self.decoder(input_token, hidden, cell)
            outputs[:, t] = output

            if torch.rand(1).item() < teacher_forcing_ratio:
                input_token = trg[:, t]
            else:
                input_token = output.argmax(1)

        return outputs
