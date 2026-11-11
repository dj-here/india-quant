"""
Configuration loader and settings validation using Pydantic Settings.
"""

import os
from pathlib import Path
from typing import List, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
import yaml


class BrokerSettings(BaseSettings):
    kite_api_key: Optional[str] = Field(default=None, alias="KITE_API_KEY")
    kite_api_secret: Optional[str] = Field(default=None, alias="KITE_API_SECRET")
    kite_access_token: Optional[str] = Field(default=None, alias="KITE_ACCESS_TOKEN")
    kite_user_id: Optional[str] = Field(default=None, alias="KITE_USER_ID")

    dhan_client_id: Optional[str] = Field(default=None, alias="DHAN_CLIENT_ID")
    dhan_access_token: Optional[str] = Field(default=None, alias="DHAN_ACCESS_TOKEN")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


class DatabaseSettings(BaseSettings):
    host: str = Field(default="localhost", alias="DB_HOST")
    port: int = Field(default=5432, alias="DB_PORT")
    user: str = Field(default="india_quant", alias="DB_USER")
    password: str = Field(default="india_quant_secure_pass", alias="DB_PASSWORD")
    name: str = Field(default="india_quant_tsdb", alias="DB_NAME")
    ssl_mode: str = Field(default="disable", alias="DB_SSL_MODE")

    @property
    def connection_url(self) -> str:
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


class RedisSettings(BaseSettings):
    host: str = Field(default="localhost", alias="REDIS_HOST")
    port: int = Field(default=6379, alias="REDIS_PORT")
    password: Optional[str] = Field(default=None, alias="REDIS_PASSWORD")
    db: int = Field(default=0, alias="REDIS_DB")

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


class QuantConfig(BaseSettings):
    app_env: str = Field(default="development", alias="APP_ENV")
    app_name: str = Field(default="IndiaQuant", alias="APP_NAME")
    timezone: str = Field(default="Asia/Kolkata", alias="TIMEZONE")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    debug: bool = Field(default=True, alias="DEBUG")

    data_lake_path: str = Field(default="./data/lake", alias="DATA_LAKE_PATH")
    aws_region: str = Field(default="ap-south-1", alias="AWS_REGION")
    aws_s3_data_bucket: Optional[str] = Field(default=None, alias="AWS_S3_DATA_BUCKET")

    mlflow_tracking_uri: str = Field(default="http://localhost:5000", alias="MLFLOW_TRACKING_URI")
    mlflow_experiment_name: str = Field(default="IndiaQuant-Direction-Range", alias="MLFLOW_EXPERIMENT_NAME")

    enable_live_orders: bool = Field(default=False, alias="ENABLE_LIVE_ORDERS")
    paper_trading_initial_capital: float = Field(default=1000000.0, alias="PAPER_TRADING_INITIAL_CAPITAL")
    max_portfolio_drawdown_limit: float = Field(default=0.15, alias="MAX_PORTFOLIO_DRAWDOWN_LIMIT")
    annual_target_volatility: float = Field(default=0.14, alias="ANNUAL_TARGET_VOLATILITY")

    broker: BrokerSettings = Field(default_factory=BrokerSettings)
    db: DatabaseSettings = Field(default_factory=DatabaseSettings)
    redis: RedisSettings = Field(default_factory=RedisSettings)

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


def load_yaml_config(file_path: str) -> dict:
    """Safely loads a YAML configuration file from path."""
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Configuration file not found: {file_path}")
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def load_config() -> QuantConfig:
    """Factory function returning the unified typed QuantConfig."""
    return QuantConfig()
