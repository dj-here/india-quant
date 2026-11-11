"""
Unit and Integration Tests for IndiaQuant Serving API.
"""

from fastapi.testclient import TestClient
import pytest
from india_quant.serving.app import app

client = TestClient(app)


def test_root_web_terminal_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert "IndiaQuant Terminal" in response.text
    assert "LightweightCharts" in response.text


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "timestamp_ist" in data
    assert data["registered_models_count"] >= 1


def test_list_models_endpoint():
    response = client.get("/api/v1/models")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] >= 1
    assert len(data["models"]) >= 1


def test_predict_direction_and_range_endpoint():
    payload = {
        "symbol": "NIFTY 50",
        "horizon": "1d",
        "confidence_level": 0.90,
    }
    response = client.post("/api/v1/predict/direction-and-range", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["symbol"] == "NIFTY 50"
    assert 0.0 <= data["prob_win"] <= 1.0
    assert data["direction"] in (0, 1)
    assert isinstance(data["abstain"], bool)
    assert data["predicted_high"] > 0
    assert data["predicted_low"] > 0
    assert data["predicted_high"] >= data["predicted_low"]
    assert data["conformal_high_bound"] >= data["conformal_low_bound"]
    assert len(data["conformal_return_interval"]) == 2
    assert "model_name" in data
    assert "model_version" in data


def test_paper_trading_flow():
    # 1. Place Buy Order
    order_payload = {
        "symbol": "NIFTY 50",
        "side": "BUY",
        "quantity": 25,
        "order_type": "LIMIT",
        "price": 24000.0,
    }
    order_res = client.post("/api/v1/paper-trading/order", json=order_payload)
    assert order_res.status_code == 200
    order_data = order_res.json()
    assert order_data["status"] == "EXECUTED"
    assert order_data["friction"]["total_friction"] > 0
    assert order_data["friction"]["gst_18"] > 0

    # 2. Check Portfolio Status
    port_res = client.get("/api/v1/paper-trading/portfolio")
    assert port_res.status_code == 200
    port_data = port_res.json()
    assert port_data["total_equity"] > 0
    assert len(port_data["positions"]) >= 1

    # 3. Trigger T+1 Settle
    settle_res = client.post("/api/v1/paper-trading/settle")
    assert settle_res.status_code == 200


def test_kill_switch_and_resume():
    # Trip Kill Switch
    ks_res = client.post("/api/v1/risk/kill-switch")
    assert ks_res.status_code == 200
    ks_data = ks_res.json()
    assert ks_data["is_halted"] is True
    assert ks_data["status"] == "HALTED"

    # Order should be rejected when halted
    order_payload = {
        "symbol": "NIFTY 50",
        "side": "BUY",
        "quantity": 25,
        "order_type": "MARKET",
    }
    fail_res = client.post("/api/v1/paper-trading/order", json=order_payload)
    assert fail_res.status_code == 403

    # Resume trading
    res_resume = client.post("/api/v1/risk/resume")
    assert res_resume.status_code == 200


def test_screener_endpoint():
    response = client.get("/api/v1/screener")
    assert response.status_code == 200
    data = response.json()
    assert data["total_symbols"] >= 1
    assert len(data["ranked_signals"]) >= 1
    first_signal = data["ranked_signals"][0]
    assert "symbol" in first_signal
    assert "prob_win" in first_signal
    assert "risk_reward_ratio" in first_signal
