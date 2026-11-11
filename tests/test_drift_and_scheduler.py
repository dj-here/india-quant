"""
Unit Tests for Drift Monitoring and Pre-Market Orchestration Scheduler.
"""

from datetime import date
import numpy as np
import pandas as pd
import pytest

from india_quant.serving.drift_monitor import DriftMonitor, DriftReport
from india_quant.serving.scheduler import PreMarketPipelineOrchestrator


def test_psi_identical_distributions():
    monitor = DriftMonitor()
    np.random.seed(42)
    baseline = np.random.normal(0, 1, 1000)
    current = np.random.normal(0, 1, 1000)

    psi = monitor.calculate_psi(baseline, current)
    assert psi < 0.10, f"Expected low PSI for identical distributions, got {psi}"


def test_psi_shifted_distributions():
    monitor = DriftMonitor()
    np.random.seed(42)
    baseline = np.random.normal(0, 1, 1000)
    current = np.random.normal(3.0, 1.5, 1000)  # Significant shift

    psi = monitor.calculate_psi(baseline, current)
    assert psi >= 0.25, f"Expected high PSI (>0.25) for shifted distributions, got {psi}"


def test_ks_test_drift_detection():
    monitor = DriftMonitor()
    np.random.seed(42)
    baseline = np.random.normal(0, 1, 500)
    current_same = np.random.normal(0, 1, 500)
    current_diff = np.random.normal(1.5, 1, 500)

    _, p_val_same, is_drift_same = monitor.calculate_ks_test(baseline, current_same)
    assert not is_drift_same
    assert p_val_same > 0.01

    _, p_val_diff, is_drift_diff = monitor.calculate_ks_test(baseline, current_diff)
    assert is_drift_diff
    assert p_val_diff < 0.01


def test_evaluate_feature_drift_report():
    monitor = DriftMonitor()
    np.random.seed(42)
    b_df = pd.DataFrame({
        "feat1": np.random.normal(0, 1, 200),
        "feat2": np.random.normal(10, 2, 200),
    })
    c_df = pd.DataFrame({
        "feat1": np.random.normal(0, 1, 200),
        "feat2": np.random.normal(25, 5, 200),  # Heavy drift
    })

    report = monitor.evaluate_feature_drift(b_df, c_df, feature_columns=["feat1", "feat2"])
    assert isinstance(report, DriftReport)
    assert report.evaluated_features_count == 2
    assert "feat2" in report.drifted_features
    assert report.feature_psi["feat2"] > 0.10


def test_pre_market_pipeline_orchestration():
    orchestrator = PreMarketPipelineOrchestrator()
    # Force run regardless of weekend/holiday calendar
    res = orchestrator.execute_daily_pipeline(symbol="NIFTY 50", force_run=True)

    assert res.status == "READY_FOR_OPEN"
    assert res.features_calculated_count > 0
    assert res.inference_result is not None
    assert res.inference_result.symbol == "NIFTY 50"
    assert 0.0 <= res.inference_result.prob_win <= 1.0
    assert res.inference_result.predicted_high >= res.inference_result.predicted_low
    assert 0.0 <= res.inference_result.target_position_pct <= 0.35
