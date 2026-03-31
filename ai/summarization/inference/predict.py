from pathlib import Path
from ai.summarization.model.textrank import TextRankSummarizer


class SummarizationPredictor:
    """Summarizes chat conversations using TextRank extractive summarization."""

    def __init__(self, model_dir: str = None):
        self.summarizer = TextRankSummarizer()

    def predict(self, messages: list[str], num_sentences: int = 5) -> str:
        """Summarize a list of chat messages."""
        if not messages:
            return "No messages to summarize."

        # Filter out very short messages and format them
        meaningful_messages = [m for m in messages if len(m.split()) > 2]

        if not meaningful_messages:
            return " ".join(messages[:num_sentences])

        return self.summarizer.summarize(meaningful_messages, num_sentences=num_sentences)
