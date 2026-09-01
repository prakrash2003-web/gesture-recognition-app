# Design decisions & alternatives considered

A running log of the non-obvious choices in this project, and the reasoning behind them.
Written to be readable in an interview.

---

## 1. Where does the computer vision run: browser or server?

**Decision:** On the **server**, in Python.

The browser captures the webcam and displays results; a Python backend does all landmark detection
and gesture classification. Frames are streamed to it over a WebSocket.

**Why:**
- The project's goal is to demonstrate Python computer-vision and ML skills, so the CV must be a
  real, central Python component — not a library call hidden in the browser.
- Keeps the interesting logic (landmark normalization, the gesture classifier, temporal smoothing)
  in one tested Python codebase.

**Alternatives considered:**
- *Client-side (MediaPipe in the browser via WebAssembly):* lowest latency, trivial to deploy,
  webcam never leaves the device — but it reduces the Python backend to a bystander and weakens the
  portfolio story.
- *Hybrid (browser detects landmarks, Python classifies):* low bandwidth and keeps a Python ML
  component, but adds moving parts and splits the CV logic across two languages.

**Trade-offs we accept:** network latency per frame, backend CPU cost per connected user, and the
need for an always-on backend host. Mitigated by throttling to ~10 fps, downscaling frames to
~320 px, and dropping stale frames.

---

## 2. REST API or WebSockets?

**Decision:** **WebSockets** for the video stream; plain REST for stateless one-offs
(`GET /health`, `GET /gestures`).

**Why:** gesture recognition on a live webcam feed is a continuous, stateful, low-latency,
bidirectional problem. A WebSocket is one persistent connection that streams frames up and
predictions down with minimal per-message overhead, and it naturally holds per-session state
(the MediaPipe graph, the smoothing buffer).

**Alternatives considered:**
- *REST with rapid polling (POST each frame):* hundreds of independent requests per minute, each
  with connection + header overhead, and no natural session. Wrong tool for a stream.
- *WebRTC:* built for peer-to-peer real-time media, but needs signaling, STUN/TURN, and SDP
  negotiation — far more complexity than "browser sends frames to my server" requires.

---

## 3. Rule-based classifier or machine learning?

**Decision:** **Both, in phases.** Phase 1 ships a rule-based classifier; Phase 2 adds a trained
scikit-learn model and a written comparison.

**Why:**
- Rule-based first gets a working end-to-end demo fast, needs zero training data, and every line is
  explainable in an interview.
- The ML phase then demonstrates a full pipeline: data collection, feature engineering, train/test
  split, evaluation (confusion matrix), model persistence — and a head-to-head comparison shows
  engineering judgment.

---

## 4. TypeScript or JavaScript on the frontend?

**Decision:** **TypeScript.**

**Why:** catches errors before runtime, lets the WebSocket message shapes be defined once and
enforced on both ends, gives editor autocomplete, and is expected in modern frontend roles. The
extra learning cost is smaller now than a later migration.

---

## 5. Project kept outside OneDrive

**Decision:** the repo lives at `C:\Users\prakr\Projects\gesture-recognition-app`, not under
`OneDrive\Documents`.

**Why:** OneDrive syncs every file it sees, including the tens of thousands of files in
`node_modules` and `.venv`. That is slow and occasionally locks a file mid-write, causing spurious
permission errors. Version history is handled by Git/GitHub instead, which is change-aware.
