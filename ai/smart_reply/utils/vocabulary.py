import json
import re
from collections import Counter
from pathlib import Path


class Vocabulary:
    """Simple vocabulary for tokenization."""

    PAD_TOKEN = "<PAD>"
    SOS_TOKEN = "<SOS>"
    EOS_TOKEN = "<EOS>"
    UNK_TOKEN = "<UNK>"

    def __init__(self, max_vocab_size: int = 10000):
        self.word2idx = {self.PAD_TOKEN: 0, self.SOS_TOKEN: 1, self.EOS_TOKEN: 2, self.UNK_TOKEN: 3}
        self.idx2word = {0: self.PAD_TOKEN, 1: self.SOS_TOKEN, 2: self.EOS_TOKEN, 3: self.UNK_TOKEN}
        self.word_count = Counter()
        self.max_vocab_size = max_vocab_size

    def build_from_texts(self, texts: list[str]):
        for text in texts:
            tokens = self.tokenize(text)
            self.word_count.update(tokens)

        most_common = self.word_count.most_common(self.max_vocab_size - 4)
        for word, _ in most_common:
            idx = len(self.word2idx)
            self.word2idx[word] = idx
            self.idx2word[idx] = word

    @staticmethod
    def tokenize(text: str) -> list[str]:
        text = text.lower().strip()
        text = re.sub(r"[^a-zA-Z0-9\s'?!.,]", "", text)
        return text.split()

    def encode(self, text: str, max_len: int = 30) -> list[int]:
        tokens = self.tokenize(text)
        ids = [self.word2idx.get(t, self.word2idx[self.UNK_TOKEN]) for t in tokens[:max_len - 2]]
        ids = [self.word2idx[self.SOS_TOKEN]] + ids + [self.word2idx[self.EOS_TOKEN]]
        # Pad
        ids += [self.word2idx[self.PAD_TOKEN]] * (max_len - len(ids))
        return ids

    def decode(self, ids: list[int]) -> str:
        words = []
        for idx in ids:
            word = self.idx2word.get(idx, self.UNK_TOKEN)
            if word == self.EOS_TOKEN:
                break
            if word not in (self.PAD_TOKEN, self.SOS_TOKEN):
                words.append(word)
        return " ".join(words)

    def save(self, path: str):
        data = {"word2idx": self.word2idx, "idx2word": {str(k): v for k, v in self.idx2word.items()}}
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        with open(path, "w") as f:
            json.dump(data, f)

    def load(self, path: str):
        with open(path, "r") as f:
            data = json.load(f)
        self.word2idx = data["word2idx"]
        self.idx2word = {int(k): v for k, v in data["idx2word"].items()}

    def __len__(self):
        return len(self.word2idx)
