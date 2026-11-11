# IndiaQuant Platform Architecture

For the complete visual specification, Mermaid diagrams, and mathematical formulations, refer to the institutional design doc:
[Architecture & Design Doc](file:///C:/Users/Deepak%20joshi/.gemini/antigravity/brain/c4a44725-abed-4842-be12-c07d358743cf/architecture_and_system_design.md).

## Core Modules & Directory Layout
- `src/india_quant/common`: NSE trading calendar, IST timezone alignment, configuration, and structured logging.
- `src/india_quant/data`: Multi-provider connectors (Zerodha Kite, Dhan, NSE Bhavcopy, Yahoo/FRED fallback, Mock data generator), TimescaleDB and Parquet storage, Pandera quality validation.
- `src/india_quant/features`: Multi-horizon target generation (High/Low/Return/Direction), technical indicators (Garman-Klass, Parkinson, RSI, MACD, VWAP), derivatives microstructure (PCR, Max Pain, ATM IV, OI delta), and regime classification.
- `src/india_quant/models`: Walk-forward validation with purging and embargo, GBDT multi-quantile regressors (LightGBM/CatBoost), Conformal prediction intervals, baseline models, and MLflow registry.
- `src/india_quant/backtest`: Institutional Indian friction engine (STT, GST 18%, Stamp Duty, SEBI charges, NSE fees, slippage), fractional Kelly position sizing, volatility targeting, circuit breakers, and tear sheet metrics.
- `src/india_quant/serving`: Async FastAPI inference service with Pydantic v2 schemas, JWT authentication, and Redis caching.
- `src/india_quant/dashboard`: Streamlit real-time market overview, forecast explorer, stock screener, and model health monitor.
- `infra/`: Docker compose orchestration, AWS ap-south-1 Mumbai Terraform infrastructure.
