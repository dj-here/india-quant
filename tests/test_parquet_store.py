"""
Tests for Parquet Data Store, atomic writes, and metadata tracking.
"""

from datetime import date, datetime
import tempfile
import pandas as pd
import pytest
import pytz
from india_quant.data.storage.parquet_store import ParquetDataStore

IST = pytz.timezone("Asia/Kolkata")


def test_parquet_store_write_read_roundtrip(sample_ohlcv_df):
    with tempfile.TemporaryDirectory() as tmp_dir:
        store = ParquetDataStore(lake_root=tmp_dir)

        # Write data
        target_path = store.write_ohlcv(
            df=sample_ohlcv_df,
            asset_class="indices",
            symbol="TEST_INDEX",
        )
        assert target_path.exists()

        # Read full data back
        df_read = store.read_ohlcv("indices", "TEST_INDEX")
        assert len(df_read) == len(sample_ohlcv_df)
        assert list(df_read.columns) == store.STANDARD_COLUMNS
        assert df_read.index.tz == IST

        # Verify metadata sidecar
        meta = store.get_metadata("indices", "TEST_INDEX")
        assert meta is not None
        assert meta.total_bars == len(sample_ohlcv_df)
        assert meta.symbol == "TEST_INDEX"
        assert meta.asset_class == "indices"


def test_parquet_store_date_filtering(sample_ohlcv_df):
    with tempfile.TemporaryDirectory() as tmp_dir:
        store = ParquetDataStore(lake_root=tmp_dir)
        store.write_ohlcv(sample_ohlcv_df, "indices", "NIFTY")

        # Query a sub-range (e.g. February 2024 only)
        start_filter = datetime(2024, 2, 1)
        end_filter = datetime(2024, 2, 29)

        filtered_df = store.read_ohlcv(
            asset_class="indices",
            symbol="NIFTY",
            start_date=start_filter,
            end_date=end_filter,
        )

        assert not filtered_df.empty
        assert filtered_df.index[0].date() >= date(2024, 2, 1)
        assert filtered_df.index[-1].date() <= date(2024, 2, 29)
