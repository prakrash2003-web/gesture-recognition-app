"""Stage 5: decide which gesture a hand is making, using hand-written rules.

Why rules first (not machine learning)?
  * It works immediately with zero training data and gives a full end-to-end demo.
  * Every decision is one line you can explain in an interview: "victory = index
    and middle extended, the rest closed".
  * Its weaknesses (hand-tuned thresholds, brittle at odd angles) are exactly what
    motivates the trained scikit-learn classifier in Phase 7, where the two are
    compared head to head.

How it works:
  1. Get the per-finger extended/curled pattern from app.vision.fingers.
  2. Score every known gesture by how well that pattern matches its template.
  3. Apply a few gesture-specific geometric checks (e.g. thumbs-up also requires
     the thumb to actually point up in the image; OK sign requires the thumb and
     index fingertips to touch).
  4. Return the best-scoring gesture, or None if nothing scores above threshold.
"""

from __future__ import annotations

import numpy as np

from app.vision.fingers import finger_states
from app.vision.geometry import distance
from app.vision.types import (
    FINGERTIPS,
    INDEX_TIP,
    THUMB_TIP,
    GesturePrediction,
)

# Expected (thumb, index, middle, ring, pinky) extension pattern per gesture.
_TEMPLATES: dict[str, tuple[int, int, int, int, int]] = {
    "open_palm": (1, 1, 1, 1, 1),
    "fist": (0, 0, 0, 0, 0),
    "thumbs_up": (1, 0, 0, 0, 0),
    "victory": (0, 1, 1, 0, 0),
    "pointing_up": (0, 1, 0, 0, 0),
    "ok_sign": (0, 0, 1, 1, 1),
}
_FINGER_ORDER = ("thumb", "index", "middle", "ring", "pinky")

# Decision thresholds (normalized-landmark units; hand size ~= 1).
DEFAULT_MIN_CONFIDENCE = 0.72  # below this, report "no recognized gesture"
MIN_CONFIDENCE_RANGE = (0.40, 0.95)  # allowed range when the user tunes sensitivity
_RUNNER_UP_MARGIN = 0.04  # the winner must beat the 2nd-best gesture by this much
_PINCH_DIST = 0.35  # thumb tip <-> index tip distance that counts as "touching"
_POINT_UP_Y = -0.25  # a tip this far above the wrist (negative y) counts as "up"


def clamp_min_confidence(value: float) -> float:
    lo, hi = MIN_CONFIDENCE_RANGE
    return max(lo, min(hi, value))


def _pattern_score(states: dict[str, bool], template: tuple[int, ...]) -> float:
    observed = np.array([states[name] for name in _FINGER_ORDER], dtype=float)
    return float(1.0 - np.abs(observed - np.array(template, dtype=float)).mean())


def classify(
    normalized_points: np.ndarray,
    *,
    min_confidence: float = DEFAULT_MIN_CONFIDENCE,
) -> GesturePrediction:
    """Classify one hand. `normalized_points` is the (21, 3) output of normalize().

    `min_confidence` is the score the winning gesture must reach to be reported;
    the user tunes it via the "sensitivity" control. The winner must also beat the
    runner-up by a small margin, so a near-tie reads as "unrecognized" rather than
    flickering between two gestures.
    """
    states = finger_states(normalized_points)

    tips_y = normalized_points[list(FINGERTIPS), 1]
    highest_tip = int(np.argmin(tips_y))  # 0=thumb, 1=index, ... (smaller y = higher)
    pinch = distance(normalized_points[THUMB_TIP], normalized_points[INDEX_TIP])

    scores: dict[str, float] = {}
    for gesture, template in _TEMPLATES.items():
        score = _pattern_score(states, template)

        if gesture == "thumbs_up":
            thumb_points_up = highest_tip == 0 and tips_y[0] < _POINT_UP_Y
            score *= 1.0 if thumb_points_up else 0.25
        elif gesture == "pointing_up":
            index_points_up = highest_tip == 1 and tips_y[1] < _POINT_UP_Y
            score *= 1.0 if index_points_up else 0.4
        elif gesture == "ok_sign":
            score *= 1.0 if pinch < _PINCH_DIST else 0.3
        elif gesture == "open_palm":
            # An OK sign also has three fingers up; make sure nothing is pinching.
            score *= 0.5 if pinch < _PINCH_DIST else 1.0

        scores[gesture] = round(score, 4)

    ranked = sorted(scores.values(), reverse=True)
    best_gesture = max(scores, key=scores.get)
    best_score = ranked[0]
    runner_up = ranked[1] if len(ranked) > 1 else 0.0

    confident = best_score >= min_confidence
    decisive = best_score - runner_up >= _RUNNER_UP_MARGIN
    if not (confident and decisive):
        return GesturePrediction(gesture=None, confidence=best_score, scores=scores)

    return GesturePrediction(gesture=best_gesture, confidence=best_score, scores=scores)
