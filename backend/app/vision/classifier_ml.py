"""Inference wrapper for the trained scikit-learn gesture classifier.

Loads the model file produced by `python -m ml.train`, and exposes the same
`classify(normalized_points, min_confidence) -> GesturePrediction` surface as the
rule-based classifier, so the pipeline can use either interchangeably.

The model file is a dict: {"pipeline": <sklearn Pipeline>, "feature_version": int,
"labels": [...], ...}. Loading checks `feature_version` against the code so a stale
model is rejected loudly instead of producing garbage predictions.

If the file is missing or incompatible, `MLClassifier(...)` raises
`ModelUnavailable`; callers fall back to the rule-based classifier.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

from app.vision.features import FEATURE_VERSION, extract_features
from app.vision.types import GesturePrediction


class ModelUnavailable(RuntimeError):
    """The trained model file is missing, unreadable, or incompatible."""


class MLClassifier:
    def __init__(self, model_path: str | Path) -> None:
        path = Path(model_path)
        if not path.is_file():
            raise ModelUnavailable(f"no trained model at {path} - run `python -m ml.train` first")
        try:
            import joblib

            bundle = joblib.load(path)
        except Exception as exc:  # noqa: BLE001 - surface any load failure as one type
            raise ModelUnavailable(f"could not load {path}: {exc}") from exc

        if bundle.get("feature_version") != FEATURE_VERSION:
            raise ModelUnavailable(
                f"model was trained with feature_version {bundle.get('feature_version')}, "
                f"code expects {FEATURE_VERSION} - retrain"
            )

        self._pipeline = bundle["pipeline"]
        self.labels: list[str] = list(bundle["labels"])
        self.model_name: str = bundle.get("model_name", "ml")
        self.provisional: bool = bool(bundle.get("provisional", False))
        self.dataset: str = bundle.get("dataset", "unknown")
        self._has_proba = hasattr(self._pipeline, "predict_proba")

    def classify(
        self,
        normalized_points: np.ndarray,
        *,
        min_confidence: float = 0.5,
    ) -> GesturePrediction:
        features = extract_features(normalized_points).reshape(1, -1)

        if self._has_proba:
            proba = self._pipeline.predict_proba(features)[0]
            classes = list(self._pipeline.classes_)
            scores = {label: round(float(p), 4) for label, p in zip(classes, proba, strict=True)}
            best_idx = int(np.argmax(proba))
            gesture = classes[best_idx]
            confidence = float(proba[best_idx])
        else:  # e.g. a plain SVC without probability - fall back to the decision
            gesture = str(self._pipeline.predict(features)[0])
            confidence = 1.0
            scores = {gesture: 1.0}

        if confidence < min_confidence:
            return GesturePrediction(gesture=None, confidence=confidence, scores=scores)
        return GesturePrediction(gesture=gesture, confidence=confidence, scores=scores)
