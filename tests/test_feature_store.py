"""
Tests for Feature Store dataset creation, splitting, and LightGBM importance analysis.
"""

import tempfile
import pytest
from india_quant.features.store import FeatureStore


def test_feature_store_end_to_end(sample_ohlcv_df):
    with tempfile.TemporaryDirectory() as tmp_lake:
        store = FeatureStore(lake_root=tmp_lake)

        df_full = store.build_feature_dataset(sample_ohlcv_df, symbol="TEST_SYM")
        assert not df_full.empty
        assert len(df_full) == len(sample_ohlcv_df)

        # Separate X and Y
        X, Y = store.split_features_and_targets(df_full)
        assert not X.empty
        assert not Y.empty
        assert "target_dir_1d" in Y.columns
        assert "target_high_ratio_1d" in Y.columns
        assert "target_low_ratio_1d" in Y.columns
        assert "close" not in X.columns  # Base raw columns excluded from features

        # Save and reload
        saved_path = store.save_features(df_full, symbol="TEST_SYM")
        assert saved_path.exists()

        reloaded = store.load_features(symbol="TEST_SYM")
        assert len(reloaded) == len(df_full)


def test_feature_importance_calculation(sample_ohlcv_df):
    store = FeatureStore()
    df_full = store.build_feature_dataset(sample_ohlcv_df, symbol="TEST_SYM")
    X, Y = store.split_features_and_targets(df_full)

    # Compute importance for directional target
    imp_df = store.compute_feature_importance(X, Y["target_dir_1d"], top_k=5)
    assert not imp_df.empty
    assert len(imp_df) <= 5
    assert "feature" in imp_df.columns
    assert "importance" in imp_df.columns
    assert (imp_df["importance"] >= 0).all()
