"""
Custom exceptions for the IndiaQuant platform.
"""


class IndiaQuantException(Exception):
    """Base exception for all IndiaQuant domain errors."""

    pass


class DataQualityError(IndiaQuantException):
    """Raised when data quality assertions or Pandera schemas fail."""

    pass


class LookAheadBiasError(IndiaQuantException):
    """Raised when features access information from future timestamps."""

    pass


class MarketClosedError(IndiaQuantException):
    """Raised when an intraday execution is requested outside active market hours."""

    pass


class CircuitBreakerError(IndiaQuantException):
    """Raised when an instrument hits upper/lower circuit limits or portfolio drawdown triggers stop."""

    pass


class BrokerApiError(IndiaQuantException):
    """Raised when an upstream broker API fails, rate-limits, or drops authentication."""

    pass


class MarketDataError(IndiaQuantException):
    """Raised when market data ingestion, storage, or lookup fails."""

    pass

