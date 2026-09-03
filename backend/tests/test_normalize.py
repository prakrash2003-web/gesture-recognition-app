"""Tests for app.vision.normalize - position and scale invariance."""

import numpy as np
import pytest

from app.vision.normalize import normalize_landmarks
from app.vision.types import MIDDLE_MCP, WRIST
from tests.fixtures.synthetic_hands import open_palm


def test_wrist_moves_to_the_origin():
    normalized = normalize_landmarks(open_palm())
    assert np.allclose(normalized[WRIST], [0.0, 0.0, 0.0])


def test_hand_size_is_normalized_to_one():
    normalized = normalize_landmarks(open_palm())
    # After scaling, wrist -> middle-knuckle distance is exactly 1.
    assert np.isclose(np.linalg.norm(normalized[MIDDLE_MCP]), 1.0)


def test_translation_does_not_change_the_result():
    hand = open_palm()
    shifted = hand + np.array([0.2, -0.1, 0.05])
    assert np.allclose(normalize_landmarks(hand), normalize_landmarks(shifted))


def test_uniform_scaling_does_not_change_the_result():
    hand = open_palm()
    zoomed = hand * 1.7
    assert np.allclose(normalize_landmarks(hand), normalize_landmarks(zoomed), atol=1e-6)


def test_wrong_shape_is_rejected():
    with pytest.raises(ValueError):
        normalize_landmarks(np.zeros((10, 3)))


def test_degenerate_hand_is_rejected():
    with pytest.raises(ValueError):
        normalize_landmarks(np.zeros((21, 3)))
