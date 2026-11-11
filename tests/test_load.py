"""
Concurrency and High-Throughput Load Testing for IndiaQuant Serving API.
"""

from concurrent.futures import ThreadPoolExecutor, as_completed
from fastapi.testclient import TestClient
import pytest
from india_quant.serving.app import app

client = TestClient(app)


def _send_prediction_request(req_id: int):
    payload = {
        "symbol": "NIFTY 50",
        "horizon": "1d",
        "confidence_level": 0.90,
    }
    resp = client.post("/api/v1/predict/direction-and-range", json=payload)
    return req_id, resp.status_code, resp.json()


def _send_paper_order_request(req_id: int):
    payload = {
        "symbol": "NIFTY 50",
        "side": "BUY",
        "quantity": 1,
        "price": 24000.0,
    }
    resp = client.post("/api/v1/paper-trading/order", json=payload)
    return req_id, resp.status_code


def test_concurrent_prediction_throughput():
    """Simulates 30 concurrent model inference requests."""
    concurrency = 30
    results = []

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = [executor.submit(_send_prediction_request, i) for i in range(concurrency)]
        for f in as_completed(futures):
            results.append(f.result())

    assert len(results) == concurrency
    for req_id, status_code, body in results:
        assert status_code == 200
        assert body["symbol"] == "NIFTY 50"
        assert 0.0 <= body["prob_win"] <= 1.0
        assert body["predicted_high"] >= body["predicted_low"]


def test_concurrent_portfolio_state_thread_safety():
    """Tests thread-safety of paper broker under concurrent order submission."""
    # Ensure trading is not halted
    client.post("/api/v1/risk/resume")

    concurrency = 10
    results = []

    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(_send_paper_order_request, i) for i in range(concurrency)]
        for f in as_completed(futures):
            results.append(f.result())

    # All should execute cleanly without threading locks deadlocking
    assert len(results) == concurrency
    for req_id, status_code in results:
        assert status_code == 200

    # Verify portfolio state consistency
    port_res = client.get("/api/v1/paper-trading/portfolio")
    assert port_res.status_code == 200
    p_data = port_res.json()
    assert p_data["total_equity"] > 0
