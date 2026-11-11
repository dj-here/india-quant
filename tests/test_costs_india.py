"""
Tests for Indian statutory transaction costs, STT, GST, and SEBI fees.
"""

import pytest
from india_quant.backtest.costs_india import (
    IndianFrictionEngine,
    InstrumentType,
    OrderSide,
)


def test_equity_delivery_zero_brokerage(friction_engine):
    # Delivery buy: ₹1,00,000 turnover
    cost = friction_engine.calculate_cost(
        instrument=InstrumentType.EQUITY_DELIVERY,
        side=OrderSide.BUY,
        price=1000.0,
        quantity=100,
        slippage_bps=0.0,
    )
    assert cost.turnover == 100000.0
    assert cost.brokerage == 0.0  # Zero delivery brokerage
    assert cost.stt == 100.0       # 0.1% on delivery
    assert cost.stamp_duty == 15.0 # 0.015% on buy
    assert cost.total_statutory_charges > 0.0


def test_equity_intraday_brokerage_cap(friction_engine):
    # Large trade turnover = ₹10,00,000
    # 0.03% would be ₹300, but capped at ₹20
    cost = friction_engine.calculate_cost(
        instrument=InstrumentType.EQUITY_INTRADAY,
        side=OrderSide.SELL,
        price=1000.0,
        quantity=1000,
        slippage_bps=0.0,
    )
    assert cost.brokerage == 20.0
    # STT on intraday sell is 0.025% = ₹250
    assert cost.stt == 250.0
    # Stamp duty on sell is 0.0
    assert cost.stamp_duty == 0.0
    # GST should be 18% of (Brokerage + Exchange + SEBI)
    expected_gst = round((cost.brokerage + cost.exchange_charges + cost.sebi_charges) * 0.18, 2)
    assert abs(cost.gst - expected_gst) < 0.05


def test_futures_friction(friction_engine):
    # Futures sell leg turnover = ₹5,00,000
    cost = friction_engine.calculate_cost(
        instrument=InstrumentType.FUTURES,
        side=OrderSide.SELL,
        price=25000.0,
        quantity=20,
        slippage_bps=2.0,
    )
    assert cost.brokerage == 20.0
    # STT 0.02% on sell = ₹100
    assert cost.stt == 100.0
    assert cost.slippage == 100.0  # 2 bps of 500,000


def test_round_trip_cost(friction_engine):
    round_trip = friction_engine.calculate_round_trip_cost(
        instrument=InstrumentType.EQUITY_INTRADAY,
        buy_price=24000.0,
        sell_price=24200.0,
        quantity=25,
        slippage_bps=3.0,
    )
    assert round_trip.turnover == (24000.0 * 25) + (24200.0 * 25)
    assert round_trip.brokerage == 40.0  # ₹20 buy + ₹20 sell
    assert round_trip.total_friction > round_trip.brokerage
