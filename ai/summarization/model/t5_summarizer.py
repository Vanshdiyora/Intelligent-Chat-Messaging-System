import os
import torch
from pathlib import Path
from transformers import T5ForConditionalGeneration, AutoTokenizer
import logging

logger = logging.getLogger(__name__)

# ── Your Hugging Face model repo (private) ──
HF_REPO_ID = os.environ.get("SUMMARIZATION_HF_REPO", "vanshdiyora/chat-summary")
HF_TOKEN = os.environ.get("HF_TOKEN", None)


class T5Summarizer:
    """Abstractive summarization using a fine-tuned T5 model.

    Loads a T5 model fine-tuned on SAMSum (chat → summary pairs)
    and generates abstractive summaries for chat conversations.

    Loading priority:
        1. Local model_dir (if model files exist there)
        2. Hugging Face Hub (HF_REPO_ID) — downloaded & cached automatically
    """

    def __init__(self, model_dir: str):
        self.model_dir = model_dir
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.tokenizer = None
        self.prefix = "summarize: "
        self.max_input_length = 512
        self.max_target_length = 128

    def _local_model_exists(self) -> bool:
        """Check if model weight files exist locally."""
        model_path = Path(self.model_dir)
        if not model_path.exists():
            return False
        weight_files = list(model_path.glob("model.safetensors")) + list(model_path.glob("pytorch_model.bin"))
        return len(weight_files) > 0

    def load(self):
        """Load the fine-tuned T5 model and tokenizer.

        Tries local path first; falls back to Hugging Face Hub.
        """
        if self._local_model_exists():
            source = self.model_dir
            logger.info(f"Loading T5 summarization model from local path: {source}")
        else:
            source = HF_REPO_ID
            logger.info(f"Local model not found at {self.model_dir}. "
                        f"Downloading from Hugging Face Hub: {source}")

        token = HF_TOKEN if source == HF_REPO_ID else None
        self.tokenizer = AutoTokenizer.from_pretrained(source, token=token)
        self.model = T5ForConditionalGeneration.from_pretrained(source, token=token)
        self.model.to(self.device)
        self.model.eval()
        logger.info(f"T5 summarization model loaded on {self.device} (source: {source})")

    def summarize(self, text: str, num_beams: int = 4, length_penalty: float = 1.0) -> str:
        """Generate an abstractive summary for the given text.

        Args:
            text: The input text (chat conversation) to summarize.
            num_beams: Number of beams for beam search.
            length_penalty: Length penalty for beam search.

        Returns:
            The generated summary string.
        """
        if self.model is None:
            self.load()

        input_text = self.prefix + text
        inputs = self.tokenizer(
            input_text,
            max_length=self.max_input_length,
            truncation=True,
            return_tensors="pt",
        ).to(self.device)

        with torch.no_grad():
            output_ids = self.model.generate(
                **inputs,
                max_length=self.max_target_length,
                num_beams=num_beams,
                length_penalty=length_penalty,
                early_stopping=True,
                no_repeat_ngram_size=3,
            )

        return self.tokenizer.decode(output_ids[0], skip_special_tokens=True)
