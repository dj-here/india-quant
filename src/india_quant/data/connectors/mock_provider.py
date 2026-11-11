"""
High-Fidelity Mock Market Provider for Indian Equities and Indices.
Generates realistic geometric brownian motion with GARCH-like volatility clustering,
realistic intraday spreads, open interest, and options chain PCR for testing.
"""

from datetime import date, datetime, timedelta
from typing import Dict, List, Optional
import numpy as np
import pandas as pd
import pytz
from india_quant.common.calendar import NSECalendar
from india_quant.data.connectors.base import BaseMarketConnector

IST = pytz.timezone("Asia/Kolkata")


class MockMarketConnector(BaseMarketConnector):
    """
    Mock data provider that produces realistic, statistically consistent price action
    for offline development, CI/CD, and backtesting validation.
    """

    DEFAULT_BASE_PRICES = {
        "NIFTY 50": 24200.0,
        "NIFTY BANK": 51500.0,
        "FINNIFTY": 23400.0,
        "NIFTY IT": 41800.0,
        "NIFTY MIDCAP 100": 58200.0,
        "SENSEX": 79500.0,
        "INDIA VIX": 14.5,
        "RELIANCE": 2980.0,
        "HDFCBANK": 1720.0,
        "TCS": 4150.0,
        "INFY": 1840.0,
        "ICICIBANK": 1260.0,
    }

    def __init__(self, seed: int = 42):
        self.calendar = NSECalendar()
        self.seed = seed
        self.rng = np.random.default_rng(seed)

    def get_supported_symbols(self) -> List[str]:
        return list(self.DEFAULT_BASE_PRICES.keys())

    def fetch_historical_ohlcv(
        self,
        symbol: str,
        start_date: date,
        end_date: date,
        interval: str = "day",
    ) -> pd.DataFrame:
        """
        Generates simulated daily or intraday OHLCV bars strictly aligned to NSE trading sessions.
        """
        trading_days = self.calendar.get_trading_days(start_date, end_date)
        if not trading_days:
            return pd.DataFrame(columns=["open", "high", "low", "close", "volume", "oi"])

        base_price = self.DEFAULT_BASE_PRICES.get(symbol.upper(), 1000.0)
        n_days = len(trading_days)

        # Volatility regime modeling (GARCH-like clustering)
        daily_vol = 0.012  # ~19% annualized vol
        vols = np.zeros(n_days)
        vols[0] = daily_vol
        for i in range(1, n_days):
            shock = self.rng.standard_normal()
            vols[i] = np.sqrt(0.00002 + 0.10 * (vols[i - 1] * shock) ** 2 + 0.85 * (vols[i - 1] ** 2))

        # Generate daily close path
        log_returns = vols * self.rng.standard_normal(n_days) + 0.0004  # Slight upward equity drift
        price_series = base_price * np.exp(np.cumsum(log_returns))

        records = []
        for i, t_day in enumerate(trading_days):
            close = price_series[i]
            # Open is close of yesterday + gap
            gap = self.rng.normal(0, vols[i] * 0.4)
            prev_close = price_series[i - 1] if i > 0 else base_price
            open_p = prev_close * np.exp(gap)

            # High and low bounds
            intraday_rng = np.abs(self.rng.normal(vols[i] * 1.2, vols[i] * 0.3))
            high_p = max(open_p, close) * (1.0 + intraday_rng * 0.6)
            low_p = min(open_p, close) * (1.0 - intraday_rng * 0.6)

            # Ensure strict OHLC invariants
            high_p = max(high_p, open_p, close)
            low_p = min(low_p, open_p, close)

            volume = int(self.rng.lognormal(mean=14.5, sigma=0.4))
            oi = int(self.rng.lognormal(mean=16.0, sigma=0.2))

            ts = IST.localize(datetime.combine(t_day, datetime.min.time()) + timedelta(hours=15, minutes=30))
            records.append({
                "timestamp": ts,
                "open": round(open_p, 2),
                "high": round(high_p, 2),
                "low": round(low_p, 2),
                "close": round(close, 2),
                "volume": volume,
                "oi": oi,
            })

        df = pd.DataFrame(records).set_index("timestamp")
        return df

    def fetch_quote(self, symbol: str) -> Dict[str, float]:
        base = self.DEFAULT_BASE_PRICES.get(symbol.upper(), 1000.0)
        curr = base * (1.0 + self.rng.normal(0, 0.005))
        return {
            "last_price": round(curr, 2),
            "open": round(base * 0.998, 2),
            "high": round(curr * 1.008, 2),
            "low": round(curr * 0.992, 2),
            "close": round(base, 2),
            "volume": int(self.rng.lognormal(14.0, 0.3)),
            "oi": int(self.rng.lognormal(16.0, 0.2)),
        }

    def fetch_option_chain(self, symbol: str, expiry_date: Optional[date] = None) -> pd.DataFrame:
        spot = self.DEFAULT_BASE_PRICES.get(symbol.upper(), 24000.0)
        atm_strike = round(spot / 50.0) * 50
        strikes = [atm_strike + i * 50 for i in range(-10, 11)]

        rows = []
        for strike in strikes:
            moneyness = np.log(spot / strike)
            # Simulated Black-Scholes approx IV smile
            iv = 0.13 + 0.15 * (moneyness ** 2)
            ce_oi = int(self.rng.uniform(50000, 3000000))
            pe_oi = int(self.rng.uniform(50000, 3000000))
            rows.append({
                "strike": strike,
                "call_oi": ce_oi,
                "put_oi": pe_oi,
                "call_iv": round(iv + self.rng.normal(0, 0.005), 4),
                "put_iv": round(iv + self.rng.normal(0, 0.005), 4),
                "pcr_oi": round(pe_oi / ce_oi, 2) if ce_oi > 0 else 1.0,
            })

        return pd.DataFrame(rows)
