"""Ties the vision stages together: one JPEG frame in, one FrameResult out.

    jpeg bytes
        |  decode.decode_jpeg / downscale
        v
    BGR image ---- landmarks.LandmarkDetector.detect ----> HandLandmarks | None
        |                                                        |
        |                                          normalize.normalize_landmarks
        |                                                        v
        |                          classifier (rule-based OR trained ML) -> GesturePrediction
        |                                                        v
        |                                        smoothing.GestureSmoother.update
        v
    FrameResult  (gesture, confidence, landmarks for drawing, timing)

One GesturePipeline is created per WebSocket connection (Phase 3), because both
the MediaPipe graph and the smoothing buffer hold per-session state.

The classifier is swappable: "rule" (the hand-written baseline) or "ml" (the
trained scikit-learn model). If "ml" is requested but no model file is available,
the pipeline logs a warning and runs "rule" instead - `active_classifier` reports
what is actually in use.
"""

from __future__ import annotations

import logging
import time
from typing import Literal

from app.vision.classifier_ml import MLClassifier, ModelUnavailable
from app.vision.classifier_rules import (
    DEFAULT_MIN_CONFIDENCE,
    clamp_min_confidence,
    classify,
)
from app.vision.decode import decode_jpeg, downscale
from app.vision.landmarks import LandmarkDetector
from app.vision.normalize import normalize_landmarks
from app.vision.smoothing import GestureSmoother
from app.vision.types import FrameResult, GesturePrediction

logger = logging.getLogger(__name__)

ClassifierKind = Literal["rule", "ml"]


class GesturePipeline:
    def __init__(
        self,
        *,
        smoothing_window: int = 6,
        min_confidence: float = DEFAULT_MIN_CONFIDENCE,
        classifier: ClassifierKind = "rule",
        model_path: str | None = None,
    ) -> None:
        self._detector = LandmarkDetector()
        self._smoother = GestureSmoother(window=smoothing_window)
        self._min_confidence = clamp_min_confidence(min_confidence)
        self._model_path = model_path
        self._ml: MLClassifier | None = None
        self._requested = classifier
        self.ml_error: str | None = None
        self._active: ClassifierKind = "rule"
        if classifier == "ml":
            self._activate_ml()

    # --- classifier selection ------------------------------------------------

    def _activate_ml(self) -> bool:
        if self._ml is not None:
            self._active = "ml"
            return True
        try:
            self._ml = MLClassifier(self._model_path or "ml/models/gesture_clf.joblib")
            self._active = "ml"
            self.ml_error = None
            return True
        except ModelUnavailable as exc:
            self.ml_error = str(exc)
            self._active = "rule"
            logger.warning("ML classifier unavailable, using rule-based: %s", exc)
            return False

    def set_classifier(self, kind: ClassifierKind) -> bool:
        """Switch classifier live. Returns True if the requested kind is active."""
        if kind == "ml":
            return self._activate_ml()
        self._active = "rule"
        return True

    @property
    def active_classifier(self) -> ClassifierKind:
        return self._active

    @property
    def ml_available(self) -> bool:
        if self._ml is not None:
            return True
        try:
            MLClassifier(self._model_path or "ml/models/gesture_clf.joblib")
        except ModelUnavailable:
            return False
        return True

    # --- threshold ---------------------------------------------------------

    @property
    def min_confidence(self) -> float:
        return self._min_confidence

    def set_min_confidence(self, value: float) -> None:
        """Adjust the classifier threshold live (from the UI's sensitivity control)."""
        self._min_confidence = clamp_min_confidence(value)

    # --- per-frame -------------------------------------------------------

    def _classify(self, normalized) -> GesturePrediction:
        if self._active == "ml" and self._ml is not None:
            return self._ml.classify(normalized, min_confidence=self._min_confidence)
        return classify(normalized, min_confidence=self._min_confidence)

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
        prediction = self._smoother.update(self._classify(normalized))

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
