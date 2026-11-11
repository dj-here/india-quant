"""
Tests for Technical and Volatility Feature Calculations.
"""

import numpy as np
import pytest
from india_quant.features.technical import TechnicalFeatureEngine


def test_technical_feature_shapes_and_invariants(sample_ohlcv_df):
    engine = TechnicalFeatureEngine()
    df_feat = engine.compute_features(sample_ohlcv_df)

    # Must contain all expected indicators
    expected_cols = [
        "ret_lag_1d",
        "ret_lag_5d",
        "overnight_gap",
        "intraday_ret",
        "high_low_span",
        "vol_realized_20d",
        "vol_parkinson_20d",
        "vol_garman_klass_20d",
        "rsi_14",
        "macd_line",
        "macd_signal",
        "macd_hist",
        "atr_14",
        "natr_14",
        "bb_pct_b",
        "bb_bandwidth",
        "dist_ema_21",
        "dist_ema_50",
    ]
    for col in expected_cols:
        assert col in df_feat.columns, f"Missing feature column: {col}"

    # Verify RSI is strictly within [0, 100]
    valid_rsi = df_feat["rsi_14"].dropna()
    assert (valid_rsi >= 0.0).all()
    assert (valid_rsi <= 100.0).all()

    # Verify volatilities are non-negative
    for vol_col in ["vol_realized_20d", "vol_parkinson_20d", "vol_garman_klass_20d"]:
        valid_vol = df_feat[vol_col].dropna()
        assert (valid_vol >= 0.0).all()
        assert (valid_vol > 0.0).any()


def test_zero_lookahead_in_technical_indicators(sample_ohlcv_df):
    """
    Mutating future prices at row index 40 MUST NOT alter technical indicators at row index 20.
    """
    engine = TechnicalFeatureEngine()
    df_orig = engine.compute_features(sample_ohlcv_df)

    mutated = sample_ohlcv_df.copy()
    future_idx = mutated.index[40]
    mutated.loc[future_idx, "close"] *= 3.0
    mutated.loc[future_idx, "high"] *= 3.0

    df_mut = engine.compute_features(mutated)

    # Row 20 should be identical
    ts_20 = sample_ohlcv_df.index[20]
    for col in ["ret_lag_1d", "rsi_14", "vol_parkinson_20d", "macd_line"]:
        assert df_orig.loc[ts_20, col] == df_mut.loc[ts_20, col]
