import os
import requests
import logging

logger = logging.getLogger(__name__)

# ── HuggingFace Inference API ──
HF_REPO_ID = os.environ.get("SUMMARIZATION_HF_REPO", "vanshdiyora/chat-summary")
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_REPO_ID}"
HF_TOKEN = os.environ.get("HF_TOKEN", None)


class T5Summarizer:
    """Abstractive summarization via HuggingFace Inference API.

    Calls the HF Inference API for the fine-tuned T5 model hosted at
    vanshdiyora/chat-summary. No local model loading — runs on HF servers.
    """

    def __init__(self, model_dir: str = None):
        self.prefix = "summarize: "
        self.headers = {}
        if HF_TOKEN:
            self.headers["Authorization"] = f"Bearer {HF_TOKEN}"

    def load(self):
        """No-op — model runs on HuggingFace servers."""
        logger.info(f"Using HuggingFace Inference API: {HF_API_URL}")

    def summarize(self, text: str, **kwargs) -> str:
        """Generate a summary by calling the HuggingFace Inference API.

        Args:
            text: The input text (chat conversation) to summarize.

        Returns:
            The generated summary string.
        """
        input_text = self.prefix + text

        payload = {
            "inputs": input_text,
            "parameters": {
                "max_length": 128,
                "num_beams": 4,
                "no_repeat_ngram_size": 3,
                "early_stopping": True,
            },
        }

        try:
            response = requests.post(
                HF_API_URL,
                headers=self.headers,
                json=payload,
                timeout=60,
            )
            response.raise_for_status()
            result = response.json()

            # HF API returns [{"summary_text": "..."}] or [{"generated_text": "..."}]
            if isinstance(result, list) and len(result) > 0:
                return result[0].get("summary_text") or result[0].get("generated_text", "")
            return str(result)

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 503:
                # Model is loading on HF servers (cold start)
                logger.warning("HF model is loading, retrying...")
                return "Model is warming up, please try again in a few seconds."
            logger.error(f"HF Inference API error: {e}")
            raise
        except Exception as e:
            logger.error(f"HF Inference API request failed: {e}")
            raise
