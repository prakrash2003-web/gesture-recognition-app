# frontend/

The browser side of GestureFlow: a React + Vite + TypeScript app that turns on the webcam,
streams downscaled frames to the backend over a WebSocket, and draws the hand skeleton and
recognized gesture over the video.

**Not built yet.** Implementation starts in **Phase 4** (Vite + React + Tailwind scaffold).

Planned layout:

```
frontend/
├── src/
│   ├── App.tsx
│   ├── components/     CameraView, GestureCard, StatsPanel, GestureGuide
│   ├── hooks/          useWebcam, useGestureSocket
│   ├── lib/            frameCapture, drawLandmarks
│   └── types.ts        shared message types
├── tests/
└── package.json
```
