"""
Unit Tests for Neon Serverless PostgreSQL Store.
"""

import pytest
from india_quant.data.storage.neon_store import NEON_DDL_STATEMENTS, NeonDataStore


def test_neon_store_unconfigured():
    store = NeonDataStore(connection_url="")
    assert store.is_configured is False
    # Operations should degrade gracefully without exceptions
    assert store.init_schema() is False
    assert store.save_prediction({}) is False
    assert store.save_paper_order({}) is False
    assert store.query_recent_predictions() == []


def test_neon_store_sslmode_formatting():
    raw_url = "postgresql://user:pass@ep-test-123.neon.tech/neondb"
    store = NeonDataStore(connection_url=raw_url)
    assert store.is_configured is True
    assert "sslmode=require" in store.url


def test_neon_ddl_syntax():
    assert len(NEON_DDL_STATEMENTS) == 5
    for statement in NEON_DDL_STATEMENTS:
        assert "CREATE TABLE IF NOT EXISTS" in statement
