"""Small data containers passed between the vision stages.

These are plain dataclasses (not Pydantic models) because they stay inside the
Python pipeline. The Pydantic models that define the WebSocket wire format live
in app/schemas.py.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

# MediaPipe hand landmark indices (21 points). Kept here so every module refers
# to joints by name instead of magic numbers.
WRIST = 0
THUMB_CMC, THUMB_MCP, THUMB_IP, THUMB_TIP = 1, 2, 3, 4
INDEX_MCP, INDEX_PIP, INDEX_DIP, INDEX_TIP = 5, 6, 7, 8
MIDDLE_MCP, MIDDLE_PIP, MIDDLE_DIP, MIDDLE_TIP = 9, 10, 11, 12
RING_MCP, RING_PIP, RING_DIP, RING_TIP = 13, 14, 15, 16
PINKY_MCP, PINKY_PIP, PINKY_DIP, PINKY_TIP = 17, 18, 19, 20

FINGER_NAMES = ("thumb", "index", "middle", "ring", "pinky")

# (mcp, pip, dip, tip) index tuple for each non-thumb finger.
FINGER_JOINTS = {
    "index": (INDEX_MCP, INDEX_PIP, INDEX_DIP, INDEX_TIP),
    "middle": (MIDDLE_MCP, MIDDLE_PIP, MIDDLE_DIP, MIDDLE_TIP),
    "ring": (RING_MCP, RING_PIP, RING_DIP, RING_TIP),
    "pinky": (PINKY_MCP, PINKY_PIP, PINKY_DIP, PINKY_TIP),
}
FINGERTIPS = (THUMB_TIP, INDEX_TIP, MIDDLE_TIP, RING_TIP, PINKY_TIP)


@dataclass(frozen=True)
class HandLandmarks:
    """The output of the landmark-detection stage for a single hand.

    points: (21, 3) float array in MediaPipe's normalized image coordinates
            (x and y in 0..1 relative to the frame, x right, y DOWN; z is depth
            relative to the wrist, negative = closer to the camera).
    handedness: "Left" or "Right" as reported by MediaPipe (from the camera's
                point of view - a selfie view mirrors it).
    detection_confidence: MediaPipe's own 0..1 score that a hand is present.
    """

    points: np.ndarray
    handedness: str
    detection_confidence: float

    def __post_init__(self) -> None:
        if self.points.shape != (21, 3):
            raise ValueError(f"expected (21, 3) landmark array, got {self.points.shape}")


@dataclass(frozen=True)
class GesturePrediction:
    """A single classifier output (before or after temporal smoothing).

    gesture: a gesture id from app.gestures.SUPPORTED_GESTURES, or None when the
             hand does not match any known gesture confidently.
    confidence: 0..1. For the rule-based classifier this is a heuristic match
                score, not a probability - it says how cleanly the observed hand
                fits the winning rule.
    """

    gesture: str | None
    confidence: float
    scores: dict[str, float] = field(default_factory=dict)


@dataclass(frozen=True)
class FrameResult:
    """Everything the backend sends back to the browser for one processed frame."""

    gesture: str | None
    confidence: float
    hand_present: bool
    handedness: str | None
    landmarks: list[list[float]] | None
    scores: dict[str, float]
    inference_ms: float
