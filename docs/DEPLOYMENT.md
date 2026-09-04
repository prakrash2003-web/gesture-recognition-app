# Deployment

GestureFlow is two independently-deployed services:

```
  Browser ──HTTPS──►  Vercel   (React static build)
                        │
                   opens a secure WebSocket (wss://)
                        ▼
              Render / HF Spaces  (Docker: FastAPI + MediaPipe + trained model)
```

Both halves need **HTTPS** — browsers only allow webcam access on `https://` (or
`localhost`), and a page served over `https://` can only open a `wss://` socket.
Both recommended hosts provide HTTPS automatically.

---

## What is already prepared in the repo

| File | Purpose |
|---|---|
| `Dockerfile` (repo root) | Builds the backend image: runtime deps only, `libgl1`/`libglib2.0-0` for OpenCV/MediaPipe, the trained model + report baked in, runs as a non-root user, `HEALTHCHECK` hits `/health` |
| `.dockerignore` | Keeps the image small (no tests, datasets, frontend, docs) |
| `frontend/vercel.json` | Vite framework + SPA rewrite so `/model`, `/guide` etc. don't 404 on refresh |
| `backend/app/config.py` | All prod settings are env vars (below); `backend/.env.example` documents them |
| `frontend/src/config.ts` | Reads `VITE_*` env vars; a prod build with them missing logs a console error and falls back to localhost |
| WebSocket `Origin` check | `/ws` rejects browser origins not in `GESTUREFLOW_ALLOWED_ORIGINS` (close 1008); clients sending no Origin are allowed |

## Environment variables

**Backend** (set on Render / HF Spaces):

| Variable | Value in production | Default |
|---|---|---|
| `GESTUREFLOW_ALLOWED_ORIGINS` | `https://<your-frontend>.vercel.app` (exact, no trailing slash) | localhost:5173 |
| `GESTUREFLOW_CLASSIFIER` | **`ml`** — the trained model scores 0.95 vs the rule baseline's 0.83 | `rule` |
| `PORT` | injected by Render automatically; on HF Spaces set `7860` | `8000` |

`GESTUREFLOW_CLASSIFIER=ml` is safe even if something goes wrong with the model
file — the backend logs a warning and serves the rule-based classifier instead.

**Frontend** (set in the Vercel project settings):

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://<your-backend-host>` |
| `VITE_WS_URL` | `wss://<your-backend-host>/ws` |

---

## Backend — Render (recommended, simplest)

1. Push the repo to GitHub (already done).
2. render.com → **New** → **Web Service** → connect the repo.
3. Settings:
   - **Root Directory:** *(leave blank — the Dockerfile is at the repo root)*
   - **Runtime:** Docker
   - **Instance type:** Free
   - **Health check path:** `/health`
4. Add the backend env vars above. Leave `GESTUREFLOW_ALLOWED_ORIGINS` as a
   placeholder for now; update it once the frontend URL exists.
5. Deploy. Note the URL, e.g. `https://gestureflow-backend.onrender.com`.
6. Verify: open `https://<backend>/health` → `{"status":"ok",...}` and
   `https://<backend>/model` → the comparison report JSON.

> Render's free tier sleeps after ~15 min idle and takes ~30 s to wake. The
> frontend already shows a "backend may be waking up" hint for this.

## Backend — Hugging Face Spaces (alternative)

1. huggingface.co → **New Space** → SDK: **Docker** → **Blank**.
2. In the Space, add the repo as a remote and push, **or** connect the GitHub repo.
   The Dockerfile must be at the Space repo root — it already is.
3. Space **Settings → Variables**: add the backend env vars, and set `PORT=7860`
   (or add `app_port: 7860` to the Space `README.md` front-matter).
4. The Space builds and runs automatically. Verify `/health` and `/model`.

## Frontend — Vercel

1. vercel.com → **Add New… → Project** → import the repo.
2. Settings:
   - **Root Directory:** `frontend`
   - Framework preset: **Vite** (auto-detected; `vercel.json` also sets it)
3. **Environment Variables:** add `VITE_API_BASE_URL` and `VITE_WS_URL` pointing
   at the backend URL from above (`https://` and `wss://` respectively).
4. Deploy. Note the URL, e.g. `https://gestureflow.vercel.app`.
5. **Go back to the backend host** and set
   `GESTUREFLOW_ALLOWED_ORIGINS=https://gestureflow.vercel.app`, redeploy the
   backend.

---

## Post-deploy checklist

- [ ] `https://<backend>/health` returns ok
- [ ] `https://<backend>/model` returns the report (`dataset: "real"`)
- [ ] Frontend loads over `https://`, no console errors
- [ ] Backend status badge shows **online**
- [ ] Live page: camera permission prompt appears, video shows
- [ ] A gesture is recognized; the skeleton overlay tracks the hand
- [ ] `/dashboard`, `/guide`, `/model`, `/about` all load on hard refresh (no 404)
- [ ] Settings → engine toggle: "ML model" is enabled and switching it works
- [ ] Network tab: the WebSocket connects as `wss://` and stays open
- [ ] Rejected: a WebSocket from an unlisted origin gets closed (code 1008)

## Local Docker check (optional, needs Docker Desktop)

```bash
docker build -t gestureflow-backend .
docker run -p 8000:8000 -e GESTUREFLOW_CLASSIFIER=ml gestureflow-backend
curl http://localhost:8000/health          # {"status":"ok",...}
curl http://localhost:8000/model | head -c 200
python backend/scripts/ws_smoke.py         # ws_smoke sends no Origin, so it is allowed
```

The image is built from the **repo root** (the build context), because the
Dockerfile copies `backend/app`, `backend/ml/models` and `backend/ml/reports`.
`app/config.py` resolves its model path to `/app/ml/models/gesture_clf.joblib`
inside the container, which is where the `COPY` puts it.
