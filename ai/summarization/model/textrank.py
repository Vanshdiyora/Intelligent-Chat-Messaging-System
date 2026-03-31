import numpy as np
import re
from collections import Counter


class TextRankSummarizer:
    """Extractive summarization using TextRank algorithm.

    This implementation builds a similarity graph between sentences
    and uses a PageRank-like algorithm to score and select the most
    important sentences.
    """

    def __init__(self, damping: float = 0.85, min_diff: float = 1e-5, max_iter: int = 100):
        self.damping = damping
        self.min_diff = min_diff
        self.max_iter = max_iter

    def summarize(self, sentences: list[str], num_sentences: int = 5) -> str:
        if len(sentences) <= num_sentences:
            return " ".join(sentences)

        # Build similarity matrix
        sim_matrix = self._build_similarity_matrix(sentences)

        # Apply PageRank
        scores = self._pagerank(sim_matrix)

        # Get top sentences preserving order
        ranked_indices = np.argsort(scores)[::-1][:num_sentences]
        ranked_indices = sorted(ranked_indices)

        summary_sentences = [sentences[i] for i in ranked_indices]
        return " ".join(summary_sentences)

    def _build_similarity_matrix(self, sentences: list[str]) -> np.ndarray:
        n = len(sentences)
        sim_matrix = np.zeros((n, n))

        # Tokenize sentences
        tokenized = [self._tokenize(s) for s in sentences]

        for i in range(n):
            for j in range(n):
                if i != j:
                    sim_matrix[i][j] = self._cosine_similarity(tokenized[i], tokenized[j])

        # Normalize
        row_sums = sim_matrix.sum(axis=1, keepdims=True)
        row_sums[row_sums == 0] = 1
        sim_matrix = sim_matrix / row_sums

        return sim_matrix

    def _cosine_similarity(self, tokens_a: list[str], tokens_b: list[str]) -> float:
        all_tokens = list(set(tokens_a + tokens_b))
        if not all_tokens:
            return 0.0

        vec_a = np.array([tokens_a.count(t) for t in all_tokens], dtype=float)
        vec_b = np.array([tokens_b.count(t) for t in all_tokens], dtype=float)

        dot = np.dot(vec_a, vec_b)
        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)

        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    def _pagerank(self, matrix: np.ndarray) -> np.ndarray:
        n = matrix.shape[0]
        scores = np.ones(n) / n

        for _ in range(self.max_iter):
            new_scores = (1 - self.damping) / n + self.damping * matrix.T @ scores
            if np.abs(new_scores - scores).sum() < self.min_diff:
                break
            scores = new_scores

        return scores

    @staticmethod
    def _tokenize(text: str) -> list[str]:
        text = text.lower()
        text = re.sub(r"[^a-zA-Z0-9\s]", "", text)
        tokens = text.split()
        # Remove common stop words
        stop_words = {"the", "a", "an", "is", "was", "are", "were", "be", "been", "being",
                      "have", "has", "had", "do", "does", "did", "will", "would", "could",
                      "should", "may", "might", "shall", "can", "to", "of", "in", "for",
                      "on", "with", "at", "by", "from", "it", "this", "that", "i", "you",
                      "he", "she", "we", "they", "me", "him", "her", "us", "them", "my",
                      "your", "his", "its", "our", "their", "and", "but", "or", "not", "so"}
        return [t for t in tokens if t not in stop_words and len(t) > 1]
