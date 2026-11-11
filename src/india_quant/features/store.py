"""
Point-in-Time Feature Store & Pipeline Orchestrator for IndiaQuant.
Coordinates technical indicators, derivatives microstructure, macro, and regimes,
aligns them strictly with forward targets, and provides feature importance / stability checks.
"""

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import lightgbm as lgb
import numpy as np
import pandas as pd
from india_quant.common.logging import get_logger
from india_quant.features.macro import MacroFeatureEngine
from india_quant.features.microstructure import MicrostructureFeatureEngine
from india_quant.features.regime import RegimeDetectionEngine
from india_quant.features.targets import TargetConfig, TargetEngine, validate_target_invariants
from india_quant.features.technical import TechnicalFeatureEngine

logger = get_logger("FeatureStore")


@dataclass
class FeatureStoreMetadata:
    symbol: str
    total_bars: int
    feature_count: int
    target_count: int
    feature_names: List[str]
    target_names: List[str]


class FeatureStore:
    """
    Constructs, validates, caches, and inspects the unified point-in-time feature matrix.
    """

    def __init__(self, lake_root: str = "./data/lake"):
        self.lake_root = Path(lake_root)
        self.features_dir = self.lake_root / "features"
        self.features_dir.mkdir(parents=True, exist_ok=True)

        self.tech_engine = TechnicalFeatureEngine()
        self.micro_engine = MicrostructureFeatureEngine()
        self.macro_engine = MacroFeatureEngine()
        self.regime_engine = RegimeDetectionEngine()
        self.target_engine = TargetEngine(TargetConfig(forward_horizons_days=[1, 5, 20]))

    def build_feature_dataset(
        self,
        df_ohlcv: pd.DataFrame,
        symbol: str,
        macro_dfs: Optional[Dict[str, pd.DataFrame]] = None,
        india_vix_df: Optional[pd.DataFrame] = None,
        df_derivatives: Optional[pd.DataFrame] = None,
        df_delivery: Optional[pd.DataFrame] = None,
        df_fii_dii: Optional[pd.DataFrame] = None,
    ) -> pd.DataFrame:
        """
        Builds the complete aligned (Features + Targets) DataFrame for a symbol.
        """
        logger.info(f"Building unified feature dataset for {symbol} ({len(df_ohlcv)} base bars)...")

        # 1. Technical Indicators & Volatilities
        df_feat = self.tech_engine.compute_features(df_ohlcv)

        # 2. Derivatives & Microstructure
        df_feat = self.micro_engine.enrich_derivatives_context(df_feat, df_derivatives)
        df_feat = self.micro_engine.compute_flow_features(df_feat, df_fii_dii, df_delivery)

        # 3. Macro & Global Cross-Asset Lead/Lag
        df_feat = self.macro_engine.compute_macro_features(df_feat, macro_dfs, india_vix_df)

        # 4. Market Regime States (Point-in-Time Trailing Rules)
        df_feat = self.regime_engine.classify_regimes_deterministic(df_feat)

        # 5. Forward Prediction Targets (Strict Shift Forward)
        df_full = self.target_engine.build_targets(df_feat)

        # Validate Target Invariants
        validate_target_invariants(df_full)

        logger.info(f"Successfully generated {len(df_full.columns)} total columns for {symbol}.")
        return df_full

    def split_features_and_targets(
        self,
        df_full: pd.DataFrame,
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Separates features X from forward targets Y.
        Base columns (open, high, low, close, volume, oi) and target_* columns are excluded from X.
        """
        target_cols = [c for c in df_full.columns if c.startswith("target_")]
        base_cols = ["open", "high", "low", "close", "volume", "oi"]
        feature_cols = [c for c in df_full.columns if c not in target_cols and c not in base_cols]

        X = df_full[feature_cols].copy()
        Y = df_full[target_cols].copy()
        return X, Y

    def compute_feature_importance(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        top_k: int = 20,
    ) -> pd.DataFrame:
        """
        Computes LightGBM tree-based feature importance for target y.
        """
        valid_mask = y.notna()
        X_clean = X.loc[valid_mask].fillna(0.0)
        y_clean = y.loc[valid_mask]

        if len(X_clean) < 20:
            return pd.DataFrame(columns=["feature", "importance"])

        # Determine task: classification or regression
        is_binary = set(y_clean.unique()).issubset({0, 1, 0.0, 1.0})
        objective = "binary" if is_binary else "regression"

        train_data = lgb.Dataset(X_clean, label=y_clean)
        params = {
            "objective": objective,
            "metric": "binary_logloss" if is_binary else "rmse",
            "verbosity": -1,
            "boosting_type": "gbdt",
            "learning_rate": 0.05,
            "num_leaves": 31,
            "seed": 42,
        }

        model = lgb.train(params, train_data, num_boost_round=100)
        importances = model.feature_importance(importance_type="gain")

        imp_df = (
            pd.DataFrame({"feature": X_clean.columns, "importance": importances})
            .sort_values(by="importance", ascending=False)
            .reset_index(drop=True)
        )
        return imp_df.head(top_k)

    def save_features(self, df_full: pd.DataFrame, symbol: str) -> Path:
        """Saves enriched dataset to Parquet in the lake."""
        sanitized = symbol.replace("/", "_").replace("^", "").strip()
        out_path = self.features_dir / f"{sanitized}_features.parquet"
        df_full.to_parquet(out_path, compression="snappy")
        logger.info(f"Saved feature dataset for {symbol} to {out_path}")
        return out_path

    def load_features(self, symbol: str) -> pd.DataFrame:
        """Loads cached feature dataset from Parquet."""
        sanitized = symbol.replace("/", "_").replace("^", "").strip()
        in_path = self.features_dir / f"{sanitized}_features.parquet"
        if not in_path.exists():
            raise FileNotFoundError(f"Feature parquet not found: {in_path}")
        return pd.read_parquet(in_path)
