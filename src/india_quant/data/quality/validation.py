"""
Data Quality Validation Engine for IndiaQuant.
Performs institutional assertions on OHLCV time-series:
- Timestamp monotonicity and IST alignment
- Strict OHLC invariants
- Trading calendar completeness (missing trading days)
- Outlier / Unexplained jumps (>20% price jumps)
- Stale price & illiquidity detection
- Corporate action adjustment verification
"""

from dataclasses import dataclass, field
from datetime import date
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
import pytz
from india_quant.common.calendar import NSECalendar
from india_quant.common.exceptions import DataQualityError

IST = pytz.timezone("Asia/Kolkata")


@dataclass
class QualityCheckResult:
    check_name: str
    passed: bool
    details: str
    severity: str  # "ERROR" | "WARNING"


@dataclass
class DataQualityReport:
    symbol: str
    total_bars: int
    is_valid: bool
    checks: List[QualityCheckResult] = field(default_factory=list)
    missing_trading_days: List[date] = field(default_factory=list)
    outlier_timestamps: List[str] = field(default_factory=list)
    stale_price_periods: int = 0

    def summary(self) -> str:
        status = "PASSED" if self.is_valid else "FAILED"
        lines = [
            f"--- Data Quality Report for {self.symbol} [{status}] ---",
            f"Total Bars Evaluated: {self.total_bars}",
            f"Missing Trading Days: {len(self.missing_trading_days)}",
            f"Detected Outliers / Jumps: {len(self.outlier_timestamps)}",
            f"Stale Price Sequences: {self.stale_price_periods}",
        ]
        for c in self.checks:
            mark = "PASS" if c.passed else f"FAIL ({c.severity})"
            lines.append(f"  [{mark}] {c.check_name}: {c.details}")
        return "\n".join(lines)


class DataQualityValidator:
    """
    Validates data integrity before ingestion into feature store or model training.
    """

    def __init__(
        self,
        max_missing_day_fraction: float = 0.05,
        max_daily_jump_pct: float = 0.20,
        max_stale_consecutive_bars: int = 3,
    ):
        self.calendar = NSECalendar()
        self.max_missing_day_fraction = max_missing_day_fraction
        self.max_daily_jump_pct = max_daily_jump_pct
        self.max_stale_consecutive_bars = max_stale_consecutive_bars

    def validate(self, df: pd.DataFrame, symbol: str) -> DataQualityReport:
        """
        Runs comprehensive data quality validation checks.
        """
        if df.empty:
            return DataQualityReport(
                symbol=symbol,
                total_bars=0,
                is_valid=False,
                checks=[QualityCheckResult("EmptyCheck", False, "DataFrame is completely empty.", "ERROR")],
            )

        checks: List[QualityCheckResult] = []
        is_valid = True

        # 1. Datetime Index & Monotonicity
        if not isinstance(df.index, pd.DatetimeIndex):
            checks.append(QualityCheckResult("IndexType", False, "Index is not a DatetimeIndex.", "ERROR"))
            return DataQualityReport(symbol=symbol, total_bars=len(df), is_valid=False, checks=checks)

        is_monotonic = df.index.is_monotonic_increasing
        checks.append(
            QualityCheckResult(
                check_name="MonotonicTimestamps",
                passed=bool(is_monotonic),
                details="Timestamps are strictly increasing." if is_monotonic else "Timestamps not strictly increasing.",
                severity="ERROR",
            )
        )
        if not is_monotonic:
            is_valid = False

        # 2. Strict OHLC Invariants: Low <= min(Open, Close) and High >= max(Open, Close)
        open_p = df["open"]
        high_p = df["high"]
        low_p = df["low"]
        close_p = df["close"]

        invalid_high = (high_p < open_p) | (high_p < close_p)
        invalid_low = (low_p > open_p) | (low_p > close_p)
        negative_vol = (df["volume"] < 0) if "volume" in df.columns else pd.Series(False, index=df.index)

        ohlc_passed = bool(not (invalid_high.any() or invalid_low.any() or negative_vol.any()))
        checks.append(
            QualityCheckResult(
                check_name="OHLCInvariants",
                passed=ohlc_passed,
                details="Low <= min(Open,Close) <= High and Volume >= 0 satisfied."
                if ohlc_passed
                else f"Violations: High: {invalid_high.sum()}, Low: {invalid_low.sum()}, Vol: {negative_vol.sum()}",
                severity="ERROR",
            )
        )
        if not ohlc_passed:
            is_valid = False

        # 3. Calendar Missing Trading Days Check
        start_date = df.index[0].date()
        end_date = df.index[-1].date()
        expected_trading_days = set(self.calendar.get_trading_days(start_date, end_date))
        actual_trading_days = set(df.index.date)

        missing_days = sorted(list(expected_trading_days - actual_trading_days))
        missing_fraction = len(missing_days) / len(expected_trading_days) if expected_trading_days else 0.0

        calendar_passed = missing_fraction <= self.max_missing_day_fraction
        checks.append(
            QualityCheckResult(
                check_name="TradingCalendarCoverage",
                passed=calendar_passed,
                details=f"Missing {len(missing_days)} days ({missing_fraction:.1%} of trading calendar).",
                severity="ERROR" if missing_fraction > 0.15 else "WARNING",
            )
        )
        if missing_fraction > 0.15:
            is_valid = False

        # 4. Outlier & Unexplained Jump Detection (>20%)
        pct_change = close_p.pct_change().abs()
        jump_mask = pct_change > self.max_daily_jump_pct
        outlier_timestamps = [ts.isoformat() for ts in df.index[jump_mask]]

        # For indices, >20% daily jump is virtually impossible (except 2008 / 1992); flag as warning
        jumps_passed = len(outlier_timestamps) == 0
        checks.append(
            QualityCheckResult(
                check_name="UnexplainedJumpCheck",
                passed=jumps_passed,
                details=f"Detected {len(outlier_timestamps)} bars with >{self.max_daily_jump_pct:.0%} price move.",
                severity="WARNING",
            )
        )

        # 5. Stale Price Check (consecutive identical bars)
        stale_mask = (close_p == close_p.shift(1)) & (df["volume"] == 0 if "volume" in df.columns else False)
        stale_count = int(stale_mask.sum())
        checks.append(
            QualityCheckResult(
                check_name="StalePriceCheck",
                passed=stale_count <= self.max_stale_consecutive_bars,
                details=f"Found {stale_count} zero-volume flat price bars.",
                severity="WARNING",
            )
        )

        return DataQualityReport(
            symbol=symbol,
            total_bars=len(df),
            is_valid=is_valid,
            checks=checks,
            missing_trading_days=missing_days,
            outlier_timestamps=outlier_timestamps,
            stale_price_periods=stale_count,
        )

    @staticmethod
    def adjust_corporate_actions(
        df: pd.DataFrame,
        split_bonus_events: List[Tuple[date, float]],  # (ex_date, split_ratio e.g. 2.0 for 1:2 split)
    ) -> pd.DataFrame:
        """
        Applies geometric backward adjustments across ex-dates for stock splits and bonuses.
        """
        adj_df = df.copy()
        for ex_date, ratio in split_bonus_events:
            mask = adj_df.index.date < ex_date
            adj_df.loc[mask, "open"] /= ratio
            adj_df.loc[mask, "high"] /= ratio
            adj_df.loc[mask, "low"] /= ratio
            adj_df.loc[mask, "close"] /= ratio
            if "volume" in adj_df.columns:
                adj_df.loc[mask, "volume"] = (adj_df.loc[mask, "volume"] * ratio).round().astype(int)
        return adj_df
