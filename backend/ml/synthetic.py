"""Synthetic 21-point hands: a hand-built stand-in for real webcam landmarks.

Two uses:
  * the unit tests exercise normalize -> fingers -> classifier without a camera
  * `sample_dataset()` produces a jittered, labelled dataset so the *training
    pipeline* (split, model comparison, evaluation, persistence) can be run and
    tested end to end before any real data exists

Synthetic data is NEVER a substitute for a model trained on real hands - a model
trained here is explicitly marked `dataset: "synthetic"` and `provisional: true`.

Coordinates follow MediaPipe's convention: x right, y DOWN, values ~0..1, origin
top-left. "Fingers up" therefore means a smaller y than the wrist.
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


# --- Named canonical hands for the six supported gestures -----------------------


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


# --- Jittered dataset generation -----------------------------------------------


def _rotate_z(points: np.ndarray, radians: float) -> np.ndarray:
    c, s = np.cos(radians), np.sin(radians)
    rot = np.array([[c, -s, 0.0], [s, c, 0.0], [0.0, 0.0, 1.0]])
    return points @ rot.T


def jitter_hand(
    points: np.ndarray,
    rng: np.random.Generator,
    *,
    joint_noise: float = 0.022,
    max_rotation_deg: float = 22.0,
    scale_jitter: float = 0.18,
    translation: float = 0.06,
) -> np.ndarray:
    """Apply small random noise, rotation, scale and translation to one hand."""
    wrist = points[WRIST].copy()
    centred = points - wrist

    centred = _rotate_z(centred, np.deg2rad(rng.uniform(-max_rotation_deg, max_rotation_deg)))
    centred *= 1.0 + rng.uniform(-scale_jitter, scale_jitter)
    centred += rng.normal(0.0, joint_noise, size=centred.shape)

    shifted = centred + wrist + rng.uniform(-translation, translation, size=3)
    shifted[:, 2] = points[:, 2] + rng.normal(0.0, joint_noise, size=21)
    return shifted


def _hard_variant(gesture: str, rng: np.random.Generator) -> np.ndarray:
    """A borderline version of a gesture that overlaps its neighbours in feature
    space - so the synthetic model comparison shows real differences, not a
    trivial 100% for everything."""
    if gesture == "thumbs_up":  # thumb barely raised -> close to a fist
        pts = thumbs_up()
        pts[THUMB_TIP, 1] += rng.uniform(0.06, 0.12)
        pts[THUMB_IP, 1] += rng.uniform(0.03, 0.06)
        return pts
    if gesture == "pointing_up":  # pointing sideways -> weaker "up" signal
        return build_hand(
            thumb=False, index=True, middle=False, ring=False, pinky=False, fingers_up=False
        )
    if gesture == "victory":  # ring finger half-out
        pts = victory()
        ring_tip = FINGER_JOINTS["ring"][3]
        pts[ring_tip, 1] -= rng.uniform(0.05, 0.10)
        return pts
    if gesture == "ok_sign":  # loose pinch
        pts = build_hand(thumb=True, index=False, middle=True, ring=True, pinky=True, pinch=True)
        pts[THUMB_TIP] += np.array([rng.uniform(0.04, 0.09), rng.uniform(-0.04, 0.04), 0.0])
        return pts
    if gesture == "open_palm":  # fingers together
        pts = open_palm()
        pts[:, 0] *= 0.9
        return pts
    return ALL_GESTURES[gesture]()  # fist: already distinctive


def sample_dataset(
    samples_per_gesture: int = 200,
    *,
    n_sessions: int = 6,
    hard_fraction: float = 0.22,
    seed: int = 0,
) -> tuple[np.ndarray, list[str], list[str]]:
    """Generate a jittered synthetic dataset.

    Returns (raw_landmarks (N, 21, 3), labels (N,), session_ids (N,)). Each
    "session" applies its own bias so a leakage-safe group split has real groups
    to work with. `hard_fraction` of samples use a borderline variant.
    """
    rng = np.random.default_rng(seed)
    hands: list[np.ndarray] = []
    labels: list[str] = []
    sessions: list[str] = []

    for session in range(n_sessions):
        session_bias = rng.normal(0.0, 0.008, size=(21, 3))
        for gesture, make in ALL_GESTURES.items():
            per = samples_per_gesture // n_sessions + (
                1 if session < samples_per_gesture % n_sessions else 0
            )
            for _ in range(per):
                if rng.random() < hard_fraction:
                    base = _hard_variant(gesture, rng) + session_bias
                else:
                    base = make() + session_bias
                hands.append(jitter_hand(base, rng))
                labels.append(gesture)
                sessions.append(f"synthetic-{session}")

    return np.array(hands), labels, sessions
