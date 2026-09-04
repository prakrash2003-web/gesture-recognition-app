"""Offline machine-learning pipeline for GestureFlow.

This package is NOT imported by the running server's request path except for the
inference wrapper (app.vision.classifier_ml), which loads a trained model file.
Everything else here - data collection helpers, feature-set definition, training,
evaluation - is run from the command line by a developer.

    ml/
      synthetic.py   build synthetic hands + a jittered dataset (pipeline smoke tests)
      dataset.py     the on-disk dataset format + load / save / validate
      train.py       load dataset -> split (no leakage) -> compare models -> save best
      evaluate.py    load a model + dataset -> full metrics + confusion matrix report
      data/          collected datasets (git-ignored)
      models/        trained model files (*.joblib, git-ignored)
      reports/       small JSON/markdown metric reports (committed)
"""
