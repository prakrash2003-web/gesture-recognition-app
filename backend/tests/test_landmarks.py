"""Tests for app.vision.landmarks - the MediaPipe wrapper.

These actually load MediaPipe (no network needed - the model ships with the
package). We only check the wrapper's contract, not MediaPipe's accuracy:
a blank frame has no hand, so detect() must return None cleanly.
"""

import numpy as np

from app.vision.landmarks import LandmarkDetector


def test_blank_frame_yields_no_hand():
    with LandmarkDetector() as detector:
        blank = np.zeros((240, 320, 3), dtype=np.uint8)
        assert detector.detect(blank) is None


def test_noise_frame_does_not_raise():
    with LandmarkDetector() as detector:
        noise = (np.random.default_rng(1).random((240, 320, 3)) * 255).astype(np.uint8)
        # May or may not "find" a hand in noise; must not crash either way.
        result = detector.detect(noise)
        assert result is None or result.points.shape == (21, 3)
