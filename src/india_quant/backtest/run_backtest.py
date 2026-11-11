"""
End-to-End Realistic Backtest Execution Runner.
Loads the registered production model, runs event-driven simulation with exact Indian statutory friction,
evaluates historical stress periods, and generates institutional HTML tear sheets.
"""

from typing import Dict, Optional, Tuple
import pandas as pd
from india_quant.backtest.costs_india import InstrumentType
from india_quant.backtest.engine import RealisticBacktestEngine
from india_quant.backtest.metrics import PerformanceMetricsCalculator, PerformanceMetricsReport
from india_quant.backtest.stress_testing import HistoricalStressTester
from india_quant.backtest.tearsheet import TearSheetGenerator
from india_quant.common.logging import get_logger
from india_quant.features.store import FeatureStore
from india_quant.models.registry import ModelRegistry

logger = get_logger("RunBacktest")


def execute_production_backtest(
    symbol: str = "NIFTY 50",
    initial_capital: float = 1_000_000.0,  # ₹10 Lakhs
) -> Tuple[PerformanceMetricsReport, str]:
    """
    Executes backtest with registered production model and generates tear sheet.
    """
    feature_store = FeatureStore()
    registry = ModelRegistry()
    engine = RealisticBacktestEngine(
        initial_capital=initial_capital,
        instrument_type=InstrumentType.FUTURES,
        target_annual_vol=0.14,
        kelly_fraction=0.50,
        max_drawdown_limit=0.15,
        default_slippage_bps=2.0,
        min_prob_hurdle=0.53,
    )
    metrics_calc = PerformanceMetricsCalculator(r_free_annual=0.065, n_trials_tested=10)
    stress_tester = HistoricalStressTester()
    tearsheet_gen = TearSheetGenerator()

    # 1. Load active production model
    bundle = registry.load_production_model(symbol)
    if bundle is None:
        raise ValueError(f"No active PRODUCTION model found in registry for {symbol}. Run walk-forward first.")

    model = bundle["model"]
    logger.info(f"Loaded production model '{bundle.get('symbol')}' version {bundle.get('version')}...")

    # 2. Load feature dataset
    df_full = feature_store.load_features(symbol)
    X, Y = feature_store.split_features_and_targets(df_full)
    close_prices = df_full["close"]

    # 3. Generate model predictions
    preds = model.predict(X, current_prices=close_prices)

    # 4. Run event-driven realistic backtester
    logger.info(f"Executing realistic backtest for {symbol} ({len(df_full)} trading days)...")
    snapshots, trades = engine.run_backtest(
        symbol=symbol,
        df_ohlcv=df_full,
        preds=preds,
        benchmark_close=close_prices,
    )

    # 5. Compute performance metrics & DSR
    metrics = metrics_calc.compute_metrics(symbol=symbol, snapshots=snapshots, trades=trades)
    logger.info(f"\n{metrics.summary()}\n")

    # 6. Evaluate historical stress testing windows
    stress_results = stress_tester.evaluate_stress_windows(snapshots)
    logger.info("--- Historical Stress Window Breakdown ---")
    for s in stress_results:
        logger.info(
            f"  {s.event_name:32} | Strat Ret: {s.strategy_return_pct:+.2%} | "
            f"Bench Ret: {s.benchmark_return_pct:+.2%} | MaxDD: {s.strategy_max_dd_pct:.2%} | Alpha: {s.alpha_pct:+.2%}"
        )

    # 7. Generate HTML Tear Sheet
    html_path = tearsheet_gen.generate_html_tearsheet(
        metrics=metrics,
        stress_results=stress_results,
        snapshots=snapshots,
        trades=trades,
    )
    logger.info(f"Successfully generated institutional HTML tear sheet: {html_path}")

    return metrics, str(html_path)


def main():
    execute_production_backtest(symbol="NIFTY 50")


if __name__ == "__main__":
    main()
