import os
import requests
import logging

logger = logging.getLogger(__name__)

# ── HuggingFace Space API (Gradio 5.x) ──
HF_SPACE = os.environ.get("SUMMARIZATION_HF_SPACE", "vanshdiyora/chat-summary-api")
HF_SPACE_BASE = f"https://{HF_SPACE.replace('/', '-')}.hf.space"
HF_TOKEN = os.environ.get("HF_TOKEN", None)


class T5Summarizer:
    """Abstractive summarization via HuggingFace Space API.

    Calls a Gradio Space running the fine-tuned T5 model.
    No local model loading — runs on HF Space servers (free, 16GB RAM).
    Uses the Gradio 5.x two-step API (call → fetch result).
    """

    def __init__(self, model_dir: str = None):
        self.headers = {"Content-Type": "application/json"}
        if HF_TOKEN:
            self.headers["Authorization"] = f"Bearer {HF_TOKEN}"

    def load(self):
        """No-op — model runs on HuggingFace Space."""
        logger.info(f"Using HuggingFace Space API: {HF_SPACE_BASE}")

    def summarize(self, text: str, **kwargs) -> str:
        """Generate a summary by calling the HuggingFace Space API.

        Gradio 5.x API:
          1. POST /gradio_api/call/predict → {"event_id": "..."}
          2. GET  /gradio_api/call/predict/{event_id} → SSE stream with result
        """
        call_url = f"{HF_SPACE_BASE}/gradio_api/call/predict"

        try:
            # Step 1: Submit the request
            response = requests.post(
                call_url,
                headers=self.headers,
                json={"data": [text]},
                timeout=30,
            )
            response.raise_for_status()
            event_id = response.json().get("event_id")

            if not event_id:
                logger.error(f"No event_id in response: {response.json()}")
                raise ValueError("Failed to get event_id from Gradio API")

            # Step 2: Fetch the result (SSE stream)
            result_url = f"{call_url}/{event_id}"
            result_response = requests.get(
                result_url,
                headers={"Authorization": self.headers.get("Authorization", "")},
                timeout=120,
                stream=True,
            )
            result_response.raise_for_status()

            # Parse SSE stream — look for "event: complete" data line
            for line in result_response.iter_lines(decode_unicode=True):
                if line and line.startswith("data:"):
                    data_str = line[len("data:"):].strip()
                    try:
                        import json
                        data = json.loads(data_str)
                        # Gradio returns data as a list: [summary_text]
                        if isinstance(data, list) and len(data) > 0:
                            return data[0]
                        return str(data)
                    except (json.JSONDecodeError, TypeError):
                        continue

            return "Could not parse summarization result."

        except requests.exceptions.HTTPError as e:
            status = e.response.status_code if e.response is not None else "unknown"
            if status == 503:
                logger.warning("HF Space is sleeping/loading...")
                return "Model is warming up, please try again in a few seconds."
            logger.error(f"HF Space API error ({status}): {e}")
            raise
        except Exception as e:
            logger.error(f"HF Space API request failed: {e}")
            raise
