# frontend/

The browser side of GestureFlow: a React + Vite + TypeScript app styled with
Tailwind CSS. It captures the webcam, streams frames to the backend over a
WebSocket, and draws the hand skeleton and recognized gesture over the video.

## Status

**Phase 5 complete** — the live pipeline works end to end: the Live page turns on
the webcam, streams downscaled JPEG frames over the WebSocket, and renders the
recognized gesture, a confidence bar, the 21-point hand skeleton overlay, and
session stats (fps, latency, dropped frames, detections). Permission / error /
reconnect states are handled.

> Browser-only paths (camera, canvas, WebSocket) are covered by mocked unit
> tests. Real-camera verification is a manual step — see the repo's Phase 5 notes.

## Layout

```
frontend/
├── index.html            page shell + <title> + meta
├── src/
│   ├── main.tsx           entry point (mounts React, sets up the Router)
│   ├── App.tsx            the route table
│   ├── config.ts          reads VITE_ env vars (API + WS URLs)
│   ├── types.ts           TypeScript mirrors of the backend's Pydantic models
│   ├── vite-env.d.ts      types for import.meta.env
│   ├── index.css          Tailwind import + design tokens + base styles
│   ├── lib/
│   │   ├── api.ts           fetch wrappers for /health and /gestures
│   │   ├── frameCapture.ts  <video> frame -> downscaled JPEG Blob (reused canvas)
│   │   └── drawLandmarks.ts 21-point skeleton onto a 2D canvas context
│   ├── hooks/
│   │   ├── useTheme.ts         light/dark state, persisted to localStorage
│   │   ├── useBackendHealth.ts    polls /health
│   │   ├── useGestures.ts      loads the gesture list
│   │   ├── useWebcam.ts        getUserMedia + permission/error states
│   │   └── useGestureSocket.ts the /ws connection: send loop + reconnect
│   ├── components/         Layout, NavBar, ThemeToggle, BackendStatusBadge,
│   │                       Card, PageContainer, GestureCard, CameraView,
│   │                       GesturePanel, SessionStats
│   ├── pages/              LivePage, DashboardPage, GuidePage, AboutPage, NotFoundPage
│   └── test/setup.ts       Vitest setup (jest-dom matchers, cleanup)
└── vite.config.ts         plugins (react, tailwind) + Vitest config
```

## Running locally

Needs Node.js 20+ and the backend running (see `../backend/README.md`).

```bash
npm install            # first time only
cp .env.example .env    # points at the local backend by default

npm run dev            # dev server at http://localhost:5173
npm run lint           # oxlint
npm run typecheck      # tsc --noEmit
npm run test           # Vitest (watch mode); test:run for a single pass
npm run build          # production build into dist/
npm run preview        # serve the production build locally
```

## Environment variables

| Variable | Meaning | Local default |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the FastAPI backend | `http://127.0.0.1:8000` |
| `VITE_WS_URL` | Full URL of the gesture WebSocket | `ws://127.0.0.1:8000/ws` |
