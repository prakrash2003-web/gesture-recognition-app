"""Ties the vision stages together: one JPEG frame in, one FrameResult out.

    jpeg bytes
        |  decode.decode_jpeg / downscale
        v
    BGR image ---- landmarks.LandmarkDetector.detect ----> HandLandmarks | None
        |                                                        |
        |                                          normalize.normalize_landmarks
        |                                                        v
        |                                        classifier_rules.classify -> GesturePrediction
        |                                                        v
        |                                        smoothing.GestureSmoother.update
        v
    FrameResult  (gesture, confidence, landmarks for drawing, timing)

One GesturePipeline is created per WebSocket connection (Phase 3), because both
the MediaPipe graph and the smoothing buffer hold per-session state.
"""

from __future__ import annotations

import time

from app.vision.classifier_rules import classify
from app.vision.decode import decode_jpeg, downscale
from app.vision.landmarks import LandmarkDetector
from app.vision.normalize import normalize_landmarks
from app.vision.smoothing import GestureSmoother
from app.vision.types import FrameResult


class GesturePipeline:
    def __init__(self, *, smoothing_window: int = 6) -> None:
        self._detector = LandmarkDetector()
        self._smoother = GestureSmoother(window=smoothing_window)

    def process_frame(self, data: bytes) -> FrameResult:
        started = time.perf_counter()

        image = downscale(decode_jpeg(data))
        hand = self._detector.detect(image)

        if hand is None:
            self._smoother.reset()
            return FrameResult(
                gesture=None,
                confidence=0.0,
                hand_present=False,
                handedness=None,
                landmarks=None,
                scores={},
                inference_ms=round((time.perf_counter() - started) * 1000, 2),
            )

        normalized = normalize_landmarks(hand.points)
        prediction = self._smoother.update(classify(normalized))

        return FrameResult(
            gesture=prediction.gesture,
            confidence=prediction.confidence,
            hand_present=True,
            handedness=hand.handedness,
            landmarks=hand.points[:, :2].round(4).tolist(),
            scores=prediction.scores,
            inference_ms=round((time.perf_counter() - started) * 1000, 2),
        )

    def reset(self) -> None:
        """Forget the smoothing history (e.g. after the camera was paused)."""
        self._smoother.reset()

    def close(self) -> None:
        self._detector.close()
