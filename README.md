# GestureFlow

**Real-time hand gesture recognition in the browser** — a React frontend streams your webcam to a
Python (FastAPI + MediaPipe) backend over a WebSocket, which detects 21 hand landmarks and classifies
the gesture, then streams the result back to draw a live hand skeleton and the recognized gesture.

> 🚧 **Status:** in development. This README grows as the project is built.

**Live demo:** _(coming in Phase 8)_

---

## What it does

- Turns on your webcam (in the browser, with your permission).
- Streams downscaled video frames to a Python backend ~10 times per second over a WebSocket.
- The backend finds your hand, extracts 21 landmark points (MediaPipe), and classifies the gesture.
- The browser draws the hand skeleton over the video and shows the recognized gesture + confidence.

### Recognized gestures (planned)

| Gesture | | Gesture | |
|---|---|---|---|
| Open Palm | ✋ | Pointing Up | ☝️ |
| Fist | ✊ | Victory / Peace | ✌️ |
| Thumbs Up | 👍 | OK Sign | 👌 |

---

## Tech stack

| Area | Technology |
|---|---|
| Frontend | React, Vite, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI, Uvicorn |
| Computer vision | OpenCV, MediaPipe Hands |
| Gesture classifier | Rule-based (Phase 1) → scikit-learn model (Phase 2) |
| Real-time transport | WebSockets |
| Testing | pytest, Vitest, React Testing Library |
| CI/CD | GitHub Actions |
| Deployment | Vercel (frontend), Hugging Face Spaces / Docker (backend) |

See [`docs/decisions.md`](docs/decisions.md) for **why** each choice was made.

---

## Repository layout

```
gesture-recognition-app/
├── frontend/   React + Vite app (the browser UI)
├── backend/    FastAPI app (computer vision + gesture recognition)
├── docs/       Architecture notes and design decisions
└── .github/    Continuous integration workflows
```

---

## Local development

_(Setup instructions are added as each part is built — see Phase 1 for the backend, Phase 4 for the
frontend.)_

---

## License

[MIT](LICENSE)
