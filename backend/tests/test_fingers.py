"""Tests for app.vision.fingers - per-finger extended/curled detection."""

import numpy as np
import pytest

from app.vision.fingers import finger_states
from app.vision.normalize import normalize_landmarks
from tests.fixtures import synthetic_hands as hands

# Expected (thumb, index, middle, ring, pinky) extension per named fixture.
_EXPECTED = {
    "open_palm": (True, True, True, True, True),
    "fist": (False, False, False, False, False),
    "thumbs_up": (True, False, False, False, False),
    "victory": (False, True, True, False, False),
    "pointing_up": (False, True, False, False, False),
}


@pytest.mark.parametrize(("name", "expected"), _EXPECTED.items())
def test_finger_states_match_the_fixture(name, expected):
    points = normalize_landmarks(hands.ALL_GESTURES[name]())
    states = finger_states(points)
    actual = tuple(states[f] for f in ("thumb", "index", "middle", "ring", "pinky"))
    assert actual == expected


def test_finger_states_are_translation_and_scale_invariant():
    hand = hands.victory()
    moved_and_zoomed = (hand + np.array([0.15, -0.2, 0.0])) * 1.4
    a = finger_states(normalize_landmarks(hand))
    b = finger_states(normalize_landmarks(moved_and_zoomed))
    assert a == b
