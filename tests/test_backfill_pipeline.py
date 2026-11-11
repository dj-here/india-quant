"""
Tests for the Backfill Pipeline.
"""

from datetime import date
import tempfile
import pytest
from india_quant.data.pipelines.backfill import BackfillPipeline


def test_backfill_pipeline_execution():
    with tempfile.TemporaryDirectory() as tmp_lake:
        pipeline = BackfillPipeline(
            lake_root=tmp_lake,
            start_date=date(2024, 1, 1),
            end_date=date(2024, 2, 28),
            use_mock_fallback=True,
        )

        reports = pipeline.run_backfill(symbols=["NIFTY 50"])
        assert "NIFTY 50" in reports
        assert reports["NIFTY 50"].is_valid is True

        # Check that file was written to disk
        symbols_in_lake = pipeline.store.list_available_symbols("indices")
        assert "NIFTY 50" in symbols_in_lake.get("indices", [])

        df_read = pipeline.store.read_ohlcv("indices", "NIFTY 50")
        assert not df_read.empty
        assert len(df_read) == reports["NIFTY 50"].total_bars
