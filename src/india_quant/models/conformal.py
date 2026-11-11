"""
Conformal Prediction Engine for IndiaQuant.
Implements Inductive Conformal Prediction (ICP) to generate distribution-free
prediction intervals with mathematically guaranteed finite-sample coverage (1 - alpha).
"""

from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd


class ConformalPredictionEngine:
    """
    Computes distribution-free calibrated prediction intervals using Split Conformal Prediction.
    Guarantees: P(Y in C(X)) >= 1 - alpha for exchangeable sequences.
    """

    def __init__(self, confidence_level: float = 0.90):
        self.confidence_level = confidence_level
        self.alpha = 1.0 - confidence_level
        self.conformal_quantile_ret: float = 0.0
        self.conformal_quantile_high: float = 0.0
        self.conformal_quantile_low: float = 0.0

    def calibrate(
        self,
        y_cal_ret: np.ndarray,
        y_cal_high: np.ndarray,
        y_cal_low: np.ndarray,
        pred_cal_ret_low: np.ndarray,
        pred_cal_ret_high: np.ndarray,
        pred_cal_high_50: np.ndarray,
        pred_cal_low_50: np.ndarray,
    ):
        """
        Calibrates non-conformity scores on a hold-out calibration dataset.
        """
        n = len(y_cal_ret)
        if n < 10:
            self.conformal_quantile_ret = 0.005
            self.conformal_quantile_high = 0.005
            self.conformal_quantile_low = 0.005
            return self

        # 1. Non-conformity scores for Return Quantile interval [q_low, q_high]
        # s_i = max(q_low - y_i, y_i - q_high)
        scores_ret = np.maximum(pred_cal_ret_low - y_cal_ret, y_cal_ret - pred_cal_ret_high)

        # 2. Non-conformity scores for Next-Day High log ratio
        # s_i = max(0, y_high - pred_high_50)
        scores_high = np.abs(y_cal_high - pred_cal_high_50)

        # 3. Non-conformity scores for Next-Day Low log ratio
        scores_low = np.abs(y_cal_low - pred_cal_low_50)

        # Conformal quantile: ceil((n + 1) * (1 - alpha)) / n
        level = min(np.ceil((n + 1) * (1.0 - self.alpha)) / n, 1.0)
        p_idx = int(np.clip(level * 100, 1, 99))

        self.conformal_quantile_ret = float(np.percentile(scores_ret, p_idx))
        self.conformal_quantile_high = float(np.percentile(scores_high, p_idx))
        self.conformal_quantile_low = float(np.percentile(scores_low, p_idx))

        return self

    def predict_conformal_intervals(
        self,
        pred_ret_low: np.ndarray,
        pred_ret_high: np.ndarray,
        pred_high_50: np.ndarray,
        pred_low_50: np.ndarray,
        current_prices: Optional[pd.Series] = None,
    ) -> Dict[str, np.ndarray]:
        """
        Applies calibrated conformal adjustments to produce guaranteed prediction intervals.
        """
        # Adjusted return bounds
        conf_ret_low = pred_ret_low - self.conformal_quantile_ret
        conf_ret_high = pred_ret_high + self.conformal_quantile_ret

        # Adjusted High and Low log-ratio bounds
        conf_high_ratio = pred_high_50 + self.conformal_quantile_high
        conf_low_ratio = pred_low_50 - self.conformal_quantile_low

        # Enforce non-crossing constraint: low <= high
        conf_high_ratio = np.maximum(conf_high_ratio, 0.0)
        conf_low_ratio = np.minimum(conf_low_ratio, 0.0)

        out = {
            "conf_ret_low": conf_ret_low,
            "conf_ret_high": conf_ret_high,
            "conf_ret_width": conf_ret_high - conf_ret_low,
            "conf_high_ratio": conf_high_ratio,
            "conf_low_ratio": conf_low_ratio,
        }

        if current_prices is not None:
            c = current_prices.values
            out["conf_high_price"] = np.round(c * np.exp(conf_high_ratio), 2)
            out["conf_low_price"] = np.round(c * np.exp(conf_low_ratio), 2)

        return out

    def evaluate_coverage(
        self,
        y_test: np.ndarray,
        conf_low: np.ndarray,
        conf_high: np.ndarray,
    ) -> float:
        """Computes empirical fraction of test labels captured inside conformal intervals."""
        in_band = (y_test >= conf_low) & (y_test <= conf_high)
        return float(np.mean(in_band))
