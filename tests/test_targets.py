"""
Tests for target formulation, High/Low log-ratios, and directional invariants.
"""

import numpy as np
import pytest
from india_quant.features.targets import (
    TargetEngine,
    TargetConfig,
    validate_target_invariants,
)


def test_target_generation_shapes_and_columns(target_engine, sample_ohlcv_df):
    df_targets = target_engine.build_targets(sample_ohlcv_df)

    expected_cols = {
        "target_dir_1d",
        "target_high_ratio_1d",
        "target_low_ratio_1d",
        "target_ret_1d",
        "target_ret_5d",
        "target_ret_20d",
    }
    assert expected_cols.issubset(set(df_targets.columns))
    assert len(df_targets) == len(sample_ohlcv_df)


def test_target_invariants(target_engine, sample_ohlcv_df):
    df_targets = target_engine.build_targets(sample_ohlcv_df)
    assert validate_target_invariants(df_targets) is True


def test_price_reconstruction():
    current_close = 24000.0
    high_ratio = np.log(24250.0 / 24000.0)  # ~0.01036
    low_ratio = np.log(23900.0 / 24000.0)   # ~-0.00417

    pred_high, pred_low, _ = TargetEngine.reconstruct_price_levels(
        current_close=current_close,
        pred_high_ratio=high_ratio,
        pred_low_ratio=low_ratio,
    )

    assert abs(pred_high - 24250.0) < 0.01
    assert abs(pred_low - 23900.0) < 0.01
    assert pred_low <= pred_high
