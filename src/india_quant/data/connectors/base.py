"""
Abstract Base Market Connector interface for IndiaQuant data layer.
Enforces standard schema, timezone localization (Asia/Kolkata), and point-in-time boundaries.
"""

from abc import ABC, abstractmethod
from datetime import date, datetime
from typing import Dict, List, Optional
import pandas as pd
import pytz

IST = pytz.timezone("Asia/Kolkata")


class BaseMarketConnector(ABC):
    """
    Standard interface for all data providers (Zerodha Kite, Dhan, NSE Bhavcopy, Yahoo fallback, Mock).
    """

    @abstractmethod
    def fetch_historical_ohlcv(
        self,
        symbol: str,
        start_date: date,
        end_date: date,
        interval: str = "day",  # "day", "60minute", "15minute"
    ) -> pd.DataFrame:
        """
        Returns a DataFrame indexed by timezone-aware datetime (Asia/Kolkata) with standard columns:
        ['open', 'high', 'low', 'close', 'volume', 'oi']
        """
        pass

    @abstractmethod
    def fetch_quote(self, symbol: str) -> Dict[str, float]:
        """
        Returns latest market quote: {'last_price', 'ohlc', 'change', 'volume', 'oi'}
        """
        pass

    @abstractmethod
    def fetch_option_chain(self, symbol: str, expiry_date: Optional[date] = None) -> pd.DataFrame:
        """
        Returns option chain snapshot with strikes, call/put OI, IV, LTP, and volume.
        """
        pass

    @abstractmethod
    def get_supported_symbols(self) -> List[str]:
        """Returns list of supported instruments and indices."""
        pass
