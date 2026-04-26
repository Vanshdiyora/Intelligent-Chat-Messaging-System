import os
import logging
from gradio_client import Client

logger = logging.getLogger(__name__)

# ── HuggingFace Space (Gradio Client) ──
HF_SPACE = os.environ.get("SUMMARIZATION_HF_SPACE", "vanshdiyora/chat-summary-api")
HF_TOKEN = os.environ.get("HF_TOKEN", None)


class T5Summarizer:
    """Abstractive summarization via HuggingFace Space using Gradio Client.

    Calls a Gradio Space running the fine-tuned T5 model.
    No local model loading — runs on HF Space servers.
    """

    def __init__(self, model_dir: str = None):
        self.client = None

    def load(self):
        """Initialize the Gradio client."""
        logger.info(f"Connecting to HuggingFace Space: {HF_SPACE}")
        self.client = Client(HF_SPACE, hf_token=HF_TOKEN)
        logger.info("Gradio client connected")

    def summarize(self, text: str, **kwargs) -> str:
        """Generate a summary by calling the HuggingFace Space."""
        if self.client is None:
            self.load()

        try:
            result = self.client.predict(
                text,
                api_name="/summarize",
            )
            return result

        except Exception as e:
            logger.error(f"HF Space API request failed: {e}")
            raise
