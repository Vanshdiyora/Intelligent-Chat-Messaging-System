import os
import json
import numpy as np
from pathlib import Path
from app.core.config import settings


class AIService:
    """Service that loads and runs AI models for smart reply, toxicity detection, and summarization."""

    def __init__(self):
        self.model_dir = Path(settings.MODEL_DIR)
        self._smart_reply_model = None
        self._toxicity_model = None
        self._models_loaded = False

    def _ensure_models_dir(self):
        self.model_dir.mkdir(parents=True, exist_ok=True)

    def get_smart_replies(self, messages: list[str], num_replies: int = 3) -> list[str]:
        """Generate smart reply suggestions based on recent messages."""
        try:
            from ai.smart_reply.inference.predict import SmartReplyPredictor
            predictor = SmartReplyPredictor(str(self.model_dir / "smart_reply"))
            return predictor.predict(messages, num_replies=num_replies)
        except Exception:
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
            from ai.toxicity.inference.predict import ToxicityPredictor
            predictor = ToxicityPredictor(str(self.model_dir / "toxicity"))
            return predictor.predict(text)
        except Exception:
            return self._fallback_toxicity(text)

    def _fallback_toxicity(self, text: str) -> dict:
        """Rule-based fallback toxicity check."""
        toxic_words = [
            "hate", "kill", "stupid", "idiot", "dumb", "ugly",
            "loser", "shut up", "die", "worst", "terrible",
        ]
        text_lower = text.lower()
        toxic_count = sum(1 for word in toxic_words if word in text_lower)
        score = min(toxic_count * 0.25, 1.0)

        return {
            "is_toxic": score >= 0.5,
            "confidence": score if score >= 0.5 else 1.0 - score,
            "label": "toxic" if score >= 0.5 else "non-toxic",
        }

    def summarize_chat(self, messages: list[str], num_sentences: int = 5) -> str:
        """Summarize a list of chat messages."""
        try:
            from ai.summarization.inference.predict import SummarizationPredictor
            predictor = SummarizationPredictor(str(self.model_dir / "summarization"))
            return predictor.predict(messages, num_sentences=num_sentences)
        except Exception:
            return self._fallback_summarize(messages, num_sentences)

    def _fallback_summarize(self, messages: list[str], num_sentences: int = 5) -> str:
        """Extractive summarization fallback using simple TextRank-like scoring."""
        if not messages:
            return "No messages to summarize."

        if len(messages) <= num_sentences:
            return " ".join(messages)

        # Simple frequency-based scoring
        all_text = " ".join(messages).lower()
        words = all_text.split()
        word_freq = {}
        for word in words:
            word = word.strip(".,!?;:'\"")
            if len(word) > 3:
                word_freq[word] = word_freq.get(word, 0) + 1

        # Score each message
        scored = []
        for i, msg in enumerate(messages):
            msg_words = msg.lower().split()
            score = sum(word_freq.get(w.strip(".,!?;:'\""), 0) for w in msg_words)
            # Boost recent messages slightly
            score *= (1 + i / len(messages) * 0.3)
            scored.append((score, i, msg))

        scored.sort(reverse=True)
        top = sorted(scored[:num_sentences], key=lambda x: x[1])
        return " ".join(item[2] for item in top)


# Singleton instance
ai_service = AIService()
