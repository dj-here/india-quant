"""
Purged Walk-Forward Cross-Validation & Model Promotion Runner.
Evaluates:
1. Naive Persistence Baseline
2. Momentum Baseline
3. L2 Ridge Regression Baseline
4. LightGBM Multi-Quantile & Calibrated Directional Forecaster
Promotes models to Production only if they statistically outperform baselines out-of-sample.
"""

from typing import Dict, List, Tuple
import numpy as np
import pandas as pd
from tabulate import tabulate
from india_quant.common.logging import get_logger
from india_quant.features.store import FeatureStore
from india_quant.models.baselines import MomentumBaseline, NaivePersistenceBaseline, RidgeBaseline
from india_quant.models.evaluation import ModelEvaluationReport, ModelEvaluator
from india_quant.models.registry import ModelRegistry
from india_quant.models.tree_models import LightGBMQuantileForecaster
from india_quant.models.validation import PurgedWalkForwardCV

logger = get_logger("WalkForwardRunner")


def evaluate_model_walk_forward(
    symbol: str = "NIFTY 50",
    n_splits: int = 5,
) -> Tuple[Dict[str, ModelEvaluationReport], ModelRegistry]:
    """
    Executes Purged Walk-Forward cross-validation comparing ML models against baselines.
    """
    feature_store = FeatureStore()
    registry = ModelRegistry()
    evaluator = ModelEvaluator()

    logger.info(f"Loading feature dataset for {symbol}...")
    df_full = feature_store.load_features(symbol)

    # Extract X, Y, and original prices for rupee High/Low error calculation
    X, Y = feature_store.split_features_and_targets(df_full)
    close_prices = df_full["close"]

    # Target series
    y_dir = Y["target_dir_1d"]
    y_ret = Y["target_ret_1d"]
    y_high = Y["target_high_ratio_1d"]
    y_low = Y["target_low_ratio_1d"]

    # True future high and low price levels
    true_high_p = close_prices * np.exp(y_high)
    true_low_p = close_prices * np.exp(y_low)

    # Filter rows with valid targets (last row is NaN by construction)
    valid_mask = y_dir.notna() & y_ret.notna() & y_high.notna() & y_low.notna()
    X = X.loc[valid_mask]
    y_dir = y_dir.loc[valid_mask]
    y_ret = y_ret.loc[valid_mask]
    y_high = y_high.loc[valid_mask]
    y_low = y_low.loc[valid_mask]
    close_prices = close_prices.loc[valid_mask]
    true_high_p = true_high_p.loc[valid_mask]
    true_low_p = true_low_p.loc[valid_mask]

    cv = PurgedWalkForwardCV(
        n_splits=n_splits,
        train_bars=750,      # ~3 years of training
        test_bars=125,       # ~6 months test fold
        embargo_bars=5,      # 5 days embargo
        prediction_horizon=1,
    )

    models = {
        "Naive": NaivePersistenceBaseline(),
        "Momentum": MomentumBaseline(),
        "Ridge": RidgeBaseline(alpha=10.0),
        "LightGBM_Quantile": LightGBMQuantileForecaster(n_estimators=100, learning_rate=0.03),
    }

    # Storage for out-of-sample predictions across folds
    oos_preds: Dict[str, Dict[str, List[np.ndarray]]] = {m: {} for m in models}
    oos_targets = {"dir": [], "ret": [], "high_p": [], "low_p": []}

    fold_idx = 0
    for train_idx, test_idx in cv.split(X):
        fold_idx += 1
        logger.info(f"Fold {fold_idx}/{n_splits}: Train bars={len(train_idx)}, Test bars={len(test_idx)}")

        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        yd_train = y_dir.iloc[train_idx]
        yr_train = y_ret.iloc[train_idx]
        yh_train = y_high.iloc[train_idx]
        yl_train = y_low.iloc[train_idx]

        test_close = close_prices.iloc[test_idx]

        # Store test targets
        oos_targets["dir"].append(y_dir.iloc[test_idx].values)
        oos_targets["ret"].append(y_ret.iloc[test_idx].values)
        oos_targets["high_p"].append(true_high_p.iloc[test_idx].values)
        oos_targets["low_p"].append(true_low_p.iloc[test_idx].values)

        # 1. Fit & Predict Naive
        models["Naive"].fit(X_train, yh_train, yl_train)
        pred_naive = models["Naive"].predict(X_test)
        pred_naive["pred_high_price_50"] = test_close.values * np.exp(pred_naive["pred_high_ratio_50"])
        pred_naive["pred_low_price_50"] = test_close.values * np.exp(pred_naive["pred_low_ratio_50"])
        _append_preds(oos_preds["Naive"], pred_naive)

        # 2. Fit & Predict Momentum
        models["Momentum"].fit(X_train, yd_train)
        pred_mom = models["Momentum"].predict(X_test)
        pred_mom["pred_high_price_50"] = test_close.values * np.exp(pred_mom["pred_high_ratio_50"])
        pred_mom["pred_low_price_50"] = test_close.values * np.exp(pred_mom["pred_low_ratio_50"])
        _append_preds(oos_preds["Momentum"], pred_mom)

        # 3. Fit & Predict Ridge
        models["Ridge"].fit(X_train, yd_train, yr_train, yh_train, yl_train)
        pred_ridge = models["Ridge"].predict(X_test)
        pred_ridge["pred_high_price_50"] = test_close.values * np.exp(pred_ridge["pred_high_ratio_50"])
        pred_ridge["pred_low_price_50"] = test_close.values * np.exp(pred_ridge["pred_low_ratio_50"])
        _append_preds(oos_preds["Ridge"], pred_ridge)

        # 4. Fit & Predict LightGBM Quantile Forecaster
        models["LightGBM_Quantile"].fit(X_train, yd_train, yr_train, yh_train, yl_train)
        pred_lgb = models["LightGBM_Quantile"].predict(X_test, current_prices=test_close)
        _append_preds(oos_preds["LightGBM_Quantile"], pred_lgb)

    # Concatenate all out-of-sample segments
    y_test_dir = np.concatenate(oos_targets["dir"])
    y_test_ret = np.concatenate(oos_targets["ret"])
    y_test_high_p = np.concatenate(oos_targets["high_p"])
    y_test_low_p = np.concatenate(oos_targets["low_p"])

    consolidated_preds = {}
    for m in models:
        consolidated_preds[m] = {k: np.concatenate(v) for k, v in oos_preds[m].items()}

    # Compute Evaluation Reports
    reports: Dict[str, ModelEvaluationReport] = {}
    naive_report = evaluator.evaluate(
        model_name="Naive",
        symbol=symbol,
        y_true_dir=y_test_dir,
        y_true_ret=y_test_ret,
        y_true_high_p=y_test_high_p,
        y_true_low_p=y_test_low_p,
        preds=consolidated_preds["Naive"],
        baseline_report=None,
    )
    reports["Naive"] = naive_report

    for m in ["Momentum", "Ridge", "LightGBM_Quantile"]:
        reports[m] = evaluator.evaluate(
            model_name=m,
            symbol=symbol,
            y_true_dir=y_test_dir,
            y_true_ret=y_test_ret,
            y_true_high_p=y_test_high_p,
            y_true_low_p=y_test_low_p,
            preds=consolidated_preds[m],
            baseline_report=naive_report,
        )

    # Display out-of-sample comparative leaderboard
    table_rows = []
    for m, rep in reports.items():
        table_rows.append([
            m,
            f"{rep.hit_rate:.2%}",
            f"{rep.brier_score:.4f}",
            f"{rep.roc_auc:.4f}",
            f"{rep.mean_pinball_loss:.5f}",
            f"{rep.empirical_coverage_80:.1%}",
            f"{rep.high_mae_points:.1f} pts",
            f"{rep.low_mae_points:.1f} pts",
            "PROMOTED" if rep.promoted else "REJECTED",
        ])

    headers = ["Model", "Hit Rate", "Brier Score", "ROC-AUC", "Pinball Loss", "Cov [q10,q90]", "High MAE", "Low MAE", "Status"]
    logger.info(f"\n--- OUT-OF-SAMPLE WALK-FORWARD LEADERBOARD ({symbol}) ---\n" + tabulate(table_rows, headers=headers, tablefmt="github"))

    # Register the best model (LightGBM_Quantile if promoted)
    lgb_report = reports["LightGBM_Quantile"]
    if lgb_report.promoted:
        # Fit on full data for production serving
        full_model = LightGBMQuantileForecaster(n_estimators=150, learning_rate=0.03)
        full_model.fit(X, y_dir, y_ret, y_high, y_low)

        metrics = {
            "hit_rate": lgb_report.hit_rate,
            "brier_score": lgb_report.brier_score,
            "roc_auc": lgb_report.roc_auc,
            "mean_pinball_loss": lgb_report.mean_pinball_loss,
            "high_mae_points": lgb_report.high_mae_points,
            "low_mae_points": lgb_report.low_mae_points,
        }
        registry.register_model(
            model_name="LightGBM_QuantileForecaster",
            symbol=symbol,
            version="1.0.0",
            model_obj=full_model,
            feature_names=list(X.columns),
            metrics=metrics,
            promote_to_production=True,
        )

    return reports, registry


def _append_preds(collector: Dict[str, List[np.ndarray]], preds: Dict[str, np.ndarray]):
    for k, v in preds.items():
        if k not in collector:
            collector[k] = []
        collector[k].append(v)


def main():
    for sym in ["NIFTY 50", "NIFTY BANK"]:
        evaluate_model_walk_forward(symbol=sym, n_splits=5)


if __name__ == "__main__":
    main()
