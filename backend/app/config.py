"""Runtime configuration, read from environment variables.

Environment variables let the same code run locally and in production with
different settings, and keep deployment specifics out of the source. Nothing here
is secret - just URLs - but the pattern is the same one we would use for secrets.
"""

from __future__ import annotations

import os

_DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"


def _split_csv(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


# Browser origins allowed to call this API. The frontend dev server runs on
# :5173; the deployed frontend URL is added via the env var in Phase 8.
ALLOWED_ORIGINS: list[str] = _split_csv(os.getenv("GESTUREFLOW_ALLOWED_ORIGINS", _DEFAULT_ORIGINS))
