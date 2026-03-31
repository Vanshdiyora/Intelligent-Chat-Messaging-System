import re
from collections import Counter


def clean_text(text: str) -> str:
    """Basic text cleaning for ML preprocessing."""
    text = text.lower().strip()
    text = re.sub(r"http\S+|www\S+|https\S+", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def build_word_freq(texts: list[str]) -> Counter:
    """Build word frequency counter from a list of texts."""
    counter = Counter()
    for text in texts:
        tokens = clean_text(text).split()
        counter.update(tokens)
    return counter
