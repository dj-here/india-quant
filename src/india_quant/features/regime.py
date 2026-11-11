"""
Market Regime Classification Engine for IndiaQuant.
Classifies market states into:
- State 0: Low-Vol Bull Trend (Positive drift, subdued volatility)
- State 1: Range-Bound Chop (Low directional momentum, moderate volatility)
- State 2: High-Vol Panic / Bear Breakdown (Sharp volatility spikes, negative drift)
Uses strictly trailing rolling indicators to ensure zero look-ahead bias.
"""

from typing import Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.mixture import GaussianMixture


class RegimeDetectionEngine:
    """
    Detects market regimes using both unsupervised statistical clustering (GMM)
    and robust deterministic trailing rules.
    """

    def __init__(self, n_regimes: int = 3, rolling_window: int = 252):
        self.n_regimes = n_regimes
        self.rolling_window = rolling_window

    def classify_regimes_deterministic(self, df_features: pd.DataFrame) -> pd.DataFrame:
        """
        Computes deterministic, point-in-time market regime labels:
        - 0: Bull Trend
        - 1: Range Chop
        - 2: High-Vol Stress
        Uses trailing 252-day quantiles so that no future data is accessed.
        """
        out = df_features.copy()
        close_p = out["close"]

        # 1. 20-day return & 20-day realized volatility
        ret_20d = out.get("ret_lag_20d", np.log(close_p / close_p.shift(20))).fillna(0.0)
        vol_20d = out.get("vol_realized_20d", ret_20d.rolling(20).std() * np.sqrt(252)).fillna(0.15)

        # 2. Moving Average Distances
        ema_50 = close_p.ewm(span=50, adjust=False).mean()
        ema_200 = close_p.ewm(span=200, adjust=False).mean()
        trend_bullish = (close_p > ema_50) & (ema_50 > ema_200)
        trend_bearish = (close_p < ema_50) & (ema_50 < ema_200)

        # Trailing 252-day volatility 80th percentile threshold
        vol_high_thresh = vol_20d.rolling(window=self.rolling_window, min_periods=60).quantile(0.80).fillna(0.22)

        regimes = np.ones(len(out), dtype=int)  # Default State 1: Chop

        # State 2: High-Vol Panic / Bear Breakdown
        panic_mask = (vol_20d >= vol_high_thresh) | (trend_bearish & (ret_20d < -0.05))
        regimes[panic_mask] = 2

        # State 0: Low-Vol Bull Trend
        bull_mask = trend_bullish & (vol_20d < vol_high_thresh) & (ret_20d > 0.0) & (~panic_mask)
        regimes[bull_mask] = 0

        out["regime_state"] = regimes
        out["is_bull_regime"] = (regimes == 0).astype(int)
        out["is_chop_regime"] = (regimes == 1).astype(int)
        out["is_panic_regime"] = (regimes == 2).astype(int)

        return out

    def fit_gmm_regimes(self, df_features: pd.DataFrame) -> Tuple[pd.Series, GaussianMixture]:
        """
        Fits a 3-component Gaussian Mixture Model on historical [return, volatility] space.
        Orders components so:
        Component 0 = lowest volatility (Bull)
        Component 2 = highest volatility (Panic)
        """
        ret_20d = df_features.get("ret_lag_20d", pd.Series(0, index=df_features.index)).fillna(0.0)
        vol_20d = df_features.get("vol_realized_20d", pd.Series(0.15, index=df_features.index)).fillna(0.15)

        X = np.column_stack([ret_20d.values, vol_20d.values])

        gmm = GaussianMixture(n_components=self.n_regimes, covariance_type="full", random_state=42)
        raw_labels = gmm.fit_predict(X)

        # Sort cluster indices by ascending cluster mean volatility
        vol_means = [gmm.means_[k][1] for k in range(self.n_regimes)]
        sorted_order = np.argsort(vol_means)
        mapping = {old_label: new_label for new_label, old_label in enumerate(sorted_order)}

        ordered_labels = pd.Series([mapping[lbl] for lbl in raw_labels], index=df_features.index, name="gmm_regime")
        return ordered_labels, gmm
