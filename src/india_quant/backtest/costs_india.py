"""
Indian Statutory Taxes, Exchange Fees, and Transaction Cost Engine.
Computes precise Brokerage, STT, Exchange Charges, SEBI fees, Stamp Duty, GST (18%),
and market slippage for NSE/BSE equity and derivatives trades.
"""

from dataclasses import dataclass
from enum import Enum
import math
from typing import Optional


class InstrumentType(str, Enum):
    EQUITY_DELIVERY = "equity_delivery"
    EQUITY_INTRADAY = "equity_intraday"
    FUTURES = "futures"
    OPTIONS = "options"


class OrderSide(str, Enum):
    BUY = "buy"
    SELL = "sell"


@dataclass
class TradeCostBreakdown:
    turnover: float
    brokerage: float
    stt: float
    exchange_charges: float
    sebi_charges: float
    stamp_duty: float
    gst: float
    slippage: float
    total_statutory_charges: float  # stt + exchange + sebi + stamp + gst
    total_friction: float            # brokerage + statutory + slippage
    effective_bps: float             # total_friction / turnover * 10,000


class IndianFrictionEngine:
    """
    Computes statutory Indian transaction charges and realistic market friction.
    Complies with NSE/BSE, SEBI, and Ministry of Finance schedules.
    """

    GST_RATE = 0.18  # 18% GST on (Brokerage + Exchange Fees + SEBI Fees)
    SEBI_RATE = 10.0 / 10_000_000.0  # ₹10 per crore (0.0001%)

    def __init__(
        self,
        default_slippage_bps: float = 5.0,
        flat_options_brokerage: float = 20.0,
        intraday_brokerage_pct: float = 0.0003,
        intraday_brokerage_cap: float = 20.0,
        zero_brokerage_delivery: bool = True,
    ):
        self.default_slippage_bps = default_slippage_bps
        self.flat_options_brokerage = flat_options_brokerage
        self.intraday_brokerage_pct = intraday_brokerage_pct
        self.intraday_brokerage_cap = intraday_brokerage_cap
        self.zero_brokerage_delivery = zero_brokerage_delivery

    def calculate_cost(
        self,
        instrument: InstrumentType,
        side: OrderSide,
        price: float,
        quantity: int,
        slippage_bps: Optional[float] = None,
        strike_price: float = 0.0,
    ) -> TradeCostBreakdown:
        """
        Calculates full statutory fee breakdown for a single leg order.
        """
        if price <= 0 or quantity <= 0:
            raise ValueError(f"Price ({price}) and Quantity ({quantity}) must be strictly positive.")

        turnover = price * quantity
        if slippage_bps is None:
            slippage_bps = self.default_slippage_bps

        slippage = turnover * (slippage_bps / 10_000.0)

        # 1. Brokerage
        if instrument == InstrumentType.EQUITY_DELIVERY:
            brokerage = 0.0 if self.zero_brokerage_delivery else min(turnover * self.intraday_brokerage_pct, self.intraday_brokerage_cap)
        elif instrument in (InstrumentType.EQUITY_INTRADAY, InstrumentType.FUTURES):
            brokerage = min(turnover * self.intraday_brokerage_pct, self.intraday_brokerage_cap)
        elif instrument == InstrumentType.OPTIONS:
            brokerage = self.flat_options_brokerage
        else:
            brokerage = 0.0

        # 2. STT / CTT (Securities Transaction Tax)
        stt = 0.0
        if instrument == InstrumentType.EQUITY_DELIVERY:
            # 0.1% on both Buy and Sell
            stt = round(turnover * 0.001)
        elif instrument == InstrumentType.EQUITY_INTRADAY:
            # 0.025% on Sell side only
            if side == OrderSide.SELL:
                stt = round(turnover * 0.00025)
        elif instrument == InstrumentType.FUTURES:
            # 0.02% on Sell side only (post 2024 budget revision: 0.02%)
            if side == OrderSide.SELL:
                stt = round(turnover * 0.0002)
        elif instrument == InstrumentType.OPTIONS:
            # 0.0625% on Sell side premium (post 2024 revision: 0.1% on options premium)
            if side == OrderSide.SELL:
                stt = round(turnover * 0.001)

        # 3. Exchange Turnover Charges (NSE)
        if instrument in (InstrumentType.EQUITY_DELIVERY, InstrumentType.EQUITY_INTRADAY):
            exchange_charges = turnover * 0.0000325
        elif instrument == InstrumentType.FUTURES:
            exchange_charges = turnover * 0.000019
        elif instrument == InstrumentType.OPTIONS:
            exchange_charges = turnover * 0.0005  # on premium turnover
        else:
            exchange_charges = turnover * 0.0000325

        # 4. SEBI Turnover Charges (₹10 / Crore)
        sebi_charges = turnover * self.SEBI_RATE

        # 5. Stamp Duty (Applies only on BUY orders since July 1, 2020)
        stamp_duty = 0.0
        if side == OrderSide.BUY:
            if instrument == InstrumentType.EQUITY_DELIVERY:
                stamp_duty = turnover * 0.00015  # 0.015%
            elif instrument == InstrumentType.EQUITY_INTRADAY:
                stamp_duty = turnover * 0.00003  # 0.003%
            elif instrument == InstrumentType.FUTURES:
                stamp_duty = turnover * 0.00002  # 0.002%
            elif instrument == InstrumentType.OPTIONS:
                stamp_duty = turnover * 0.00003  # 0.003% on premium

        # 6. GST (18% on Brokerage + Exchange charges + SEBI charges)
        gst = (brokerage + exchange_charges + sebi_charges) * self.GST_RATE

        total_statutory = stt + exchange_charges + sebi_charges + stamp_duty + gst
        total_friction = brokerage + total_statutory + slippage
        effective_bps = (total_friction / turnover) * 10_000.0 if turnover > 0 else 0.0

        return TradeCostBreakdown(
            turnover=round(turnover, 2),
            brokerage=round(brokerage, 2),
            stt=round(stt, 2),
            exchange_charges=round(exchange_charges, 2),
            sebi_charges=round(sebi_charges, 4),
            stamp_duty=round(stamp_duty, 2),
            gst=round(gst, 2),
            slippage=round(slippage, 2),
            total_statutory_charges=round(total_statutory, 2),
            total_friction=round(total_friction, 2),
            effective_bps=round(effective_bps, 2),
        )

    def calculate_round_trip_cost(
        self,
        instrument: InstrumentType,
        buy_price: float,
        sell_price: float,
        quantity: int,
        slippage_bps: Optional[float] = None,
    ) -> TradeCostBreakdown:
        """
        Calculates cumulative round-trip costs (Buy leg + Sell leg).
        """
        buy_cost = self.calculate_cost(instrument, OrderSide.BUY, buy_price, quantity, slippage_bps)
        sell_cost = self.calculate_cost(instrument, OrderSide.SELL, sell_price, quantity, slippage_bps)

        total_turnover = buy_cost.turnover + sell_cost.turnover
        total_friction = buy_cost.total_friction + sell_cost.total_friction
        effective_bps = (total_friction / total_turnover) * 10_000.0 if total_turnover > 0 else 0.0

        return TradeCostBreakdown(
            turnover=round(total_turnover, 2),
            brokerage=round(buy_cost.brokerage + sell_cost.brokerage, 2),
            stt=round(buy_cost.stt + sell_cost.stt, 2),
            exchange_charges=round(buy_cost.exchange_charges + sell_cost.exchange_charges, 2),
            sebi_charges=round(buy_cost.sebi_charges + sell_cost.sebi_charges, 4),
            stamp_duty=round(buy_cost.stamp_duty + sell_cost.stamp_duty, 2),
            gst=round(buy_cost.gst + sell_cost.gst, 2),
            slippage=round(buy_cost.slippage + sell_cost.slippage, 2),
            total_statutory_charges=round(buy_cost.total_statutory_charges + sell_cost.total_statutory_charges, 2),
            total_friction=round(total_friction, 2),
            effective_bps=round(effective_bps, 2),
        )
