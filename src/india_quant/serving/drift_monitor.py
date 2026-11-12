"""
Production Drift Monitoring & Statistical Covariate Shift Detection for IndiaQuant.
Implements:
- Population Stability Index (PSI) with quantile binning
- Two-sample Kolmogorov-Smirnov (KS) test for non-parametric distribution shift
- Prediction drift and concept drift detection
- Automated model retraining triggers.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
import pytz
from scipy import stats

from india_quant.common.logging import get_logger

logger = get_logger("DriftMonitor")
IST = pytz.timezone("Asia/Kolkata")


@dataclass
class DriftReport:
    timestamp_ist: str
    symbol: str
    evaluated_features_count: int
    drifted_features_count: int
    drifted_features: List[str]
    feature_psi: Dict[str, float]
    prediction_drift_detected: bool
    prediction_psi: float
    retrain_recommended: bool
    summary: str


class DriftMonitor:
    """
    Monitors data drift, feature drift, and prediction drift across time horizons.
    """

    def __init__(
        self,
        psi_threshold_warning: float = 0.10,
        psi_threshold_critical: float = 0.25,
        ks_p_value_threshold: float = 0.05,
        n_bins: int = 10,
        epsilon: float = 1e-4,
    ):
        self.psi_threshold_warning = psi_threshold_warning
        self.psi_threshold_critical = psi_threshold_critical
        self.ks_p_value_threshold = ks_p_value_threshold
        self.n_bins = n_bins
        self.epsilon = epsilon

    def calculate_psi(self, baseline: np.ndarray, current: np.ndarray) -> float:
        """
        Calculates Population Stability Index (PSI) between baseline and current distributions.
        PSI = sum((Actual% - Expected%) * ln(Actual% / Expected%))
        """
        baseline_clean = baseline[~np.isnan(baseline)]
        current_clean = current[~np.isnan(current)]

        if len(baseline_clean) < 10 or len(current_clean) < 10:
            return 0.0

        # Create quantile bin edges from baseline
        quantiles = np.linspace(0, 100, self.n_bins + 1)
        try:
            bin_edges = np.percentile(baseline_clean, quantiles)
            bin_edges[0] = -np.inf
            bin_edges[-1] = np.inf
            bin_edges = np.unique(bin_edges)
            if len(bin_edges) < 3:
                return 0.0
        except Exception:
            return 0.0

        # Compute counts in each bin
        expected_counts, _ = np.histogram(baseline_clean, bins=bin_edges)
        actual_counts, _ = np.histogram(current_clean, bins=bin_edges)

        # Convert to percentages with epsilon smoothing
        expected_pct = (expected_counts + self.epsilon) / (len(baseline_clean) + self.epsilon * len(expected_counts))
        actual_pct = (actual_counts + self.epsilon) / (len(current_clean) + self.epsilon * len(actual_counts))

        # Calculate PSI
        psi_val = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
        return float(max(0.0, psi_val))

    def calculate_ks_test(self, baseline: np.ndarray, current: np.ndarray) -> Tuple[float, float, bool]:
        """
        Performs two-sample Kolmogorov-Smirnov test.
        Returns (statistic, p_value, is_drifted).
        """
        baseline_clean = baseline[~np.isnan(baseline)]
        current_clean = current[~np.isnan(current)]

        if len(baseline_clean) < 10 or len(current_clean) < 10:
            return 0.0, 1.0, False

        res = stats.ks_2samp(baseline_clean, current_clean)
        is_drifted = res.pvalue < self.ks_p_value_threshold
        return float(res.statistic), float(res.pvalue), bool(is_drifted)

    def evaluate_feature_drift(
        self,
        baseline_df: pd.DataFrame,
        current_df: pd.DataFrame,
        feature_columns: Optional[List[str]] = None,
        symbol: str = "NIFTY 50",
    ) -> DriftReport:
        """
        Comprehensive data and feature drift audit comparing baseline training window
        to the current operational inference window.
        """
        numeric_cols = [
            c for c in baseline_df.select_dtypes(include=[np.number]).columns
            if c in current_df.columns and c not in ["timestamp", "date", "symbol"]
        ]
        cols = feature_columns or numeric_cols
        now_ist = datetime.now(tz=IST).isoformat()

        psi_scores: Dict[str, float] = {}
        drifted_cols: List[str] = []

        for col in cols:
            b_vals = baseline_df[col].to_numpy(dtype=float)
            c_vals = current_df[col].to_numpy(dtype=float)

            psi = self.calculate_psi(b_vals, c_vals)
            psi_scores[col] = round(psi, 4)

            _, _, ks_drift = self.calculate_ks_test(b_vals, c_vals)

            if psi >= self.psi_threshold_critical or (psi >= self.psi_threshold_warning and ks_drift):
                drifted_cols.append(col)

        # Retraining decision:
        # Trigger retraining if:
        # 1. Any critical feature exhibits PSI >= 0.25, OR
        # 2. More than 15% of features exhibit drift.
        drift_fraction = len(drifted_cols) / max(1, len(cols))
        max_psi = max(psi_scores.values()) if psi_scores else 0.0
        retrain = max_psi >= self.psi_threshold_critical or drift_fraction >= 0.15

        summary = (
            f"Evaluated {len(cols)} features for {symbol}: {len(drifted_cols)} drifted "
            f"({drift_fraction * 100:.1f}%). Max PSI = {max_psi:.4f}. Retrain trigger: {retrain}."
        )

        logger.info(summary)

        return DriftReport(
            timestamp_ist=now_ist,
            symbol=symbol,
            evaluated_features_count=len(cols),
            drifted_features_count=len(drifted_cols),
            drifted_features=drifted_cols,
            feature_psi=psi_scores,
            prediction_drift_detected=False,
            prediction_psi=0.0,
            retrain_recommended=retrain,
            summary=summary,
        )

    def evaluate_prediction_drift(
        self,
        baseline_probs: np.ndarray,
        current_probs: np.ndarray,
        symbol: str = "NIFTY 50",
    ) -> Tuple[float, bool]:
        """
        Monitors output probability distribution shifts to detect concept drift.
        """
        psi = self.calculate_psi(baseline_probs, current_probs)
        is_drifted = psi >= self.psi_threshold_warning
        return round(psi, 4), bool(is_drifted)
