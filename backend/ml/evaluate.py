"""Evaluate a saved model against a dataset.

    python -m ml.evaluate                                  # default model + ml/data
    python -m ml.evaluate --model ml/models/gesture_clf.joblib --data ml/data

Prints accuracy / precision / recall / F1 (macro and per class) plus the
confusion matrix. Use it to check a model on a fresh session it was not trained
on, or to re-score after collecting more data.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib

from app.vision.features import FEATURE_VERSION, extract_features
from ml.dataset import load_dir
from ml.metrics import confusion_ascii, scores

_DEFAULT_MODEL = Path(__file__).resolve().parent / "models" / "gesture_clf.joblib"


def evaluate(model_path: Path, data_dir: Path) -> dict[str, object]:
    bundle = joblib.load(model_path)
    if bundle.get("feature_version") != FEATURE_VERSION:
        got = bundle.get("feature_version")
        raise SystemExit(f"model feature_version {got} != code {FEATURE_VERSION}; retrain")
    pipeline = bundle["pipeline"]
    labels = list(bundle["labels"])

    dataset = load_dir(data_dir)
    X = [extract_features(hand) for hand in dataset.landmarks]
    y_true = dataset.labels.tolist()
    y_pred = pipeline.predict(X).tolist()

    result = scores(y_true, y_pred, labels)
    result["model_name"] = bundle.get("model_name", "ml")
    result["n_samples"] = len(dataset)
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model", type=Path, default=_DEFAULT_MODEL)
    parser.add_argument("--data", type=Path, default=Path("ml/data"))
    args = parser.parse_args()

    result = evaluate(args.model, args.data)
    print(f"model: {result['model_name']}   samples: {result['n_samples']}")
    print(
        f"accuracy={result['accuracy']:.3f}  precision={result['precision_macro']:.3f}  "
        f"recall={result['recall_macro']:.3f}  f1={result['f1_macro']:.3f}"
    )
    print("\nper class:")
    for label, m in result["per_class"].items():
        print(
            f"  {label:12s} p={m['precision']:.3f} r={m['recall']:.3f} "
            f"f1={m['f1']:.3f} n={m['support']}"
        )
    print("\nconfusion matrix:")
    print(confusion_ascii(result["confusion_matrix"], result["confusion_labels"]))
    print()
    print(json.dumps({k: result[k] for k in ("accuracy", "f1_macro")}, indent=0))


if __name__ == "__main__":
    main()
