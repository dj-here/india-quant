"""
Modeling, cross-validation, baseline benchmarks, deep learning, conformal prediction, and model registry.
"""

from india_quant.models.validation import PurgedWalkForwardCV
from india_quant.models.baselines import (
    NaivePersistenceBaseline,
    MomentumBaseline,
    RidgeBaseline,
)
from india_quant.models.tree_models import LightGBMQuantileForecaster
from india_quant.models.conformal import ConformalPredictionEngine
from india_quant.models.deep_models import LSTMSequenceForecaster
from india_quant.models.ensemble import RegimeAwareEnsemble
from india_quant.models.optuna_tuner import WalkForwardHyperparameterTuner
from india_quant.models.evaluation import ModelEvaluator, ModelEvaluationReport
from india_quant.models.registry import ModelRegistry, RegisteredModelEntry

__all__ = [
    "PurgedWalkForwardCV",
    "NaivePersistenceBaseline",
    "MomentumBaseline",
    "RidgeBaseline",
    "LightGBMQuantileForecaster",
    "ConformalPredictionEngine",
    "LSTMSequenceForecaster",
    "RegimeAwareEnsemble",
    "WalkForwardHyperparameterTuner",
    "ModelEvaluator",
    "ModelEvaluationReport",
    "ModelRegistry",
    "RegisteredModelEntry",
]
