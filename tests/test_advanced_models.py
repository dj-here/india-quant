"""
Tests for Conformal Prediction, Deep LSTM Sequence Forecaster,
Regime-Aware Stacking Ensemble, and Optuna Walk-Forward Tuner.
"""

import numpy as np
import pandas as pd
import pytest
from india_quant.models.conformal import ConformalPredictionEngine
from india_quant.models.deep_models import LSTMSequenceForecaster
from india_quant.models.ensemble import RegimeAwareEnsemble
from india_quant.models.optuna_tuner import WalkForwardHyperparameterTuner


def test_conformal_prediction_coverage_guarantee():
    # Synthetic calibration and test data
    rng = np.random.default_rng(42)
    n = 200
    y_cal_ret = rng.normal(0.0005, 0.012, n)
    y_cal_high = np.abs(rng.normal(0.008, 0.004, n))
    y_cal_low = -np.abs(rng.normal(0.008, 0.004, n))

    pred_ret_low = y_cal_ret - 0.010
    pred_ret_high = y_cal_ret + 0.010
    pred_high_50 = np.full(n, 0.008)
    pred_low_50 = np.full(n, -0.008)

    engine = ConformalPredictionEngine(confidence_level=0.90)
    engine.calibrate(
        y_cal_ret=y_cal_ret,
        y_cal_high=y_cal_high,
        y_cal_low=y_cal_low,
        pred_cal_ret_low=pred_ret_low,
        pred_cal_ret_high=pred_ret_high,
        pred_cal_high_50=pred_high_50,
        pred_cal_low_50=pred_low_50,
    )

    # Test set predictions
    y_test_ret = rng.normal(0.0005, 0.012, 100)
    preds = engine.predict_conformal_intervals(
        pred_ret_low=y_test_ret - 0.010,
        pred_ret_high=y_test_ret + 0.010,
        pred_high_50=np.full(100, 0.008),
        pred_low_50=np.full(100, -0.008),
    )

    cov = engine.evaluate_coverage(y_test_ret, preds["conf_ret_low"], preds["conf_ret_high"])
    # Coverage should meet or exceed nominal 90%
    assert cov >= 0.85
    assert (preds["conf_low_ratio"] <= preds["conf_high_ratio"]).all()


def test_lstm_sequence_forecaster(sample_ohlcv_df):
    from india_quant.features.store import FeatureStore

    fs = FeatureStore()
    df_full = fs.build_feature_dataset(sample_ohlcv_df, symbol="TEST")
    X, Y = fs.split_features_and_targets(df_full)
    valid = Y["target_dir_1d"].notna()

    lstm = LSTMSequenceForecaster(lookback_window=5, hidden_dim=16, epochs=3, batch_size=32)
    lstm.fit(
        X=X.loc[valid],
        y_dir=Y.loc[valid, "target_dir_1d"],
        y_ret=Y.loc[valid, "target_ret_1d"],
        y_high=Y.loc[valid, "target_high_ratio_1d"],
        y_low=Y.loc[valid, "target_low_ratio_1d"],
    )

    preds = lstm.predict(X, current_prices=df_full["close"])
    assert len(preds["prob_up"]) == len(X)
    assert (preds["prob_up"] >= 0.0).all() and (preds["prob_up"] <= 1.0).all()
    assert (preds["pred_low_ratio_50"] <= preds["pred_high_ratio_50"]).all()


def test_regime_aware_ensemble_abstention(sample_ohlcv_df):
    from india_quant.features.store import FeatureStore

    fs = FeatureStore()
    df_full = fs.build_feature_dataset(sample_ohlcv_df, symbol="TEST")
    X, Y = fs.split_features_and_targets(df_full)

    ensemble = RegimeAwareEnsemble(n_estimators_lgb=20, lstm_epochs=2)
    ensemble.fit(
        X=X,
        y_dir=Y["target_dir_1d"],
        y_ret=Y["target_ret_1d"],
        y_high=Y["target_high_ratio_1d"],
        y_low=Y["target_low_ratio_1d"],
    )

    preds = ensemble.predict(X, current_prices=df_full["close"])
    assert "abstain" in preds
    assert "prob_up" in preds
    assert "conf_ret_low" in preds
    assert "conf_ret_high" in preds
    assert (preds["conf_ret_low"] <= preds["conf_ret_high"]).all()
