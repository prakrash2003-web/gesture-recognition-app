"""Tests for app.vision.smoothing - temporal stabilisation of predictions."""

from app.vision.smoothing import GestureSmoother
from app.vision.types import GesturePrediction


def _pred(gesture, confidence=0.9):
    return GesturePrediction(gesture=gesture, confidence=confidence)


def test_a_single_bad_frame_does_not_change_the_output():
    smoother = GestureSmoother(window=6, switch_frames=2)
    for _ in range(6):
        smoother.update(_pred("fist"))

    blip = smoother.update(_pred("open_palm"))  # one stray frame
    assert blip.gesture == "fist"


def test_a_sustained_new_gesture_eventually_wins():
    smoother = GestureSmoother(window=6, switch_frames=2)
    for _ in range(6):
        smoother.update(_pred("fist"))

    results = [smoother.update(_pred("open_palm")).gesture for _ in range(6)]
    assert results[-1] == "open_palm"
    # It should not switch on the very first new frame.
    assert results[0] == "fist"


def test_reported_confidence_averages_the_matching_frames():
    smoother = GestureSmoother(window=4, switch_frames=1)
    smoother.update(_pred("victory", 0.8))
    smoother.update(_pred("victory", 0.9))
    out = smoother.update(_pred("victory", 1.0))
    assert 0.8 <= out.confidence <= 1.0


def test_reset_clears_the_history():
    smoother = GestureSmoother(window=4)
    for _ in range(4):
        smoother.update(_pred("fist"))
    smoother.reset()
    out = smoother.update(_pred("open_palm"))
    assert out.gesture in (None, "open_palm")
