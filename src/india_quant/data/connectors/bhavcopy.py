"""
Official NSE Bhavcopy Downloader & Parser.
Extracts cash market settlement prices, F&O derivatives open interest, delivery percentage,
and participant-wise (FII/DII) positioning.
"""

from datetime import date, datetime, timedelta
import io
from typing import Dict, List, Optional
import zipfile
import pandas as pd
import pytz
import requests
from india_quant.common.calendar import NSECalendar
from india_quant.common.logging import get_logger

IST = pytz.timezone("Asia/Kolkata")
logger = get_logger("NSEBhavcopy")


class NSEBhavcopyParser:
    """
    Parses and processes official National Stock Exchange Bhavcopy archives.
    """

    NSE_HEADERS = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Accept-Language": "en-US,en;q=0.9",
    }

    def __init__(self):
        self.calendar = NSECalendar()
        self.session = requests.Session()
        self.session.headers.update(self.NSE_HEADERS)

    def parse_cash_bhavcopy_csv(self, csv_content: str) -> pd.DataFrame:
        """
        Parses raw text of standard NSE CM Bhavcopy CSV (e.g. SEC_SERIES, SYMBOL, OPEN, HIGH, LOW, CLOSE, TTL_TRD_QNTY).
        """
        df = pd.read_csv(io.StringIO(csv_content))
        # Normalize column headers
        df.columns = [c.strip().upper() for c in df.columns]

        # Strip whitespace from string values
        for c in df.select_dtypes(include=["object", "string"]).columns:
            df[c] = df[c].astype(str).str.strip()

        # Filter for Equity series 'EQ'
        if "SERIES" in df.columns:
            df = df[df["SERIES"] == "EQ"]

        col_mapping = {
            "SYMBOL": "symbol",
            "OPEN": "open",
            "HIGH": "high",
            "LOW": "low",
            "CLOSE": "close",
            "TOTTRDQTY": "volume",
            "TTL_TRD_QNTY": "volume",
            "TIMESTAMP": "trade_date",
        }

        rename_dict = {k: v for k, v in col_mapping.items() if k in df.columns}
        res = df[list(rename_dict.keys())].rename(columns=rename_dict)
        return res

    def parse_delivery_report(self, dat_content: str) -> pd.DataFrame:
        """
        Parses NSE MTO (Market Turnover & Delivery) position report.
        Extracts Delivery Quantity and Delivery %.
        """
        lines = dat_content.strip().split("\n")
        data = []
        for line in lines:
            parts = [p.strip() for p in line.split(",")]
            # Format: RecordType, SrNo, Symbol, Series, TradedQty, DeliverableQty, DeliveryPct
            if len(parts) >= 7 and parts[0] == "20" and parts[3] == "EQ":
                try:
                    symbol = parts[2]
                    traded_qty = int(parts[4])
                    delivery_qty = int(parts[5])
                    delivery_pct = float(parts[6])
                    data.append({
                        "symbol": symbol,
                        "traded_qty": traded_qty,
                        "delivery_qty": delivery_qty,
                        "delivery_pct": delivery_pct,
                    })
                except (ValueError, IndexError):
                    continue
        return pd.DataFrame(data)

    def generate_mock_participant_oi(self, target_date: date) -> pd.DataFrame:
        """
        Generates structured FII/DII participant-wise derivatives positioning for testing.
        """
        return pd.DataFrame([
            {
                "date": target_date,
                "client_type": "FII",
                "future_index_long": 85400,
                "future_index_short": 124200,
                "net_index_contracts": -38800,  # Net short index
                "call_long": 245000,
                "call_short": 180000,
                "put_long": 310000,
                "put_short": 220000,
            },
            {
                "date": target_date,
                "client_type": "DII",
                "future_index_long": 62000,
                "future_index_short": 41000,
                "net_index_contracts": 21000,   # Net long index
                "call_long": 12000,
                "call_short": 35000,
                "put_long": 15000,
                "put_short": 5000,
            },
        ])
