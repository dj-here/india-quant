"""
Tests for market connectors, ticker resolution, and Bhavcopy parsing.
"""

from datetime import date
import pytest
from india_quant.common.exceptions import BrokerApiError
from india_quant.data.connectors.bhavcopy import NSEBhavcopyParser
from india_quant.data.connectors.kite import KiteMarketConnector
from india_quant.data.connectors.yfinance_provider import YFinanceConnector


def test_yfinance_ticker_mapping():
    connector = YFinanceConnector()
    assert connector._resolve_ticker("NIFTY 50") == "^NSEI"
    assert connector._resolve_ticker("BANK NIFTY") == "^NSEBANK"
    assert connector._resolve_ticker("RELIANCE") == "RELIANCE.NS"
    assert connector._resolve_ticker("HDFCBANK.NS") == "HDFCBANK.NS"


def test_kite_unauthenticated_raises_error():
    connector = KiteMarketConnector(api_key=None, access_token=None)
    with pytest.raises(BrokerApiError, match="not configured"):
        connector.fetch_historical_ohlcv("NIFTY 50", date(2024, 1, 1), date(2024, 1, 10))


def test_bhavcopy_parsing():
    parser = NSEBhavcopyParser()
    sample_csv = """SYMBOL, SERIES, OPEN, HIGH, LOW, CLOSE, LAST, PREVCLOSE, TOTTRDQTY, TOTTRDVAL, TIMESTAMP, TOTALTRADES, ISIN
RELIANCE, EQ, 2950.00, 2980.00, 2940.00, 2975.00, 2974.00, 2945.00, 4500000, 13387500000, 15-JAN-2024, 125000, INE002A01018
TCS, EQ, 3850.00, 3900.00, 3840.00, 3890.00, 3892.00, 3840.00, 1800000, 6984000000, 15-JAN-2024, 85000, INE467B01029
RELIANCE, N1, 105.00, 106.00, 104.00, 105.50, 105.50, 105.00, 500, 52750, 15-JAN-2024, 10, INE002A08013
"""
    df_cm = parser.parse_cash_bhavcopy_csv(sample_csv)
    assert len(df_cm) == 2  # Only EQ series
    assert "symbol" in df_cm.columns
    assert "close" in df_cm.columns
    assert df_cm.iloc[0]["symbol"] == "RELIANCE"
    assert df_cm.iloc[0]["close"] == 2975.00


def test_delivery_report_parsing():
    parser = NSEBhavcopyParser()
    sample_mto = """10,1,15012024,100000,100000
20,1,RELIANCE,EQ,4500000,2250000,50.00
20,2,TCS,EQ,1800000,1080000,60.00
"""
    df_mto = parser.parse_delivery_report(sample_mto)
    assert len(df_mto) == 2
    assert df_mto.iloc[0]["symbol"] == "RELIANCE"
    assert df_mto.iloc[0]["delivery_pct"] == 50.00
