"""Runtime configuration, read from environment variables.

Environment variables let the same code run locally and in production with
different settings, and keep deployment specifics out of the source. Nothing here
is secret - just URLs and toggles - but the pattern is the same one we would use
for secrets.
"""

from __future__ import annotations

import os
from pathlib import Path

_DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"

_BACKEND_ROOT = Path(__file__).resolve().parent.parent


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


# Browser origins allowed to call this API. The frontend dev server runs on
# :5173; the deployed frontend URL is added via the env var in Phase 8.
ALLOWED_ORIGINS: list[str] = _split_csv(os.getenv("GESTUREFLOW_ALLOWED_ORIGINS", _DEFAULT_ORIGINS))

# Which gesture classifier to start with: "rule" (hand-written baseline) or "ml"
# (trained scikit-learn model). Can also be switched per-connection over the
# WebSocket. "ml" silently falls back to "rule" if no model file is present.
CLASSIFIER: str = os.getenv("GESTUREFLOW_CLASSIFIER", "rule").strip().lower()

# Path to the trained model file produced by `python -m ml.train`.
MODEL_PATH: str = os.getenv(
    "GESTUREFLOW_MODEL_PATH", str(_BACKEND_ROOT / "ml" / "models" / "gesture_clf.joblib")
)

# The committed model-comparison report (rule-based vs. ML metrics), served to the
# frontend's Model page.
MODEL_REPORT_PATH: str = os.getenv(
    "GESTUREFLOW_MODEL_REPORT", str(_BACKEND_ROOT / "ml" / "reports" / "comparison.json")
)
