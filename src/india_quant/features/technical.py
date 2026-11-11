"""
Vectorized Technical & Volatility Indicators for IndiaQuant.
Implements institutional volatility estimators (Parkinson, Garman-Klass, Realized),
trend indicators (EMA distances, MACD), oscillators (RSI, ATR, Bollinger %B), and volume dynamics.
Strictly zero look-ahead bias: all transformations use trailing windows only.
"""

from typing import List, Optional
import numpy as np
import pandas as pd


class TechnicalFeatureEngine:
    """
    Computes trailing technical and volatility features on OHLCV data.
    """

    def __init__(
        self,
        return_lags: Optional[List[int]] = None,
        vol_windows: Optional[List[int]] = None,
        ema_windows: Optional[List[int]] = None,
        rsi_period: int = 14,
        atr_period: int = 14,
    ):
        self.return_lags = return_lags or [1, 2, 3, 5, 10, 20]
        self.vol_windows = vol_windows or [5, 10, 20, 60]
        self.ema_windows = ema_windows or [9, 21, 50, 200]
        self.rsi_period = rsi_period
        self.atr_period = atr_period

    def compute_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Takes OHLCV DataFrame and appends technical features.
        Preserves original columns and returns a feature-enriched DataFrame.
        """
        if df.empty:
            return df.copy()

        out = df.copy()
        open_p = out["open"]
        high_p = out["high"]
        low_p = out["low"]
        close_p = out["close"]
        vol_p = out["volume"] if "volume" in out.columns else pd.Series(0, index=out.index)

        # 1. Trailing Log Returns and Gaps
        log_close = np.log(close_p)
        for lag in self.return_lags:
            out[f"ret_lag_{lag}d"] = log_close - log_close.shift(lag)

        # Overnight Gap: ln(Open_t / Close_{t-1})
        prev_close = close_p.shift(1)
        out["overnight_gap"] = np.log(open_p / prev_close)

        # Intraday Return: ln(Close_t / Open_t)
        out["intraday_ret"] = np.log(close_p / open_p)

        # High-Low Range: ln(High_t / Low_t)
        out["high_low_span"] = np.log(high_p / low_p)

        # 2. Institutional Volatility Estimators (Annualized via sqrt(252))
        ret_1d = out["ret_lag_1d"]
        for w in self.vol_windows:
            # Realized Close-to-Close Volatility
            out[f"vol_realized_{w}d"] = ret_1d.rolling(window=w).std() * np.sqrt(252)

            # Parkinson Volatility: sigma_P = sqrt( 1/(4*ln(2)*w) * sum( (ln(H/L))^2 ) ) * sqrt(252)
            hl_sq = (np.log(high_p / low_p)) ** 2
            park_var = hl_sq.rolling(window=w).mean() / (4.0 * np.log(2.0))
            out[f"vol_parkinson_{w}d"] = np.sqrt(np.maximum(park_var, 0)) * np.sqrt(252)

            # Garman-Klass Volatility:
            # 0.5 * (ln(H/L))^2 - (2*ln(2) - 1) * (ln(C/O))^2
            co_sq = (np.log(close_p / open_p)) ** 2
            gk_var = 0.5 * hl_sq - (2.0 * np.log(2.0) - 1.0) * co_sq
            gk_rolling = gk_var.rolling(window=w).mean()
            out[f"vol_garman_klass_{w}d"] = np.sqrt(np.maximum(gk_rolling, 0)) * np.sqrt(252)

        # 3. Relative Strength Index (RSI - Wilder's Smoothing)
        delta = close_p.diff()
        gain = delta.where(delta > 0, 0.0)
        loss = -delta.where(delta < 0, 0.0)
        avg_gain = gain.ewm(alpha=1.0 / self.rsi_period, min_periods=self.rsi_period, adjust=False).mean()
        avg_loss = loss.ewm(alpha=1.0 / self.rsi_period, min_periods=self.rsi_period, adjust=False).mean()
        rs = avg_gain / (avg_loss + 1e-9)
        out[f"rsi_{self.rsi_period}"] = 100.0 - (100.0 / (1.0 + rs))

        # 4. MACD (12, 26, 9)
        ema_12 = close_p.ewm(span=12, adjust=False).mean()
        ema_26 = close_p.ewm(span=26, adjust=False).mean()
        macd_line = ema_12 - ema_26
        signal_line = macd_line.ewm(span=9, adjust=False).mean()
        out["macd_line"] = macd_line
        out["macd_signal"] = signal_line
        out["macd_hist"] = macd_line - signal_line

        # 5. Average True Range (ATR) & Normalized ATR
        tr1 = high_p - low_p
        tr2 = (high_p - prev_close).abs()
        tr3 = (low_p - prev_close).abs()
        tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
        atr = tr.rolling(window=self.atr_period).mean()
        out[f"atr_{self.atr_period}"] = atr
        out[f"natr_{self.atr_period}"] = (atr / close_p) * 100.0  # ATR as % of price

        # 6. Bollinger Bands (20-period, 2 std) & %B
        bb_mid = close_p.rolling(window=20).mean()
        bb_std = close_p.rolling(window=20).std()
        bb_upper = bb_mid + 2.0 * bb_std
        bb_lower = bb_mid - 2.0 * bb_std
        out["bb_pct_b"] = (close_p - bb_lower) / ((bb_upper - bb_lower) + 1e-9)
        out["bb_bandwidth"] = (bb_upper - bb_lower) / (bb_mid + 1e-9)

        # 7. Trend Distances to Key Moving Averages
        for ema_w in self.ema_windows:
            ema_val = close_p.ewm(span=ema_w, adjust=False).mean()
            out[f"dist_ema_{ema_w}"] = (close_p - ema_val) / ema_val

        # 8. Volume Dynamics & Trailing Z-Score
        if "volume" in out.columns and (vol_p > 0).any():
            vol_mean_20 = vol_p.rolling(window=20).mean()
            vol_std_20 = vol_p.rolling(window=20).std()
            out["vol_zscore_20d"] = (vol_p - vol_mean_20) / (vol_std_20 + 1e-9)

            # On-Balance Volume (OBV)
            direction = np.sign(close_p.diff()).fillna(0)
            obv = (direction * vol_p).cumsum()
            out["obv_roc_10d"] = (obv - obv.shift(10)) / (obv.shift(10).abs() + 1e-9)

        return out
