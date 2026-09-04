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


# Browser origins allowed to call this API (REST CORS *and* the WebSocket origin
# check). The frontend dev server runs on :5173; in production set this to the
# deployed frontend URL, e.g. GESTUREFLOW_ALLOWED_ORIGINS=https://gestureflow.vercel.app
ALLOWED_ORIGINS: list[str] = _split_csv(os.getenv("GESTUREFLOW_ALLOWED_ORIGINS", _DEFAULT_ORIGINS))

# Reject WebSocket upgrades whose Origin header is not in ALLOWED_ORIGINS. On by
# default; set GESTUREFLOW_WS_ALLOW_ANY_ORIGIN=1 only for local tooling that sends
# no Origin (e.g. scripts/ws_smoke.py). Requests with no Origin are always allowed
# (non-browser clients); browsers always send one.
WS_CHECK_ORIGIN: bool = os.getenv("GESTUREFLOW_WS_ALLOW_ANY_ORIGIN", "0").strip() not in {
    "1",
    "true",
    "yes",
}

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
