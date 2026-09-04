"""Feature extraction: normalized 21-point hand -> a fixed-length numeric vector.

This is the single feature representation used by BOTH the trained ML classifier
(training in backend/ml/train.py) and its inference path (classifier_ml.py). If it
changes, models must be retrained - `FEATURE_VERSION` guards against a mismatch.

We deliberately use engineered *geometric* features (finger extension ratios, joint
angles, inter-fingertip distances, tip heights) rather than the raw 63 landmark
coordinates:
  * they are rotation- and scale-tolerant, so a few hundred samples generalize well
  * every feature is interpretable, which matters for a portfolio explanation
  * they mirror the quantities the rule-based classifier already reasons about,
    making the rule-vs-ML comparison an apples-to-apples one

Input is always the output of app.vision.normalize.normalize_landmarks (wrist at
the origin, hand scaled to size ~1, y still meaning "up/down in the image").
"""

from __future__ import annotations

import numpy as np

from app.vision.geometry import angle, distance
from app.vision.types import (
    FINGER_JOINTS,
    FINGERTIPS,
    INDEX_MCP,
    PINKY_MCP,
    THUMB_CMC,
    THUMB_IP,
    THUMB_MCP,
    THUMB_TIP,
    WRIST,
)

FEATURE_VERSION = 1

_EPS = 1e-6

FEATURE_NAMES: tuple[str, ...] = (
    "thumb_ext_ratio",
    "index_ext_ratio",
    "middle_ext_ratio",
    "ring_ext_ratio",
    "pinky_ext_ratio",
    "thumb_curl_angle",
    "index_curl_angle",
    "middle_curl_angle",
    "ring_curl_angle",
    "pinky_curl_angle",
    "dist_thumb_index_tip",
    "dist_index_middle_tip",
    "dist_middle_ring_tip",
    "dist_ring_pinky_tip",
    "dist_thumb_tip_index_mcp",
    "fingertip_spread",
    "mean_tip_reach",
    "tips_above_wrist",
    "highest_tip_index",
    "palm_width",
    "thumb_tip_y",
    "index_tip_y",
    "middle_tip_y",
    "ring_tip_y",
    "pinky_tip_y",
)

FEATURE_COUNT = len(FEATURE_NAMES)


def _finger_extension_ratio(points: np.ndarray, mcp: int, pip: int, tip: int) -> float:
    wrist = points[WRIST]
    return distance(points[tip], wrist) / (distance(points[pip], wrist) + _EPS)


def extract_features(normalized_points: np.ndarray) -> np.ndarray:
    """Return a (FEATURE_COUNT,) float64 feature vector for one normalized hand."""
    if normalized_points.shape != (21, 3):
        raise ValueError(f"expected (21, 3), got {normalized_points.shape}")

    p = normalized_points
    tips = p[list(FINGERTIPS)]

    # Per-finger extension ratios (tip reach vs. PIP reach from the wrist).
    ext = [
        _finger_extension_ratio(p, THUMB_MCP, THUMB_IP, THUMB_TIP),
        *[
            _finger_extension_ratio(p, mcp, pip, tip)
            for mcp, pip, _dip, tip in FINGER_JOINTS.values()
        ],
    ]

    # Per-finger curl angle at the middle joint (thumb: IP joint; others: PIP).
    curl = [angle(p[THUMB_CMC], p[THUMB_MCP], p[THUMB_IP])]
    for mcp, pip, _dip, tip in FINGER_JOINTS.values():
        curl.append(angle(p[mcp], p[pip], p[tip]))

    # Adjacent fingertip distances (thumb-index, index-middle, ...).
    adjacent = [distance(tips[i], tips[i + 1]) for i in range(4)]

    pinch = distance(p[THUMB_TIP], p[INDEX_MCP])
    spread = float(np.max([distance(a, b) for a in tips for b in tips]))
    mean_reach = float(np.mean([distance(t, p[WRIST]) for t in tips]))
    tips_above = float(np.sum(tips[:, 1] < 0.0))
    highest_tip = float(np.argmin(tips[:, 1]))
    palm_width = distance(p[INDEX_MCP], p[PINKY_MCP])
    tip_ys = tips[:, 1].tolist()

    return np.array(
        [
            *ext,
            *curl,
            *adjacent,
            pinch,
            spread,
            mean_reach,
            tips_above,
            highest_tip,
            palm_width,
            *tip_ys,
        ],
        dtype=np.float64,
    )
