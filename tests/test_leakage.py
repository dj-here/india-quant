"""
Strict Zero Look-Ahead Bias & Point-in-Time Data Leakage Tests.
Ensures that features at timestamp t cannot access any future information (t+1, t+2...).
"""

import numpy as np
import pandas as pd
import pytest
from india_quant.common.exceptions import LookAheadBiasError
from india_quant.features.targets import (
    TargetEngine,
    TargetConfig,
    validate_target_invariants,
)


def test_strict_zero_lookahead_on_features(sample_ohlcv_df):
    """
    Test: Modifying future prices at index k MUST NOT alter any features computed at index j < k.
    """
    engine = TargetEngine(TargetConfig(forward_horizons_days=[1, 5, 20]))

    # Compute targets on original dataframe
    df_original = engine.build_targets(sample_ohlcv_df)

    # Copy and mutate future row at index 30 (e.g. inject huge price spike)
    df_mutated = sample_ohlcv_df.copy()
    spike_idx = df_mutated.index[30]
    df_mutated.loc[spike_idx, "close"] *= 2.0
    df_mutated.loc[spike_idx, "high"] *= 2.0
    df_mutated.loc[spike_idx, "low"] *= 2.0

    df_mutated_targets = engine.build_targets(df_mutated)

    # 1. Past rows (index 0 to 28) target_ret_1d must be COMPLETELY IDENTICAL
    for i in range(29):
        ts = sample_ohlcv_df.index[i]
        assert df_original.loc[ts, "target_ret_1d"] == df_mutated_targets.loc[ts, "target_ret_1d"]
        assert df_original.loc[ts, "target_dir_1d"] == df_mutated_targets.loc[ts, "target_dir_1d"]
        assert df_original.loc[ts, "target_high_ratio_1d"] == df_mutated_targets.loc[ts, "target_high_ratio_1d"]

    # 2. Row 29 forward return DOES change because it looks into spiked row 30
    ts_29 = sample_ohlcv_df.index[29]
    assert df_original.loc[ts_29, "target_ret_1d"] != df_mutated_targets.loc[ts_29, "target_ret_1d"]


def test_final_row_has_no_future_leakage(target_engine, sample_ohlcv_df):
    """
    Ensures that the most recent bar (now) cannot have forward targets populated.
    """
    df_targets = target_engine.build_targets(sample_ohlcv_df)
    last_row = df_targets.iloc[-1]

    assert pd.isna(last_row["target_ret_1d"])
    assert pd.isna(last_row["target_high_ratio_1d"])
    assert pd.isna(last_row["target_low_ratio_1d"])
    assert pd.isna(last_row["target_ret_5d"])
    assert pd.isna(last_row["target_ret_20d"])


def test_corrupted_targets_trigger_leakage_error(sample_ohlcv_df):
    """
    Intentionally corrupts the target relationship and checks that validator catches it.
    """
    engine = TargetEngine(TargetConfig(forward_horizons_days=[1]))
    df_targets = engine.build_targets(sample_ohlcv_df)

    # Corrupt: artificially force Low ratio to be strictly higher than High ratio
    corrupted_df = df_targets.copy()
    first_idx = corrupted_df.index[0]
    corrupted_df.loc[first_idx, "target_low_ratio_1d"] = 0.50
    corrupted_df.loc[first_idx, "target_high_ratio_1d"] = 0.01

    with pytest.raises(LookAheadBiasError, match="Target Invariant Failed"):
        validate_target_invariants(corrupted_df)
