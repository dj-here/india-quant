"""
Structured logging module for IndiaQuant with IST timestamp alignment and JSON formatting.
"""

import logging
import sys
from datetime import datetime
import pytz

IST = pytz.timezone("Asia/Kolkata")


class ISTFormatter(logging.Formatter):
    """Formats timestamps explicitly in Asia/Kolkata IST."""

    def formatTime(self, record, datefmt=None):
        dt = datetime.fromtimestamp(record.created, tz=IST)
        if datefmt:
            return dt.strftime(datefmt)
        return dt.isoformat()


def get_logger(name: str, level: str = "INFO") -> logging.Logger:
    """
    Returns a configured structured logger.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(getattr(logging, level.upper(), logging.INFO))
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(getattr(logging, level.upper(), logging.INFO))

        fmt = "%(asctime)s | %(levelname)-7s | [%(name)s] %(message)s"
        formatter = ISTFormatter(fmt, datefmt="%Y-%m-%d %H:%M:%S %Z")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.propagate = False

    return logger
