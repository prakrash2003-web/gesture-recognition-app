"""Shared evaluation metrics so train.py and evaluate.py report identically."""

from __future__ import annotations

import numpy as np
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    precision_recall_fscore_support,
)


def scores(y_true: list[str], y_pred: list[str], labels: list[str]) -> dict[str, object]:
    """Full metric bundle for one classifier's predictions.

    `labels` fixes the class order so every model's confusion matrix lines up.
    Rule-based predictions may include "none" (no gesture); it is scored as its
    own class so misses are visible rather than silently dropped.
    """
    all_labels = list(labels)
    if "none" in set(y_pred) | set(y_true) and "none" not in all_labels:
        all_labels = [*all_labels, "none"]

    precision, recall, f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=all_labels, zero_division=0
    )
    macro_p, macro_r, macro_f1, _ = precision_recall_fscore_support(
        y_true, y_pred, labels=labels, average="macro", zero_division=0
    )
    cm = confusion_matrix(y_true, y_pred, labels=all_labels)

    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision_macro": round(float(macro_p), 4),
        "recall_macro": round(float(macro_r), 4),
        "f1_macro": round(float(macro_f1), 4),
        "per_class": {
            label: {
                "precision": round(float(precision[i]), 4),
                "recall": round(float(recall[i]), 4),
                "f1": round(float(f1[i]), 4),
                "support": int(support[i]),
            }
            for i, label in enumerate(all_labels)
        },
        "confusion_matrix": cm.astype(int).tolist(),
        "confusion_labels": all_labels,
    }


def confusion_ascii(matrix: list[list[int]], labels: list[str]) -> str:
    """A compact text confusion matrix for the markdown report."""
    short = [label[:6] for label in labels]
    header = "true\\pred".ljust(11) + " ".join(s.rjust(6) for s in short)
    lines = [header]
    for name, row in zip(labels, matrix, strict=True):
        lines.append(name[:10].ljust(11) + " ".join(str(v).rjust(6) for v in row))
    return "\n".join(lines)


def as_float_matrix(matrix: list[list[int]]) -> np.ndarray:
    return np.array(matrix, dtype=float)
