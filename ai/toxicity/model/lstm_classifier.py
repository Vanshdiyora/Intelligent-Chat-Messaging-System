import torch
import torch.nn as nn


class ToxicityLSTM(nn.Module):
    """LSTM-based text classifier for toxicity detection."""

    def __init__(
        self,
        vocab_size: int,
        embed_dim: int = 100,
        hidden_dim: int = 128,
        num_layers: int = 2,
        dropout: float = 0.3,
        num_classes: int = 2,
    ):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(
            embed_dim, hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if num_layers > 1 else 0,
        )
        self.dropout = nn.Dropout(dropout)
        self.fc = nn.Linear(hidden_dim * 2, num_classes)  # *2 for bidirectional

    def forward(self, x):
        embedded = self.dropout(self.embedding(x))
        lstm_out, (hidden, _) = self.lstm(embedded)

        # Concatenate final forward and backward hidden states
        hidden_fwd = hidden[-2]
        hidden_bwd = hidden[-1]
        hidden_cat = torch.cat((hidden_fwd, hidden_bwd), dim=1)

        out = self.dropout(hidden_cat)
        out = self.fc(out)
        return out
