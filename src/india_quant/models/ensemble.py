"""
Regime-Aware Stacking Ensemble & Uncertainty Abstention Gate for IndiaQuant.
Combines:
1. Multi-Quantile LightGBM
2. Deep Sequence LSTM (PyTorch)
3. L2 Regularized Ridge Baseline
4. Conformal Prediction Engine (ICP)
Applies dynamic regime-dependent stacking weights and provides an automated abstention gate.
"""

from typing import Dict, List, Optional
import numpy as np
import pandas as pd
from india_quant.models.baselines import RidgeBaseline
from india_quant.models.conformal import ConformalPredictionEngine
from india_quant.models.deep_models import LSTMSequenceForecaster
from india_quant.models.tree_models import LightGBMQuantileForecaster


class RegimeAwareEnsemble:
    """
    Ensemble model combining Gradient Boosting, Deep Sequence LSTM, and Linear Baselines
    with dynamic regime weights and conformal uncertainty calibration.
    """

    # Dynamic weights: [Tree, LSTM, Ridge] per market regime state
    REGIME_WEIGHTS = {
        0: (0.60, 0.30, 0.10),  # Bull Trend: heavier tree momentum
        1: (0.40, 0.30, 0.30),  # Range Chop: balanced regularized linear + tree
        2: (0.30, 0.20, 0.50),  # High-Vol Panic: defensive regularized weights
    }

    def __init__(
        self,
        n_estimators_lgb: int = 120,
        lstm_epochs: int = 15,
        conformal_confidence: float = 0.90,
        abstain_lower: float = 0.47,
        abstain_upper: float = 0.53,
        disagreement_threshold: float = 0.04,
    ):
        self.tree_model = LightGBMQuantileForecaster(n_estimators=n_estimators_lgb, learning_rate=0.03)
        self.lstm_model = LSTMSequenceForecaster(epochs=lstm_epochs, hidden_dim=32)
        self.ridge_model = RidgeBaseline(alpha=10.0)
        self.conformal_engine = ConformalPredictionEngine(confidence_level=conformal_confidence)

        self.abstain_lower = abstain_lower
        self.abstain_upper = abstain_upper
        self.disagreement_threshold = disagreement_threshold

    def fit(
        self,
        X: pd.DataFrame,
        y_dir: pd.Series,
        y_ret: pd.Series,
        y_high: pd.Series,
        y_low: pd.Series,
    ):
        """
        Fits all constituent models and calibrates conformal prediction scores on a split holdout.
        """
        n = len(X)
        split_idx = int(n * 0.80)

        # 1. Train models on 80% split
        X_train, X_cal = X.iloc[:split_idx], X.iloc[split_idx:]
        yd_train, yd_cal = y_dir.iloc[:split_idx], y_dir.iloc[split_idx:]
        yr_train, yr_cal = y_ret.iloc[:split_idx], y_ret.iloc[split_idx:]
        yh_train, yh_cal = y_high.iloc[:split_idx], y_high.iloc[split_idx:]
        yl_train, yl_cal = y_low.iloc[:split_idx], y_low.iloc[split_idx:]

        self.tree_model.fit(X_train, yd_train, yr_train, yh_train, yl_train)
        self.lstm_model.fit(X_train, yd_train, yr_train, yh_train, yl_train)
        self.ridge_model.fit(X_train, yd_train, yr_train, yh_train, yl_train)

        # 2. Calibrate Conformal Prediction Engine on remaining 20% holdout
        pred_cal_tree = self.tree_model.predict(X_cal)
        valid_cal = yr_cal.notna() & yh_cal.notna() & yl_cal.notna()

        self.conformal_engine.calibrate(
            y_cal_ret=yr_cal.loc[valid_cal].values,
            y_cal_high=yh_cal.loc[valid_cal].values,
            y_cal_low=yl_cal.loc[valid_cal].values,
            pred_cal_ret_low=pred_cal_tree["pred_return_10"][valid_cal],
            pred_cal_ret_high=pred_cal_tree["pred_return_90"][valid_cal],
            pred_cal_high_50=pred_cal_tree["pred_high_ratio_50"][valid_cal],
            pred_cal_low_50=pred_cal_tree["pred_low_ratio_50"][valid_cal],
        )

        return self

    def predict(
        self,
        X: pd.DataFrame,
        current_prices: Optional[pd.Series] = None,
        regimes: Optional[pd.Series] = None,
    ) -> Dict[str, np.ndarray]:
        """
        Generates ensemble predictions with dynamic regime weighting and conformal uncertainty bands.
        """
        n = len(X)
        p_tree = self.tree_model.predict(X, current_prices=current_prices)
        p_lstm = self.lstm_model.predict(X, current_prices=current_prices)
        p_ridge = self.ridge_model.predict(X)

        # Default to Regime 1 (Chop) if not provided
        if regimes is not None:
            reg_arr = regimes.values
        elif "regime_state" in X.columns:
            reg_arr = X["regime_state"].values
        else:
            reg_arr = np.ones(n, dtype=int)

        prob_up_ens = np.zeros(n)
        pred_ret_ens = np.zeros(n)
        pred_high_ens = np.zeros(n)
        pred_low_ens = np.zeros(n)

        # Apply regime-dependent weights per bar
        for i in range(n):
            reg = int(reg_arr[i]) if reg_arr[i] in self.REGIME_WEIGHTS else 1
            w_tree, w_lstm, w_ridge = self.REGIME_WEIGHTS[reg]

            prob_up_ens[i] = (
                w_tree * p_tree["prob_up"][i]
                + w_lstm * p_lstm["prob_up"][i]
                + w_ridge * p_ridge["prob_up"][i]
            )
            pred_ret_ens[i] = (
                w_tree * p_tree["pred_return_50"][i]
                + w_lstm * p_lstm["pred_return_50"][i]
                + w_ridge * p_ridge["pred_return_50"][i]
            )
            pred_high_ens[i] = (
                w_tree * p_tree["pred_high_ratio_50"][i]
                + w_lstm * p_lstm["pred_high_ratio_50"][i]
                + w_ridge * p_ridge["pred_high_ratio_50"][i]
            )
            pred_low_ens[i] = (
                w_tree * p_tree["pred_low_ratio_50"][i]
                + w_lstm * p_lstm["pred_low_ratio_50"][i]
                + w_ridge * p_ridge["pred_low_ratio_50"][i]
            )

        # Direction and Abstention
        pred_dir_ens = (prob_up_ens >= 0.50).astype(int)

        # Model Disagreement Variance: Var(prob_up) across tree, lstm, ridge
        all_probs = np.column_stack([p_tree["prob_up"], p_lstm["prob_up"], p_ridge["prob_up"]])
        disagreement_var = np.var(all_probs, axis=1)

        # Dynamic Abstention Gate:
        # Abstain if:
        # 1. Probability is in indecision zone [0.47, 0.53]
        # 2. Disagreement variance > threshold
        abstain_indecision = (prob_up_ens >= self.abstain_lower) & (prob_up_ens <= self.abstain_upper)
        abstain_disagreement = disagreement_var > self.disagreement_threshold
        abstain_final = abstain_indecision | abstain_disagreement

        # Conformal prediction intervals
        conf_preds = self.conformal_engine.predict_conformal_intervals(
            pred_ret_low=p_tree["pred_return_10"],
            pred_ret_high=p_tree["pred_return_90"],
            pred_high_50=pred_high_ens,
            pred_low_50=pred_low_ens,
            current_prices=current_prices,
        )

        out = {
            "prob_up": np.clip(prob_up_ens, 0.01, 0.99),
            "pred_dir": pred_dir_ens,
            "abstain": abstain_final,
            "disagreement_var": disagreement_var,
            "pred_return_50": pred_ret_ens,
            "pred_high_ratio_50": pred_high_ens,
            "pred_low_ratio_50": pred_low_ens,
            "conf_ret_low": conf_preds["conf_ret_low"],
            "conf_ret_high": conf_preds["conf_ret_high"],
            "conf_high_ratio": conf_preds["conf_high_ratio"],
            "conf_low_ratio": conf_preds["conf_low_ratio"],
        }

        if current_prices is not None:
            c = current_prices.values
            out["pred_high_price_50"] = np.round(c * np.exp(pred_high_ens), 2)
            out["pred_low_price_50"] = np.round(c * np.exp(pred_low_ens), 2)
            out["conf_high_price"] = conf_preds.get("conf_high_price", out["pred_high_price_50"])
            out["conf_low_price"] = conf_preds.get("conf_low_price", out["pred_low_price_50"])

        return out
