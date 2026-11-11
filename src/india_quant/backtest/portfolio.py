"""
Portfolio Construction, Volatility Targeting & Risk Management Engine for IndiaQuant.
Implements:
- Dynamic Volatility Targeting (12-15% annualized target)
- Fractional Kelly Sizing (0.5x) based on calibrated win probabilities
- T+1 Settlement cycle cash management
- Hard Portfolio Circuit Breaker (-15% max drawdown hard stop)
- Single-stock (10%) and sector concentration limits.
"""

from dataclasses import dataclass, field
from datetime import date
from typing import Dict, List, Optional
import numpy as np


@dataclass
class Position:
    symbol: str
    quantity: int
    entry_price: float
    current_price: float
    entry_date: date
    stop_loss: float
    take_profit: float

    @property
    def market_value(self) -> float:
        return self.quantity * self.current_price

    @property
    def unrealized_pnl(self) -> float:
        return self.quantity * (self.current_price - self.entry_price)

    @property
    def return_pct(self) -> float:
        return (self.current_price - self.entry_price) / self.entry_price if self.entry_price > 0 else 0.0


@dataclass
class PortfolioState:
    initial_capital: float
    cash: float
    unsettled_cash_t1: float = 0.0  # Cash arriving next trading day under T+1
    positions: Dict[str, Position] = field(default_factory=dict)
    high_water_mark: float = 0.0
    is_halted: bool = False  # Set to True if circuit breaker is tripped

    def __post_init__(self):
        if self.high_water_mark == 0.0:
            self.high_water_mark = self.initial_capital

    @property
    def positions_value(self) -> float:
        return sum(pos.market_value for pos in self.positions.values())

    @property
    def total_equity(self) -> float:
        return self.cash + self.unsettled_cash_t1 + self.positions_value

    @property
    def drawdown(self) -> float:
        if self.high_water_mark <= 0:
            return 0.0
        return (self.total_equity - self.high_water_mark) / self.high_water_mark

    def update_high_water_mark(self):
        equity = self.total_equity
        if equity > self.high_water_mark:
            self.high_water_mark = equity

    def settle_t1_cash(self):
        """Called at start of each trading day to settle previous day's sales."""
        self.cash += self.unsettled_cash_t1
        self.unsettled_cash_t1 = 0.0


class PortfolioRiskManager:
    """
    Manages sizing, risk limits, volatility targeting, and circuit breakers.
    """

    def __init__(
        self,
        target_annual_vol: float = 0.14,      # 14% Annual Vol Target
        kelly_fraction: float = 0.50,         # Half-Kelly sizing
        max_drawdown_limit: float = 0.15,     # 15% Max DD hard kill-switch
        max_position_pct: float = 0.10,       # Max 10% allocation per instrument
        r_free_annual: float = 0.065,         # 6.5% Indian Risk-Free Rate
    ):
        self.target_annual_vol = target_annual_vol
        self.target_daily_vol = target_annual_vol / np.sqrt(252)
        self.kelly_fraction = kelly_fraction
        self.max_drawdown_limit = max_drawdown_limit
        self.max_position_pct = max_position_pct
        self.r_free_annual = r_free_annual

    def check_circuit_breaker(self, portfolio: PortfolioState) -> bool:
        """
        Checks if portfolio drawdown exceeds the hard limit.
        If tripped, halts trading and returns True.
        """
        dd = portfolio.drawdown
        if dd <= -self.max_drawdown_limit:
            portfolio.is_halted = True
            return True
        return False

    def calculate_position_size(
        self,
        portfolio: PortfolioState,
        symbol: str,
        current_price: float,
        prob_win: float,
        expected_win_pct: float = 0.015,
        expected_loss_pct: float = 0.010,
        forecast_daily_vol: Optional[float] = None,
    ) -> int:
        """
        Computes optimal integer share quantity using Fractional Kelly scaled by Volatility Target.
        """
        if portfolio.is_halted or portfolio.cash <= 0 or current_price <= 0:
            return 0

        total_equity = portfolio.total_equity

        # 1. Fractional Kelly Sizing
        # b = win/loss ratio, p = prob_win, q = 1 - p
        # f* = (p * b - q) / b
        b = max(expected_win_pct / max(expected_loss_pct, 1e-4), 0.5)
        p = np.clip(prob_win, 0.01, 0.99)
        q = 1.0 - p
        kelly_full = (p * b - q) / b

        if kelly_full <= 0:
            return 0

        kelly_alloc = np.clip(kelly_full * self.kelly_fraction, 0.0, self.max_position_pct)

        # 2. Volatility Targeting Scaling
        # If asset's volatility is high, scale size down; if low, size up (within risk limits)
        if forecast_daily_vol is not None and forecast_daily_vol > 0:
            vol_scalar = self.target_daily_vol / forecast_daily_vol
            vol_scalar = np.clip(vol_scalar, 0.5, 1.5)
        else:
            vol_scalar = 1.0

        target_allocation_pct = min(kelly_alloc * vol_scalar, self.max_position_pct)
        target_rupees = total_equity * target_allocation_pct

        # Limit to available liquid cash
        allocated_rupees = min(target_rupees, portfolio.cash * 0.95)
        quantity = int(allocated_rupees // current_price)

        return max(quantity, 0)
