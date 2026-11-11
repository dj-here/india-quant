"""
Baseline Models for IndiaQuant.
Every machine learning model MUST beat these baselines out-of-sample to be promoted.
- Naive Persistence (0 return, historical median high/low)
- Naive Momentum (20-day SMA sign)
- Regularized Ridge & Logistic Regression
- Autoregressive AR(1) Drift
"""

from typing import Dict, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


class NaivePersistenceBaseline:
    """
    Naive baseline predicting zero expected return, 50% direction,
    and trailing median high/low log-ratios.
    """

    def __init__(self):
        self.median_high_ratio = 0.008
        self.median_low_ratio = -0.008

    def fit(self, X: pd.DataFrame, y_high: pd.Series, y_low: pd.Series):
        self.median_high_ratio = float(y_high.dropna().median())
        self.median_low_ratio = float(y_low.dropna().median())
        return self

    def predict(self, X: pd.DataFrame) -> Dict[str, np.ndarray]:
        n = len(X)
        return {
            "prob_up": np.full(n, 0.50),
            "pred_dir": np.zeros(n, dtype=int),
            "pred_return_50": np.zeros(n),
            "pred_high_ratio_50": np.full(n, self.median_high_ratio),
            "pred_low_ratio_50": np.full(n, self.median_low_ratio),
        }


class MomentumBaseline:
    """
    Classical momentum baseline predicting direction based on 20-day SMA trend.
    """

    def __init__(self):
        pass

    def fit(self, X: pd.DataFrame, y: pd.Series):
        return self

    def predict(self, X: pd.DataFrame) -> Dict[str, np.ndarray]:
        n = len(X)
        # Check if dist_ema_21 or ret_lag_20d is in X
        if "dist_ema_21" in X.columns:
            trend = X["dist_ema_21"].values > 0
        elif "ret_lag_20d" in X.columns:
            trend = X["ret_lag_20d"].values > 0
        else:
            trend = np.ones(n, dtype=bool)

        prob_up = np.where(trend, 0.60, 0.40)
        pred_dir = trend.astype(int)

        span = X.get("high_low_span", pd.Series(0.012, index=X.index)).values
        return {
            "prob_up": prob_up,
            "pred_dir": pred_dir,
            "pred_return_50": np.where(trend, 0.001, -0.001),
            "pred_high_ratio_50": span * 0.6,
            "pred_low_ratio_50": -span * 0.6,
        }


class RidgeBaseline:
    """
    L2-regularized linear baseline: LogisticRegression for direction, Ridge for High/Low and Return.
    """

    def __init__(self, alpha: float = 10.0):
        self.alpha = alpha
        self.clf = make_pipeline(StandardScaler(), LogisticRegression(C=1.0 / alpha, max_iter=1000, random_state=42))
        self.reg_ret = make_pipeline(StandardScaler(), Ridge(alpha=alpha, random_state=42))
        self.reg_high = make_pipeline(StandardScaler(), Ridge(alpha=alpha, random_state=42))
        self.reg_low = make_pipeline(StandardScaler(), Ridge(alpha=alpha, random_state=42))

    def fit(
        self,
        X: pd.DataFrame,
        y_dir: pd.Series,
        y_ret: pd.Series,
        y_high: pd.Series,
        y_low: pd.Series,
    ):
        X_clean = X.fillna(0.0)

        # 1. Fit Direction Classifier
        valid_dir = y_dir.notna()
        if valid_dir.any():
            self.clf.fit(X_clean.loc[valid_dir], y_dir.loc[valid_dir])

        # 2. Fit Return Regressor
        valid_ret = y_ret.notna()
        if valid_ret.any():
            self.reg_ret.fit(X_clean.loc[valid_ret], y_ret.loc[valid_ret])

        # 3. Fit High/Low Regressors
        valid_hl = y_high.notna() & y_low.notna()
        if valid_hl.any():
            self.reg_high.fit(X_clean.loc[valid_hl], y_high.loc[valid_hl])
            self.reg_low.fit(X_clean.loc[valid_hl], y_low.loc[valid_hl])

        return self

    def predict(self, X: pd.DataFrame) -> Dict[str, np.ndarray]:
        X_clean = X.fillna(0.0)
        try:
            prob_up = self.clf.predict_proba(X_clean)[:, 1]
        except Exception:
            prob_up = np.full(len(X), 0.50)
        pred_dir = (prob_up >= 0.50).astype(int)

        try:
            pred_ret = self.reg_ret.predict(X_clean)
            pred_high = self.reg_high.predict(X_clean)
            pred_low = self.reg_low.predict(X_clean)
        except Exception:
            pred_ret = np.zeros(len(X))
            pred_high = np.full(len(X), 0.008)
            pred_low = np.full(len(X), -0.008)

        # Enforce non-crossing constraint: low <= high
        cross_mask = pred_low > pred_high
        if cross_mask.any():
            pred_low[cross_mask], pred_high[cross_mask] = pred_high[cross_mask], pred_low[cross_mask]

        return {
            "prob_up": prob_up,
            "pred_dir": pred_dir,
            "pred_return_50": pred_ret,
            "pred_high_ratio_50": pred_high,
            "pred_low_ratio_50": pred_low,
        }
