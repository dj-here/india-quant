"""
Historical Stress Testing Engine for Indian Markets.
Evaluates strategy resilience during severe historical shock events:
- 2016 Demonetization Shock
- 2020 COVID-19 Market Crash & Circuit Breaker Halts
- 2022 Global Rate Tightening & FII Outflow Cycle
- 2024 Lok Sabha Election Volatility Window
"""

from dataclasses import dataclass
from datetime import date
from typing import Dict, List, Optional
import numpy as np
from india_quant.backtest.engine import DailyPortfolioSnapshot


@dataclass
class StressWindowResult:
    event_name: str
    start_date: date
    end_date: date
    strategy_return_pct: float
    benchmark_return_pct: float
    strategy_max_dd_pct: float
    benchmark_max_dd_pct: float
    alpha_pct: float


class HistoricalStressTester:
    """
    Evaluates backtest snapshots against known Indian market stress windows.
    """

    STRESS_PERIODS = [
        ("2016 Demonetization Shock", date(2016, 11, 8), date(2016, 12, 30)),
        ("2020 COVID-19 Crash", date(2020, 2, 15), date(2020, 5, 31)),
        ("2022 Global Rate Hike Cycle", date(2022, 1, 1), date(2022, 6, 30)),
        ("2024 Election Volatility Window", date(2024, 5, 1), date(2024, 6, 15)),
    ]

    def evaluate_stress_windows(
        self,
        snapshots: List[DailyPortfolioSnapshot],
    ) -> List[StressWindowResult]:
        """
        Calculates strategy and benchmark returns and drawdowns during stress windows.
        """
        results: List[StressWindowResult] = []

        for name, start_d, end_d in self.STRESS_PERIODS:
            # Filter snapshots in window
            window_snaps = [s for s in snapshots if start_d <= s.trade_date <= end_d]
            if len(window_snaps) < 5:
                continue

            strat_rets = np.array([s.daily_return for s in window_snaps])
            bench_rets = np.array([s.benchmark_return for s in window_snaps])

            strat_cum = float(np.prod(1.0 + strat_rets) - 1.0)
            bench_cum = float(np.prod(1.0 + bench_rets) - 1.0)

            strat_dds = np.array([s.drawdown for s in window_snaps])
            strat_max_dd = float(np.min(strat_dds))

            # Benchmark max drawdown in window
            b_cum = np.cumprod(1.0 + bench_rets)
            b_hwm = np.maximum.accumulate(b_cum)
            b_dd = (b_cum - b_hwm) / b_hwm
            bench_max_dd = float(np.min(b_dd))

            results.append(StressWindowResult(
                event_name=name,
                start_date=start_d,
                end_date=end_d,
                strategy_return_pct=round(strat_cum, 4),
                benchmark_return_pct=round(bench_cum, 4),
                strategy_max_dd_pct=round(strat_max_dd, 4),
                benchmark_max_dd_pct=round(bench_max_dd, 4),
                alpha_pct=round(strat_cum - bench_cum, 4),
            ))

        return results
