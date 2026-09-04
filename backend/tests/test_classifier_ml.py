"""Tests for app.vision.classifier_ml - the trained-model inference wrapper."""

import numpy as np
import pytest

from app.vision.classifier_ml import MLClassifier, ModelUnavailable
from app.vision.normalize import normalize_landmarks
from tests.fixtures import synthetic_hands as hands


def test_missing_file_raises_model_unavailable(tmp_path):
    with pytest.raises(ModelUnavailable):
        MLClassifier(tmp_path / "nope.joblib")


def test_incompatible_feature_version_is_rejected(tmp_path):
    import joblib

    path = tmp_path / "stale.joblib"
    joblib.dump({"pipeline": object(), "feature_version": -1, "labels": []}, path)
    with pytest.raises(ModelUnavailable, match="feature_version"):
        MLClassifier(path)


def test_loads_metadata(trained_model_path):
    clf = MLClassifier(trained_model_path)
    assert clf.provisional is True
    assert clf.dataset == "synthetic"
    assert set(clf.labels)  # non-empty


def test_predicts_a_known_gesture_id(trained_model_path):
    clf = MLClassifier(trained_model_path)
    prediction = clf.classify(normalize_landmarks(hands.open_palm()), min_confidence=0.4)
    assert prediction.gesture in clf.labels
    assert 0.0 <= prediction.confidence <= 1.0
    assert prediction.scores  # per-class probabilities


def test_low_probability_falls_back_to_none(trained_model_path):
    clf = MLClassifier(trained_model_path)
    prediction = clf.classify(normalize_landmarks(hands.open_palm()), min_confidence=1.01)
    assert prediction.gesture is None


def test_rejects_a_bad_landmark_shape(trained_model_path):
    clf = MLClassifier(trained_model_path)
    with pytest.raises(ValueError):
        clf.classify(np.zeros((5, 3)))
