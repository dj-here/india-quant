"""
Tests for Derivatives Microstructure (PCR, Max Pain, IV Skew).
"""

import pandas as pd
import pytest
from india_quant.features.microstructure import MicrostructureFeatureEngine


def test_pcr_calculation():
    # Synthetic option chain
    data = {
        "strike": [23800, 23900, 24000, 24100, 24200],
        "call_oi": [100000, 150000, 300000, 250000, 200000],  # Total = 1,000,000
        "put_oi": [250000, 350000, 400000, 150000, 50000],   # Total = 1,200,000
        "call_vol": [10000, 20000, 50000, 30000, 10000],
        "put_vol": [15000, 25000, 45000, 15000, 5000],
        "call_iv": [0.18, 0.16, 0.14, 0.15, 0.17],
        "put_iv": [0.19, 0.17, 0.15, 0.16, 0.18],
    }
    df_chain = pd.DataFrame(data)

    pcr_oi, pcr_vol = MicrostructureFeatureEngine.calculate_pcr(df_chain)
    assert pcr_oi == 1.20  # 1,200,000 / 1,000,000
    assert pcr_vol > 0.0


def test_max_pain_calculation():
    # Symmetric calls and puts around 24000
    data = {
        "strike": [23800, 23900, 24000, 24100, 24200],
        "call_oi": [10000, 50000, 500000, 200000, 100000],
        "put_oi": [100000, 200000, 500000, 50000, 10000],
    }
    df_chain = pd.DataFrame(data)

    max_pain = MicrostructureFeatureEngine.calculate_max_pain(df_chain)
    # Highest cumulative open interest cluster is around 24000
    assert max_pain == 24000.0


def test_iv_skew_calculation():
    data = {
        "strike": [23000, 23500, 24000, 24500, 25000],
        "put_iv": [0.22, 0.19, 0.15, 0.14, 0.13],
        "call_iv": [0.13, 0.14, 0.15, 0.17, 0.20],
    }
    df_chain = pd.DataFrame(data)

    skew = MicrostructureFeatureEngine.calculate_iv_skew(df_chain, spot_price=24000.0)
    # Put IV is higher than Call IV (fear of market crash)
    assert skew > 0.0
