"""
Tests for NSE trading calendar and market session logic.
"""

from datetime import date, datetime
import pytz
from india_quant.common.calendar import NSECalendar

IST = pytz.timezone("Asia/Kolkata")


def test_weekends_not_trading_days(nse_calendar):
    # 2024-01-06 was Saturday, 2024-01-07 was Sunday
    sat = date(2024, 1, 6)
    sun = date(2024, 1, 7)
    assert not nse_calendar.is_trading_day(sat)
    assert not nse_calendar.is_trading_day(sun)


def test_official_nse_holidays(nse_calendar):
    # Republic day 2024-01-26
    assert not nse_calendar.is_trading_day(date(2024, 1, 26))
    # Independence Day 2024-08-15
    assert not nse_calendar.is_trading_day(date(2024, 8, 15))
    # Gandhi Jayanti 2024-10-02
    assert not nse_calendar.is_trading_day(date(2024, 10, 2))
    # Christmas 2024-12-25
    assert not nse_calendar.is_trading_day(date(2024, 12, 25))


def test_normal_trading_day(nse_calendar):
    # 2024-01-15 was a Monday, active trading day
    assert nse_calendar.is_trading_day(date(2024, 1, 15))


def test_market_open_timing(nse_calendar):
    # Active trading day at 10:30 AM IST -> Open
    open_dt = IST.localize(datetime(2024, 1, 15, 10, 30, 0))
    assert nse_calendar.is_market_open(open_dt)

    # Pre-open at 09:05 AM IST -> Not open for continuous market
    pre_dt = IST.localize(datetime(2024, 1, 15, 9, 5, 0))
    assert not nse_calendar.is_market_open(pre_dt)

    # Post-close at 15:45 PM IST -> Closed
    post_dt = IST.localize(datetime(2024, 1, 15, 15, 45, 0))
    assert not nse_calendar.is_market_open(post_dt)


def test_monthly_expiry_calculation(nse_calendar):
    # January 2024: Last Thursday was Jan 25, 2024 (Jan 26 was holiday)
    jan_expiry = nse_calendar.get_monthly_expiry_date(2024, 1)
    assert jan_expiry == date(2024, 1, 25)
    assert jan_expiry.weekday() == 3  # Thursday
