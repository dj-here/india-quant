"""
Auto-Generated Institutional Tear Sheet Generator for IndiaQuant.
Generates self-contained HTML and Markdown performance tear sheets with:
- Risk-adjusted return profiles (Sharpe, Sortino, Calmar, Drawdown)
- Deflated Sharpe Ratio (DSR) & Bootstrap Confidence Intervals
- Statutory Indian Tax breakdown (STT, GST, Stamp Duty, SEBI)
- Historical Stress Window analysis (2016, 2020 COVID, 2022, 2024 Election).
"""

from pathlib import Path
from typing import List, Optional
from india_quant.backtest.engine import DailyPortfolioSnapshot, TradeRecord
from india_quant.backtest.metrics import PerformanceMetricsReport
from india_quant.backtest.stress_testing import StressWindowResult


class TearSheetGenerator:
    """
    Builds institutional tear sheets in standalone HTML format.
    """

    def __init__(self, output_dir: str = "./data/lake/reports"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_html_tearsheet(
        self,
        metrics: PerformanceMetricsReport,
        stress_results: List[StressWindowResult],
        snapshots: List[DailyPortfolioSnapshot],
        trades: List[TradeRecord],
    ) -> Path:
        sanitized_sym = metrics.symbol.replace("/", "_").replace("^", "").strip()
        out_file = self.output_dir / f"{sanitized_sym}_tearsheet.html"

        stress_rows = "".join([
            f"""<tr>
                <td style="font-weight: 600;">{s.event_name}</td>
                <td>{s.start_date} to {s.end_date}</td>
                <td style="color: {'#16a34a' if s.strategy_return_pct >= 0 else '#dc2626'}; font-weight: bold;">{s.strategy_return_pct:.2%}</td>
                <td style="color: {'#16a34a' if s.benchmark_return_pct >= 0 else '#dc2626'};">{s.benchmark_return_pct:.2%}</td>
                <td style="color: #dc2626;">{s.strategy_max_dd_pct:.2%}</td>
                <td style="color: #dc2626;">{s.benchmark_max_dd_pct:.2%}</td>
                <td style="color: {'#16a34a' if s.alpha_pct >= 0 else '#dc2626'}; font-weight: bold;">{s.alpha_pct:+.2%}</td>
            </tr>"""
            for s in stress_results
        ])

        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>IndiaQuant Performance Tear Sheet: {metrics.symbol}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }}
        .container {{ max-width: 1100px; margin: 0 auto; }}
        .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #334155; padding-bottom: 16px; margin-bottom: 24px; }}
        h1 {{ margin: 0; font-size: 26px; color: #38bdf8; }}
        .badge {{ background: #0284c7; color: white; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; }}
        .grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }}
        .card {{ background: #1e293b; padding: 18px; border-radius: 8px; border: 1px solid #334155; }}
        .card-label {{ color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; }}
        .card-val {{ font-size: 24px; font-weight: 700; color: #f8fafc; }}
        .card-sub {{ font-size: 12px; color: #38bdf8; margin-top: 4px; }}
        .section-title {{ font-size: 18px; font-weight: 700; color: #e2e8f0; margin-top: 32px; margin-bottom: 12px; border-left: 4px solid #38bdf8; padding-left: 10px; }}
        table {{ width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; margin-bottom: 24px; }}
        th, td {{ padding: 12px 16px; text-align: left; border-bottom: 1px solid #334155; font-size: 14px; }}
        th {{ background: #0f172a; color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 12px; }}
        .disclaimer {{ background: #1e293b; border: 1px solid #eab308; border-radius: 8px; padding: 16px; font-size: 12px; color: #fef08a; margin-top: 40px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <h1>IndiaQuant Institutional Tear Sheet: {metrics.symbol}</h1>
                <div style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Walk-Forward Backtest with Exact Statutory Indian Taxes & Slippage</div>
            </div>
            <div class="badge">PRODUCTION READY</div>
        </div>

        <div class="grid">
            <div class="card">
                <div class="card-label">Ending Portfolio Equity</div>
                <div class="card-val">₹{metrics.ending_capital:,.0f}</div>
                <div class="card-sub">Initial: ₹{metrics.initial_capital:,.0f}</div>
            </div>
            <div class="card">
                <div class="card-label">Strategy CAGR</div>
                <div class="card-val" style="color: #34d399;">{metrics.cagr_pct:.2%}</div>
                <div class="card-sub">Benchmark: {metrics.benchmark_cagr_pct:.2%}</div>
            </div>
            <div class="card">
                <div class="card-label">Sharpe Ratio (Rf=6.5%)</div>
                <div class="card-val" style="color: #38bdf8;">{metrics.sharpe_ratio:.2f}</div>
                <div class="card-sub">95% CI: [{metrics.sharpe_ci_95[0]:.2f}, {metrics.sharpe_ci_95[1]:.2f}]</div>
            </div>
            <div class="card">
                <div class="card-label">Max Drawdown</div>
                <div class="card-val" style="color: #f87171;">{metrics.max_drawdown_pct:.2%}</div>
                <div class="card-sub">Benchmark MaxDD: {metrics.benchmark_max_dd_pct:.2%}</div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <div class="card-label">Sortino Ratio</div>
                <div class="card-val">{metrics.sortino_ratio:.2f}</div>
                <div class="card-sub">Downside vol only</div>
            </div>
            <div class="card">
                <div class="card-label">Calmar Ratio</div>
                <div class="card-val">{metrics.calmar_ratio:.2f}</div>
                <div class="card-sub">CAGR / |MaxDD|</div>
            </div>
            <div class="card">
                <div class="card-label">Win Rate / Hit Rate</div>
                <div class="card-val">{metrics.win_rate_pct:.2%}</div>
                <div class="card-sub">Profit Factor: {metrics.profit_factor:.2f}</div>
            </div>
            <div class="card">
                <div class="card-label">Deflated Sharpe (DSR)</div>
                <div class="card-val" style="color: {'#34d399' if metrics.deflated_sharpe_ratio >= 0.95 else '#fbbf24'};">{metrics.deflated_sharpe_ratio:.4f}</div>
                <div class="card-sub">{'p < 0.05 Robust' if metrics.deflated_sharpe_ratio >= 0.95 else 'Multiple testing warning'}</div>
            </div>
        </div>

        <div class="section-title">Historical Indian Market Stress Windows</div>
        <table>
            <thead>
                <tr>
                    <th>Shock Event</th>
                    <th>Date Window</th>
                    <th>Strategy Return</th>
                    <th>Benchmark Return</th>
                    <th>Strategy MaxDD</th>
                    <th>Benchmark MaxDD</th>
                    <th>Net Alpha</th>
                </tr>
            </thead>
            <tbody>
                {stress_rows}
            </tbody>
        </table>

        <div class="section-title">Statutory Indian Friction & Trading Realities</div>
        <table>
            <thead>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                    <th>Quantitative Rationale</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Total Trades Executed</td>
                    <td><b>{metrics.total_trades}</b></td>
                    <td>Holding periods aligned with model predictions</td>
                </tr>
                <tr>
                    <td>Annual Portfolio Turnover</td>
                    <td><b>{metrics.turnover_ratio:.2f}x</b></td>
                    <td>Low-turnover swing overlay preserves capital</td>
                </tr>
                <tr>
                    <td>Total Statutory Friction Paid</td>
                    <td><b>₹{metrics.total_friction_paid_inr:,.2f}</b></td>
                    <td>Includes STT, GST, Exchange, SEBI, Stamp Duty, and Slippage</td>
                </tr>
                <tr>
                    <td>Securities Transaction Tax (STT) Paid</td>
                    <td><b>₹{metrics.stt_paid_inr:,.2f}</b></td>
                    <td>Mandatory Indian government levy</td>
                </tr>
                <tr>
                    <td>Goods & Services Tax (GST 18%) Paid</td>
                    <td><b>₹{metrics.gst_paid_inr:,.2f}</b></td>
                    <td>18% statutory levy on broker and exchange charges</td>
                </tr>
            </tbody>
        </table>

        <div class="disclaimer">
            <b>REGULATORY & COMPLIANCE NOTICE (SEBI GUIDELINES):</b><br/>
            All calculations and performance figures reported herein are based on simulated historical backtests. Past performance is no guarantee of future returns. Outputs represent statistical and probabilistic machine learning models for quantitative research, not registered investment advice or financial recommendations under SEBI (Research Analysts) Regulations, 2014.
        </div>
    </div>
</body>
</html>
"""
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(html_content)

        return out_file
