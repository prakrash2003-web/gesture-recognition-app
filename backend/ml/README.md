# backend/ml/

The offline machine-learning pipeline. The running server only ever loads a
trained model file (`app/vision/classifier_ml.py`); everything here is run by a
developer from the command line.

The rule-based classifier (`app/vision/classifier_rules.py`) is always available
as the baseline — the ML model is an optional upgrade selected with
`GESTUREFLOW_CLASSIFIER=ml` or the Live page's Settings panel.

## Files

| File | Purpose |
|---|---|
| `synthetic.py` | Build synthetic 21-point hands + a jittered dataset. Used by the vision unit tests and to smoke-test the training pipeline before real data exists. |
| `dataset.py` | The on-disk dataset format (CSV of normalized landmarks) + load / validate. |
| `features.py` *(in `app/vision/`)* | The single feature representation shared by training and inference. |
| `metrics.py` | Accuracy / precision / recall / F1 / confusion matrix, identical for train + evaluate. |
| `train.py` | Load dataset → split by session → compare models → save the best + write reports. |
| `evaluate.py` | Re-evaluate a saved model against a dataset. |
| `data/` | Collected datasets (git-ignored). |
| `models/` | Trained `*.joblib` files (git-ignored — regenerate with `train.py`). |
| `reports/` | `comparison.json` + `EVALUATION.md` (committed — small). |

## Dataset format

One CSV per recording *session*, header:

```
label,session,captured_at,lm0_x,lm0_y,lm0_z, ... ,lm20_x,lm20_y,lm20_z
```

`label` is a gesture id; the 63 `lm*` columns are the landmarks **after**
`normalize_landmarks` (wrist at the origin, hand scaled to ~1). We store
normalized landmarks — never images — and derive model features at train time, so
the feature set can change without re-collecting data.

## Collecting data

Needs a webcam. From `backend/` with the venv active:

```bash
# one run per gesture, per session. Record 2+ sessions so the train/test
# split can be by session (no leakage from near-duplicate frames).
python scripts/record_fixtures.py --gesture open_palm   --session s1
python scripts/record_fixtures.py --gesture fist        --session s1
python scripts/record_fixtures.py --gesture thumbs_up   --session s1
python scripts/record_fixtures.py --gesture victory     --session s1
python scripts/record_fixtures.py --gesture pointing_up --session s1
python scripts/record_fixtures.py --gesture ok_sign     --session s1
# ...repeat all six with --session s2 (different lighting / distance / angle)
```

Aim for **120–200 samples per gesture per session**. Vary hand distance,
in-plane rotation, and which hand you use.

## Training

```bash
python -m ml.train              # reads ml/data/*.csv
python -m ml.train --synthetic  # generate + use synthetic data (pipeline check only)
```

It prints a comparison table, writes `reports/comparison.json` +
`reports/EVALUATION.md`, and saves `models/gesture_clf.joblib`. Restart the
backend (or reconnect the WebSocket) to pick up the new model.
