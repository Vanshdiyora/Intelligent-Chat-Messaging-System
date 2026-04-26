import logging
from ai.summarization.model.t5_summarizer import T5Summarizer

logger = logging.getLogger(__name__)


class SummarizationPredictor:
    """Summarizes chat conversations using a fine-tuned T5 model."""

    def __init__(self, model_dir: str = None):
        self.model_dir = model_dir
        self.t5_summarizer = T5Summarizer(model_dir)
        self.t5_summarizer.load()
        logger.info("T5 summarization model loaded successfully")

    def predict(self, messages: list[str], num_sentences: int = 5) -> str:
        """Summarize a list of chat messages."""
        if not messages:
            return "No messages to summarize."

        dialogue = "\n".join(messages)
        return self.t5_summarizer.summarize(dialogue)
