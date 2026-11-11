"""
Data Layer: Connectors, storage handlers, quality validation, and ingestion pipelines.
"""

from india_quant.data.connectors.base import BaseMarketConnector
from india_quant.data.connectors.mock_provider import MockMarketConnector
from india_quant.data.connectors.yfinance_provider import YFinanceConnector
from india_quant.data.connectors.kite import KiteMarketConnector
from india_quant.data.connectors.bhavcopy import NSEBhavcopyParser
from india_quant.data.storage.parquet_store import ParquetDataStore, LakeMetadata
from india_quant.data.storage.timescale_store import TimescaleDBManager
from india_quant.data.quality.validation import DataQualityValidator, DataQualityReport

__all__ = [
    "BaseMarketConnector",
    "MockMarketConnector",
    "YFinanceConnector",
    "KiteMarketConnector",
    "NSEBhavcopyParser",
    "ParquetDataStore",
    "LakeMetadata",
    "TimescaleDBManager",
    "DataQualityValidator",
    "DataQualityReport",
]
