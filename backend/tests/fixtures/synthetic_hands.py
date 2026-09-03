"""Synthetic 21-point hands for testing the geometry / classifier stages.

Why synthetic instead of real webcam captures?
  * Unit tests must run with no camera and no MediaPipe call - fast and
    deterministic, including in CI.
  * We are testing our OWN code (normalize -> fingers -> classifier), not
    MediaPipe. Feeding hand-built landmark arrays exercises exactly that logic.

The builder places joints in MediaPipe-style coordinates: x to the right, y DOWN,
values roughly in 0..1, origin at the top-left of the frame. "Fingers up" therefore
means smaller y than the wrist.

Real-hand validation happens end-to-end with the webcam in Phase 5;
backend/scripts/record_fixtures.py captures real landmark samples for that.
"""

from __future__ import annotations

import numpy as np

from app.vision.types import (
    FINGER_JOINTS,
    THUMB_CMC,
    THUMB_IP,
    THUMB_MCP,
    THUMB_TIP,
    WRIST,
)

# Base knuckle (MCP) position for each non-thumb finger, relative to a wrist at (0, 0).
_MCP = {
    "index": np.array([-0.06, -0.42, 0.0]),
    "middle": np.array([0.00, -0.44, 0.0]),
    "ring": np.array([0.06, -0.42, 0.0]),
    "pinky": np.array([0.11, -0.38, 0.0]),
}
_WRIST_XY = np.array([0.5, 0.8, 0.0])


def _finger_points(mcp: np.ndarray, *, extended: bool, up: bool = True) -> list[np.ndarray]:
    """Return [pip, dip, tip] for one finger given its MCP."""
    direction = np.array([0.0, -1.0, 0.0]) if up else np.array([1.0, 0.0, 0.0])
    if extended:
        return [mcp + direction * d for d in (0.09, 0.16, 0.22)]
    # Curled: the tip folds back past the knuckle toward the palm/wrist.
    back = -direction
    return [
        mcp + direction * 0.05,
        mcp + direction * 0.02 + back * 0.02,
        mcp + back * 0.06,
    ]


def build_hand(
    *,
    thumb: bool,
    index: bool,
    middle: bool,
    ring: bool,
    pinky: bool,
    fingers_up: bool = True,
    thumb_dir: str = "side",  # "side", "up", or "across"
    pinch: bool = False,
) -> np.ndarray:
    """Assemble a (21, 3) landmark array from per-finger extended flags."""
    pts = np.zeros((21, 3), dtype=np.float64)
    pts[WRIST] = _WRIST_XY

    flags = {"index": index, "middle": middle, "ring": ring, "pinky": pinky}
    for name, (mcp_i, pip_i, dip_i, tip_i) in FINGER_JOINTS.items():
        mcp = _WRIST_XY + _MCP[name]
        pts[mcp_i] = mcp
        pip, dip, tip = _finger_points(mcp, extended=flags[name], up=fingers_up)
        pts[pip_i], pts[dip_i], pts[tip_i] = pip, dip, tip

    # Thumb chain.
    thumb_cmc = _WRIST_XY + np.array([-0.05, -0.12, 0.0])
    pts[THUMB_CMC] = thumb_cmc
    if thumb and thumb_dir == "up":
        pts[THUMB_MCP] = thumb_cmc + np.array([-0.02, -0.12, 0.0])
        pts[THUMB_IP] = thumb_cmc + np.array([-0.04, -0.24, 0.0])
        pts[THUMB_TIP] = thumb_cmc + np.array([-0.06, -0.36, 0.0])
    elif thumb:  # extended out to the side
        pts[THUMB_MCP] = thumb_cmc + np.array([-0.09, -0.02, 0.0])
        pts[THUMB_IP] = thumb_cmc + np.array([-0.20, -0.04, 0.0])
        pts[THUMB_TIP] = thumb_cmc + np.array([-0.32, -0.06, 0.0])
    else:  # tucked against / across the palm - both thumb joints bent sharply
        pts[THUMB_MCP] = _WRIST_XY + np.array([-0.10, -0.16, 0.0])
        pts[THUMB_IP] = _WRIST_XY + np.array([-0.04, -0.22, 0.0])
        pts[THUMB_TIP] = _WRIST_XY + np.array([0.04, -0.24, 0.0])

    if pinch:
        # Force the thumb + index fingertips together (OK sign).
        idx_tip = pts[FINGER_JOINTS["index"][3]]
        pts[THUMB_TIP] = idx_tip + np.array([0.02, 0.01, 0.0])
        pts[THUMB_IP] = (pts[THUMB_MCP] + pts[THUMB_TIP]) / 2

    return pts


# --- Named fixtures for the six supported gestures -------------------------------


def open_palm() -> np.ndarray:
    return build_hand(thumb=True, index=True, middle=True, ring=True, pinky=True)


def fist() -> np.ndarray:
    return build_hand(thumb=False, index=False, middle=False, ring=False, pinky=False)


def thumbs_up() -> np.ndarray:
    return build_hand(
        thumb=True, index=False, middle=False, ring=False, pinky=False, thumb_dir="up"
    )


def victory() -> np.ndarray:
    return build_hand(thumb=False, index=True, middle=True, ring=False, pinky=False)


def pointing_up() -> np.ndarray:
    return build_hand(thumb=False, index=True, middle=False, ring=False, pinky=False)


def ok_sign() -> np.ndarray:
    return build_hand(thumb=True, index=False, middle=True, ring=True, pinky=True, pinch=True)


ALL_GESTURES = {
    "open_palm": open_palm,
    "fist": fist,
    "thumbs_up": thumbs_up,
    "victory": victory,
    "pointing_up": pointing_up,
    "ok_sign": ok_sign,
}
