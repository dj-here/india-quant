"""
Unit Tests for SEBI Compliance, Cryptographic Audit Trail and Governance.
"""

from fastapi.testclient import TestClient
import pytest
from india_quant.serving.app import app
from india_quant.serving.audit import AuditLogger

client = TestClient(app)


def test_audit_logger_hash_and_signature(tmp_path):
    logger = AuditLogger(log_dir=str(tmp_path))
    rec = logger.log_prediction(
        symbol="NIFTY 50",
        model_name="RegimeAware_Ensemble",
        model_version="2.0.0",
        features={"feat1": 0.5, "feat2": 1.2},
        prob_win=0.54,
        direction=1,
        predicted_high=24800.0,
        predicted_low=24300.0,
        abstain=False,
    )

    assert rec.audit_id.startswith("AUD-")
    assert len(rec.feature_hash_sha256) == 64  # Valid SHA-256 hex string
    assert len(rec.record_signature_sha256) == 64
    assert rec.prob_win == 0.54

    loaded = logger.load_recent_audit_records()
    assert len(loaded) == 1
    assert loaded[0].audit_id == rec.audit_id


def test_compliance_disclaimers_endpoint():
    res = client.get("/api/v1/compliance/disclaimers")
    assert res.status_code == 200
    data = res.json()
    assert "SEBI" in data["research_analyst_regulations_2014"]
    assert "paper-trading" in data["algo_trading_framework"]
    assert data["mode"] == "SIMULATION_RESEARCH_ONLY"


def test_compliance_audit_trail_endpoint():
    # Make a prediction to generate an audit log entry
    client.post(
        "/api/v1/predict/direction-and-range",
        json={"symbol": "NIFTY 50", "horizon": "1d", "confidence_level": 0.90},
    )

    res = client.get("/api/v1/compliance/audit-trail?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["count"] >= 1
    first = data["records"][-1]
    assert first["symbol"] == "NIFTY 50"
    assert "feature_hash_sha256" in first
    assert "record_signature_sha256" in first
