"""
Feature engineering, target formulation, regime detection, and feature store.
"""

from india_quant.features.targets import (
    TargetEngine,
    TargetConfig,
    validate_target_invariants,
)
from india_quant.features.technical import TechnicalFeatureEngine
from india_quant.features.microstructure import MicrostructureFeatureEngine
from india_quant.features.macro import MacroFeatureEngine
from india_quant.features.regime import RegimeDetectionEngine
from india_quant.features.store import FeatureStore, FeatureStoreMetadata

__all__ = [
    "TargetEngine",
    "TargetConfig",
    "validate_target_invariants",
    "TechnicalFeatureEngine",
    "MicrostructureFeatureEngine",
    "MacroFeatureEngine",
    "RegimeDetectionEngine",
    "FeatureStore",
    "FeatureStoreMetadata",
]
