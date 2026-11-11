"""
Model Registry for IndiaQuant.
Handles artifact serialization, model versioning, metadata logging,
and Staging -> Production promotion gates.
"""

from dataclasses import dataclass
from datetime import datetime
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import joblib
import pytz
from india_quant.common.logging import get_logger

IST = pytz.timezone("Asia/Kolkata")
logger = get_logger("ModelRegistry")


@dataclass
class RegisteredModelEntry:
    model_name: str
    symbol: str
    version: str
    stage: str  # "STAGING" | "PRODUCTION" | "ARCHIVED"
    feature_names: List[str]
    metrics: Dict[str, float]
    artifact_path: str
    created_at_ist: str


class ModelRegistry:
    """
    Manages model registration, deployment gating, and version control.
    """

    def __init__(self, registry_root: str = "./data/lake/models"):
        self.registry_root = Path(registry_root)
        self.registry_root.mkdir(parents=True, exist_ok=True)
        self.metadata_file = self.registry_root / "registry_index.json"
        self._entries: Dict[str, RegisteredModelEntry] = self._load_index()

    def _load_index(self) -> Dict[str, RegisteredModelEntry]:
        if not self.metadata_file.exists():
            return {}
        with open(self.metadata_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {k: RegisteredModelEntry(**v) for k, v in data.items()}

    def _save_index(self):
        serialized = {k: v.__dict__ for k, v in self._entries.items()}
        with open(self.metadata_file, "w", encoding="utf-8") as f:
            json.dump(serialized, f, indent=2)

    def register_model(
        self,
        model_name: str,
        symbol: str,
        version: str,
        model_obj: Any,
        feature_names: List[str],
        metrics: Dict[str, float],
        promote_to_production: bool = False,
    ) -> RegisteredModelEntry:
        """
        Saves model weights and registers entry in the index.
        """
        sanitized_sym = symbol.replace("/", "_").replace("^", "").strip()
        filename = f"{model_name}_{sanitized_sym}_v{version}.joblib"
        artifact_path = self.registry_root / filename

        # Serialize model artifact
        bundle = {
            "model": model_obj,
            "feature_names": feature_names,
            "symbol": symbol,
            "version": version,
            "registered_at": datetime.now(tz=IST).isoformat(),
        }
        joblib.dump(bundle, artifact_path)

        stage = "PRODUCTION" if promote_to_production else "STAGING"

        # If promoting to production, archive any previous production model for this symbol
        if promote_to_production:
            for key, entry in self._entries.items():
                if entry.symbol == symbol and entry.stage == "PRODUCTION":
                    entry.stage = "ARCHIVED"

        entry_key = f"{model_name}_{sanitized_sym}_v{version}"
        entry = RegisteredModelEntry(
            model_name=model_name,
            symbol=symbol,
            version=version,
            stage=stage,
            feature_names=feature_names,
            metrics=metrics,
            artifact_path=str(artifact_path),
            created_at_ist=datetime.now(tz=IST).isoformat(),
        )

        self._entries[entry_key] = entry
        self._save_index()
        logger.info(f"Registered model {entry_key} into {stage} at {artifact_path}")
        return entry

    def load_production_model(self, symbol: str) -> Optional[Dict[str, Any]]:
        """
        Loads the active PRODUCTION model bundle for a symbol.
        """
        for entry in self._entries.values():
            if entry.symbol == symbol and entry.stage == "PRODUCTION":
                path = Path(entry.artifact_path)
                if path.exists():
                    return joblib.load(path)
        return None

    def list_models(self) -> List[RegisteredModelEntry]:
        return list(self._entries.values())
