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

---

## 6. Which MediaPipe API for hand landmarks?

**Decision:** the classic **`mediapipe.solutions.hands`** API, `model_complexity=0` (the "lite"
model), `static_image_mode=False`.

**Why:**
- The model is bundled inside the `mediapipe` package, so local dev, CI, and the Docker image need
  no separate model download or storage.
- `static_image_mode=False` tracks the hand between frames instead of re-detecting every frame,
  which is faster on a live stream.
- `model_complexity=0` is accurate enough for six coarse gestures and noticeably faster per frame.

**Alternative considered:** the newer **MediaPipe Tasks** API (`HandLandmarker`). It is the
forward-looking option and supports proper video/live-stream timestamps, but it requires shipping and
version-managing a `hand_landmarker.task` file alongside the code. Not worth the operational overhead
for this project; revisit if the solutions API is removed in a future release.

---

## 7. How the rule-based classifier actually decides

Pipeline: `normalize` (translate to wrist, scale by hand size — **no rotation**, so "up" in the
image keeps its meaning) -> `fingers` (each finger "extended" if its tip is farther from the wrist
than its PIP joint; the thumb instead needs both its joints near-straight) -> `classifier_rules`
(score the 5-finger pattern against a template per gesture, then apply one geometric check each:
thumbs-up needs the thumb to be the highest point, OK sign needs the thumb/index tips touching).

Temporal smoothing (`smoothing`) then takes a majority vote over the last ~6 predictions and only
switches gesture after a new one has held for 2 frames, which removes single-frame flicker.

**Testing:** synthetic 21-point hands (built from per-finger flags) drive the unit tests, so they run
with no camera and no MediaPipe call. Real-hand behaviour is validated with the webcam in Phase 5;
`backend/scripts/record_fixtures.py` captures real samples.

---

## 8. WebSocket connection design: "latest frame wins"

**Decision:** each `/ws` connection runs **two async tasks** sharing a one-slot buffer — a *receiver*
that keeps only the most recent inbound frame, and a *processor* that runs that frame through the
pipeline (in a worker thread) and replies. Frames that arrive mid-processing are overwritten, not
queued.

**Why:**
- Under load, a queue would grow without bound and every reply would describe an increasingly old
  hand pose. For a live UI, a 400 ms-stale "thumbs up" is worse than skipping straight to now.
- Reporting `frames_dropped` gives the frontend a real signal that the client is over-sending, which
  the UI can use to back off its capture rate.
- MediaPipe is synchronous and CPU-bound; `run_in_threadpool` keeps it off the event loop so one
  slow frame (or one busy connection) doesn't stall the server for everyone else.

**Alternative considered:** a bounded `asyncio.Queue`. Simpler to write, but "process everything"
is the wrong goal here — we explicitly want to *skip* work that's no longer relevant.

---

## 9. Where the webcam frames are prepared: in the browser

**Decision:** the browser downscales each frame to ~320 px wide and JPEG-compresses it (quality 0.7)
on a single reused `<canvas>` before sending. It sends at most `recommended_fps` (10) frames per
second and never has two captures in flight at once.

**Why:**
- Landmark detection doesn't need a large image; a ~15 KB JPEG uploads far faster than a raw frame,
  which keeps end-to-end latency low.
- Reusing one canvas avoids allocating/GC-ing a bitmap 10 times a second.
- Throttling on the client saves bandwidth and backend CPU; the "skip if the previous capture is
  still running" guard stops a slow device from queueing work it can't keep up with. The backend's
  own "latest frame wins" rule (#8) is the second line of defence.

**Trade-off:** the backend classifies a slightly soft 320 px image. Acceptable — MediaPipe is robust
at that size and the six gestures are coarse.
