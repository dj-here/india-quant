"""
Pydantic v2 Request & Response Schemas for IndiaQuant Serving API.
"""

from typing import Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    symbol: str = Field(default="NIFTY 50", description="Target NSE symbol or index")
    horizon: str = Field(default="1d", description="Forecast horizon (1d, 5d, 20d, 15m, 1h)")
    confidence_level: float = Field(default=0.90, description="Nominal conformal confidence level (0.80 - 0.95)")
    custom_features: Optional[Dict[str, float]] = Field(default=None, description="Optional real-time feature overrides")


class PredictionResponse(BaseModel):
    symbol: str
    current_price: float
    prob_win: float = Field(description="Calibrated probability P(Close_{t+1} > Close_t)")
    direction: int = Field(description="1 for Bullish / Up, 0 for Bearish / Down")
    abstain: bool = Field(description="True if model confidence is low or uncertainty is elevated")
    abstain_reason: Optional[str] = None
    predicted_high: float = Field(description="Predicted Next-Day High price level")
    predicted_low: float = Field(description="Predicted Next-Day Low price level")
    predicted_close: float = Field(description="Expected Next-Day Close price level")
    conformal_high_bound: float = Field(description="Conformal 90% guaranteed upper bound")
    conformal_low_bound: float = Field(description="Conformal 90% guaranteed lower bound")
    conformal_return_interval: Tuple[float, float] = Field(description="[q_low, q_high] return interval")
    model_name: str
    model_version: str
    timestamp_ist: str


class PaperOrderRequest(BaseModel):
    symbol: str = Field(default="NIFTY 50")
    side: str = Field(default="BUY", description="BUY or SELL")
    quantity: int = Field(default=25, gt=0, description="Order quantity in units/shares")
    order_type: str = Field(default="MARKET", description="MARKET or LIMIT")
    price: Optional[float] = Field(default=None, description="Limit price if LIMIT order")


class StatutoryFrictionDetail(BaseModel):
    brokerage: float
    stt: float
    exchange_charges: float
    sebi_charges: float
    stamp_duty: float
    gst_18: float
    slippage: float
    total_friction: float


class PaperOrderResponse(BaseModel):
    order_id: str
    symbol: str
    side: str
    quantity: int
    executed_price: float
    turnover: float
    friction: StatutoryFrictionDetail
    net_cash_balance: float
    status: str
    timestamp_ist: str


class PortfolioPositionItem(BaseModel):
    symbol: str
    quantity: int
    entry_price: float
    current_price: float
    unrealized_pnl: float
    return_pct: float
    entry_date: str


class PortfolioStatusResponse(BaseModel):
    total_equity: float
    liquid_cash: float
    unsettled_cash_t1: float
    positions_value: float
    drawdown_pct: float
    high_water_mark: float
    is_halted: bool
    positions: List[PortfolioPositionItem]


class KillSwitchResponse(BaseModel):
    status: str
    is_halted: bool
    positions_closed: int
    freed_cash_inr: float
    timestamp_ist: str


class ScreenerItem(BaseModel):
    symbol: str
    current_price: float
    prob_win: float
    direction: int
    abstain: bool
    predicted_high: float
    predicted_low: float
    risk_reward_ratio: float


class ScreenerResponse(BaseModel):
    total_symbols: int
    ranked_signals: List[ScreenerItem]
    timestamp_ist: str
