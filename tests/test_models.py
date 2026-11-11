"""
Tests for Purged Walk-Forward CV, Baselines, LightGBM Quantile Forecaster,
Evaluator, and Model Registry.
"""

import tempfile
import numpy as np
import pandas as pd
import pytest
from india_quant.models.baselines import MomentumBaseline, NaivePersistenceBaseline, RidgeBaseline
from india_quant.models.evaluation import ModelEvaluator
from india_quant.models.registry import ModelRegistry
from india_quant.models.tree_models import LightGBMQuantileForecaster
from india_quant.models.validation import PurgedWalkForwardCV


def test_purged_walk_forward_cv_leakage_protection():
    df = pd.DataFrame(index=pd.date_range("2020-01-01", periods=500, freq="B"))
    cv = PurgedWalkForwardCV(
        n_splits=3,
        train_bars=200,
        test_bars=50,
        embargo_bars=5,
        prediction_horizon=1,
    )

    splits = list(cv.split(df))
    assert len(splits) == 3

    for train_idx, test_idx in splits:
        # Strict temporal order: max train must be strictly less than min test
        assert train_idx.max() < test_idx.min()

        # Purging check: train_idx must not include cutoff point overlapping forward label
        assert train_idx.max() <= test_idx.min() - 1


def test_baselines_prediction_contracts(sample_ohlcv_df):
    from india_quant.features.store import FeatureStore

    fs = FeatureStore()
    df_full = fs.build_feature_dataset(sample_ohlcv_df, symbol="TEST")
    X, Y = fs.split_features_and_targets(df_full)

    # 1. Naive
    naive = NaivePersistenceBaseline()
    naive.fit(X, Y["target_high_ratio_1d"], Y["target_low_ratio_1d"])
    pred_naive = naive.predict(X)
    assert len(pred_naive["prob_up"]) == len(X)
    assert (pred_naive["pred_high_ratio_50"] >= pred_naive["pred_low_ratio_50"]).all()

    # 2. Momentum
    mom = MomentumBaseline()
    mom.fit(X, Y["target_dir_1d"])
    pred_mom = mom.predict(X)
    assert len(pred_mom["pred_dir"]) == len(X)

    # 3. Ridge
    ridge = RidgeBaseline()
    ridge.fit(X, Y["target_dir_1d"], Y["target_ret_1d"], Y["target_high_ratio_1d"], Y["target_low_ratio_1d"])
    pred_ridge = ridge.predict(X)
    assert (pred_ridge["pred_high_ratio_50"] >= pred_ridge["pred_low_ratio_50"]).all()


def test_lightgbm_quantile_forecaster_invariants(sample_ohlcv_df):
    from india_quant.features.store import FeatureStore

    fs = FeatureStore()
    df_full = fs.build_feature_dataset(sample_ohlcv_df, symbol="TEST")
    X, Y = fs.split_features_and_targets(df_full)
    valid = Y["target_dir_1d"].notna()

    model = LightGBMQuantileForecaster(n_estimators=30, learning_rate=0.05)
    model.fit(
        X=X.loc[valid],
        y_dir=Y.loc[valid, "target_dir_1d"],
        y_ret=Y.loc[valid, "target_ret_1d"],
        y_high=Y.loc[valid, "target_high_ratio_1d"],
        y_low=Y.loc[valid, "target_low_ratio_1d"],
    )

    preds = model.predict(X, current_prices=df_full["close"])

    # Quantile monotonicity check: q10 <= q50 <= q90
    assert (preds["pred_return_10"] <= preds["pred_return_50"]).all()
    assert (preds["pred_return_50"] <= preds["pred_return_90"]).all()

    # High / Low non-crossing check: Low <= High
    assert (preds["pred_low_ratio_50"] <= preds["pred_high_ratio_50"]).all()
    assert (preds["pred_low_price_50"] <= preds["pred_high_price_50"]).all()

    # Probabilities bounded in [0, 1]
    assert (preds["prob_up"] >= 0.0).all()
    assert (preds["prob_up"] <= 1.0).all()


def test_model_registry_lifecycle():
    with tempfile.TemporaryDirectory() as tmp_reg:
        registry = ModelRegistry(registry_root=tmp_reg)

        dummy_model = {"weights": [1, 2, 3]}
        entry = registry.register_model(
            model_name="TestModel",
            symbol="NIFTY 50",
            version="1.0.0",
            model_obj=dummy_model,
            feature_names=["f1", "f2"],
            metrics={"hit_rate": 0.54, "brier_score": 0.248},
            promote_to_production=True,
        )

        assert entry.stage == "PRODUCTION"

        # Load active production model
        loaded_bundle = registry.load_production_model("NIFTY 50")
        assert loaded_bundle is not None
        assert loaded_bundle["version"] == "1.0.0"
        assert loaded_bundle["model"] == dummy_model
