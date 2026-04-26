import torch
import torch.nn.functional as F
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
        # Use only the last message — model was trained on single-turn pairs
        context = messages[-1] if messages else ""
        input_ids = torch.tensor([self.vocab.encode(context, max_len=30)]).to(self.device)

        replies = []
        # Vary temperature across attempts for diversity
        temperatures = [0.6, 0.8, 1.0, 0.7, 0.9]
        for i in range(num_replies * 2):  # extra attempts in case of duplicates
            temp = temperatures[i % len(temperatures)]
            reply_ids = self._generate(input_ids, max_len, temperature=temp)
            reply_text = self.vocab.decode(reply_ids)
            if reply_text and reply_text not in replies:
                replies.append(reply_text)
            if len(replies) >= num_replies:
                break

        return replies if replies else ["I see.", "Tell me more!", "Interesting!"]

    def _generate(self, src: torch.Tensor, max_len: int = 30,
                  temperature: float = 0.8, top_k: int = 30, top_p: float = 0.9,
                  repetition_penalty: float = 1.3) -> list[int]:
        with torch.no_grad():
            encoder_outputs, src_pad_mask = self.model.encoder(src)

            generated = [self.vocab.word2idx[Vocabulary.SOS_TOKEN]]

            for _ in range(max_len):
                trg_tensor = torch.tensor([generated]).to(self.device)
                output = self.model.decoder(trg_tensor, encoder_outputs, src_pad_mask)
                logits = output[0, -1]  # (vocab_size,)

                # Repetition penalty — reduce score of already-generated tokens
                for token_id in set(generated):
                    if logits[token_id] > 0:
                        logits[token_id] /= repetition_penalty
                    else:
                        logits[token_id] *= repetition_penalty

                # Temperature scaling
                logits = logits / temperature

                # Top-k filtering
                if top_k > 0:
                    top_k_vals, _ = torch.topk(logits, min(top_k, logits.size(-1)))
                    min_top_k = top_k_vals[-1]
                    logits[logits < min_top_k] = float('-inf')

                # Top-p (nucleus) filtering
                if top_p < 1.0:
                    sorted_logits, sorted_indices = torch.sort(logits, descending=True)
                    cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
                    # Remove tokens with cumulative probability above the threshold
                    sorted_indices_to_remove = cumulative_probs > top_p
                    sorted_indices_to_remove[1:] = sorted_indices_to_remove[:-1].clone()
                    sorted_indices_to_remove[0] = False
                    indices_to_remove = sorted_indices[sorted_indices_to_remove]
                    logits[indices_to_remove] = float('-inf')

                probs = F.softmax(logits, dim=-1)
                next_token = torch.multinomial(probs, 1).item()

                if next_token == self.vocab.word2idx[Vocabulary.EOS_TOKEN]:
                    break
                generated.append(next_token)

            return generated[1:]  # skip SOS
