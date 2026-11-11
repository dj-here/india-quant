"""
Pytest fixtures for IndiaQuant test suite.
"""

from datetime import date
import pytest
from india_quant.common.calendar import NSECalendar
from india_quant.backtest.costs_india import IndianFrictionEngine
from india_quant.data.connectors.mock_provider import MockMarketConnector
from india_quant.features.targets import TargetConfig, TargetEngine


@pytest.fixture
def nse_calendar():
    return NSECalendar()


@pytest.fixture
def friction_engine():
    return IndianFrictionEngine(default_slippage_bps=5.0)


@pytest.fixture
def mock_connector():
    return MockMarketConnector(seed=123)


@pytest.fixture
def target_engine():
    return TargetEngine(TargetConfig(forward_horizons_days=[1, 5, 20]))


@pytest.fixture
def sample_ohlcv_df(mock_connector):
    return mock_connector.fetch_historical_ohlcv(
        symbol="NIFTY 50",
        start_date=date(2024, 1, 1),
        end_date=date(2024, 3, 31),
    )
