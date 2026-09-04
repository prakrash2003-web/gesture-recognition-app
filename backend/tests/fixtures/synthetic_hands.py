"""Synthetic hands for the vision unit tests.

The builder now lives in ml.synthetic (it is also used to generate a training
dataset). This module re-exports it so the existing test imports keep working.
"""

from ml.synthetic import (
    ALL_GESTURES,
    build_hand,
    fist,
    ok_sign,
    open_palm,
    pointing_up,
    thumbs_up,
    victory,
)

__all__ = [
    "ALL_GESTURES",
    "build_hand",
    "fist",
    "ok_sign",
    "open_palm",
    "pointing_up",
    "thumbs_up",
    "victory",
]
