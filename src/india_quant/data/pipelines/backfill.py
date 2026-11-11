"""
Historical Backfill Pipeline for IndiaQuant.
Backfills 10+ years of daily OHLCV data for NIFTY 50 and BANK NIFTY,
executes data quality validation gates, and stores into the Parquet Lakehouse.
"""

from datetime import date, datetime
from typing import Dict, List, Optional
import pandas as pd
from india_quant.common.logging import get_logger
from india_quant.data.connectors.mock_provider import MockMarketConnector
from india_quant.data.connectors.yfinance_provider import YFinanceConnector
from india_quant.data.quality.validation import DataQualityValidator, DataQualityReport
from india_quant.data.storage.parquet_store import ParquetDataStore

logger = get_logger("BackfillPipeline")


class BackfillPipeline:
    """
    Manages end-to-end historical backfilling, data validation, and lakehouse storage.
    """

    DEFAULT_SYMBOLS = ["NIFTY 50", "NIFTY BANK"]

    def __init__(
        self,
        lake_root: str = "./data/lake",
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        use_mock_fallback: bool = True,
    ):
        self.store = ParquetDataStore(lake_root=lake_root)
        self.validator = DataQualityValidator()
        self.yf_connector = YFinanceConnector()
        self.mock_connector = MockMarketConnector(seed=42)
        self.use_mock_fallback = use_mock_fallback

        # Default to 10+ years backfill (from 2014-01-01 to today)
        self.start_date = start_date or date(2014, 1, 1)
        self.end_date = end_date or date.today()

    def run_backfill(
        self,
        symbols: Optional[List[str]] = None,
        asset_class: str = "indices",
    ) -> Dict[str, DataQualityReport]:
        """
        Executes backfill for specified symbols.
        Returns a mapping of symbol to DataQualityReport.
        """
        targets = symbols or self.DEFAULT_SYMBOLS
        reports: Dict[str, DataQualityReport] = {}

        logger.info(
            f"Starting historical backfill for {len(targets)} symbols "
            f"({self.start_date} to {self.end_date}) into {self.store.lake_root}..."
        )

        for sym in targets:
            df = self._fetch_data_with_fallback(sym)
            if df.empty:
                logger.error(f"Failed to fetch any data for {sym}. Skipping storage.")
                continue

            # Run quality validation
            report = self.validator.validate(df, sym)
            reports[sym] = report

            logger.info(f"\n{report.summary()}\n")

            if not report.is_valid:
                logger.error(f"Data quality checks FAILED for {sym}. Not saving to production lake.")
                continue

            # Write to Parquet Data Lake
            file_path = self.store.write_ohlcv(
                df=df,
                asset_class=asset_class,
                symbol=sym,
            )
            logger.info(f"Successfully saved {sym} ({len(df)} bars) to {file_path}")

        return reports

    def _fetch_data_with_fallback(self, symbol: str) -> pd.DataFrame:
        """
        Attempts to fetch live historical data via YFinance; falls back to MockMarketConnector if unavailable.
        """
        try:
            df = self.yf_connector.fetch_historical_ohlcv(
                symbol=symbol,
                start_date=self.start_date,
                end_date=self.end_date,
                interval="1d",
            )
            if not df.empty and len(df) >= 100:
                logger.info(f"Successfully fetched real market data for {symbol} via Yahoo Finance.")
                return df
        except Exception as e:
            logger.warning(f"Live fetch failed for {symbol}: {e}")

        if self.use_mock_fallback:
            logger.info(f"Using high-fidelity MockMarketConnector fallback for {symbol} ({self.start_date} to {self.end_date})...")
            return self.mock_connector.fetch_historical_ohlcv(
                symbol=symbol,
                start_date=self.start_date,
                end_date=self.end_date,
                interval="day",
            )

        return pd.DataFrame()


def main():
    pipeline = BackfillPipeline()
    reports = pipeline.run_backfill()
    all_passed = all(r.is_valid for r in reports.values())
    if all_passed:
        logger.info("Historical backfill completed successfully for all targets.")
    else:
        logger.warning("One or more targets failed data quality validation.")


if __name__ == "__main__":
    main()
