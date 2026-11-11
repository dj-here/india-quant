"""
Tests for configuration loading and validation.
"""

from india_quant.common.config import QuantConfig, load_config


def test_default_config_instantiation():
    cfg = load_config()
    assert cfg.app_name == "IndiaQuant"
    assert cfg.timezone == "Asia/Kolkata"
    assert cfg.enable_live_orders is False  # Safe by default
    assert cfg.max_portfolio_drawdown_limit == 0.15
    assert cfg.annual_target_volatility == 0.14
