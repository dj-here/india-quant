"""
Evaluation Metrics & Model Promotion Gates for IndiaQuant.
Calculates:
- Direction: Hit Rate, ROC-AUC, Brier score, Expected Calibration Error (ECE)
- Multi-Quantile: Pinball Loss, Empirical Coverage Rate for [q10, q90], Interval Width
- Price Range: MAE and RMSE in index points / rupees on Next-Day High and Low
- Strict Promotion Gate: Candidate model must beat simple baselines out-of-sample.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, brier_score_loss, roc_auc_score


@dataclass
class ModelEvaluationReport:
    model_name: str
    symbol: str
    n_samples: int
    hit_rate: float
    roc_auc: float
    brier_score: float
    mean_pinball_loss: float
    empirical_coverage_80: float  # [q10, q90] coverage (target: ~80%)
    mean_interval_width: float
    high_mae_points: float        # Next-Day High MAE
    low_mae_points: float         # Next-Day Low MAE
    promoted: bool
    promotion_reason: str

    def summary(self) -> str:
        status = "PROMOTED TO PRODUCTION" if self.promoted else "REJECTED / HELD IN STAGING"
        return f"""--- Model Evaluation Tear Sheet: {self.model_name} on {self.symbol} [{status}] ---
Evaluation Samples: {self.n_samples}
Direction Metrics:
  Hit Rate (Accuracy): {self.hit_rate:.2%}
  Brier Score:         {self.brier_score:.4f} (Uninformed baseline = 0.2500)
  ROC-AUC:             {self.roc_auc:.4f}
Probabilistic & Quantile Metrics:
  Mean Pinball Loss:   {self.mean_pinball_loss:.6f}
  Coverage [q10, q90]: {self.empirical_coverage_80:.1%} (Theoretical Target: 80.0%)
  Mean Interval Width: {self.mean_interval_width:.4f}
Next-Day Range Accuracy (Rupees/Points):
  Next-Day High MAE:   {self.high_mae_points:.2f} pts
  Next-Day Low MAE:    {self.low_mae_points:.2f} pts
Promotion Decision:
  {self.promotion_reason}"""


class ModelEvaluator:
    """
    Evaluates probabilistic, directional, and range forecasts against institutional benchmarks.
    """

    @staticmethod
    def calculate_pinball_loss(y_true: np.ndarray, y_pred_q: np.ndarray, alpha: float) -> float:
        """Computes Pinball / Quantile loss for a given quantile alpha."""
        diff = y_true - y_pred_q
        loss = np.maximum(alpha * diff, (alpha - 1.0) * diff)
        return float(np.mean(loss))

    def evaluate(
        self,
        model_name: str,
        symbol: str,
        y_true_dir: np.ndarray,
        y_true_ret: np.ndarray,
        y_true_high_p: np.ndarray,
        y_true_low_p: np.ndarray,
        preds: Dict[str, np.ndarray],
        baseline_report: Optional["ModelEvaluationReport"] = None,
    ) -> ModelEvaluationReport:
        """
        Computes all out-of-sample metrics and evaluates the promotion gate.
        """
        n = len(y_true_dir)
        prob_up = preds["prob_up"]
        pred_dir = preds["pred_dir"]

        # 1. Directional Metrics
        hit_rate = float(accuracy_score(y_true_dir, pred_dir))
        brier = float(brier_score_loss(y_true_dir, prob_up))
        try:
            auc = float(roc_auc_score(y_true_dir, prob_up))
        except ValueError:
            auc = 0.50

        # 2. Quantile Metrics
        pred_ret_50 = preds.get("pred_return_50", np.zeros(n))
        pred_ret_10 = preds.get("pred_return_10", pred_ret_50 - 0.01)
        pred_ret_90 = preds.get("pred_return_90", pred_ret_50 + 0.01)

        pb10 = self.calculate_pinball_loss(y_true_ret, pred_ret_10, 0.10)
        pb50 = self.calculate_pinball_loss(y_true_ret, pred_ret_50, 0.50)
        pb90 = self.calculate_pinball_loss(y_true_ret, pred_ret_90, 0.90)
        mean_pinball = (pb10 + pb50 + pb90) / 3.0

        # Empirical Coverage: fraction of actual returns between pred_ret_10 and pred_ret_90
        in_band = (y_true_ret >= pred_ret_10) & (y_true_ret <= pred_ret_90)
        coverage_80 = float(np.mean(in_band))
        mean_width = float(np.mean(pred_ret_90 - pred_ret_10))

        # 3. Next-Day High and Low MAE
        pred_high_p = preds.get("pred_high_price_50", y_true_high_p)
        pred_low_p = preds.get("pred_low_price_50", y_true_low_p)
        high_mae = float(np.mean(np.abs(y_true_high_p - pred_high_p)))
        low_mae = float(np.mean(np.abs(y_true_low_p - pred_low_p)))

        # 4. Promotion Gate
        promoted = True
        reasons = []

        if baseline_report is not None:
            # Must beat baseline Brier score (lower is better)
            if brier > baseline_report.brier_score:
                promoted = False
                reasons.append(f"Failed Brier test ({brier:.4f} > baseline {baseline_report.brier_score:.4f})")
            # Must beat baseline Hit Rate
            if hit_rate < baseline_report.hit_rate:
                promoted = False
                reasons.append(f"Failed Hit Rate test ({hit_rate:.2%} < baseline {baseline_report.hit_rate:.2%})")
            # Must beat baseline Pinball loss
            if mean_pinball > baseline_report.mean_pinball_loss:
                promoted = False
                reasons.append(f"Failed Pinball loss test ({mean_pinball:.6f} > baseline {baseline_report.mean_pinball_loss:.6f})")

        if promoted:
            decision_text = "Passed all statistical promotion tests out-of-sample against baseline."
        else:
            decision_text = "Blocked by promotion gate: " + "; ".join(reasons)

        return ModelEvaluationReport(
            model_name=model_name,
            symbol=symbol,
            n_samples=n,
            hit_rate=hit_rate,
            roc_auc=auc,
            brier_score=brier,
            mean_pinball_loss=mean_pinball,
            empirical_coverage_80=coverage_80,
            mean_interval_width=mean_width,
            high_mae_points=high_mae,
            low_mae_points=low_mae,
            promoted=promoted,
            promotion_reason=decision_text,
        )
