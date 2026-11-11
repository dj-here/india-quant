"""
Institutional Performance Metrics & Statistical Rigor Engine for IndiaQuant.
Calculates:
- Sharpe, Sortino, Calmar, Max Drawdown
- Win Rate, Profit Factor, Payoff Ratio
- Statutory Indian Taxes & Turnover
- Deflated Sharpe Ratio (DSR) correcting for multiple testing and non-normality (López de Prado)
- 95% Bootstrap Confidence Intervals for Sharpe and Max Drawdown.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from scipy.stats import kurtosis, norm, skew
from india_quant.backtest.engine import DailyPortfolioSnapshot, TradeRecord


@dataclass
class PerformanceMetricsReport:
    symbol: str
    total_days: int
    initial_capital: float
    ending_capital: float
    total_return_pct: float
    cagr_pct: float
    annual_volatility_pct: float
    sharpe_ratio: float
    sortino_ratio: float
    calmar_ratio: float
    max_drawdown_pct: float
    max_drawdown_duration_days: int
    win_rate_pct: float
    profit_factor: float
    total_trades: int
    total_friction_paid_inr: float
    stt_paid_inr: float
    gst_paid_inr: float
    turnover_ratio: float
    deflated_sharpe_ratio: float  # DSR in [0, 1]
    sharpe_ci_95: Tuple[float, float]
    benchmark_cagr_pct: float
    benchmark_sharpe: float
    benchmark_max_dd_pct: float

    def summary(self) -> str:
        ci_str = f"[{self.sharpe_ci_95[0]:.2f}, {self.sharpe_ci_95[1]:.2f}]"
        dsr_valid = "SIGNIFICANT (p < 0.05)" if self.deflated_sharpe_ratio >= 0.95 else "SUSPECT / SNOOPED (p >= 0.05)"
        return f"""================================================================================
INSTITUTIONAL PERFORMANCE TEAR SHEET: {self.symbol}
================================================================================
Portfolio Capital:       ₹{self.initial_capital:,.2f} -> ₹{self.ending_capital:,.2f}
Total Net Return:        {self.total_return_pct:.2%} (CAGR: {self.cagr_pct:.2%})
Benchmark (Buy & Hold):  CAGR: {self.benchmark_cagr_pct:.2%} | Sharpe: {self.benchmark_sharpe:.2f} | MaxDD: {self.benchmark_max_dd_pct:.2%}
--------------------------------------------------------------------------------
Risk-Adjusted Return Metrics (Risk-Free Rate Rf = 6.50%):
  Annualized Volatility: {self.annual_volatility_pct:.2%}
  Sharpe Ratio:          {self.sharpe_ratio:.2f}
  Sortino Ratio:         {self.sortino_ratio:.2f}
  Calmar Ratio:          {self.calmar_ratio:.2f}
  Max Drawdown:          {self.max_drawdown_pct:.2%} (Duration: {self.max_drawdown_duration_days} days)
--------------------------------------------------------------------------------
Statistical Rigor & Significance:
  Deflated Sharpe (DSR): {self.deflated_sharpe_ratio:.4f} -> {dsr_valid}
  Sharpe 95% Bootstrap:  {ci_str}
--------------------------------------------------------------------------------
Trading & Friction Reality:
  Total Trades Executed: {self.total_trades}
  Win Rate:              {self.win_rate_pct:.2%}
  Profit Factor:         {self.profit_factor:.2f}
  Annual Turnover:       {self.turnover_ratio:.2f}x
  Total Statutory Cost:  ₹{self.total_friction_paid_inr:,.2f}
    - STT Paid:          ₹{self.stt_paid_inr:,.2f}
    - GST (18%) Paid:    ₹{self.gst_paid_inr:,.2f}
================================================================================"""


class PerformanceMetricsCalculator:
    """
    Computes statistical and institutional metrics from backtest snapshots and trade records.
    """

    def __init__(self, r_free_annual: float = 0.065, n_trials_tested: int = 10):
        self.r_free_annual = r_free_annual
        self.r_free_daily = r_free_annual / 252.0
        self.n_trials_tested = n_trials_tested

    def compute_metrics(
        self,
        symbol: str,
        snapshots: List[DailyPortfolioSnapshot],
        trades: List[TradeRecord],
    ) -> PerformanceMetricsReport:
        if not snapshots:
            raise ValueError("Snapshots list cannot be empty.")

        n_days = len(snapshots)
        initial_cap = snapshots[0].total_equity
        ending_cap = snapshots[-1].total_equity
        total_ret = (ending_cap - initial_cap) / initial_cap

        years = max(n_days / 252.0, 0.05)
        cagr = (ending_cap / initial_cap) ** (1.0 / years) - 1.0

        daily_rets = np.array([s.daily_return for s in snapshots])
        bench_rets = np.array([s.benchmark_return for s in snapshots])

        # Benchmark cumulative
        bench_cum = np.prod(1.0 + bench_rets)
        bench_cagr = (bench_cum) ** (1.0 / years) - 1.0
        bench_vol = float(np.std(bench_rets) * np.sqrt(252))
        bench_sharpe = float((bench_cagr - self.r_free_annual) / bench_vol) if bench_vol > 0 else 0.0

        bench_cum_series = np.cumprod(1.0 + bench_rets)
        bench_hwm = np.maximum.accumulate(bench_cum_series)
        bench_dd = (bench_cum_series - bench_hwm) / bench_hwm
        bench_max_dd = float(np.min(bench_dd))

        # Strategy Volatility and Sharpe
        ann_vol = float(np.std(daily_rets) * np.sqrt(252))
        sharpe = float((cagr - self.r_free_annual) / ann_vol) if ann_vol > 0 else 0.0

        # Sortino (Downside risk)
        downside_diff = np.minimum(daily_rets - self.r_free_daily, 0.0)
        downside_vol = float(np.sqrt(np.mean(downside_diff ** 2)) * np.sqrt(252))
        sortino = float((cagr - self.r_free_annual) / downside_vol) if downside_vol > 0 else 0.0

        # Max Drawdown & Duration
        dds = np.array([s.drawdown for s in snapshots])
        max_dd = float(np.min(dds))
        calmar = float(cagr / abs(max_dd)) if max_dd < 0 else 0.0

        # Max DD duration
        max_dd_duration = 0
        cur_duration = 0
        for s in snapshots:
            if s.drawdown < 0:
                cur_duration += 1
                if cur_duration > max_dd_duration:
                    max_dd_duration = cur_duration
            else:
                cur_duration = 0

        # Trade metrics
        total_trades = len(trades)
        if total_trades > 0:
            wins = [t for t in trades if t.net_pnl > 0]
            losses = [t for t in trades if t.net_pnl <= 0]
            win_rate = len(wins) / total_trades
            gross_win = sum(t.net_pnl for t in wins)
            gross_loss = abs(sum(t.net_pnl for t in losses))
            profit_factor = float(gross_win / gross_loss) if gross_loss > 0 else 9.99

            total_friction = sum(t.total_friction for t in trades)
            total_stt = sum(t.stt_paid for t in trades)
            total_gst = sum(t.gst_paid for t in trades)
            total_turnover = sum(t.entry_price * t.quantity + t.exit_price * t.quantity for t in trades)
            turnover_ratio = (total_turnover / initial_cap) / years
        else:
            win_rate = 0.0
            profit_factor = 0.0
            total_friction = 0.0
            total_stt = 0.0
            total_gst = 0.0
            turnover_ratio = 0.0

        # Deflated Sharpe Ratio (DSR - López de Prado)
        dsr = self._calculate_deflated_sharpe(daily_rets, sharpe)

        # 95% Bootstrap Confidence Interval for Sharpe
        sharpe_ci = self._bootstrap_sharpe_ci(daily_rets)

        return PerformanceMetricsReport(
            symbol=symbol,
            total_days=n_days,
            initial_capital=initial_cap,
            ending_capital=ending_cap,
            total_return_pct=total_ret,
            cagr_pct=cagr,
            annual_volatility_pct=ann_vol,
            sharpe_ratio=round(sharpe, 2),
            sortino_ratio=round(sortino, 2),
            calmar_ratio=round(calmar, 2),
            max_drawdown_pct=round(max_dd, 4),
            max_drawdown_duration_days=max_dd_duration,
            win_rate_pct=round(win_rate, 4),
            profit_factor=round(profit_factor, 2),
            total_trades=total_trades,
            total_friction_paid_inr=round(total_friction, 2),
            stt_paid_inr=round(total_stt, 2),
            gst_paid_inr=round(total_gst, 2),
            turnover_ratio=round(turnover_ratio, 2),
            deflated_sharpe_ratio=round(dsr, 4),
            sharpe_ci_95=sharpe_ci,
            benchmark_cagr_pct=round(bench_cagr, 4),
            benchmark_sharpe=round(bench_sharpe, 2),
            benchmark_max_dd_pct=round(bench_max_dd, 4),
        )

    def _calculate_deflated_sharpe(self, daily_rets: np.ndarray, annualized_sharpe: float) -> float:
        """
        Calculates the Deflated Sharpe Ratio (DSR) under multiple testing, skewness, and kurtosis.
        """
        T = len(daily_rets)
        if T < 60:
            return 0.50

        # Daily Sharpe
        daily_sharpe = annualized_sharpe / np.sqrt(252)

        # Skewness and Kurtosis
        sk = float(skew(daily_rets))
        kt = float(kurtosis(daily_rets, fisher=False))  # Pearson kurtosis (normal = 3)

        # Expected maximum Sharpe under N independent trials
        K = max(self.n_trials_tested, 1)
        if K == 1:
            sr_star = 0.0
        else:
            euler_mascheroni = 0.5772156649
            sr_star = (1.0 - euler_mascheroni) * norm.ppf(1.0 - 1.0 / K) + euler_mascheroni * norm.ppf(1.0 - 1.0 / (K * np.e))
            sr_star = sr_star / np.sqrt(252)

        # Variance of the Sharpe ratio estimator
        var_sr = (1.0 - sk * daily_sharpe + (kt - 1.0) / 4.0 * (daily_sharpe ** 2)) / (T - 1)
        if var_sr <= 0:
            return 0.50

        # DSR statistic
        z_stat = (daily_sharpe - sr_star) / np.sqrt(var_sr)
        dsr = float(norm.cdf(z_stat))
        return dsr

    def _bootstrap_sharpe_ci(
        self,
        daily_rets: np.ndarray,
        n_bootstraps: int = 500,
        alpha: float = 0.05,
    ) -> Tuple[float, float]:
        """
        Computes 95% non-parametric bootstrap confidence interval for Sharpe Ratio.
        """
        T = len(daily_rets)
        if T < 60:
            return 0.0, 0.0

        rng = np.random.default_rng(42)
        boot_sharpes = np.zeros(n_bootstraps)

        for b in range(n_bootstraps):
            sample = rng.choice(daily_rets, size=T, replace=True)
            std = np.std(sample)
            if std > 1e-6:
                boot_cagr = (np.prod(1.0 + sample)) ** (252.0 / T) - 1.0
                boot_sharpes[b] = (boot_cagr - self.r_free_annual) / (std * np.sqrt(252))
            else:
                boot_sharpes[b] = 0.0

        lower = float(np.percentile(boot_sharpes, (alpha / 2.0) * 100))
        upper = float(np.percentile(boot_sharpes, (1.0 - alpha / 2.0) * 100))
        return round(lower, 2), round(upper, 2)
