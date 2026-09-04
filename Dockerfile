# Backend container for GestureFlow (FastAPI + MediaPipe + the trained classifier).
# Build from the repository root:
#
#   docker build -t gestureflow-backend .
#   docker run -p 8000:8000 \
#     -e GESTUREFLOW_ALLOWED_ORIGINS=https://<your-frontend>.vercel.app \
#     -e GESTUREFLOW_CLASSIFIER=ml \
#     gestureflow-backend
#
# Render and Hugging Face Spaces (Docker SDK) build this automatically from the repo.
# The frontend is deployed separately (Vercel) and ignores this file.

FROM python:3.12-slim

# System libraries OpenCV / MediaPipe need at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends \
      libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

# Runtime deps only (no pytest / ruff) - copied first for layer caching.
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code, the trained model, and its comparison report.
COPY backend/app ./app
COPY backend/ml/models ./ml/models
COPY backend/ml/reports ./ml/reports

EXPOSE 8000

# One worker: the MediaPipe graph is per-process; scale with more instances.
# $PORT is injected by Render; Hugging Face Spaces expects 7860 (set PORT=7860).
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
