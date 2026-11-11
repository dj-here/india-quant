"""
NSE (National Stock Exchange of India) Trading Calendar & Market Session Manager.
Enforces Asia/Kolkata (IST) market timings and official exchange holidays.
"""

from datetime import date, datetime, time, timedelta
from typing import List, Optional, Set
import pytz

IST = pytz.timezone("Asia/Kolkata")


class NSECalendar:
    """
    NSE Market Hours & Holiday Calendar.
    Normal Market Session: 09:15:00 to 15:30:00 IST, Monday through Friday.
    Pre-Open Session: 09:00:00 to 09:08:00 IST.
    """

    PRE_OPEN_START = time(9, 0, 0)
    PRE_OPEN_END = time(9, 8, 0)
    MARKET_OPEN = time(9, 15, 0)
    MARKET_CLOSE = time(15, 30, 0)
    POST_CLOSE = time(16, 0, 0)

    # Standard / Recognized NSE Holidays for 2023, 2024, 2025, 2026 (Extensible)
    OFFICIAL_HOLIDAYS: Set[date] = {
        # 2023
        date(2023, 1, 26),  # Republic Day
        date(2023, 3, 7),   # Holi
        date(2023, 3, 30),  # Ram Navami
        date(2023, 4, 4),   # Mahavir Jayanti
        date(2023, 4, 7),   # Good Friday
        date(2023, 4, 14),  # Dr. Baba Saheb Ambedkar Jayanti
        date(2023, 4, 21),  # Id-Ul-Fitr
        date(2023, 5, 1),   # Maharashtra Day
        date(2023, 6, 29),  # Bakri Id
        date(2023, 8, 15),  # Independence Day
        date(2023, 9, 19),  # Ganesh Chaturthi
        date(2023, 10, 2),  # Mahatma Gandhi Jayanti
        date(2023, 10, 24), # Dussehra
        date(2023, 11, 14), # Diwali Balipratipada
        date(2023, 11, 27), # Gurunanak Jayanti
        date(2023, 12, 25), # Christmas
        # 2024
        date(2024, 1, 22),  # Special Holiday
        date(2024, 1, 26),  # Republic Day
        date(2024, 3, 8),   # Maha Shivratri
        date(2024, 3, 25),  # Holi
        date(2024, 3, 29),  # Good Friday
        date(2024, 4, 11),  # Id-Ul-Fitr
        date(2024, 4, 17),  # Shri Ram Navami
        date(2024, 5, 1),   # Maharashtra Day
        date(2024, 5, 20),  # Parliamentary Elections Mumbai
        date(2024, 6, 17),  # Bakri Id
        date(2024, 7, 17),  # Moharram
        date(2024, 8, 15),  # Independence Day
        date(2024, 10, 2),  # Mahatma Gandhi Jayanti
        date(2024, 11, 1),  # Diwali Laxmi Pujan (Muhurat session only)
        date(2024, 11, 15), # Gurunanak Jayanti
        date(2024, 12, 25), # Christmas
        # 2025
        date(2025, 1, 26),  # Republic Day
        date(2025, 2, 26),  # Maha Shivratri
        date(2025, 3, 14),  # Holi
        date(2025, 3, 31),  # Id-Ul-Fitr
        date(2025, 4, 10),  # Mahavir Jayanti
        date(2025, 4, 14),  # Ambedkar Jayanti
        date(2025, 4, 18),  # Good Friday
        date(2025, 5, 1),   # Maharashtra Day
        date(2025, 8, 15),  # Independence Day
        date(2025, 8, 27),  # Ganesh Chaturthi
        date(2025, 10, 2),  # Gandhi Jayanti
        date(2025, 10, 21), # Diwali
        date(2025, 10, 22), # Diwali Balipratipada
        date(2025, 11, 5),  # Prakash Gurpurb
        date(2025, 12, 25), # Christmas
        # 2026
        date(2026, 1, 26),  # Republic Day
        date(2026, 3, 3),   # Holi
        date(2026, 3, 20),  # Id-Ul-Fitr
        date(2026, 4, 3),   # Good Friday
        date(2026, 4, 14),  # Ambedkar Jayanti
        date(2026, 5, 1),   # Maharashtra Day
        date(2026, 8, 15),  # Independence Day
        date(2026, 10, 2),  # Gandhi Jayanti
        date(2026, 11, 8),  # Diwali
        date(2026, 12, 25), # Christmas
    }

    def __init__(self, additional_holidays: Optional[Set[date]] = None):
        self.holidays = set(self.OFFICIAL_HOLIDAYS)
        if additional_holidays:
            self.holidays.update(additional_holidays)

    def is_trading_day(self, target_date: date) -> bool:
        """Checks if a given calendar date is an active NSE trading day (Monday-Friday and not a holiday)."""
        if target_date.weekday() >= 5:  # 5 = Saturday, 6 = Sunday
            return False
        return target_date not in self.holidays

    def is_market_open(self, dt: Optional[datetime] = None) -> bool:
        """
        Checks if the continuous trading market is currently open at datetime `dt`.
        Assumes `dt` is in or converted to Asia/Kolkata timezone.
        """
        if dt is None:
            dt = datetime.now(tz=IST)
        elif dt.tzinfo is None:
            dt = IST.localize(dt)
        else:
            dt = dt.astimezone(IST)

        current_date = dt.date()
        if not self.is_trading_day(current_date):
            return False

        current_time = dt.time()
        return self.MARKET_OPEN <= current_time <= self.MARKET_CLOSE

    def next_trading_day(self, current: date) -> date:
        """Returns the next valid NSE trading day strictly after `current`."""
        nxt = current + timedelta(days=1)
        while not self.is_trading_day(nxt):
            nxt += timedelta(days=1)
        return nxt

    def previous_trading_day(self, current: date) -> date:
        """Returns the most recent valid NSE trading day strictly prior to `current`."""
        prev = current - timedelta(days=1)
        while not self.is_trading_day(prev):
            prev -= timedelta(days=1)
        return prev

    def get_trading_days(self, start_date: date, end_date: date) -> List[date]:
        """Returns an ordered list of all trading days between start_date and end_date inclusive."""
        days = []
        curr = start_date
        while curr <= end_date:
            if self.is_trading_day(curr):
                days.append(curr)
            curr += timedelta(days=1)
        return days

    def get_monthly_expiry_date(self, year: int, month: int) -> date:
        """
        Calculates the monthly F&O expiry date (traditionally last Thursday of the month).
        If the last Thursday is an exchange holiday, moves to the preceding trading day.
        """
        # Start at last day of the month
        if month == 12:
            next_month = date(year + 1, 1, 1)
        else:
            next_month = date(year, month + 1, 1)
        last_day = next_month - timedelta(days=1)

        # Walk backwards to find last Thursday (weekday 3)
        offset = (last_day.weekday() - 3) % 7
        last_thursday = last_day - timedelta(days=offset)

        # If that Thursday is a holiday, step backwards to previous trading day
        expiry = last_thursday
        while not self.is_trading_day(expiry):
            expiry -= timedelta(days=1)

        return expiry
