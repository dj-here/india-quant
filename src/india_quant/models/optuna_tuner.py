"""
Optuna Bayesian Hyperparameter Optimization under Purged Walk-Forward Cross-Validation.
Tunes LightGBM parameters to minimize out-of-sample Brier score and Pinball loss with zero look-ahead bias.
"""

from __future__ import annotations
from typing import Any, Dict, Tuple
import numpy as np
import pandas as pd
from india_quant.common.logging import get_logger
from india_quant.models.evaluation import ModelEvaluator
from india_quant.models.tree_models import LightGBMQuantileForecaster
from india_quant.models.validation import PurgedWalkForwardCV

try:
    import optuna
    HAS_OPTUNA = True
    optuna.logging.set_verbosity(optuna.logging.WARNING)
except ImportError:
    optuna = None
    HAS_OPTUNA = False
logger = get_logger("OptunaTuner")


class WalkForwardHyperparameterTuner:
    """
    Automated Bayesian tuning under Purged Walk-Forward CV.
    """

    def __init__(self, n_trials: int = 15, n_splits: int = 3):
        self.n_trials = n_trials
        self.n_splits = n_splits
        self.cv = PurgedWalkForwardCV(n_splits=n_splits, train_bars=600, test_bars=100, embargo_bars=5)
        self.evaluator = ModelEvaluator()

    def tune(self, X: pd.DataFrame, y_dir: pd.Series, y_ret: pd.Series, y_high: pd.Series, y_low: pd.Series) -> Dict[str, any]:
        """
        Executes Optuna study minimizing composite out-of-sample loss: (Brier Score + 10 * Pinball Loss).
        """
        if not HAS_OPTUNA or optuna is None:
            raise RuntimeError("Optuna is not installed in this environment.")
        logger.info(f"Starting Optuna walk-forward hyperparameter search ({self.n_trials} trials, {self.n_splits} folds)...")

        def objective(trial: Any) -> float:
            num_leaves = trial.suggest_int("num_leaves", 15, 45)
            max_depth = trial.suggest_int("max_depth", 3, 7)
            learning_rate = trial.suggest_float("learning_rate", 0.015, 0.08, log=True)
            subsample = trial.suggest_float("subsample", 0.65, 0.90)
            colsample_bytree = trial.suggest_float("colsample_bytree", 0.65, 0.90)

            model = LightGBMQuantileForecaster(
                n_estimators=80,
                num_leaves=num_leaves,
                max_depth=max_depth,
                learning_rate=learning_rate,
                subsample=subsample,
                colsample_bytree=colsample_bytree,
            )

            brier_scores = []
            pinball_losses = []

            for train_idx, test_idx in self.cv.split(X):
                X_tr, X_te = X.iloc[train_idx], X.iloc[test_idx]
                yd_tr, yd_te = y_dir.iloc[train_idx], y_dir.iloc[test_idx].values
                yr_tr, yr_te = y_ret.iloc[train_idx], y_ret.iloc[test_idx].values
                yh_tr = y_high.iloc[train_idx]
                yl_tr = y_low.iloc[train_idx]

                model.fit(X_tr, yd_tr, yr_tr, yh_tr, yl_tr)
                preds = model.predict(X_te)

                # Brier score
                brier = float(np.mean((preds["prob_up"] - yd_te) ** 2))
                brier_scores.append(brier)

                # Pinball loss on median return
                pb50 = self.evaluator.calculate_pinball_loss(yr_te, preds["pred_return_50"], 0.50)
                pinball_losses.append(pb50)

            composite_loss = float(np.mean(brier_scores) + 10.0 * np.mean(pinball_losses))
            return composite_loss

        study = optuna.create_study(direction="minimize", sampler=optuna.samplers.TPESampler(seed=42))
        study.optimize(objective, n_trials=self.n_trials)

        best_params = study.best_params
        logger.info(f"Optuna tuning completed. Best Trial Composite Loss: {study.best_value:.5f}")
        logger.info(f"Optimal Hyperparameters: {best_params}")

        return best_params
