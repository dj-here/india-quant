"""
Macroeconomic & Cross-Asset Lead/Lag Features for IndiaQuant.
Aligns global assets (USDINR, Brent Crude, US 10Y Yield, DXY, GIFT Nifty, India VIX)
with Indian trading sessions to capture international risk transmission.
"""

from typing import Dict, Optional
import numpy as np
import pandas as pd


class MacroFeatureEngine:
    """
    Computes macro risk-on/risk-off indicators and global cross-asset signals.
    """

    def compute_macro_features(
        self,
        df_target: pd.DataFrame,
        macro_dfs: Optional[Dict[str, pd.DataFrame]] = None,
        india_vix_df: Optional[pd.DataFrame] = None,
    ) -> pd.DataFrame:
        """
        Enriches target equity/index dataframe with macro indicators.
        Uses forward-fill to align international assets with Indian exchange dates.
        """
        out = df_target.copy()
        macro_dict = macro_dfs or {}

        # 1. USDINR Exchange Rate Dynamics
        if "USDINR" in macro_dict and not macro_dict["USDINR"].empty:
            usdinr = macro_dict["USDINR"]["close"].reindex(out.index).ffill()
            out["usdinr_ret_1d"] = np.log(usdinr / usdinr.shift(1)).fillna(0.0)
            out["usdinr_ret_5d"] = np.log(usdinr / usdinr.shift(5)).fillna(0.0)
        else:
            out["usdinr_ret_1d"] = 0.0
            out["usdinr_ret_5d"] = 0.0

        # 2. Brent Crude Oil
        if "BRENT_CRUDE" in macro_dict and not macro_dict["BRENT_CRUDE"].empty:
            brent = macro_dict["BRENT_CRUDE"]["close"].reindex(out.index).ffill()
            out["brent_ret_1d"] = np.log(brent / brent.shift(1)).fillna(0.0)
            out["brent_ret_5d"] = np.log(brent / brent.shift(5)).fillna(0.0)
        else:
            out["brent_ret_1d"] = 0.0
            out["brent_ret_5d"] = 0.0

        # 3. US 10Y Treasury Yield
        if "US_10Y" in macro_dict and not macro_dict["US_10Y"].empty:
            us10y = macro_dict["US_10Y"]["close"].reindex(out.index).ffill()
            out["us10y_delta_1d"] = (us10y - us10y.shift(1)).fillna(0.0)
            out["us10y_delta_5d"] = (us10y - us10y.shift(5)).fillna(0.0)
        else:
            out["us10y_delta_1d"] = 0.0
            out["us10y_delta_5d"] = 0.0

        # 4. US Dollar Index (DXY)
        if "DXY" in macro_dict and not macro_dict["DXY"].empty:
            dxy = macro_dict["DXY"]["close"].reindex(out.index).ffill()
            out["dxy_ret_1d"] = np.log(dxy / dxy.shift(1)).fillna(0.0)
            out["dxy_ret_5d"] = np.log(dxy / dxy.shift(5)).fillna(0.0)
        else:
            out["dxy_ret_1d"] = 0.0
            out["dxy_ret_5d"] = 0.0

        # 5. India VIX & Volatility Risk Premium
        if india_vix_df is not None and not india_vix_df.empty:
            vix = india_vix_df["close"].reindex(out.index).ffill()
            out["vix_level"] = vix
            out["vix_change_5d"] = (vix - vix.shift(5)).fillna(0.0)

            # Volatility Spread: VIX - Realized Volatility 20D (in annualized percentage points)
            if "vol_realized_20d" in out.columns:
                out["vol_risk_premium"] = vix - (out["vol_realized_20d"] * 100.0)
            else:
                out["vol_risk_premium"] = 0.0
        else:
            out["vix_level"] = 15.0
            out["vix_change_5d"] = 0.0
            out["vol_risk_premium"] = 0.0

        return out
