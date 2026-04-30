from pathlib import Path
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent


class AIService:
    """Service that loads and runs AI models for smart reply, toxicity detection, and summarization."""

    def __init__(self):
        model_dir = Path(settings.MODEL_DIR)
        if not model_dir.is_absolute():
            model_dir = PROJECT_ROOT / model_dir
        self.model_dir = model_dir
        self._smart_reply_predictor = None
        self._toxicity_predictor = None
        self._summarization_predictor = None

    def _ensure_models_dir(self):
        self.model_dir.mkdir(parents=True, exist_ok=True)

    def get_smart_replies(self, messages: list[str], num_replies: int = 3) -> list[str]:
        """Generate smart reply suggestions based on recent messages."""
        try:
            if self._smart_reply_predictor is None:
                from ai.smart_reply.inference.predict import SmartReplyPredictor
                self._smart_reply_predictor = SmartReplyPredictor(str(self.model_dir / "smart_reply"))
                logger.info("Smart reply model loaded successfully")
            return self._smart_reply_predictor.predict(messages, num_replies=num_replies)
        except Exception as e:
            logger.warning(f"Smart reply model failed: {e}")
            # Fallback: rule-based replies when model isn't available
            return self._fallback_smart_replies(messages)

    def _fallback_smart_replies(self, messages: list[str]) -> list[str]:
        """Rule-based fallback when ML model isn't available."""
        if not messages:
            return ["Hi there!", "Hello!", "Hey!"]

        last_msg = messages[-1].lower().strip()

        if any(q in last_msg for q in ["how are you", "how's it going", "what's up"]):
            return ["I'm doing great, thanks!", "Pretty good, you?", "All good here!"]
        elif any(q in last_msg for q in ["hello", "hi", "hey"]):
            return ["Hey! How are you?", "Hi there!", "Hello! What's up?"]
        elif "?" in last_msg:
            return ["Let me think about that.", "Good question!", "I'm not sure, what do you think?"]
        elif any(w in last_msg for w in ["thanks", "thank you", "thx"]):
            return ["You're welcome!", "No problem!", "Anytime!"]
        elif any(w in last_msg for w in ["bye", "goodbye", "see you"]):
            return ["Goodbye!", "See you later!", "Take care!"]
        elif any(w in last_msg for w in ["yes", "yeah", "sure", "ok"]):
            return ["Great!", "Sounds good!", "Perfect!"]
        elif any(w in last_msg for w in ["no", "nope", "nah"]):
            return ["Okay, no worries.", "That's fine.", "Understood."]
        else:
            return ["That's interesting!", "I see.", "Tell me more!"]

    def check_toxicity(self, text: str) -> dict:
        """Check if text is toxic."""
        try:
            if self._toxicity_predictor is None:
                from ai.toxicity.inference.predict import ToxicityPredictor
                self._toxicity_predictor = ToxicityPredictor(str(self.model_dir / "toxicity"))
                logger.info("Toxicity model loaded successfully")
            return self._toxicity_predictor.predict(text)
        except Exception as e:
            logger.warning(f"Toxicity model failed: {e}")
            return self._fallback_toxicity(text)

    def _fallback_toxicity(self, text: str) -> dict:
        """Rule-based toxicity detector.

        Used whenever the trained LSTM model isn't available (e.g. weights
        missing or torch not installed in the runtime). Combines a curated
        profanity wordlist (`better_profanity`, ~1500 entries) with simple
        heuristics: profane-token density, ALL-CAPS shouting, and
        character-repetition obfuscation (e.g. "loooser", "suuuck").
        """
        import re

        try:
            from shared.constants import TOXICITY_THRESHOLD
        except Exception:
            TOXICITY_THRESHOLD = 0.7

        if not text or not text.strip():
            return {"is_toxic": False, "confidence": 1.0, "label": "non-toxic"}

        raw_tokens = re.findall(r"[A-Za-z']+", text)
        if not raw_tokens:
            return {"is_toxic": False, "confidence": 1.0, "label": "non-toxic"}

        score = max(
            self._score_profanity(text, raw_tokens),
            self._score_shouting(raw_tokens),
        )
        score += self._score_obfuscation(text)
        score = max(0.0, min(score, 1.0))

        is_toxic = score >= TOXICITY_THRESHOLD
        confidence = score if is_toxic else 1.0 - score

        return {
            "is_toxic": is_toxic,
            "confidence": round(confidence, 4),
            "label": "toxic" if is_toxic else "non-toxic",
        }

    @staticmethod
    def _score_profanity(text: str, raw_tokens: list[str]) -> float:
        """Score from curated wordlist match (0.0 - 1.0)."""
        try:
            from better_profanity import profanity
        except Exception:
            return AIService._score_minimal_wordlist(text, raw_tokens)

        profane_hits = sum(
            1 for tok in raw_tokens if profanity.contains_profanity(tok)
        )
        if profane_hits > 0:
            density = profane_hits / len(raw_tokens)
            return min(0.80 + density * 0.20, 1.0)
        if profanity.contains_profanity(text):
            return 0.80
        return 0.0

    @staticmethod
    def _score_minimal_wordlist(text: str, raw_tokens: list[str]) -> float:
        """Fallback when better_profanity isn't installed."""
        minimal = {
            "hate", "kill", "stupid", "idiot", "dumb", "ugly", "loser",
            "die", "worst", "moron", "trash", "scum", "freak",
        }
        hits = sum(1 for t in raw_tokens if t.lower() in minimal)
        if "shut up" in text.lower():
            hits += 1
        if hits == 0:
            return 0.0
        return min(0.55 + 0.15 * hits, 1.0)

    @staticmethod
    def _score_shouting(raw_tokens: list[str]) -> float:
        """Score from aggressive ALL-CAPS shouting on multi-word messages."""
        if len(raw_tokens) < 3:
            return 0.0
        caps_tokens = sum(1 for t in raw_tokens if len(t) >= 3 and t.isupper())
        if caps_tokens / len(raw_tokens) >= 0.6:
            return 0.50
        return 0.0

    @staticmethod
    def _score_obfuscation(text: str) -> float:
        """Score bump from character repetition or censored profanity."""
        import re

        bump = 0.05 * len(re.findall(r"([A-Za-z])\1{3,}", text))
        if re.search(r"[A-Za-z]\*{2,}", text):
            bump += 0.7
        return bump

    def summarize_chat(self, messages: list[str], num_sentences: int = 5) -> str:
        """Summarize a list of chat messages using fine-tuned T5."""
        try:
            if self._summarization_predictor is None:
                from ai.summarization.inference.predict import SummarizationPredictor
                self._summarization_predictor = SummarizationPredictor(str(self.model_dir / "summarization"))
                logger.info("Summarization model loaded successfully")
            return self._summarization_predictor.predict(messages, num_sentences=num_sentences)
        except Exception as e:
            logger.warning(f"Summarization model failed: {e}")
            return "Summarization model is not available. Please ensure the T5 model files are in ai/saved_models/summarization/."


# Singleton instance
ai_service = AIService()
