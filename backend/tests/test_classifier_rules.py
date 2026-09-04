"""Tests for app.vision.classifier_rules - the rule-based gesture classifier."""

import numpy as np
import pytest

from app.gestures import SUPPORTED_GESTURES
from app.vision.classifier_rules import (
    MIN_CONFIDENCE_RANGE,
    clamp_min_confidence,
    classify,
)
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


def test_closed_fist_with_a_straightish_raised_thumb_is_not_thumbs_up():
    """Regression: a real closed fist has the thumb nearly as straight as an
    extended one and often sitting higher than the wrist. It must still read as a
    fist unless the thumb clearly protrudes past the curled fingers (the real
    failure mode reported during manual testing).
    """
    fist = normalize_landmarks(hands.fist())
    # Straighten the thumb and lift it just above the fist, without extending it
    # out (tip stays close to the curled fingertips).
    curled_tip_reach = np.linalg.norm(fist[[8, 12, 16, 20]].mean(axis=0) - fist[0])
    for joint, up in ((2, 0.10), (3, 0.20), (4, 0.30)):
        fist[joint] = np.array([0.05, -up, 0.0])  # roughly collinear, pointing up

    from app.vision.geometry import distance

    protrusion = distance(fist[4], fist[0]) - curled_tip_reach
    assert protrusion < 0.55  # the fixture really is a non-protruding thumb

    assert classify(fist).gesture != "thumbs_up"


def test_a_real_thumbs_up_still_classifies_after_the_fist_fix():
    prediction = classify(normalize_landmarks(hands.thumbs_up()))
    assert prediction.gesture == "thumbs_up"
    assert prediction.confidence >= 0.72


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


def _noisy_victory():
    # Victory shape but with the ring finger also extended - a marginal match.
    return hands.build_hand(thumb=False, index=True, middle=True, ring=True, pinky=False)


def test_min_confidence_gates_a_marginal_hand():
    points = normalize_landmarks(_noisy_victory())

    assert classify(points, min_confidence=0.72).gesture == "victory"
    assert classify(points, min_confidence=0.9).gesture is None


def test_clamp_min_confidence_stays_in_range():
    lo, hi = MIN_CONFIDENCE_RANGE
    assert clamp_min_confidence(0.0) == lo
    assert clamp_min_confidence(1.0) == hi
    assert clamp_min_confidence(0.6) == 0.6
