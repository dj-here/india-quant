"""
Institutional Paper Trading Execution Broker for Indian Markets.
Simulates realistic trade execution with:
- Exact statutory Indian charges (STT, GST 18%, Stamp Duty, SEBI turnover fees, exchange charges, slippage)
- T+1 settlement queue for equities and derivatives
- Position tracking with real-time mark-to-market
- Portfolio circuit breakers (hard drawdown stop)
- Emergency kill-switch for immediate position square-off.
"""

from datetime import datetime
import threading
from typing import Dict, List, Optional
import uuid
import pytz

from india_quant.backtest.costs_india import (
    IndianFrictionEngine,
    InstrumentType,
    OrderSide,
    TradeCostBreakdown,
)
from india_quant.common.exceptions import MarketDataError
from india_quant.data.storage.parquet_store import ParquetDataStore
from india_quant.serving.schemas import (
    KillSwitchResponse,
    PaperOrderResponse,
    PortfolioPositionItem,
    PortfolioStatusResponse,
    StatutoryFrictionDetail,
)


class PaperTradingBroker:
    """
    Thread-safe Paper Trading Broker simulating live execution on NSE/BSE.
    """

    def __init__(
        self,
        initial_capital: float = 1_000_000.0,
        max_drawdown_limit: float = 0.15,
        default_instrument: InstrumentType = InstrumentType.FUTURES,
    ):
        self._lock = threading.Lock()
        self.initial_capital = float(initial_capital)
        self.liquid_cash = float(initial_capital)
        self.unsettled_cash_t1 = 0.0
        self.positions: Dict[str, Dict] = {}  # symbol -> position dict
        self.orders: List[Dict] = []
        self.high_water_mark = float(initial_capital)
        self.max_drawdown_limit = max_drawdown_limit
        self.default_instrument = default_instrument
        self.is_halted = False
        self.friction_engine = IndianFrictionEngine()
        self.ist_tz = pytz.timezone("Asia/Kolkata")
        self.store = ParquetDataStore()

    def _get_current_price(self, symbol: str) -> float:
        """Fetches the latest closing price from data store or fallback."""
        try:
            df = self.store.read_bars(symbol=symbol, asset_class="indices")
            if not df.empty and "close" in df.columns:
                return float(df["close"].iloc[-1])
        except Exception:
            pass
        # Fallback default price approximations if lake is offline
        defaults = {"NIFTY 50": 24500.0, "NIFTY BANK": 52000.0}
        return defaults.get(symbol, 1000.0)

    def execute_order(
        self,
        symbol: str,
        side: str,
        quantity: int,
        price: Optional[float] = None,
        order_type: str = "MARKET",
        instrument: Optional[InstrumentType] = None,
    ) -> PaperOrderResponse:
        """
        Executes a paper order with statutory Indian friction and risk checks.
        """
        with self._lock:
            now_ist = datetime.now(self.ist_tz).isoformat()
            order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
            side_norm = side.upper().strip()

            if self.is_halted:
                raise PermissionError("Trading halted: portfolio circuit breaker or emergency kill-switch is active.")

            if quantity <= 0:
                raise ValueError(f"Order quantity must be positive, got {quantity}")

            exec_price = float(price) if price and price > 0 else self._get_current_price(symbol)
            inst = instrument or self.default_instrument
            order_side = OrderSide.BUY if side_norm == "BUY" else OrderSide.SELL

            # Compute friction breakdown
            costs = self.friction_engine.calculate_cost(
                instrument=inst,
                side=order_side,
                price=exec_price,
                quantity=quantity,
            )
            turnover = exec_price * quantity
            total_friction = costs.total_friction

            friction_detail = StatutoryFrictionDetail(
                brokerage=round(costs.brokerage, 2),
                stt=round(costs.stt, 2),
                exchange_charges=round(costs.exchange_charges, 2),
                sebi_charges=round(costs.sebi_charges, 2),
                stamp_duty=round(costs.stamp_duty, 2),
                gst_18=round(costs.gst, 2),
                slippage=round(costs.slippage, 2),
                total_friction=round(total_friction, 2),
            )

            if side_norm == "BUY":
                total_required = turnover + total_friction
                if self.liquid_cash < total_required:
                    raise ValueError(
                        f"Insufficient liquid cash: required ₹{total_required:,.2f} "
                        f"(Turnover: ₹{turnover:,.2f} + Friction: ₹{total_friction:,.2f}), "
                        f"available ₹{self.liquid_cash:,.2f}."
                    )
                self.liquid_cash -= total_required

                if symbol in self.positions:
                    pos = self.positions[symbol]
                    old_qty = pos["quantity"]
                    old_val = old_qty * pos["entry_price"]
                    new_qty = old_qty + quantity
                    new_entry = (old_val + turnover) / new_qty
                    pos["quantity"] = new_qty
                    pos["entry_price"] = new_entry
                    pos["current_price"] = exec_price
                else:
                    self.positions[symbol] = {
                        "quantity": quantity,
                        "entry_price": exec_price,
                        "current_price": exec_price,
                        "entry_date": now_ist[:10],
                    }

            elif side_norm == "SELL":
                if symbol not in self.positions or self.positions[symbol]["quantity"] < quantity:
                    current_qty = self.positions.get(symbol, {}).get("quantity", 0)
                    raise ValueError(f"Cannot sell {quantity} shares of {symbol}: current position is {current_qty}.")

                pos = self.positions[symbol]
                pos["quantity"] -= quantity
                if pos["quantity"] == 0:
                    del self.positions[symbol]

                # Under T+1 settlement, net proceeds are credited to unsettled cash queue
                net_proceeds = turnover - total_friction
                self.unsettled_cash_t1 += net_proceeds

            else:
                raise ValueError(f"Unsupported order side: {side}")

            self._update_hwm_and_risk()

            order_record = {
                "order_id": order_id,
                "symbol": symbol,
                "side": side_norm,
                "quantity": quantity,
                "executed_price": round(exec_price, 2),
                "turnover": round(turnover, 2),
                "friction": friction_detail.model_dump(),
                "net_cash_balance": round(self.liquid_cash, 2),
                "status": "EXECUTED",
                "timestamp_ist": now_ist,
            }
            self.orders.append(order_record)

            return PaperOrderResponse(
                order_id=order_id,
                symbol=symbol,
                side=side_norm,
                quantity=quantity,
                executed_price=round(exec_price, 2),
                turnover=round(turnover, 2),
                friction=friction_detail,
                net_cash_balance=round(self.liquid_cash, 2),
                status="EXECUTED",
                timestamp_ist=now_ist,
            )

    def _update_hwm_and_risk(self):
        """Monitors drawdown against high water mark and enforces circuit breakers."""
        pos_val = sum(p["quantity"] * p["current_price"] for p in self.positions.values())
        equity = self.liquid_cash + self.unsettled_cash_t1 + pos_val
        if equity > self.high_water_mark:
            self.high_water_mark = equity

        if self.high_water_mark > 0:
            dd = (self.high_water_mark - equity) / self.high_water_mark
            if dd >= self.max_drawdown_limit:
                self.is_halted = True

    def update_market_prices(self, price_map: Dict[str, float]):
        """Updates real-time mark-to-market prices for all active positions."""
        with self._lock:
            for symbol, price in price_map.items():
                if symbol in self.positions:
                    self.positions[symbol]["current_price"] = float(price)
            self._update_hwm_and_risk()

    def settle_t1(self):
        """Simulates T+1 settlement: unsettled funds become liquid cash."""
        with self._lock:
            self.liquid_cash += self.unsettled_cash_t1
            self.unsettled_cash_t1 = 0.0

    def get_portfolio_status(self) -> PortfolioStatusResponse:
        """Returns the full MTM portfolio state and risk metrics."""
        with self._lock:
            pos_items = []
            pos_value = 0.0

            for sym, pos in self.positions.items():
                mkt_val = pos["quantity"] * pos["current_price"]
                pos_value += mkt_val
                unrealized = pos["quantity"] * (pos["current_price"] - pos["entry_price"])
                ret_pct = (pos["current_price"] - pos["entry_price"]) / pos["entry_price"] if pos["entry_price"] > 0 else 0.0

                pos_items.append(
                    PortfolioPositionItem(
                        symbol=sym,
                        quantity=pos["quantity"],
                        entry_price=round(pos["entry_price"], 2),
                        current_price=round(pos["current_price"], 2),
                        unrealized_pnl=round(unrealized, 2),
                        return_pct=round(ret_pct, 4),
                        entry_date=pos["entry_date"],
                    )
                )

            total_equity = self.liquid_cash + self.unsettled_cash_t1 + pos_value
            dd_pct = 0.0
            if self.high_water_mark > 0:
                dd_pct = max(0.0, (self.high_water_mark - total_equity) / self.high_water_mark)

            return PortfolioStatusResponse(
                total_equity=round(total_equity, 2),
                liquid_cash=round(self.liquid_cash, 2),
                unsettled_cash_t1=round(self.unsettled_cash_t1, 2),
                positions_value=round(pos_value, 2),
                drawdown_pct=round(dd_pct, 4),
                high_water_mark=round(self.high_water_mark, 2),
                is_halted=self.is_halted,
                positions=pos_items,
            )

    def kill_switch(self) -> KillSwitchResponse:
        """
        Emergency risk kill-switch: closes all open positions immediately,
        converts assets to cash, and halts all subsequent trading.
        """
        with self._lock:
            now_ist = datetime.now(self.ist_tz).isoformat()
            self.is_halted = True
            closed_count = len(self.positions)
            freed_cash = 0.0

            symbols_to_close = list(self.positions.keys())
            for sym in symbols_to_close:
                pos = self.positions[sym]
                qty = pos["quantity"]
                price = pos["current_price"]
                turnover = qty * price
                costs = self.friction_engine.calculate_cost(
                    instrument=self.default_instrument,
                    side=OrderSide.SELL,
                    price=price,
                    quantity=qty,
                )
                net_proceeds = turnover - costs.total_friction
                freed_cash += net_proceeds
                self.liquid_cash += net_proceeds
                del self.positions[sym]

            return KillSwitchResponse(
                status="HALTED",
                is_halted=True,
                positions_closed=closed_count,
                freed_cash_inr=round(freed_cash, 2),
                timestamp_ist=now_ist,
            )

    def resume_trading(self):
        """Manually resets the circuit breaker and resumes trading."""
        with self._lock:
            self.is_halted = False
