"""
Neon Serverless PostgreSQL Storage Adapter for IndiaQuant.
Handles live cloud persistence for:
- Market bars (OHLCV, OI, delivery)
- Model predictions & conformal bounds
- Paper trading orders & portfolio snapshots
- Cryptographic SEBI audit logs.
"""

from datetime import datetime
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import pytz

from india_quant.common.logging import get_logger

logger = get_logger("NeonStore")
IST = pytz.timezone("Asia/Kolkata")

# Neon Serverless PostgreSQL DDL Schema
NEON_DDL_STATEMENTS = [
    """
    CREATE TABLE IF NOT EXISTS market_bars (
        timestamp TIMESTAMPTZ NOT NULL,
        symbol VARCHAR(50) NOT NULL,
        open NUMERIC(14, 4) NOT NULL,
        high NUMERIC(14, 4) NOT NULL,
        low NUMERIC(14, 4) NOT NULL,
        close NUMERIC(14, 4) NOT NULL,
        volume BIGINT DEFAULT 0,
        oi BIGINT DEFAULT 0,
        delivery_pct NUMERIC(6, 4) DEFAULT 0,
        PRIMARY KEY (timestamp, symbol)
    );
    CREATE INDEX IF NOT EXISTS idx_bars_symbol_time ON market_bars (symbol, timestamp DESC);
    """,
    """
    CREATE TABLE IF NOT EXISTS model_predictions (
        id SERIAL PRIMARY KEY,
        timestamp_ist TIMESTAMPTZ NOT NULL,
        symbol VARCHAR(50) NOT NULL,
        model_name VARCHAR(100) NOT NULL,
        model_version VARCHAR(20) NOT NULL,
        current_price NUMERIC(14, 4) NOT NULL,
        prob_win NUMERIC(6, 4) NOT NULL,
        direction INT NOT NULL,
        predicted_high NUMERIC(14, 4) NOT NULL,
        predicted_low NUMERIC(14, 4) NOT NULL,
        predicted_close NUMERIC(14, 4) NOT NULL,
        conformal_high NUMERIC(14, 4) NOT NULL,
        conformal_low NUMERIC(14, 4) NOT NULL,
        abstain BOOLEAN NOT NULL DEFAULT FALSE,
        signature_sha256 VARCHAR(64) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_pred_symbol_time ON model_predictions (symbol, timestamp_ist DESC);
    """,
    """
    CREATE TABLE IF NOT EXISTS paper_orders (
        order_id VARCHAR(50) PRIMARY KEY,
        timestamp_ist TIMESTAMPTZ NOT NULL,
        symbol VARCHAR(50) NOT NULL,
        side VARCHAR(10) NOT NULL,
        quantity INT NOT NULL,
        executed_price NUMERIC(14, 4) NOT NULL,
        turnover NUMERIC(16, 4) NOT NULL,
        total_friction NUMERIC(12, 4) NOT NULL,
        status VARCHAR(20) NOT NULL,
        friction_json JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_orders_time ON paper_orders (timestamp_ist DESC);
    """,
    """
    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
        id SERIAL PRIMARY KEY,
        timestamp_ist TIMESTAMPTZ NOT NULL,
        total_equity NUMERIC(16, 4) NOT NULL,
        liquid_cash NUMERIC(16, 4) NOT NULL,
        unsettled_cash NUMERIC(16, 4) NOT NULL,
        positions_value NUMERIC(16, 4) NOT NULL,
        drawdown_pct NUMERIC(6, 4) NOT NULL,
        high_water_mark NUMERIC(16, 4) NOT NULL,
        is_halted BOOLEAN NOT NULL DEFAULT FALSE,
        positions_json JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS audit_trail (
        audit_id VARCHAR(50) PRIMARY KEY,
        timestamp_ist TIMESTAMPTZ NOT NULL,
        symbol VARCHAR(50) NOT NULL,
        model_name VARCHAR(100) NOT NULL,
        model_version VARCHAR(20) NOT NULL,
        feature_hash_sha256 VARCHAR(64) NOT NULL,
        prob_win NUMERIC(6, 4) NOT NULL,
        record_signature_sha256 VARCHAR(64) NOT NULL,
        payload_json JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_trail (timestamp_ist DESC);
    """,
]


class NeonDataStore:
    """
    Client for Neon Serverless PostgreSQL database.
    """

    def __init__(self, connection_url: Optional[str] = None):
        if connection_url is not None:
            self.url = connection_url
        else:
            self.url = os.getenv("NEON_DATABASE_URL") or os.getenv("DATABASE_URL")
            if not self.url:
                for env_path in [Path(".env"), Path(__file__).resolve().parent.parent.parent.parent / ".env"]:
                    if env_path.exists():
                        try:
                            with open(env_path, "r", encoding="utf-8") as f:
                                for line in f:
                                    line = line.strip()
                                    if line.startswith("NEON_DATABASE_URL="):
                                        self.url = line.split("=", 1)[1].strip().strip('"').strip("'")
                                        break
                                    elif line.startswith("DATABASE_URL=") and not self.url:
                                        self.url = line.split("=", 1)[1].strip().strip('"').strip("'")
                        except Exception:
                            pass
                    if self.url:
                        break

        if self.url and "sslmode" not in self.url:
            separator = "&" if "?" in self.url else "?"
            self.url = f"{self.url}{separator}sslmode=require"

    @property
    def is_configured(self) -> bool:
        return bool(self.url and self.url.startswith("postgres"))

    def get_connection(self):
        """Establishes a connection to Neon PostgreSQL."""
        if not self.is_configured:
            raise ConnectionError("NEON_DATABASE_URL or DATABASE_URL environment variable is not configured.")
        return psycopg2.connect(self.url)

    def init_schema(self) -> bool:
        """Provisions all required relational tables in Neon Postgres."""
        if not self.is_configured:
            logger.warning("Neon URL not configured; skipping schema provisioning.")
            return False

        logger.info("Initializing Neon Serverless PostgreSQL database schema...")
        with self.get_connection() as conn:
            with conn.cursor() as cur:
                for ddl in NEON_DDL_STATEMENTS:
                    cur.execute(ddl)
            conn.commit()
        logger.info("Neon PostgreSQL schema successfully initialized and verified.")
        return True

    def save_prediction(self, record: Dict[str, Any]) -> bool:
        """Persists a model prediction to Neon."""
        if not self.is_configured:
            return False

        query = """
        INSERT INTO model_predictions (
            timestamp_ist, symbol, model_name, model_version, current_price,
            prob_win, direction, predicted_high, predicted_low, predicted_close,
            conformal_high, conformal_low, abstain, signature_sha256
        ) VALUES (
            %(timestamp_ist)s, %(symbol)s, %(model_name)s, %(model_version)s, %(current_price)s,
            %(prob_win)s, %(direction)s, %(predicted_high)s, %(predicted_low)s, %(predicted_close)s,
            %(conformal_high)s, %(conformal_low)s, %(abstain)s, %(signature_sha256)s
        );
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, record)
                conn.commit()
            return True
        except Exception as e:
            logger.warning(f"Failed to persist prediction to Neon: {e}")
            return False

    def save_paper_order(self, order: Dict[str, Any]) -> bool:
        """Persists an executed paper order to Neon."""
        if not self.is_configured:
            return False

        query = """
        INSERT INTO paper_orders (
            order_id, timestamp_ist, symbol, side, quantity,
            executed_price, turnover, total_friction, status, friction_json
        ) VALUES (
            %(order_id)s, %(timestamp_ist)s, %(symbol)s, %(side)s, %(quantity)s,
            %(executed_price)s, %(turnover)s, %(total_friction)s, %(status)s, %(friction_json)s
        ) ON CONFLICT (order_id) DO NOTHING;
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        query,
                        {
                            "order_id": order["order_id"],
                            "timestamp_ist": order["timestamp_ist"],
                            "symbol": order["symbol"],
                            "side": order["side"],
                            "quantity": order["quantity"],
                            "executed_price": order["executed_price"],
                            "turnover": order["turnover"],
                            "total_friction": order["friction"]["total_friction"],
                            "status": order["status"],
                            "friction_json": json.dumps(order["friction"]),
                        },
                    )
                conn.commit()
            return True
        except Exception as e:
            logger.warning(f"Failed to persist paper order to Neon: {e}")
            return False

    def save_portfolio_snapshot(self, snapshot: Dict[str, Any]) -> bool:
        """Persists a portfolio MTM snapshot to Neon."""
        if not self.is_configured:
            return False

        query = """
        INSERT INTO portfolio_snapshots (
            timestamp_ist, total_equity, liquid_cash, unsettled_cash,
            positions_value, drawdown_pct, high_water_mark, is_halted, positions_json
        ) VALUES (
            %(timestamp_ist)s, %(total_equity)s, %(liquid_cash)s, %(unsettled_cash)s,
            %(positions_value)s, %(drawdown_pct)s, %(high_water_mark)s, %(is_halted)s, %(positions_json)s
        );
        """
        try:
            with self.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(query, snapshot)
                conn.commit()
            return True
        except Exception as e:
            logger.warning(f"Failed to persist portfolio snapshot to Neon: {e}")
            return False

    def query_recent_predictions(self, symbol: str = "NIFTY 50", limit: int = 10) -> List[Dict[str, Any]]:
        """Queries the latest predictions for a symbol."""
        if not self.is_configured:
            return []

        query = """
        SELECT * FROM model_predictions
        WHERE symbol = %s
        ORDER BY timestamp_ist DESC
        LIMIT %s;
        """
        with self.get_connection() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, (symbol, limit))
                return [dict(r) for r in cur.fetchall()]
