"""Tiny vector helpers shared by the finger and classifier stages."""

from __future__ import annotations

import numpy as np


def distance(a: np.ndarray, b: np.ndarray) -> float:
    """Euclidean distance between two points."""
    return float(np.linalg.norm(a - b))


def angle(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> float:
    """Interior angle at vertex b (radians), formed by the points a-b-c."""
    ba = a - b
    bc = c - b
    denom = float(np.linalg.norm(ba) * np.linalg.norm(bc))
    if denom < 1e-9:
        return float(np.pi)
    cosine = float(np.clip(np.dot(ba, bc) / denom, -1.0, 1.0))
    return float(np.arccos(cosine))
