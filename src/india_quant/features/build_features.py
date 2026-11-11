"""
Feature Pipeline Runner for IndiaQuant.
Processes historical datasets in the Parquet Lakehouse, computes multi-asset features,
performs feature importance analysis, and caches the feature store.
"""

from typing import Dict, List
import pandas as pd
from india_quant.common.logging import get_logger
from india_quant.data.storage.parquet_store import ParquetDataStore
from india_quant.features.store import FeatureStore

logger = get_logger("BuildFeatures")


def run_feature_generation(symbols: List[str] = ["NIFTY 50", "NIFTY BANK"]) -> Dict[str, pd.DataFrame]:
    store = ParquetDataStore()
    feature_store = FeatureStore()
    results = {}

    for sym in symbols:
        logger.info(f"Loading raw OHLCV for {sym} from lakehouse...")
        try:
            df_raw = store.read_ohlcv("indices", sym)
        except FileNotFoundError:
            logger.error(f"Symbol {sym} not found in lakehouse. Run backfill first.")
            continue

        # Build feature dataset
        df_features = feature_store.build_feature_dataset(df_raw, symbol=sym)

        # Drop initial warm-up period (first 60 rows for rolling indicators)
        df_clean = df_features.iloc[60:].copy()

        # Split features and targets
        X, Y = feature_store.split_features_and_targets(df_clean)
        logger.info(f"{sym}: Generated {X.shape[1]} features across {len(X)} bars.")

        # Compute Feature Importance for Next-Day Direction
        if "target_dir_1d" in Y.columns:
            imp_dir = feature_store.compute_feature_importance(X, Y["target_dir_1d"], top_k=10)
            logger.info(f"\nTop 10 Features for {sym} Next-Day Direction [target_dir_1d]:\n{imp_dir.to_string(index=False)}")

        # Compute Feature Importance for Next-Day High Ratio
        if "target_high_ratio_1d" in Y.columns:
            imp_high = feature_store.compute_feature_importance(X, Y["target_high_ratio_1d"], top_k=10)
            logger.info(f"\nTop 10 Features for {sym} Next-Day High Ratio [target_high_ratio_1d]:\n{imp_high.to_string(index=False)}")

        # Compute Feature Importance for Next-Day Low Ratio
        if "target_low_ratio_1d" in Y.columns:
            imp_low = feature_store.compute_feature_importance(X, Y["target_low_ratio_1d"], top_k=10)
            logger.info(f"\nTop 10 Features for {sym} Next-Day Low Ratio [target_low_ratio_1d]:\n{imp_low.to_string(index=False)}")

        # Save to feature store
        out_path = feature_store.save_features(df_clean, symbol=sym)
        logger.info(f"Persisted feature dataset to {out_path}")
        results[sym] = df_clean

    return results


if __name__ == "__main__":
    run_feature_generation()
