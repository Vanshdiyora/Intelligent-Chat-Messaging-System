import torch
import json
from pathlib import Path
from ai.smart_reply.model.seq2seq import Seq2SeqModel
from ai.smart_reply.utils.vocabulary import Vocabulary


class SmartReplyPredictor:
    """Loads a trained Seq2Seq model and generates reply suggestions."""

    def __init__(self, model_dir: str):
        self.model_dir = Path(model_dir)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.vocab = Vocabulary()
        self.model = None
        self._load()

    def _load(self):
        vocab_path = self.model_dir / "vocab.json"
        model_path = self.model_dir / "model.pt"

        if not vocab_path.exists() or not model_path.exists():
            raise FileNotFoundError(f"Model files not found in {self.model_dir}")

        self.vocab.load(str(vocab_path))

        self.model = Seq2SeqModel(vocab_size=len(self.vocab))
        self.model.load_state_dict(torch.load(str(model_path), map_location=self.device))
        self.model.to(self.device)
        self.model.eval()

    def predict(self, messages: list[str], num_replies: int = 3, max_len: int = 30) -> list[str]:
        """Generate reply suggestions given a list of recent messages."""
        context = " ".join(messages[-3:])  # Use last 3 messages as context
        input_ids = torch.tensor([self.vocab.encode(context, max_len=30)]).to(self.device)

        replies = []
        for _ in range(num_replies):
            reply_ids = self._generate(input_ids, max_len)
            reply_text = self.vocab.decode(reply_ids)
            if reply_text and reply_text not in replies:
                replies.append(reply_text)

        return replies if replies else ["I see.", "Tell me more!", "Interesting!"]

    def _generate(self, src: torch.Tensor, max_len: int = 30) -> list[int]:
        with torch.no_grad():
            _, hidden, cell = self.model.encoder(src)

            input_token = torch.tensor([self.vocab.word2idx[Vocabulary.SOS_TOKEN]]).to(self.device)
            generated = []

            for _ in range(max_len):
                output, hidden, cell = self.model.decoder(input_token, hidden, cell)
                # Add temperature sampling for diversity
                probs = torch.softmax(output / 0.8, dim=-1)
                next_token = torch.multinomial(probs, 1).squeeze(-1)
                token_id = next_token.item()

                if token_id == self.vocab.word2idx[Vocabulary.EOS_TOKEN]:
                    break
                generated.append(token_id)
                input_token = next_token

            return generated
