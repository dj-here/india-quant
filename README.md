# IndiaQuant Platform
**Institutional Market Prediction & Quantitative Trading Engine for Indian Markets (NSE/BSE)**

[![IndiaQuant CI](https://github.com/your-org/india-quant/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/india-quant/actions/workflows/ci.yml)
[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/release/python-3110/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

---

## Overview

**IndiaQuant** is an institutional quantitative forecasting and algorithmic execution platform engineered specifically for Indian equity and derivatives markets. It bridges deep learning / gradient-boosted decision trees with statistical rigor, producing multi-horizon direction probabilities, calibrated return distributions, and predictive Next-Day High/Low price ranges.

### Core Architecture & Coverage
- **Indices**: NIFTY 50, BANK NIFTY, FINNIFTY, NIFTY IT, NIFTY Midcap 100, SENSEX, INDIA VIX.
- **Equities**: Point-in-time NIFTY 500 universe with survivorship-bias handling.
- **Derivatives Context**: Futures basis & rollover, options chain microstructure (PCR, Max Pain, ATM/OTM IV skew), and participant-wise FII/DII derivatives positioning.
- **Predictive Horizons**: Intraday (15m, 1h), Next-Day (1D), 5-Day, and 20-Day holding periods.
- **Predictive Outputs**:
  - Directional Win Probability $P(R_{t+1} > 0 \mid \mathcal{F}_t)$
  - Calibrated Return Quantiles ($q_{0.05}, q_{0.10}, q_{0.25}, q_{0.50}, q_{0.75}, q_{0.90}, q_{0.95}$) via Conformal Prediction
  - Next-Day High $\hat{H}_{t+1}$ and Next-Day Low $\hat{L}_{t+1}$ bound estimates
- **Realistic Indian Friction**: Exact statutory schedules for STT, NSE transaction charges, SEBI turnover fees, Stamp Duty, 18% GST, slippage, and circuit band constraints.

For the comprehensive design document with Mermaid workflows and mathematical proofs, refer to [Architecture & Design Specification](docs/architecture.md).

---

## Repository Layout

```text
├── .github/workflows/ci.yml     # Automated linting, typechecking & leakage tests
├── configs/                     # Hydra & YAML configuration hierarchy
│   ├── config.yaml              # Main configuration entry point
│   ├── data/                    # Market symbols, timings, quality rules
│   ├── features/                # Technical indicators, targets, microstructure
│   ├── models/                  # LightGBM quantiles, walk-forward CV, conformal
│   ├── backtest/                # Indian statutory taxes (STT, GST, SEBI) & sizing
│   └── serving/                 # FastAPI parameters, rate limiting, security
├── docs/                        # Architecture specs & market rules documentation
├── infra/                       # Deployment infrastructure
│   ├── docker/                  # Dockerfile & Docker Compose (TSDB, Redis, MLflow, API)
│   └── terraform/               # AWS ap-south-1 Mumbai Infrastructure-as-Code
├── src/india_quant/             # Core Python package
│   ├── common/                  # NSE trading calendar, IST alignment, config, logging
│   ├── data/                    # Connectors (Kite, Dhan, Bhavcopy, Mock), TSDB/Parquet
│   ├── features/                # Targets (High/Low/Returns), technical indicators
│   ├── models/                  # Baselines, Quantile GBDTs, Deep learning, Registry
│   ├── backtest/                # Event-driven backtester, Indian tax engine, portfolio sizing
│   ├── serving/                 # Async FastAPI endpoints, schemas, auth
│   └── dashboard/               # Streamlit analytics & TradingView charts
├── tests/                       # Unit, integration, and strict look-ahead leakage tests
├── Makefile                     # Standard developer commands
├── pyproject.toml               # Pinned project dependencies and tool configs
├── .env.example                 # Environment template (API keys, DB, risk settings)
└── README.md                    # Project documentation
```

---

## Quickstart

### 1. Prerequisites
- Python 3.11+
- Git
- Docker & Docker Compose (for local TimescaleDB & Redis)

### 2. Environment Setup
```bash
# Clone the repository
git clone https://github.com/your-org/india-quant.git
cd india-quant

# Copy environment template
cp .env.example .env

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies in editable mode
pip install -e ".[dev,serving,mlops]"
```

### 3. Verify Code Quality & Run Tests
```bash
# Run unit and quantitative tests
make test

# Run strict look-ahead bias leakage verification
make test-leakage

# Run code linters
make lint
```

### 4. Local Infrastructure (TimescaleDB, Redis, MLflow)
```bash
# Spin up local storage & tracking stack
make docker-up

# Verify running containers
docker compose -f infra/docker/docker-compose.yml ps
```

---

## Testing Strategy & Non-Negotiable Guarantees

1. **Zero Look-Ahead Bias**:
   `tests/test_leakage.py` runs perturbation checks verifying that future price action modifications strictly do not alter past features or historical predictions.
2. **Target Invariants**:
   Every predicted next-day range satisfies:
   $$\hat{L}_{t+1} \le C_t \le \hat{H}_{t+1} \quad \text{and} \quad \hat{q}_{0.10} \le \hat{q}_{0.50} \le \hat{q}_{0.90}$$
3. **Realistic Indian Market Friction**:
   All backtests deduct statutory STT, GST (18%), NSE exchange fees, SEBI charges, Stamp Duty, and slippage before reporting Sharpe or Sortino ratios.

---

## Phase Roadmap & Deliverables
- [x] **Phase 0**: Architecture & System Design, Monorepo Scaffolding, Hydra Configs, CI Skeleton, Indian Statutory Friction Engine, NSE Calendar, Target Engine, Mock Provider, Leakage Tests.
- [x] **Phase 1**: Historical 10+ Year Data Ingestion (NSE Bhavcopy, Kite Connect, YFinance fallback, TimescaleDB Hypertable DDL, Parquet Lakehouse Store, Pandera validation).
- [x] **Phase 2**: Feature Store & Alpha Engineering (Garman-Klass Vol, Microstructure, PCR, Max Pain, FII/DII Flows, Macro VRP, 3-State Regime Detector).
- [x] **Phase 3**: Modeling & Walk-Forward Cross-Validation with 5-Day Embargo (Baselines, LightGBM Quantile Regressors, Monotonic High/Low Price Range Projections, Platt Calibration).
- [x] **Phase 4**: Realistic Backtesting Engine & Auto-Generated HTML Tear Sheets (Statutory Indian taxes, 18% GST, Fractional Kelly, Dynamic Vol Targeting, Historical Crisis Alpha Stress Testing).
- [x] **Phase 5**: Advanced Models, Deep Sequence PyTorch LSTM, Split Conformal Prediction Intervals (92.9% empirical coverage), Bayesian Optuna Walk-Forward Tuning, Regime-Aware Stacking Ensemble with Uncertainty Abstention.
- [x] **Phase 6**: High-Throughput FastAPI Serving API, Interactive Streamlit Institutional Dashboard, Paper Trading Desk with T+1 cash settlement and emergency kill switch.
- [x] **Phase 7**: MLOps Engine (PSI & KS-test Covariate Shift Drift Monitoring, 08:30 IST Pre-Market Daily Orchestration DAG, Docker Compose multi-container stack, AWS ap-south-1 Mumbai Terraform IaC).
- [x] **Phase 8**: System Hardening, Concurrency & High-Throughput Load Testing, Cryptographic SHA-256 Audit Trail, In-App SEBI Regulatory Compliance Disclaimers.

---

## Operational Runbook & Execution Commands

### 1. Execute Full Test Suite
```bash
# Run 67 unit, integration, leakage, compliance, and load tests
pytest tests/ -v
```

### 2. Run Data Ingestion Pipeline (10+ Year Daily Backfill)
```bash
python -m india_quant.data.pipelines.backfill
```

### 3. Generate Feature Store & Regimes
```bash
python -m india_quant.features.build_features
```

### 4. Train Models & Run Purged Walk-Forward Cross-Validation
```bash
# Baseline comparisons & LightGBM Multi-Quantile GBDTs
python -m india_quant.models.run_walk_forward

# Deep LSTM, Optuna Tuning, Conformal Holdout Calibration & Regime Ensemble
python -m india_quant.models.run_advanced_models
```

### 5. Run Realistic Backtest & Generate HTML Tear Sheet
```bash
python -m india_quant.backtest.run_backtest
# Open data/lake/reports/NIFTY 50_tearsheet.html in any browser
```

### 6. Launch FastAPI Production Serving Microservice
```bash
uvicorn india_quant.serving.app:app --host 0.0.0.0 --port 8000 --reload
# Interactive Swagger Documentation: http://localhost:8000/docs
# Interactive ReDoc: http://localhost:8000/redoc
```

### 7. Launch Streamlit Institutional Trading Terminal
```bash
streamlit run src/india_quant/dashboard/app.py --server.port 8501
# Open http://localhost:8501 in your browser
```

### 8. Run 08:30 IST Pre-Market Automated Ingestion & Drift DAG
```bash
python -c "from india_quant.serving.scheduler import PreMarketPipelineOrchestrator; res = PreMarketPipelineOrchestrator().execute_daily_pipeline('NIFTY 50', force_run=True); print(res.status, res.inference_result)"
```

### 9. Multi-Container Docker Deployment
```bash
# Starts TimescaleDB, Redis, MLflow, FastAPI Serving API, and Streamlit Dashboard
docker compose -f infra/docker/docker-compose.yml up -d
```

---

## SEBI Regulatory Disclaimers & Governance Notice
- **Non-Advisory Research Platform**: Outputs, directional probabilities, and predicted price ranges are algorithmic research estimates and do NOT constitute financial advice or recommendations under SEBI (Research Analysts) Regulations, 2014.
- **Paper Trading Safeguards**: Live order routing modules default to paper-trading simulation. Real-world broker API integration is subject to SEBI Algorithmic Trading Framework circulars and exchange certification.
- **Immutable Audit Logging**: Every model prediction, input feature hash, and timestamp is signed with SHA-256 and stored in `data/lake/audit/prediction_audit_trail.jsonl`.
