"""Stage 4: from normalized landmarks, decide which fingers are extended.

This is the bridge between raw geometry and human-readable gesture rules. Every
value here is a simple, explainable measurement on the 21 points:

  * A non-thumb finger is "extended" when its tip is farther from the wrist than
    its middle knuckle (PIP joint) is. When a finger curls, the tip folds back
    toward the palm and ends up closer to the wrist than the PIP - so the
    comparison flips. This is rotation-independent: it works whichever way the
    hand is turned.

  * The thumb bends sideways, not toward the wrist, so it needs its own test:
    it is "extended" when it is straight - both its knuckle joints (MCP and IP)
    are close to 180 degrees. When the thumb tucks against or across the palm,
    those joints bend sharply, which is what we detect.

All inputs are the normalized landmarks from app.vision.normalize (hand size ~= 1).
"""

from __future__ import annotations

import numpy as np

from app.vision.geometry import angle, distance
from app.vision.types import (
    FINGER_JOINTS,
    THUMB_CMC,
    THUMB_IP,
    THUMB_MCP,
    THUMB_TIP,
    WRIST,
)

# Tuned against synthetic fixtures and refined with real webcam data in Phase 5.
_EXTENSION_MARGIN = 1.05  # tip must be >5% farther from the wrist than the PIP
_THUMB_STRAIGHT_RAD = 2.0  # ~115 deg: min angle at each thumb joint to count as "straight"


def thumb_is_extended(points: np.ndarray) -> bool:
    mcp_angle = angle(points[THUMB_CMC], points[THUMB_MCP], points[THUMB_IP])
    ip_angle = angle(points[THUMB_MCP], points[THUMB_IP], points[THUMB_TIP])
    return bool(mcp_angle > _THUMB_STRAIGHT_RAD and ip_angle > _THUMB_STRAIGHT_RAD)


def finger_is_extended(points: np.ndarray, finger: str) -> bool:
    mcp, pip, _dip, tip = FINGER_JOINTS[finger]
    wrist = points[WRIST]
    tip_reach = distance(points[tip], wrist)
    pip_reach = distance(points[pip], wrist)
    mcp_reach = distance(points[mcp], wrist)
    return bool(tip_reach > pip_reach * _EXTENSION_MARGIN and tip_reach > mcp_reach)


def finger_states(points: np.ndarray) -> dict[str, bool]:
    """{'thumb': bool, 'index': bool, ...} - True where the finger is extended."""
    return {
        "thumb": thumb_is_extended(points),
        "index": finger_is_extended(points, "index"),
        "middle": finger_is_extended(points, "middle"),
        "ring": finger_is_extended(points, "ring"),
        "pinky": finger_is_extended(points, "pinky"),
    }


def extended_count(states: dict[str, bool]) -> int:
    return sum(states.values())
