"""Stage 3: make the landmarks independent of where the hand is and how big it looks.

MediaPipe gives coordinates relative to the video frame, so the same gesture
produces very different numbers depending on where in the frame the hand is and
how close it is to the camera. We fix that with two steps:

  1. Translate  - move the wrist to the origin (0, 0, 0), so absolute position
                  in the frame no longer matters.
  2. Scale      - divide by the hand's size (wrist -> middle-finger knuckle
                  distance), so distance from the camera no longer matters.

We deliberately do NOT rotate the hand to a canonical upright pose: some gestures
(thumbs up) are defined by their real-world orientation, and the classifier still
needs to know which way is "up" in the image. The vertical (y) axis therefore
keeps its original meaning: smaller y = higher in the frame.
"""

from __future__ import annotations

import numpy as np

from app.vision.types import MIDDLE_MCP, WRIST


def normalize_landmarks(points: np.ndarray) -> np.ndarray:
    """Return a (21, 3) array translated to the wrist and scaled by hand size.

    Raises ValueError if the hand is degenerate (all points coincide).
    """
    if points.shape != (21, 3):
        raise ValueError(f"expected (21, 3), got {points.shape}")

    translated = points - points[WRIST]

    hand_size = float(np.linalg.norm(translated[MIDDLE_MCP]))
    if hand_size < 1e-6:
        raise ValueError("degenerate hand: wrist and middle knuckle coincide")

    return translated / hand_size


def bounding_box(points: np.ndarray) -> tuple[float, float, float, float]:
    """(min_x, min_y, max_x, max_y) of the landmarks in whatever space they are in."""
    xs, ys = points[:, 0], points[:, 1]
    return float(xs.min()), float(ys.min()), float(xs.max()), float(ys.max())
