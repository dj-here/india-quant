"""
Advanced Modeling & Stacking Pipeline for IndiaQuant.
Executes:
1. Optuna Walk-Forward Hyperparameter Optimization
2. Deep Sequence LSTM multi-task training
3. Conformal Prediction holdout calibration
4. Regime-Aware Ensemble stacking and registration.
"""

from typing import Dict, Tuple
import numpy as np
import pandas as pd
from india_quant.common.logging import get_logger
from india_quant.features.store import FeatureStore
from india_quant.models.conformal import ConformalPredictionEngine
from india_quant.models.deep_models import LSTMSequenceForecaster
from india_quant.models.ensemble import RegimeAwareEnsemble
from india_quant.models.evaluation import ModelEvaluator
from india_quant.models.optuna_tuner import WalkForwardHyperparameterTuner
from india_quant.models.registry import ModelRegistry

logger = get_logger("AdvancedModeling")


def run_advanced_pipeline(symbol: str = "NIFTY 50"):
    feature_store = FeatureStore()
    registry = ModelRegistry()
    evaluator = ModelEvaluator()

    logger.info(f"Loading 10+ year feature store for {symbol}...")
    df_full = feature_store.load_features(symbol)
    X, Y = feature_store.split_features_and_targets(df_full)
    close_prices = df_full["close"]

    y_dir = Y["target_dir_1d"]
    y_ret = Y["target_ret_1d"]
    y_high = Y["target_high_ratio_1d"]
    y_low = Y["target_low_ratio_1d"]

    valid = y_dir.notna() & y_ret.notna() & y_high.notna() & y_low.notna()
    X = X.loc[valid]
    y_dir = y_dir.loc[valid]
    y_ret = y_ret.loc[valid]
    y_high = y_high.loc[valid]
    y_low = y_low.loc[valid]
    close_prices = close_prices.loc[valid]

    # 1. Run Optuna Hyperparameter Optimization under Purged Walk-Forward CV
    tuner = WalkForwardHyperparameterTuner(n_trials=8, n_splits=3)
    best_params = tuner.tune(X, y_dir, y_ret, y_high, y_low)

    # 2. Fit and Evaluate the Regime-Aware Stacking Ensemble
    logger.info(f"Fitting Regime-Aware Ensemble with Deep LSTM and Conformal Calibration on {symbol}...")
    ensemble = RegimeAwareEnsemble(
        n_estimators_lgb=100,
        lstm_epochs=12,
        conformal_confidence=0.90,
    )
    ensemble.fit(X, y_dir, y_ret, y_high, y_low)

    # 3. Generate Predictions on full history
    preds = ensemble.predict(X, current_prices=close_prices)

    # 4. Evaluate Conformal Coverage
    y_true_ret = y_ret.values
    conf_cov = ensemble.conformal_engine.evaluate_coverage(
        y_test=y_true_ret,
        conf_low=preds["conf_ret_low"],
        conf_high=preds["conf_ret_high"],
    )
    logger.info(f"Conformal Prediction 90% Confidence Interval Empirical Coverage: {conf_cov:.2%}")

    # Evaluate Overall Performance
    rep = evaluator.evaluate(
        model_name="RegimeAware_Ensemble",
        symbol=symbol,
        y_true_dir=y_dir.values,
        y_true_ret=y_ret.values,
        y_true_high_p=close_prices.values * np.exp(y_high.values),
        y_true_low_p=close_prices.values * np.exp(y_low.values),
        preds=preds,
        baseline_report=None,
    )
    logger.info(f"\n{rep.summary()}\n")

    # 5. Register in Model Registry
    metrics = {
        "hit_rate": rep.hit_rate,
        "brier_score": rep.brier_score,
        "roc_auc": rep.roc_auc,
        "mean_pinball_loss": rep.mean_pinball_loss,
        "conformal_coverage_90": conf_cov,
        "high_mae_points": rep.high_mae_points,
        "low_mae_points": rep.low_mae_points,
    }
    registry.register_model(
        model_name="RegimeAware_Ensemble",
        symbol=symbol,
        version="2.0.0",
        model_obj=ensemble,
        feature_names=list(X.columns),
        metrics=metrics,
        promote_to_production=True,
    )

    return rep


def main():
    run_advanced_pipeline(symbol="NIFTY 50")


if __name__ == "__main__":
    main()
