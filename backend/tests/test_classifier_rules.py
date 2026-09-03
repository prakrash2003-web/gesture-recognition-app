"""Tests for app.vision.classifier_rules - the rule-based gesture classifier."""

import numpy as np
import pytest

from app.gestures import SUPPORTED_GESTURES
from app.vision.classifier_rules import classify
from app.vision.normalize import normalize_landmarks
from tests.fixtures import synthetic_hands as hands


@pytest.mark.parametrize("name", list(hands.ALL_GESTURES))
def test_each_gesture_fixture_is_classified_correctly(name):
    prediction = classify(normalize_landmarks(hands.ALL_GESTURES[name]()))
    assert prediction.gesture == name
    assert prediction.confidence >= 0.72


def test_classifier_only_returns_known_gesture_ids():
    known = {g.id for g in SUPPORTED_GESTURES} | {None}
    for name in hands.ALL_GESTURES:
        prediction = classify(normalize_landmarks(hands.ALL_GESTURES[name]()))
        assert prediction.gesture in known


def test_thumbs_up_needs_the_thumb_pointing_up():
    """The same finger pattern with the thumb sideways is not a thumbs-up."""
    sideways = hands.build_hand(
        thumb=True, index=False, middle=False, ring=False, pinky=False, thumb_dir="side"
    )
    prediction = classify(normalize_landmarks(sideways))
    assert prediction.gesture != "thumbs_up"


def test_ambiguous_hand_returns_no_gesture():
    """Thumb + middle + pinky up (a "spider") matches no template well."""
    ambiguous = hands.build_hand(thumb=True, index=False, middle=True, ring=False, pinky=True)
    prediction = classify(normalize_landmarks(ambiguous))
    assert prediction.gesture is None


def test_scores_are_reported_for_every_gesture():
    prediction = classify(normalize_landmarks(hands.open_palm()))
    assert set(prediction.scores) == {g.id for g in SUPPORTED_GESTURES}
    assert all(0.0 <= v <= 1.0 for v in prediction.scores.values())


def test_classification_is_translation_and_scale_invariant():
    hand = hands.thumbs_up()
    moved_and_zoomed = (hand + np.array([-0.1, 0.12, 0.0])) * 1.6
    assert (
        classify(normalize_landmarks(hand)).gesture
        == classify(normalize_landmarks(moved_and_zoomed)).gesture
        == "thumbs_up"
    )


def test_classify_rejects_a_bad_shape():
    with pytest.raises((ValueError, IndexError)):
        classify(np.zeros((5, 3)))
