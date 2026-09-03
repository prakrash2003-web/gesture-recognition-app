"""Computer-vision pipeline: raw webcam frame -> recognized gesture.

Stages (each in its own module, so each can be tested in isolation):

    decode      JPEG bytes            -> BGR image (NumPy array)
    landmarks   BGR image             -> 21 hand landmark points (MediaPipe)
    normalize   raw landmarks         -> position/scale-independent landmarks
    fingers     normalized landmarks  -> per-finger extended/curled state
    classifier_rules  finger state + geometry -> gesture id + heuristic confidence
    smoothing   stream of predictions -> stable prediction (majority vote over time)
    pipeline    ties all of the above together for the WebSocket endpoint (Phase 3)
"""
