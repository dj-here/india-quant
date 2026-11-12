"""
Unit and Integration Tests for the Whole Indian Market Predictor Engine.
Verifies all 65+ assets across Indices, F&O Equities, MCX Commodities, and Currencies.
"""

from fastapi.testclient import TestClient
import pytest
from india_quant.serving.app import app
from india_quant.common.universe import MARKET_UNIVERSE, AssetClass

client = TestClient(app)


def test_market_universe_endpoint():
    """Verifies that all 65+ assets are cataloged and returned with metadata."""
    res = client.get("/api/v1/market/universe")
    assert res.status_code == 200
    assets = res.json()
    assert len(assets) >= 65

    # Check key symbols are present
    symbols = {a["symbol"] for a in assets}
    assert "NIFTY 50" in symbols
    assert "NIFTY BANK" in symbols
    assert "SENSEX" in symbols
    assert "RELIANCE" in symbols
    assert "HDFCBANK" in symbols
    assert "GOLD" in symbols
    assert "CRUDE OIL" in symbols
    assert "USDINR" in symbols


def test_market_scan_endpoint_all():
    """Verifies scanning the whole Indian market returns calibrated predictions."""
    res = client.get("/api/v1/market/scan?category=all")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 65
    assert len(data["predictions"]) >= 65

    first = data["predictions"][0]
    assert "symbol" in first
    assert "current_price" in first
    assert 0.0 <= first["prob_win"] <= 1.0
    assert first["direction"] in (0, 1)
    assert first["signal"] in ("STRONG BUY", "BUY", "NEUTRAL", "SELL", "STRONG SELL")
    assert first["predicted_high"] >= first["current_price"] * 0.95
    assert first["predicted_low"] <= first["current_price"] * 1.05


def test_market_scan_categories():
    """Verifies filtering by asset category: indices, equities, commodities, currencies."""
    for cat, expected_min in [
        ("indices", 18),
        ("equities", 32),
        ("commodities", 9),
        ("currencies", 6),
    ]:
        res = client.get(f"/api/v1/market/scan?category={cat}")
        assert res.status_code == 200
        data = res.json()
        assert data["count"] >= expected_min, f"Category {cat} expected >= {expected_min}"


def test_market_breadth_endpoint():
    """Verifies aggregate sentiment breadth computation."""
    res = client.get("/api/v1/market/breadth")
    assert res.status_code == 200
    b = res.json()
    assert b["total_scanned"] >= 65
    assert 0.0 <= b["bullish_pct"] <= 100.0
    assert 0.0 <= b["bearish_pct"] <= 100.0
    assert b["overall_sentiment"] in (
        "STRONGLY BULLISH",
        "MODERATELY BULLISH",
        "CONSOLIDATION / NEUTRAL",
        "MODERATELY BEARISH",
        "STRONGLY BEARISH",
    )
    assert b["vix_level"] > 0


def test_chart_endpoint_multi_asset():
    """Verifies candlestick bars and forecast price cones for different asset classes."""
    for sym in ["NIFTY 50", "GOLD", "RELIANCE", "USDINR"]:
        res = client.get(f"/api/v1/chart/{sym}")
        assert res.status_code == 200
        d = res.json()
        assert d["symbol"] == sym
        assert len(d["candles"]) > 0
        assert "open" in d["candles"][0]
        assert "close" in d["candles"][0]
        assert "forecast" in d
        assert d["forecast"]["predicted_high"] > 0
        assert d["forecast"]["predicted_low"] > 0
