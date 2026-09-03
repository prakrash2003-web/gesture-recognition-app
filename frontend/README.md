# frontend/

The browser side of GestureFlow: a React + Vite + TypeScript app styled with
Tailwind CSS. It captures the webcam, streams frames to the backend over a
WebSocket, and draws the hand skeleton and recognized gesture over the video.

## Status

**Phase 4 complete** — the application shell: routing, navigation, four pages,
light/dark theme, backend health indicator, and the Gesture Guide (which loads
its list from `GET /gestures`). The webcam + WebSocket wiring comes in Phase 5.

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
│   │   └── api.ts          fetch wrappers for /health and /gestures
│   ├── hooks/
│   │   ├── useTheme.ts        light/dark state, persisted to localStorage
│   │   ├── useBackendHealth.ts   polls /health
│   │   └── useGestures.ts     loads the gesture list
│   ├── components/         Layout, NavBar, ThemeToggle, BackendStatusBadge,
│   │                       Card, PageContainer, GestureCard
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
