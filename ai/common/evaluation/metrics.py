from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report


def compute_classification_metrics(y_true: list, y_pred: list) -> dict:
    """Compute standard classification metrics."""
    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred, average="binary", zero_division=0),
        "recall": recall_score(y_true, y_pred, average="binary", zero_division=0),
        "f1": f1_score(y_true, y_pred, average="binary", zero_division=0),
    }


def print_classification_report(y_true: list, y_pred: list, labels: list[str] = None):
    """Print detailed classification report."""
    print(classification_report(y_true, y_pred, target_names=labels))
