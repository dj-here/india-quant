"""
Yahoo Finance Connector for Indian Markets & Macro Feeds.
Serves as an institutional fallback data provider with automatic ticker mapping,
Asia/Kolkata timezone alignment, and schema standardization.
"""

from datetime import date, datetime, timedelta
from typing import Dict, List, Optional
import numpy as np
import pandas as pd
import pytz
import yfinance as yf
from india_quant.common.logging import get_logger
from india_quant.data.connectors.base import BaseMarketConnector

IST = pytz.timezone("Asia/Kolkata")
logger = get_logger("YFinanceConnector")


class YFinanceConnector(BaseMarketConnector):
    """
    Connects to Yahoo Finance for backfilling historical market data.
    """

    # Symbol mapping between IndiaQuant standard symbols and Yahoo Finance tickers
    TICKER_MAP = {
        "NIFTY 50": "^NSEI",
        "NIFTY BANK": "^NSEBANK",
        "BANK NIFTY": "^NSEBANK",
        "FINNIFTY": "NIFTY_FIN_SERVICE.NS",
        "NIFTY IT": "^CNXIT",
        "NIFTY MIDCAP 100": "NIFTY_MIDCAP_100.NS",
        "SENSEX": "^BSESN",
        "INDIA VIX": "^INDIAVIX",
        "USDINR": "USDINR=X",
        "BRENT_CRUDE": "BZ=F",
        "US_10Y": "^TNX",
        "DXY": "DX-Y.NYB",
        "SP500_FUT": "ES=F",
        "GOLD": "GC=F",
    }

    def __init__(self):
        pass

    def _resolve_ticker(self, symbol: str) -> str:
        upper_sym = symbol.upper().strip()
        if upper_sym in self.TICKER_MAP:
            return self.TICKER_MAP[upper_sym]
        # For individual Indian equities, append .NS if not already present
        if not upper_sym.endswith(".NS") and not upper_sym.endswith(".BO") and not upper_sym.startswith("^"):
            return f"{upper_sym}.NS"
        return upper_sym

    def get_supported_symbols(self) -> List[str]:
        return list(self.TICKER_MAP.keys())

    def fetch_historical_ohlcv(
        self,
        symbol: str,
        start_date: date,
        end_date: date,
        interval: str = "1d",
    ) -> pd.DataFrame:
        """
        Fetches historical OHLCV data from Yahoo Finance and normalizes to IndiaQuant standard schema:
        ['open', 'high', 'low', 'close', 'volume', 'oi'] indexed by Asia/Kolkata timestamp.
        """
        ticker_str = self._resolve_ticker(symbol)
        logger.info(f"Fetching historical OHLCV for {symbol} (Ticker: {ticker_str}) from {start_date} to {end_date}...")

        # Yahoo Finance end date is exclusive, so add 1 day
        query_end = end_date + timedelta(days=1)

        ticker = yf.Ticker(ticker_str)
        raw_df = ticker.history(
            start=start_date.isoformat(),
            end=query_end.isoformat(),
            interval=interval,
            auto_adjust=False,  # Keep explicit unadjusted + adjusted data
        )

        if raw_df.empty:
            logger.warning(f"No data returned from yfinance for {symbol} ({ticker_str})")
            return pd.DataFrame(columns=["open", "high", "low", "close", "volume", "oi"])

        # Rename columns to lowercase
        df = raw_df.copy()
        df.columns = [c.lower() for c in df.columns]

        # Ensure required columns
        for col in ["open", "high", "low", "close", "volume"]:
            if col not in df.columns:
                raise ValueError(f"Expected column '{col}' missing from downloaded data for {symbol}")

        # Ensure numeric float64 / int64
        for col in ["open", "high", "low", "close"]:
            df[col] = df[col].astype(float)
        df["volume"] = df["volume"].fillna(0).astype(int)

        # Handle Open Interest
        if "oi" not in df.columns:
            df["oi"] = 0

        # Standardize index to Asia/Kolkata
        if df.index.tz is None:
            df.index = df.index.tz_localize(IST)
        else:
            df.index = df.index.tz_convert(IST)

        # Set EOD time to 15:30:00 IST for daily bars
        if interval in ("1d", "day"):
            new_index = [
                IST.localize(datetime.combine(ts.date(), datetime.min.time()) + timedelta(hours=15, minutes=30))
                for ts in df.index
            ]
            df.index = pd.DatetimeIndex(new_index, name="timestamp")

        # Keep only standard columns
        standard_cols = ["open", "high", "low", "close", "volume", "oi"]
        df = df[standard_cols].sort_index()

        # Remove duplicate timestamps if any
        df = df[~df.index.duplicated(keep="last")]

        logger.info(f"Successfully retrieved {len(df)} bars for {symbol} ({df.index[0].date()} to {df.index[-1].date()})")
        return df

    def fetch_quote(self, symbol: str) -> Dict[str, float]:
        ticker_str = self._resolve_ticker(symbol)
        ticker = yf.Ticker(ticker_str)
        info = ticker.fast_info
        last_price = float(info.last_price or 0.0)
        prev_close = float(info.previous_close or last_price)
        return {
            "last_price": round(last_price, 2),
            "open": round(float(info.open or last_price), 2),
            "high": round(float(info.day_high or last_price), 2),
            "low": round(float(info.day_low or last_price), 2),
            "close": round(prev_close, 2),
            "volume": int(info.last_volume or 0),
            "oi": 0,
        }

    def fetch_option_chain(self, symbol: str, expiry_date: Optional[date] = None) -> pd.DataFrame:
        """
        Yahoo Finance options support for Indian tickers is limited; returns placeholder schema.
        Production options chain uses Zerodha Kite Connect or NSE Bhavcopy.
        """
        return pd.DataFrame(columns=["strike", "call_oi", "put_oi", "call_iv", "put_iv", "pcr_oi"])
