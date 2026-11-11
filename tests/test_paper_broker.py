"""
Unit tests for Paper Trading Broker and Risk Controls.
"""

import pytest
from india_quant.backtest.costs_india import InstrumentType
from india_quant.serving.paper_broker import PaperTradingBroker


def test_paper_broker_initialization():
    broker = PaperTradingBroker(initial_capital=500_000.0)
    assert broker.liquid_cash == 500_000.0
    assert broker.unsettled_cash_t1 == 0.0
    assert len(broker.positions) == 0
    assert broker.is_halted is False


def test_paper_broker_order_execution():
    broker = PaperTradingBroker(initial_capital=1_000_000.0)
    res = broker.execute_order(
        symbol="NIFTY 50",
        side="BUY",
        quantity=25,
        price=24000.0,
        instrument=InstrumentType.FUTURES,
    )

    assert res.status == "EXECUTED"
    assert res.executed_price == 24000.0
    assert res.turnover == 600_000.0
    assert res.friction.total_friction > 0.0
    assert res.friction.gst_18 > 0.0
    assert broker.liquid_cash < 1_000_000.0 - 600_000.0
    assert "NIFTY 50" in broker.positions
    assert broker.positions["NIFTY 50"]["quantity"] == 25


def test_paper_broker_insufficient_funds():
    broker = PaperTradingBroker(initial_capital=10_000.0)
    with pytest.raises(ValueError, match="Insufficient liquid cash"):
        broker.execute_order(
            symbol="NIFTY 50",
            side="BUY",
            quantity=50,
            price=24000.0,
            instrument=InstrumentType.FUTURES,
        )


def test_paper_broker_sell_and_t1_settlement():
    broker = PaperTradingBroker(initial_capital=1_000_000.0)
    # Buy first
    broker.execute_order(symbol="NIFTY 50", side="BUY", quantity=25, price=24000.0)
    cash_after_buy = broker.liquid_cash

    # Sell
    sell_res = broker.execute_order(symbol="NIFTY 50", side="SELL", quantity=25, price=24500.0)
    assert sell_res.status == "EXECUTED"
    assert len(broker.positions) == 0  # Position closed
    assert broker.unsettled_cash_t1 > 0.0  # Net proceeds waiting in T+1
    assert broker.liquid_cash == cash_after_buy  # Liquid cash unchanged before settlement

    # Settle T+1
    broker.settle_t1()
    assert broker.unsettled_cash_t1 == 0.0
    assert broker.liquid_cash > cash_after_buy


def test_paper_broker_kill_switch():
    broker = PaperTradingBroker(initial_capital=1_000_000.0)
    broker.execute_order(symbol="NIFTY 50", side="BUY", quantity=25, price=24000.0)
    assert len(broker.positions) == 1

    ks_res = broker.kill_switch()
    assert ks_res.status == "HALTED"
    assert ks_res.is_halted is True
    assert ks_res.positions_closed == 1
    assert len(broker.positions) == 0
    assert broker.is_halted is True

    # Order placement must be rejected when halted
    with pytest.raises(PermissionError, match="Trading halted"):
        broker.execute_order(symbol="NIFTY 50", side="BUY", quantity=25, price=24000.0)

    # Resume trading
    broker.resume_trading()
    assert broker.is_halted is False
