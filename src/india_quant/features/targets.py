"""
Predictive Target Formulation Engine for IndiaQuant.
Strictly eliminates look-ahead bias and computes:
- Next-Day Directional Probability Label: C_{t+1} > C_t
- Next-Day High Log-Ratio: ln(H_{t+1} / C_t)
- Next-Day Low Log-Ratio: ln(L_{t+1} / C_t)
- Multi-Horizon Forward Log-Returns: ln(C_{t+h} / C_t) for h in {1, 5, 20}
"""

from dataclasses import dataclass, field
from typing import List, Optional, Tuple
import numpy as np
import pandas as pd
from india_quant.common.exceptions import LookAheadBiasError


@dataclass
class TargetConfig:
    forward_horizons_days: List[int] = field(default_factory=lambda: [1, 5, 20])
    compute_direction: bool = True
    compute_high_low_ratios: bool = True
    direction_threshold: float = 0.0


class TargetEngine:
    """
    Constructs forward prediction targets with rigorous boundary assertions.
    All targets for bar t are computed strictly using information from t+1 onwards.
    """

    def __init__(self, config: TargetConfig = TargetConfig()):
        self.config = config

    def build_targets(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Takes an OHLCV DataFrame indexed by timestamp (ascending) and appends target columns:
        - target_dir_1d: {0, 1}
        - target_high_ratio_1d: ln(High_{t+1} / Close_t)
        - target_low_ratio_1d: ln(Low_{t+1} / Close_t)
        - target_ret_1d, target_ret_5d, target_ret_20d
        """
        required_cols = {"open", "high", "low", "close"}
        if not required_cols.issubset(set(df.columns)):
            raise ValueError(f"DataFrame missing required OHLC columns: {required_cols - set(df.columns)}")

        # Ensure index is sorted ascending
        if not df.index.is_monotonic_increasing:
            df = df.sort_index()

        out = df.copy()
        close = out["close"]
        high = out["high"]
        low = out["low"]

        # 1. Next-Day High & Low Log-Ratios
        if self.config.compute_high_low_ratios:
            # Shift backwards so that row t contains t+1 values
            next_high = high.shift(-1)
            next_low = low.shift(-1)

            # High and Low relative to today's close
            out["target_high_ratio_1d"] = np.log(next_high / close)
            out["target_low_ratio_1d"] = np.log(next_low / close)

        # 2. Multi-Horizon Forward Log-Returns & Direction
        for h in self.config.forward_horizons_days:
            future_close = close.shift(-h)
            ret_col = f"target_ret_{h}d"
            out[ret_col] = np.log(future_close / close)

            if h == 1 and self.config.compute_direction:
                # 1 if positive return > threshold, else 0
                out["target_dir_1d"] = (out[ret_col] > self.config.direction_threshold).astype(int)
                # Keep NaN where future close is NaN
                out.loc[out[ret_col].isna(), "target_dir_1d"] = np.nan

        return out

    @staticmethod
    def reconstruct_price_levels(
        current_close: float,
        pred_high_ratio: float,
        pred_low_ratio: float,
        pred_ret_1d: Optional[float] = None,
    ) -> Tuple[float, float, Optional[float]]:
        """
        Reconstructs absolute rupee price levels from log-ratio predictions:
        pred_high = C_t * exp(high_ratio)
        pred_low = C_t * exp(low_ratio)
        pred_close = C_t * exp(ret_1d)
        """
        pred_high = float(current_close * np.exp(pred_high_ratio))
        pred_low = float(current_close * np.exp(pred_low_ratio))
        pred_close = float(current_close * np.exp(pred_ret_1d)) if pred_ret_1d is not None else None

        # Monotonicity check
        if pred_low > pred_high:
            # Swap if cross-over occurs due to unconstrained estimation
            pred_low, pred_high = pred_high, pred_low

        return pred_high, pred_low, pred_close


def validate_target_invariants(df_with_targets: pd.DataFrame) -> bool:
    """
    Validates structural invariants on computed targets:
    1. Low ratio <= High ratio for every valid row
    2. target_dir_1d == 1 if and only if target_ret_1d > 0
    3. Last row must have NaN for 1d targets (cannot foresee the future)
    """
    valid_mask = df_with_targets["target_high_ratio_1d"].notna() & df_with_targets["target_low_ratio_1d"].notna()
    subset = df_with_targets[valid_mask]

    if (subset["target_low_ratio_1d"] > subset["target_high_ratio_1d"]).any():
        raise LookAheadBiasError("Target Invariant Failed: Low ratio exceeds High ratio.")

    # Direction check
    dir_valid = subset["target_dir_1d"].notna() & subset["target_ret_1d"].notna()
    dir_subset = subset[dir_valid]
    expected_dir = (dir_subset["target_ret_1d"] > 0).astype(int)
    if not (dir_subset["target_dir_1d"] == expected_dir).all():
        raise LookAheadBiasError("Target Invariant Failed: Direction target does not match sign of 1-day return.")

    # Final row must be NaN for forward targets
    last_idx = df_with_targets.index[-1]
    if pd.notna(df_with_targets.loc[last_idx, "target_ret_1d"]):
        raise LookAheadBiasError("Target Leakage: Final timestamp in series has non-null forward return target.")

    return True
