"""
TimescaleDB Time-Series Storage Handler for IndiaQuant.
Generates production DDL for PostgreSQL/TimescaleDB hypertables, compression policies,
and optimized batch upsert queries.
"""

from dataclasses import dataclass
from typing import List, Optional
import pandas as pd


@dataclass
class TimescaleSchemaConfig:
    table_name: str = "market_bars"
    chunk_time_interval: str = "7 days"
    compress_after: str = "30 days"
    enable_compression: bool = True


class TimescaleDBManager:
    """
    Manages TimescaleDB DDL, hypertables, compression, and query generation.
    """

    def __init__(self, config: TimescaleSchemaConfig = TimescaleSchemaConfig()):
        self.config = config

    def generate_schema_ddl(self) -> str:
        """
        Generates full PostgreSQL + TimescaleDB DDL script.
        """
        table = self.config.table_name
        ddl = f"""-- ==============================================================================
-- IndiaQuant TimescaleDB Schema Definition
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

CREATE TABLE IF NOT EXISTS {table} (
    timestamp       TIMESTAMPTZ NOT NULL,
    symbol          VARCHAR(32) NOT NULL,
    interval        VARCHAR(16) NOT NULL DEFAULT '1d',
    open            DOUBLE PRECISION NOT NULL,
    high            DOUBLE PRECISION NOT NULL,
    low             DOUBLE PRECISION NOT NULL,
    close           DOUBLE PRECISION NOT NULL,
    volume          BIGINT NOT NULL DEFAULT 0,
    oi              BIGINT NOT NULL DEFAULT 0,
    delivery_pct    REAL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_{table} PRIMARY KEY (timestamp, symbol, interval)
);

-- Convert to TimescaleDB Hypertable partitioned on timestamp
SELECT create_hypertable(
    '{table}',
    'timestamp',
    chunk_time_interval => INTERVAL '{self.config.chunk_time_interval}',
    if_not_exists => TRUE
);

-- Composite Index for fast symbol-interval historical range queries
CREATE INDEX IF NOT EXISTS idx_{table}_sym_int_time
ON {table} (symbol, interval, timestamp DESC);
"""
        if self.config.enable_compression:
            ddl += f"""
-- Enable TimescaleDB Segmented Compression
ALTER TABLE {table} SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'symbol, interval',
    timescaledb.compress_orderby = 'timestamp DESC'
);

-- Automatically compress chunks older than {self.config.compress_after}
SELECT add_compression_policy('{table}', INTERVAL '{self.config.compress_after}', if_not_exists => TRUE);
"""
        return ddl

    @staticmethod
    def generate_upsert_sql(table_name: str = "market_bars") -> str:
        """
        Generates idempotent SQL upsert command with ON CONFLICT DO UPDATE.
        """
        return f"""
INSERT INTO {table_name} (timestamp, symbol, interval, open, high, low, close, volume, oi)
VALUES (:timestamp, :symbol, :interval, :open, :high, :low, :close, :volume, :oi)
ON CONFLICT (timestamp, symbol, interval)
DO UPDATE SET
    open = EXCLUDED.open,
    high = EXCLUDED.high,
    low = EXCLUDED.low,
    close = EXCLUDED.close,
    volume = EXCLUDED.volume,
    oi = EXCLUDED.oi;
"""
