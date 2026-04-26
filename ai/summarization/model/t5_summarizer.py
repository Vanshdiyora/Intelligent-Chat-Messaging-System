import os
import requests
import logging

logger = logging.getLogger(__name__)

# ── HuggingFace Inference API via Space ──
HF_API_URL = os.environ.get(
    "SUMMARIZATION_API_URL",
    "https://api-inference.huggingface.co/models/vanshdiyora/chat-summary-api",
)
HF_TOKEN = os.environ.get("HF_TOKEN", None)


class T5Summarizer:
    """Abstractive summarization via HuggingFace Inference API.

    Calls the HF Inference API for the T5 model running on a HuggingFace Space.
    No local model loading — runs on HF servers.
    """

    def __init__(self, model_dir: str = None):
        self.headers = {}
        if HF_TOKEN:
            self.headers["Authorization"] = f"Bearer {HF_TOKEN}"

    def load(self):
        """No-op — model runs on HuggingFace servers."""
        logger.info(f"Using HuggingFace Inference API: {HF_API_URL}")

    def summarize(self, text: str, **kwargs) -> str:
        """Generate a summary by calling the HuggingFace Inference API."""
        try:
            response = requests.post(
                HF_API_URL,
                headers=self.headers,
                json={"inputs": text},
                timeout=120,
            )
            response.raise_for_status()
            result = response.json()

            # HF returns [{"summary_text": "..."}] or [{"generated_text": "..."}]
            if isinstance(result, list) and len(result) > 0:
                return result[0].get("summary_text") or result[0].get("generated_text", "")
            return str(result)

        except requests.exceptions.HTTPError as e:
            status = e.response.status_code if e.response is not None else "unknown"
            if status == 503:
                logger.warning("HF model is loading, please retry...")
                return "Model is warming up, please try again in a few seconds."
            logger.error(f"HF Inference API error ({status}): {e}")
            raise
        except Exception as e:
            logger.error(f"HF Inference API request failed: {e}")
            raise
