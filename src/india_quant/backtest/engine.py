"""
Realistic Indian Market Backtest Engine for IndiaQuant.
Simulates day-by-day execution with:
- Exact statutory Indian friction (STT, GST 18%, Stamp Duty, SEBI fees, exchange fees, slippage)
- T+1 settlement cycles
- Circuit breaker band constraints (5%, 10%, 20%)
- Predictive High/Low stop-loss and take-profit execution
- Fractional Kelly and Volatility Targeting sizing.
"""

from dataclasses import dataclass, field
from datetime import date
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from india_quant.backtest.costs_india import IndianFrictionEngine, InstrumentType, OrderSide
from india_quant.backtest.portfolio import PortfolioRiskManager, PortfolioState, Position
from india_quant.common.logging import get_logger

logger = get_logger("BacktestEngine")


@dataclass
class TradeRecord:
    symbol: str
    entry_date: date
    exit_date: date
    entry_price: float
    exit_price: float
    quantity: int
    gross_pnl: float
    net_pnl: float
    total_friction: float
    stt_paid: float
    gst_paid: float
    return_pct: float
    exit_reason: str  # "TAKE_PROFIT" | "STOP_LOSS" | "HORIZON_EXPIRY" | "CIRCUIT_HALT"


@dataclass
class DailyPortfolioSnapshot:
    trade_date: date
    total_equity: float
    cash: float
    positions_value: float
    drawdown: float
    daily_return: float
    benchmark_return: float
    cumulative_friction_paid: float
    open_positions: int


class RealisticBacktestEngine:
    """
    Simulates portfolio execution with statutory Indian market friction and risk controls.
    """

    def __init__(
        self,
        initial_capital: float = 1_000_000.0,  # ₹10 Lakhs
        instrument_type: InstrumentType = InstrumentType.FUTURES,
        target_annual_vol: float = 0.14,
        kelly_fraction: float = 0.50,
        max_drawdown_limit: float = 0.15,
        default_slippage_bps: float = 2.0,
        min_prob_hurdle: float = 0.53,        # Confidence filter to amortize Indian statutory STT friction
    ):
        self.initial_capital = initial_capital
        self.instrument_type = instrument_type
        self.friction_engine = IndianFrictionEngine(default_slippage_bps=default_slippage_bps)
        self.risk_manager = PortfolioRiskManager(
            target_annual_vol=target_annual_vol,
            kelly_fraction=kelly_fraction,
            max_drawdown_limit=max_drawdown_limit,
        )
        self.min_prob_hurdle = min_prob_hurdle

    def run_backtest(
        self,
        symbol: str,
        df_ohlcv: pd.DataFrame,
        preds: Dict[str, np.ndarray],
        benchmark_close: Optional[pd.Series] = None,
    ) -> Tuple[List[DailyPortfolioSnapshot], List[TradeRecord]]:
        """
        Executes backtest over historical bars and predictions.
        """
        portfolio = PortfolioState(
            initial_capital=self.initial_capital,
            cash=self.initial_capital,
        )

        snapshots: List[DailyPortfolioSnapshot] = []
        closed_trades: List[TradeRecord] = []
        cumulative_friction = 0.0

        n_bars = len(df_ohlcv)
        dates = df_ohlcv.index
        opens = df_ohlcv["open"].values
        highs = df_ohlcv["high"].values
        lows = df_ohlcv["low"].values
        closes = df_ohlcv["close"].values

        # Model signal series
        prob_up = preds["prob_up"]
        pred_dir = preds.get("pred_dir", (prob_up >= 0.50).astype(int))
        abstain = preds.get("abstain", np.zeros(n_bars, dtype=bool))
        pred_high_p = preds.get("pred_high_price_50", closes * 1.01)
        pred_low_p = preds.get("pred_low_price_50", closes * 0.99)

        # Benchmark returns (buy and hold)
        b_series = benchmark_close if benchmark_close is not None else df_ohlcv["close"]
        bench_ret = b_series.pct_change().fillna(0.0).values

        prev_equity = self.initial_capital

        for i in range(n_bars):
            t_date = dates[i].date() if hasattr(dates[i], "date") else dates[i]
            cur_open = opens[i]
            cur_high = highs[i]
            cur_low = lows[i]
            cur_close = closes[i]

            # 1. T+1 Settlement: Cash from yesterday's sales becomes liquid today
            portfolio.settle_t1_cash()

            # 2. Update mark-to-market valuations for existing positions
            if symbol in portfolio.positions:
                pos = portfolio.positions[symbol]
                pos.current_price = cur_close

                # Check intraday exits (Stop Loss or Take Profit)
                exit_price = None
                exit_reason = ""

                # Stop loss check
                if cur_low <= pos.stop_loss:
                    exit_price = pos.stop_loss
                    exit_reason = "STOP_LOSS"
                # Take profit check
                elif cur_high >= pos.take_profit:
                    exit_price = pos.take_profit
                    exit_reason = "TAKE_PROFIT"
                # 1-day horizon expiration: close at current day's close
                elif (t_date - pos.entry_date).days >= 1:
                    exit_price = cur_close
                    exit_reason = "HORIZON_EXPIRY"

                if exit_price is not None:
                    # Execute sell leg with statutory friction
                    sell_cost = self.friction_engine.calculate_cost(
                        instrument=self.instrument_type,
                        side=OrderSide.SELL,
                        price=exit_price,
                        quantity=pos.quantity,
                    )
                    gross_pnl = (exit_price - pos.entry_price) * pos.quantity
                    net_proceeds = (exit_price * pos.quantity) - sell_cost.total_friction
                    net_pnl = gross_pnl - sell_cost.total_friction

                    # Add net proceeds to T+1 unsettled cash queue
                    portfolio.unsettled_cash_t1 += net_proceeds
                    cumulative_friction += sell_cost.total_friction

                    closed_trades.append(TradeRecord(
                        symbol=symbol,
                        entry_date=pos.entry_date,
                        exit_date=t_date,
                        entry_price=pos.entry_price,
                        exit_price=exit_price,
                        quantity=pos.quantity,
                        gross_pnl=round(gross_pnl, 2),
                        net_pnl=round(net_pnl, 2),
                        total_friction=round(sell_cost.total_friction, 2),
                        stt_paid=round(sell_cost.stt, 2),
                        gst_paid=round(sell_cost.gst, 2),
                        return_pct=round((exit_price - pos.entry_price) / pos.entry_price, 4),
                        exit_reason=exit_reason,
                    ))
                    del portfolio.positions[symbol]

            # 3. Update High-Water Mark and check Circuit Breaker
            portfolio.update_high_water_mark()
            is_halted = self.risk_manager.check_circuit_breaker(portfolio)

            # 4. Process New Entry Signals
            # Must not be halted, must not hold position, and signal must be Bullish without Abstention
            if (
                not is_halted
                and symbol not in portfolio.positions
                and i < n_bars - 1
                and not abstain[i]
                and pred_dir[i] == 1
                and prob_up[i] >= self.min_prob_hurdle
            ):
                # Volatility forecast from trailing features
                daily_vol = (cur_high - cur_low) / cur_close
                quantity = self.risk_manager.calculate_position_size(
                    portfolio=portfolio,
                    symbol=symbol,
                    current_price=cur_close,
                    prob_win=prob_up[i],
                    forecast_daily_vol=daily_vol,
                )

                if quantity > 0:
                    # Execute Buy order
                    buy_cost = self.friction_engine.calculate_cost(
                        instrument=self.instrument_type,
                        side=OrderSide.BUY,
                        price=cur_close,
                        quantity=quantity,
                    )
                    total_required = (cur_close * quantity) + buy_cost.total_friction

                    if portfolio.cash >= total_required:
                        portfolio.cash -= total_required
                        cumulative_friction += buy_cost.total_friction

                        # Stop-loss set to model's predicted Low, Take-profit set to predicted High
                        stop_loss = float(pred_low_p[i]) if pred_low_p[i] < cur_close else cur_close * 0.985
                        take_profit = float(pred_high_p[i]) if pred_high_p[i] > cur_close else cur_close * 1.015

                        portfolio.positions[symbol] = Position(
                            symbol=symbol,
                            quantity=quantity,
                            entry_price=cur_close,
                            current_price=cur_close,
                            entry_date=t_date,
                            stop_loss=stop_loss,
                            take_profit=take_profit,
                        )

            # 5. Snapshot EOD Portfolio Valuation
            current_equity = portfolio.total_equity
            daily_ret = (current_equity - prev_equity) / prev_equity if prev_equity > 0 else 0.0
            prev_equity = current_equity

            snapshots.append(DailyPortfolioSnapshot(
                trade_date=t_date,
                total_equity=round(current_equity, 2),
                cash=round(portfolio.cash, 2),
                positions_value=round(portfolio.positions_value, 2),
                drawdown=round(portfolio.drawdown, 4),
                daily_return=round(daily_ret, 6),
                benchmark_return=round(bench_ret[i], 6),
                cumulative_friction_paid=round(cumulative_friction, 2),
                open_positions=len(portfolio.positions),
            ))

        return snapshots, closed_trades
