"""Train and compare gesture classifiers on a labelled-landmark dataset.

    python -m ml.train                       # uses ml/data/*.csv
    python -m ml.train --synthetic           # generate + use a synthetic dataset
    python -m ml.train --data ml/data --out ml/models/gesture_clf.joblib

Pipeline:
  1. load the dataset (normalized landmarks + labels + session ids)
  2. turn each hand into the shared feature vector (app.vision.features)
  3. split train/test BY SESSION (GroupShuffleSplit) so consecutive near-duplicate
     frames cannot leak across the split; fall back to a stratified split, with a
     warning, when only one session is present
  4. fit several candidates - a most-frequent baseline, logistic regression,
     random forest, RBF SVM - plus score the existing rule-based classifier on the
     same test set
  5. pick the best ML model by macro-F1, refit it on train+... no: keep the
     train-only fit that was evaluated, and persist it with metadata
  6. write ml/reports/comparison.json and ml/reports/EVALUATION.md
"""

from __future__ import annotations

import argparse
import json
import time
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import sklearn
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import (
    GroupShuffleSplit,
    StratifiedKFold,
    cross_val_score,
    train_test_split,
)
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

from app.gestures import SUPPORTED_GESTURES
from app.vision.classifier_rules import classify as rule_classify
from app.vision.features import FEATURE_NAMES, FEATURE_VERSION, extract_features
from ml.dataset import Dataset, dataset_from_raw, load_dir, summary, validate
from ml.metrics import confusion_ascii, scores

_REPORTS = Path(__file__).resolve().parent / "reports"
_DEFAULT_MODEL = Path(__file__).resolve().parent / "models" / "gesture_clf.joblib"
_LABELS = [g.id for g in SUPPORTED_GESTURES]


def _candidates(seed: int) -> dict[str, object]:
    return {
        "most_frequent": DummyClassifier(strategy="most_frequent"),
        "logreg": make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000, C=1.0)),
        "random_forest": RandomForestClassifier(
            n_estimators=300, max_depth=None, random_state=seed, n_jobs=-1
        ),
        "svm_rbf": make_pipeline(
            StandardScaler(),
            SVC(kernel="rbf", C=8.0, gamma="scale", probability=True, random_state=seed),
        ),
    }


@dataclass
class TrainResult:
    selected_model: str
    report: dict[str, object]
    pipeline: object


def _features(dataset: Dataset) -> np.ndarray:
    return np.array([extract_features(hand) for hand in dataset.landmarks])


def _split(dataset: Dataset, test_size: float, seed: int):
    if len(np.unique(dataset.sessions)) >= 2:
        splitter = GroupShuffleSplit(n_splits=1, test_size=test_size, random_state=seed)
        train_idx, test_idx = next(
            splitter.split(dataset.landmarks, dataset.labels, dataset.sessions)
        )
        return train_idx, test_idx, "group-by-session"

    train_idx, test_idx = train_test_split(
        np.arange(len(dataset)),
        test_size=test_size,
        random_state=seed,
        stratify=dataset.labels,
    )
    return train_idx, test_idx, "stratified (single session - not leakage-safe)"


def _rule_predictions(landmarks: np.ndarray) -> list[str]:
    preds: list[str] = []
    for hand in landmarks:
        prediction = rule_classify(hand)
        preds.append(prediction.gesture or "none")
    return preds


def train(
    dataset: Dataset, *, test_size: float = 0.25, seed: int = 0, kind: str = "real"
) -> TrainResult:
    problems = validate(dataset)
    blocking = [p for p in problems if "only one session" not in p]
    if blocking:
        raise ValueError("dataset is not usable:\n  - " + "\n  - ".join(blocking))

    X = _features(dataset)
    y = dataset.labels
    train_idx, test_idx, split_kind = _split(dataset, test_size, seed)
    X_train, X_test = X[train_idx], X[test_idx]
    y_train, y_test = y[train_idx].tolist(), y[test_idx].tolist()

    cv = StratifiedKFold(n_splits=min(5, np.min(np.unique(y_train, return_counts=True)[1])))

    models: dict[str, object] = {}

    # Rule-based baseline on the same held-out test set.
    rule_pred = _rule_predictions(dataset.landmarks[test_idx])
    models["rule_based"] = scores(y_test, rule_pred, _LABELS)

    fitted: dict[str, object] = {}
    for name, estimator in _candidates(seed).items():
        estimator.fit(X_train, y_train)
        fitted[name] = estimator
        entry = scores(y_test, estimator.predict(X_test).tolist(), _LABELS)
        if name != "most_frequent":
            cv_scores = cross_val_score(estimator, X_train, y_train, cv=cv, scoring="f1_macro")
            entry["cv_f1_macro_mean"] = round(float(cv_scores.mean()), 4)
            entry["cv_f1_macro_std"] = round(float(cv_scores.std()), 4)
        models[name] = entry

    ranked = sorted(
        (n for n in fitted if n != "most_frequent"),
        key=lambda n: models[n]["f1_macro"],
        reverse=True,
    )
    selected = ranked[0]

    report: dict[str, object] = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "dataset": kind,
        "provisional": kind == "synthetic",
        "feature_version": FEATURE_VERSION,
        "feature_names": list(FEATURE_NAMES),
        "sklearn_version": sklearn.__version__,
        "n_samples": len(dataset),
        "n_train": len(train_idx),
        "n_test": len(test_idx),
        "split": split_kind,
        "dataset_summary": summary(dataset),
        "labels": _LABELS,
        "selected_model": selected,
        "models": models,
        "notes": problems,
    }

    return TrainResult(selected_model=selected, report=report, pipeline=fitted[selected])


def _write_reports(report: dict[str, object]) -> None:
    _REPORTS.mkdir(parents=True, exist_ok=True)
    (_REPORTS / "comparison.json").write_text(json.dumps(report, indent=2), newline="\n")

    lines = [
        "# Model comparison",
        "",
        f"Generated: {report['generated_at']}  |  dataset: **{report['dataset']}**"
        + ("  |  **PROVISIONAL (synthetic)**" if report["provisional"] else ""),
        "",
        f"{report['n_samples']} samples, split `{report['split']}` "
        f"({report['n_train']} train / {report['n_test']} test).",
        "",
        "| model | accuracy | precision | recall | F1 (macro) |",
        "|---|---|---|---|---|",
    ]
    for name, m in report["models"].items():
        lines.append(
            f"| {name} | {m['accuracy']} | {m['precision_macro']} | "
            f"{m['recall_macro']} | {m['f1_macro']} |"
        )
    selected = report["selected_model"]
    lines += [
        "",
        f"**Selected model: `{selected}`**",
        "",
        "## Confusion matrix (selected model)",
        "",
        "```",
    ]
    sel = report["models"][selected]
    lines.append(confusion_ascii(sel["confusion_matrix"], sel["confusion_labels"]))
    lines += ["```", ""]
    (_REPORTS / "EVALUATION.md").write_text("\n".join(lines), newline="\n")


def _save_model(pipeline: object, report: dict[str, object], path: Path) -> None:
    import joblib

    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(
        {
            "pipeline": pipeline,
            "model_name": report["selected_model"],
            "feature_names": list(FEATURE_NAMES),
            "feature_version": FEATURE_VERSION,
            "labels": report["labels"],
            "sklearn_version": report["sklearn_version"],
            "trained_at": report["generated_at"],
            "dataset": report["dataset"],
            "provisional": report["provisional"],
            "test_f1_macro": report["models"][report["selected_model"]]["f1_macro"],
        },
        path,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=Path("ml/data"))
    parser.add_argument("--out", type=Path, default=_DEFAULT_MODEL)
    parser.add_argument(
        "--synthetic", action="store_true", help="use a generated synthetic dataset"
    )
    parser.add_argument("--synthetic-samples", type=int, default=1200)
    parser.add_argument("--test-size", type=float, default=0.25)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--no-save", action="store_true")
    args = parser.parse_args()

    if args.synthetic:
        from ml.synthetic import sample_dataset

        raw, labels, sessions = sample_dataset(args.synthetic_samples, seed=args.seed)
        dataset = dataset_from_raw(raw, labels, sessions)
        kind = "synthetic"
    else:
        dataset = load_dir(args.data)
        kind = "real"

    print(f"loaded {len(dataset)} samples ({kind}); {json.dumps(summary(dataset), indent=0)}")
    result = train(dataset, test_size=args.test_size, seed=args.seed, kind=kind)
    _write_reports(result.report)

    for name, m in result.report["models"].items():
        marker = "  <- selected" if name == result.selected_model else ""
        print(f"  {name:16s} f1_macro={m['f1_macro']:.3f} acc={m['accuracy']:.3f}{marker}")

    if not args.no_save:
        _save_model(result.pipeline, result.report, args.out)
        print(f"saved model -> {args.out}")
    print(f"reports -> {_REPORTS}/comparison.json, {_REPORTS}/EVALUATION.md")


if __name__ == "__main__":
    main()
