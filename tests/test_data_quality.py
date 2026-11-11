"""
Tests for Data Quality Validation rules, assertions, and corporate actions.
"""

from datetime import date
import pandas as pd
import pytest
from india_quant.data.quality.validation import DataQualityValidator


def test_clean_data_passes_quality_check(sample_ohlcv_df):
    validator = DataQualityValidator()
    report = validator.validate(sample_ohlcv_df, "NIFTY 50")

    assert report.is_valid is True
    assert report.total_bars == len(sample_ohlcv_df)
    assert len(report.outlier_timestamps) == 0


def test_corrupted_ohlc_fails_quality_check(sample_ohlcv_df):
    validator = DataQualityValidator()
    corrupt_df = sample_ohlcv_df.copy()

    # Corrupt: set Low > Open
    first_idx = corrupt_df.index[0]
    corrupt_df.loc[first_idx, "low"] = corrupt_df.loc[first_idx, "open"] + 500.0

    report = validator.validate(corrupt_df, "CORRUPTED")
    assert report.is_valid is False
    ohlc_check = [c for c in report.checks if c.check_name == "OHLCInvariants"][0]
    assert ohlc_check.passed is False


def test_corporate_action_adjustment():
    # 2:1 stock split simulation on 2024-02-15
    dates = pd.date_range("2024-02-01", "2024-02-28", freq="B", tz="Asia/Kolkata")
    df = pd.DataFrame(
        {
            "open": 2000.0,
            "high": 2050.0,
            "low": 1950.0,
            "close": 2000.0,
            "volume": 100000,
        },
        index=dates,
    )

    # Post-split prices drop to 1000
    df.loc[df.index.date >= date(2024, 2, 15), ["open", "high", "low", "close"]] /= 2.0
    df.loc[df.index.date >= date(2024, 2, 15), "volume"] *= 2

    # Adjust pre-split data with 2.0 ratio
    adjusted = DataQualityValidator.adjust_corporate_actions(
        df=df,
        split_bonus_events=[(date(2024, 2, 15), 2.0)],
    )

    # Before split date (e.g. Feb 1), close was 2000, should now be adjusted to 1000
    pre_split_bar = adjusted.loc[adjusted.index.date == date(2024, 2, 1)]
    assert pre_split_bar["close"].iloc[0] == 1000.0
    assert pre_split_bar["volume"].iloc[0] == 200000
