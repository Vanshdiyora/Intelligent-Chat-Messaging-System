import torch
from transformers import T5ForConditionalGeneration, T5Tokenizer
import logging

logger = logging.getLogger(__name__)


class T5Summarizer:
    """Abstractive summarization using a fine-tuned T5 model.

    Loads a T5 model fine-tuned on SAMSum (chat → summary pairs)
    and generates abstractive summaries for chat conversations.
    """

    def __init__(self, model_dir: str):
        self.model_dir = model_dir
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.tokenizer = None
        self.prefix = "summarize: "
        self.max_input_length = 512
        self.max_target_length = 128

    def load(self):
        """Load the fine-tuned T5 model and tokenizer."""
        logger.info(f"Loading T5 summarization model from {self.model_dir}")
        self.tokenizer = T5Tokenizer.from_pretrained(self.model_dir, legacy=False)
        self.model = T5ForConditionalGeneration.from_pretrained(self.model_dir)
        self.model.to(self.device)
        self.model.eval()
        logger.info(f"T5 summarization model loaded on {self.device}")

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
