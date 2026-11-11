"""
Tests for Market Regime Detection and GMM Clustering.
"""

import numpy as np
import pytest
from india_quant.features.regime import RegimeDetectionEngine
from india_quant.features.technical import TechnicalFeatureEngine


def test_regime_classification_states(sample_ohlcv_df):
    tech = TechnicalFeatureEngine()
    df_feat = tech.compute_features(sample_ohlcv_df)

    regime_engine = RegimeDetectionEngine()
    df_regime = regime_engine.classify_regimes_deterministic(df_feat)

    assert "regime_state" in df_regime.columns
    assert "is_bull_regime" in df_regime.columns
    assert "is_chop_regime" in df_regime.columns
    assert "is_panic_regime" in df_regime.columns

    states = set(df_regime["regime_state"].unique())
    # States must be a subset of {0, 1, 2}
    assert states.issubset({0, 1, 2})


def test_gmm_regime_clustering(sample_ohlcv_df):
    tech = TechnicalFeatureEngine()
    df_feat = tech.compute_features(sample_ohlcv_df)

    regime_engine = RegimeDetectionEngine(n_regimes=3)
    labels, gmm = regime_engine.fit_gmm_regimes(df_feat)

    assert len(labels) == len(df_feat)
    assert set(labels.unique()).issubset({0, 1, 2})
    assert gmm.converged_ is True
