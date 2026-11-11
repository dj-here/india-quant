"""
Derivatives Microstructure & Flow Features for IndiaQuant.
Computes Put-Call Ratio (PCR), Max Pain strike, ATM/OTM IV Skew,
FII/DII Institutional Flows, and Delivery Percentage dynamics.
"""

from typing import Dict, Optional, Tuple
import numpy as np
import pandas as pd


class MicrostructureFeatureEngine:
    """
    Computes derivatives market microstructure and institutional flow features.
    """

    @staticmethod
    def calculate_pcr(option_chain_df: pd.DataFrame) -> Tuple[float, float]:
        """
        Calculates Put-Call Ratio for Open Interest and Traded Volume.
        Returns: (pcr_oi, pcr_volume)
        """
        if option_chain_df.empty or "call_oi" not in option_chain_df.columns or "put_oi" not in option_chain_df.columns:
            return 1.0, 1.0

        total_call_oi = option_chain_df["call_oi"].sum()
        total_put_oi = option_chain_df["put_oi"].sum()
        pcr_oi = float(total_put_oi / total_call_oi) if total_call_oi > 0 else 1.0

        pcr_vol = 1.0
        if "call_vol" in option_chain_df.columns and "put_vol" in option_chain_df.columns:
            total_call_vol = option_chain_df["call_vol"].sum()
            total_put_vol = option_chain_df["put_vol"].sum()
            pcr_vol = float(total_put_vol / total_call_vol) if total_call_vol > 0 else 1.0

        return round(pcr_oi, 4), round(pcr_vol, 4)

    @staticmethod
    def calculate_max_pain(option_chain_df: pd.DataFrame) -> float:
        """
        Calculates Max Pain strike where options writers suffer minimal cumulative loss at expiry:
        Total Pain(K) = sum_j Call_OI_j * max(0, K - K_j) + sum_j Put_OI_j * max(0, K_j - K)
        """
        if option_chain_df.empty or "strike" not in option_chain_df.columns:
            return 0.0

        strikes = option_chain_df["strike"].values
        call_oi = option_chain_df["call_oi"].fillna(0).values
        put_oi = option_chain_df["put_oi"].fillna(0).values

        if len(strikes) == 0:
            return 0.0

        min_pain = float("inf")
        max_pain_strike = float(strikes[0])

        for k in strikes:
            call_loss = np.sum(np.maximum(0.0, k - strikes) * call_oi)
            put_loss = np.sum(np.maximum(0.0, strikes - k) * put_oi)
            total_loss = call_loss + put_loss

            if total_loss < min_pain:
                min_pain = total_loss
                max_pain_strike = float(k)

        return max_pain_strike

    @staticmethod
    def calculate_iv_skew(option_chain_df: pd.DataFrame, spot_price: float) -> float:
        """
        Calculates Implied Volatility (IV) Skew:
        IV_skew = IV(25-delta OTM Put) - IV(25-delta OTM Call)
        Approximated as OTM Put IV (strike ~ spot*0.97) - OTM Call IV (strike ~ spot*1.03).
        """
        if option_chain_df.empty or "put_iv" not in option_chain_df.columns or spot_price <= 0:
            return 0.0

        put_strike_target = spot_price * 0.97
        call_strike_target = spot_price * 1.03

        put_row = option_chain_df.iloc[(option_chain_df["strike"] - put_strike_target).abs().argmin()]
        call_row = option_chain_df.iloc[(option_chain_df["strike"] - call_strike_target).abs().argmin()]

        put_iv = float(put_row.get("put_iv", 0.15))
        call_iv = float(call_row.get("call_iv", 0.15))

        return round(put_iv - call_iv, 4)

    def enrich_derivatives_context(
        self,
        df_ohlcv: pd.DataFrame,
        df_derivatives_daily: Optional[pd.DataFrame] = None,
    ) -> pd.DataFrame:
        """
        Enriches OHLCV time series with daily trailing derivatives indicators:
        - pcr_oi
        - max_pain_distance: (MaxPain - Close) / Close
        - iv_skew
        - oi_change_pct: ln(OI_t / OI_{t-1})
        """
        out = df_ohlcv.copy()

        # Trailing Open Interest Change
        if "oi" in out.columns and (out["oi"] > 0).any():
            oi_series = out["oi"].replace(0, np.nan).ffill().fillna(1.0)
            out["oi_change_1d"] = np.log(oi_series / oi_series.shift(1)).fillna(0.0)
            out["oi_change_5d"] = np.log(oi_series / oi_series.shift(5)).fillna(0.0)
        else:
            out["oi_change_1d"] = 0.0
            out["oi_change_5d"] = 0.0

        if df_derivatives_daily is not None and not df_derivatives_daily.empty:
            merged = out.join(df_derivatives_daily, how="left")
            out["pcr_oi"] = merged.get("pcr_oi", 1.0).ffill().fillna(1.0)
            if "max_pain" in merged.columns:
                out["max_pain_distance"] = (merged["max_pain"] - out["close"]) / out["close"]
            else:
                out["max_pain_distance"] = 0.0
            out["iv_skew"] = merged.get("iv_skew", 0.0).ffill().fillna(0.0)
        else:
            # Baseline neutral values when full historical chain is absent
            out["pcr_oi"] = 1.0
            out["max_pain_distance"] = 0.0
            out["iv_skew"] = 0.0

        return out

    def compute_flow_features(
        self,
        df_ohlcv: pd.DataFrame,
        df_fii_dii: Optional[pd.DataFrame] = None,
        df_delivery: Optional[pd.DataFrame] = None,
    ) -> pd.DataFrame:
        """
        Appends institutional participant positioning and delivery % dynamics.
        """
        out = df_ohlcv.copy()

        if df_delivery is not None and not df_delivery.empty and "delivery_pct" in df_delivery.columns:
            merged = out.join(df_delivery[["delivery_pct"]], how="left")
            delivery = merged["delivery_pct"].ffill().fillna(40.0)
            out["delivery_pct"] = delivery
            out["delivery_dev_5d"] = delivery - delivery.rolling(window=5).mean()
        else:
            out["delivery_pct"] = 40.0
            out["delivery_dev_5d"] = 0.0

        if df_fii_dii is not None and not df_fii_dii.empty:
            merged = out.join(df_fii_dii, how="left")
            fii_contracts = merged.get("net_fii_index_contracts", 0.0).ffill().fillna(0.0)
            dii_cash = merged.get("net_dii_cash_cr", 0.0).ffill().fillna(0.0)
            out["fii_index_net"] = fii_contracts
            out["dii_cash_net"] = dii_cash
            out["fii_flow_accel_3d_10d"] = fii_contracts.rolling(3).mean() - fii_contracts.rolling(10).mean()
        else:
            out["fii_index_net"] = 0.0
            out["dii_cash_net"] = 0.0
            out["fii_flow_accel_3d_10d"] = 0.0

        return out
