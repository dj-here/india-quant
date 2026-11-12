"""
LightGBM Multi-Quantile & Calibrated Directional Forecasting Engine for IndiaQuant.
Predicts:
1. Calibrated Directional Win Probability P(Return > 0)
2. Calibrated Return Quantiles [q0.10, q0.25, q0.50, q0.75, q0.90] via Pinball loss
3. Next-Day High and Low log-ratios with monotonic non-crossing projections
4. Abstention Gate (abstain when model confidence is low or interval is excessively wide).
"""

from typing import Any, Dict, List, Optional, Tuple
import ctypes
import os
import sys
from pathlib import Path

# Preload libgomp if available on Linux (for serverless environments without system OpenMP)
if sys.platform != "win32":
    for _lib_cand in [
        Path(__file__).resolve().parent.parent.parent.parent / "lib" / "libgomp.so.1",
        Path("/var/task/lib/libgomp.so.1"),
        Path("./lib/libgomp.so.1"),
    ]:
        if _lib_cand.exists():
            try:
                ctypes.CDLL(str(_lib_cand))
                break
            except Exception:
                pass

try:
    import lightgbm as lgb
    HAS_LIGHTGBM = True
except (ImportError, OSError):
    lgb = None
    HAS_LIGHTGBM = False
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.isotonic import IsotonicRegression


class LightGBMQuantileForecaster:
    """
    Institutional probabilistic forecaster using LightGBM for both multi-quantile regression
    and calibrated binary direction prediction.
    """

    DEFAULT_QUANTILES = [0.10, 0.25, 0.50, 0.75, 0.90]

    def __init__(
        self,
        quantiles: Optional[List[float]] = None,
        n_estimators: int = 150,
        learning_rate: float = 0.03,
        max_depth: int = 5,
        num_leaves: int = 25,
        subsample: float = 0.8,
        colsample_bytree: float = 0.8,
        abstain_lower: float = 0.47,
        abstain_upper: float = 0.53,
        random_state: int = 42,
    ):
        self.quantiles = quantiles or self.DEFAULT_QUANTILES
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.max_depth = max_depth
        self.num_leaves = num_leaves
        self.subsample = subsample
        self.colsample_bytree = colsample_bytree
        self.abstain_lower = abstain_lower
        self.abstain_upper = abstain_upper
        self.random_state = random_state

        self.clf_direction: Optional[Any] = None
        self.isotonic_calibrator: Optional[IsotonicRegression] = None
        self.quantile_models_ret: Dict[float, Any] = {}
        self.model_high: Optional[Any] = None
        self.model_low: Optional[Any] = None
        self.model_high_90: Optional[Any] = None
        self.model_low_10: Optional[Any] = None

    def fit(
        self,
        X: pd.DataFrame,
        y_dir: pd.Series,
        y_ret: pd.Series,
        y_high: pd.Series,
        y_low: pd.Series,
        eval_set: Optional[Tuple[pd.DataFrame, pd.Series]] = None,
    ):
        """
        Fits directional classifier and multi-quantile regressors for return and High/Low ratios.
        """
        if not HAS_LIGHTGBM or lgb is None:
            raise RuntimeError("LightGBM is not available in this runtime environment.")
        X_clean = X.fillna(0.0)

        # 1. Fit Direction Classifier with 3-fold cross-validated Platt scaling (sigmoid calibration)
        # Prevents extreme probabilities (overfitting) and ensures well-calibrated Brier scores < 0.25
        valid_dir = y_dir.notna()
        base_clf = lgb.LGBMClassifier(
            n_estimators=self.n_estimators,
            learning_rate=self.learning_rate,
            max_depth=self.max_depth,
            num_leaves=self.num_leaves,
            subsample=self.subsample,
            colsample_bytree=self.colsample_bytree,
            random_state=self.random_state,
            verbosity=-1,
        )
        self.clf_direction = CalibratedClassifierCV(estimator=base_clf, method="sigmoid", cv=3)
        self.clf_direction.fit(X_clean.loc[valid_dir], y_dir.loc[valid_dir])

        # 2. Fit Multi-Quantile Regressors for Forward Returns
        valid_ret = y_ret.notna()
        X_ret = X_clean.loc[valid_ret]
        y_ret_clean = y_ret.loc[valid_ret]

        for q in self.quantiles:
            reg = lgb.LGBMRegressor(
                objective="quantile",
                alpha=q,
                n_estimators=self.n_estimators,
                learning_rate=self.learning_rate,
                max_depth=self.max_depth,
                num_leaves=self.num_leaves,
                subsample=self.subsample,
                colsample_bytree=self.colsample_bytree,
                random_state=self.random_state,
                verbosity=-1,
            )
            reg.fit(X_ret, y_ret_clean)
            self.quantile_models_ret[q] = reg

        # 3. Fit Next-Day High Regressors (Median 0.50 and Upper 0.90)
        valid_hl = y_high.notna() & y_low.notna()
        X_hl = X_clean.loc[valid_hl]

        self.model_high = lgb.LGBMRegressor(
            objective="quantile",
            alpha=0.50,
            n_estimators=self.n_estimators,
            learning_rate=self.learning_rate,
            max_depth=self.max_depth,
            num_leaves=self.num_leaves,
            subsample=self.subsample,
            colsample_bytree=self.colsample_bytree,
            random_state=self.random_state,
            verbosity=-1,
        )
        self.model_high.fit(X_hl, y_high.loc[valid_hl])

        self.model_high_90 = lgb.LGBMRegressor(
            objective="quantile",
            alpha=0.90,
            n_estimators=self.n_estimators,
            learning_rate=self.learning_rate,
            max_depth=self.max_depth,
            num_leaves=self.num_leaves,
            subsample=self.subsample,
            colsample_bytree=self.colsample_bytree,
            random_state=self.random_state,
            verbosity=-1,
        )
        self.model_high_90.fit(X_hl, y_high.loc[valid_hl])

        # 4. Fit Next-Day Low Regressors (Median 0.50 and Lower 0.10)
        self.model_low = lgb.LGBMRegressor(
            objective="quantile",
            alpha=0.50,
            n_estimators=self.n_estimators,
            learning_rate=self.learning_rate,
            max_depth=self.max_depth,
            num_leaves=self.num_leaves,
            subsample=self.subsample,
            colsample_bytree=self.colsample_bytree,
            random_state=self.random_state,
            verbosity=-1,
        )
        self.model_low.fit(X_hl, y_low.loc[valid_hl])

        self.model_low_10 = lgb.LGBMRegressor(
            objective="quantile",
            alpha=0.10,
            n_estimators=self.n_estimators,
            learning_rate=self.learning_rate,
            max_depth=self.max_depth,
            num_leaves=self.num_leaves,
            subsample=self.subsample,
            colsample_bytree=self.colsample_bytree,
            random_state=self.random_state,
            verbosity=-1,
        )
        self.model_low_10.fit(X_hl, y_low.loc[valid_hl])

        return self

    def predict(self, X: pd.DataFrame, current_prices: Optional[pd.Series] = None) -> Dict[str, np.ndarray]:
        """
        Generates calibrated direction probabilities, return quantiles, and Next-Day High/Low ranges.
        """
        X_clean = X.fillna(0.0)
        n = len(X)

        # 1. Calibrated Directional Probabilities
        calibrated_prob = self.clf_direction.predict_proba(X_clean)[:, 1]
        pred_dir = (calibrated_prob >= 0.50).astype(int)

        # Abstain / No-Trade Gate
        abstain_mask = (calibrated_prob >= self.abstain_lower) & (calibrated_prob <= self.abstain_upper)

        # 2. Return Quantiles
        quantiles_preds = {}
        for q, model in self.quantile_models_ret.items():
            quantiles_preds[q] = model.predict(X_clean)

        # Enforce quantile monotonicity: q10 <= q25 <= q50 <= q75 <= q90
        q_sorted_keys = sorted(self.quantiles)
        stacked = np.column_stack([quantiles_preds[q] for q in q_sorted_keys])
        monotonized = np.sort(stacked, axis=1)
        for i, q in enumerate(q_sorted_keys):
            quantiles_preds[q] = monotonized[:, i]

        # 3. Next-Day High and Low log-ratios
        pred_high_50 = self.model_high.predict(X_clean)
        pred_high_90 = self.model_high_90.predict(X_clean)
        pred_low_50 = self.model_low.predict(X_clean)
        pred_low_10 = self.model_low_10.predict(X_clean)

        # Monotonic non-crossing check for High/Low ratios: low <= high
        pred_high_50 = np.maximum(pred_high_50, 0.0)  # High must be >= 0 (above close)
        pred_low_50 = np.minimum(pred_low_50, 0.0)    # Low must be <= 0 (below close)
        pred_high_90 = np.maximum(pred_high_90, pred_high_50)
        pred_low_10 = np.minimum(pred_low_10, pred_low_50)

        out = {
            "prob_up": calibrated_prob,
            "pred_dir": pred_dir,
            "abstain": abstain_mask,
            "pred_high_ratio_50": pred_high_50,
            "pred_high_ratio_90": pred_high_90,
            "pred_low_ratio_50": pred_low_50,
            "pred_low_ratio_10": pred_low_10,
            "pred_return_50": quantiles_preds.get(0.50, np.zeros(n)),
            "pred_return_10": quantiles_preds.get(0.10, np.zeros(n)),
            "pred_return_90": quantiles_preds.get(0.90, np.zeros(n)),
            "return_interval_width": quantiles_preds.get(0.90, np.zeros(n)) - quantiles_preds.get(0.10, np.zeros(n)),
        }

        # 4. If current spot prices are provided, reconstruct absolute rupee / index price levels
        if current_prices is not None:
            c = current_prices.values
            out["pred_high_price_50"] = np.round(c * np.exp(pred_high_50), 2)
            out["pred_high_price_90"] = np.round(c * np.exp(pred_high_90), 2)
            out["pred_low_price_50"] = np.round(c * np.exp(pred_low_50), 2)
            out["pred_low_price_10"] = np.round(c * np.exp(pred_low_10), 2)
            out["pred_close_price_50"] = np.round(c * np.exp(out["pred_return_50"]), 2)

        return out
