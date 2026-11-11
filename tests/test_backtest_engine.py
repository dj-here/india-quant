"""
Tests for Realistic Backtesting Engine, Portfolio Risk Manager, and Metrics.
"""

from datetime import date
import numpy as np
import pandas as pd
import pytest
from india_quant.backtest.costs_india import InstrumentType
from india_quant.backtest.engine import DailyPortfolioSnapshot, RealisticBacktestEngine, TradeRecord
from india_quant.backtest.metrics import PerformanceMetricsCalculator
from india_quant.backtest.portfolio import PortfolioRiskManager, PortfolioState
from india_quant.backtest.stress_testing import HistoricalStressTester


def test_t1_settlement_and_portfolio_state():
    state = PortfolioState(initial_capital=100_000.0, cash=50_000.0, unsettled_cash_t1=50_000.0)
    assert state.cash == 50_000.0
    assert state.total_equity == 100_000.0

    # Settle T+1 cash
    state.settle_t1_cash()
    assert state.cash == 100_000.0
    assert state.unsettled_cash_t1 == 0.0


def test_fractional_kelly_and_vol_targeting():
    risk_mgr = PortfolioRiskManager(
        target_annual_vol=0.14,
        kelly_fraction=0.50,
        max_drawdown_limit=0.15,
        max_position_pct=0.10,
    )
    state = PortfolioState(initial_capital=1_000_000.0, cash=1_000_000.0)

    qty = risk_mgr.calculate_position_size(
        portfolio=state,
        symbol="NIFTY",
        current_price=24000.0,
        prob_win=0.58,
        forecast_daily_vol=0.010,
    )
    assert qty > 0
    # Position value must be <= 10% of portfolio equity
    assert qty * 24000.0 <= state.total_equity * 0.101


def test_portfolio_circuit_breaker_halt():
    risk_mgr = PortfolioRiskManager(max_drawdown_limit=0.15)
    # Severe 20% drawdown
    state = PortfolioState(initial_capital=1_000_000.0, cash=800_000.0, high_water_mark=1_000_000.0)
    assert state.drawdown == -0.20
    is_halted = risk_mgr.check_circuit_breaker(state)
    assert is_halted is True
    assert state.is_halted is True


def test_stress_window_evaluation():
    tester = HistoricalStressTester()
    # Mock snapshots covering 2020 COVID window
    snaps = [
        DailyPortfolioSnapshot(
            trade_date=date(2020, 3, 1) + pd.Timedelta(days=i),
            total_equity=1_000_000.0 + i * 1000.0,
            cash=1_000_000.0,
            positions_value=0.0,
            drawdown=0.0,
            daily_return=0.001,
            benchmark_return=-0.02,
            cumulative_friction_paid=100.0,
            open_positions=1,
        )
        for i in range(20)
    ]

    results = tester.evaluate_stress_windows(snaps)
    covid_res = [r for r in results if "COVID" in r.event_name]
    assert len(covid_res) == 1
    assert covid_res[0].strategy_return_pct > covid_res[0].benchmark_return_pct
    assert covid_res[0].alpha_pct > 0.0
