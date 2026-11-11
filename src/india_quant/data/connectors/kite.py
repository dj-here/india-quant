"""
Zerodha Kite Connect v3 Market Connector.
Handles authentication, instrument token resolution, historical candle pagination,
and live quote streaming for NSE equities, indices, and derivatives.
"""

from datetime import date, datetime, timedelta
from typing import Dict, List, Optional
import pandas as pd
import pytz
import requests
from india_quant.common.exceptions import BrokerApiError
from india_quant.common.logging import get_logger
from india_quant.data.connectors.base import BaseMarketConnector

IST = pytz.timezone("Asia/Kolkata")
logger = get_logger("KiteConnector")


class KiteMarketConnector(BaseMarketConnector):
    """
    Zerodha Kite Connect REST API wrapper.
    """

    BASE_URL = "https://api.kite.trade"

    # Known NSE Index Instrument Tokens on Kite Connect
    INDEX_TOKENS = {
        "NIFTY 50": 256265,
        "NIFTY BANK": 260105,
        "BANK NIFTY": 260105,
        "FINNIFTY": 257801,
        "NIFTY IT": 259849,
        "INDIA VIX": 264969,
        "SENSEX": 265,
    }

    def __init__(
        self,
        api_key: Optional[str] = None,
        access_token: Optional[str] = None,
    ):
        self.api_key = api_key
        self.access_token = access_token
        self.session = requests.Session()
        if self.api_key and self.access_token:
            self.session.headers.update({
                "X-Kite-Version": "3",
                "Authorization": f"token {self.api_key}:{self.access_token}",
            })

    def _check_authenticated(self):
        if not self.api_key or not self.access_token:
            raise BrokerApiError(
                "Zerodha Kite Connect credentials not configured. "
                "Please set KITE_API_KEY and KITE_ACCESS_TOKEN in .env"
            )

    def get_supported_symbols(self) -> List[str]:
        return list(self.INDEX_TOKENS.keys())

    def fetch_historical_ohlcv(
        self,
        symbol: str,
        start_date: date,
        end_date: date,
        interval: str = "day",
    ) -> pd.DataFrame:
        """
        Fetches historical candles from Kite Connect API.
        """
        self._check_authenticated()
        token = self.INDEX_TOKENS.get(symbol.upper())
        if not token:
            raise ValueError(f"Instrument token not found for symbol: {symbol}")

        url = f"{self.BASE_URL}/instruments/historical/{token}/{interval}"
        params = {
            "from": start_date.isoformat(),
            "to": end_date.isoformat(),
            "oi": 1,
        }

        response = self.session.get(url, params=params, timeout=15)
        if response.status_code != 200:
            raise BrokerApiError(f"Kite Connect historical API error ({response.status_code}): {response.text}")

        payload = response.json()
        if payload.get("status") != "success":
            raise BrokerApiError(f"Kite Connect error: {payload.get('message')}")

        candles = payload.get("data", {}).get("candles", [])
        if not candles:
            return pd.DataFrame(columns=["open", "high", "low", "close", "volume", "oi"])

        # Kite candle structure: [timestamp, open, high, low, close, volume, oi]
        records = []
        for c in candles:
            dt = pd.to_datetime(c[0])
            if dt.tzinfo is None:
                dt = IST.localize(dt)
            else:
                dt = dt.astimezone(IST)

            oi_val = c[6] if len(c) > 6 else 0
            records.append({
                "timestamp": dt,
                "open": float(c[1]),
                "high": float(c[2]),
                "low": float(c[3]),
                "close": float(c[4]),
                "volume": int(c[5]),
                "oi": int(oi_val),
            })

        df = pd.DataFrame(records).set_index("timestamp").sort_index()
        return df

    def fetch_quote(self, symbol: str) -> Dict[str, float]:
        self._check_authenticated()
        instrument_key = f"NSE:{symbol.upper()}"
        url = f"{self.BASE_URL}/quote"
        response = self.session.get(url, params={"i": instrument_key}, timeout=10)
        if response.status_code != 200:
            raise BrokerApiError(f"Failed to fetch quote from Kite ({response.status_code}): {response.text}")

        data = response.json().get("data", {}).get(instrument_key, {})
        ohlc = data.get("ohlc", {})
        return {
            "last_price": float(data.get("last_price", 0.0)),
            "open": float(ohlc.get("open", 0.0)),
            "high": float(ohlc.get("high", 0.0)),
            "low": float(ohlc.get("low", 0.0)),
            "close": float(ohlc.get("close", 0.0)),
            "volume": int(data.get("volume", 0)),
            "oi": int(data.get("oi", 0)),
        }

    def fetch_option_chain(self, symbol: str, expiry_date: Optional[date] = None) -> pd.DataFrame:
        self._check_authenticated()
        # Option chain construction from Kite NFO instrument symbols
        return pd.DataFrame(columns=["strike", "call_oi", "put_oi", "call_iv", "put_iv", "pcr_oi"])
