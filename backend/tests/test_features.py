"""Tests for app.vision.features - the shared ML feature representation."""

import numpy as np
import pytest

from app.vision.features import FEATURE_COUNT, FEATURE_NAMES, FEATURE_VERSION, extract_features
from app.vision.normalize import normalize_landmarks
from tests.fixtures import synthetic_hands as hands


def test_feature_vector_has_the_declared_length():
    vec = extract_features(normalize_landmarks(hands.open_palm()))
    assert vec.shape == (FEATURE_COUNT,)
    assert len(FEATURE_NAMES) == FEATURE_COUNT
    assert vec.dtype == np.float64


def test_features_are_finite_for_every_gesture():
    for make in hands.ALL_GESTURES.values():
        vec = extract_features(normalize_landmarks(make()))
        assert np.isfinite(vec).all()


def test_features_are_translation_and_scale_invariant():
    hand = hands.victory()
    moved = (hand + np.array([0.2, -0.1, 0.0])) * 1.5
    a = extract_features(normalize_landmarks(hand))
    b = extract_features(normalize_landmarks(moved))
    assert np.allclose(a, b, atol=1e-6)


def test_different_gestures_produce_different_features():
    fist = extract_features(normalize_landmarks(hands.fist()))
    palm = extract_features(normalize_landmarks(hands.open_palm()))
    assert not np.allclose(fist, palm)


def test_wrong_shape_is_rejected():
    with pytest.raises(ValueError):
        extract_features(np.zeros((10, 3)))


def test_feature_version_is_an_int():
    assert isinstance(FEATURE_VERSION, int)
