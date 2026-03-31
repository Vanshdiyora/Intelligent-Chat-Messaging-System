import torch
from pathlib import Path
from ai.toxicity.model.lstm_classifier import ToxicityLSTM
from ai.toxicity.utils.vocabulary import ToxicityVocabulary


class ToxicityPredictor:
    """Loads a trained toxicity detection model and predicts toxicity."""

    LABELS = ["non-toxic", "toxic"]

    def __init__(self, model_dir: str):
        self.model_dir = Path(model_dir)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.vocab = ToxicityVocabulary()
        self.model = None
        self._load()

    def _load(self):
        vocab_path = self.model_dir / "vocab.json"
        model_path = self.model_dir / "model.pt"

        if not vocab_path.exists() or not model_path.exists():
            raise FileNotFoundError(f"Model files not found in {self.model_dir}")

        self.vocab.load(str(vocab_path))

        self.model = ToxicityLSTM(vocab_size=len(self.vocab))
        self.model.load_state_dict(torch.load(str(model_path), map_location=self.device))
        self.model.to(self.device)
        self.model.eval()

    def predict(self, text: str) -> dict:
        """Predict toxicity of a text string."""
        input_ids = torch.tensor([self.vocab.encode(text)]).to(self.device)

        with torch.no_grad():
            logits = self.model(input_ids)
            probs = torch.softmax(logits, dim=-1)
            predicted_class = probs.argmax(dim=-1).item()
            confidence = probs[0][predicted_class].item()

        return {
            "is_toxic": predicted_class == 1,
            "confidence": round(confidence, 4),
            "label": self.LABELS[predicted_class],
        }
