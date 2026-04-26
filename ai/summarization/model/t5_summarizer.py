import os
import requests
import logging

logger = logging.getLogger(__name__)

# ── HuggingFace Space API ──
HF_SPACE = os.environ.get("SUMMARIZATION_HF_SPACE", "vanshdiyora/chat-summary-api")
HF_SPACE_URL = f"https://{HF_SPACE.replace('/', '-')}.hf.space/api/predict"
HF_TOKEN = os.environ.get("HF_TOKEN", None)


class T5Summarizer:
    """Abstractive summarization via HuggingFace Space API.

    Calls a Gradio Space running the fine-tuned T5 model.
    No local model loading — runs on HF Space servers (free, 16GB RAM).
    """

    def __init__(self, model_dir: str = None):
        self.headers = {}
        if HF_TOKEN:
            self.headers["Authorization"] = f"Bearer {HF_TOKEN}"

    def load(self):
        """No-op — model runs on HuggingFace Space."""
        logger.info(f"Using HuggingFace Space API: {HF_SPACE_URL}")

    def summarize(self, text: str, **kwargs) -> str:
        """Generate a summary by calling the HuggingFace Space API.

        Args:
            text: The input text (chat conversation) to summarize.

        Returns:
            The generated summary string.
        """
        payload = {
            "data": [text],
        }

        try:
            response = requests.post(
                HF_SPACE_URL,
                headers=self.headers,
                json=payload,
                timeout=120,
            )
            response.raise_for_status()
            result = response.json()

            # Gradio API returns {"data": ["summary text"]}
            if "data" in result and len(result["data"]) > 0:
                return result["data"][0]
            return str(result)

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 503:
                logger.warning("HF Space is sleeping/loading, retrying...")
                return "Model is warming up, please try again in a few seconds."
            logger.error(f"HF Space API error: {e}")
            raise
        except Exception as e:
            logger.error(f"HF Space API request failed: {e}")
            raise
