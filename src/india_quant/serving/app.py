"""
FastAPI High-Performance Production Serving API for IndiaQuant Platform.
Provides async REST endpoints for:
- Calibrated directional win probabilities & next-day High/Low range forecasts
- Conformal prediction bounds & uncertainty abstention
- Screener across indices and equities
- Paper trading order execution with Indian statutory tax breakdown
- Risk controls, drawdown circuit breakers, and emergency kill-switch.
"""

from dataclasses import asdict
from datetime import datetime
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import numpy as np
import pandas as pd
import pytz

from india_quant.backtest.costs_india import InstrumentType
from india_quant.common.logging import get_logger
from india_quant.features.store import FeatureStore
from india_quant.models.ensemble import RegimeAwareEnsemble
from india_quant.models.registry import ModelRegistry
from india_quant.models.tree_models import LightGBMQuantileForecaster
from india_quant.data.storage.neon_store import NeonDataStore
from india_quant.serving.web_terminal import HTML_TERMINAL
from india_quant.serving.paper_broker import PaperTradingBroker
from india_quant.serving.audit import (
    AuditLogger,
    SEBI_ALGO_TRADING_DISCLAIMER,
    SEBI_RESEARCH_ANALYST_DISCLAIMER,
)
from india_quant.serving.schemas import (
    KillSwitchResponse,
    PaperOrderRequest,
    PaperOrderResponse,
    PortfolioStatusResponse,
    PredictionRequest,
    PredictionResponse,
    ScreenerItem,
    ScreenerResponse,
)

logger = get_logger("ServingAPI")
IST = pytz.timezone("Asia/Kolkata")

# Initialize FastAPI application
app = FastAPI(
    title="IndiaQuant Production Serving Engine",
    description="Institutional ML & Quant Prediction API for Indian Equities and Derivatives (NSE/BSE).",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global runtime state singletons
feature_store = FeatureStore()
registry = ModelRegistry()
paper_broker = PaperTradingBroker(initial_capital=1_000_000.0)
audit_logger = AuditLogger()
neon_store = NeonDataStore()


@app.on_event("startup")
def on_startup():
    """Initializes external cloud persistence connections on startup."""
    if neon_store.is_configured:
        try:
            neon_store.init_schema()
            logger.info("Connected to Neon Serverless PostgreSQL successfully.")
        except Exception as e:
            logger.warning(f"Neon database connection failed on startup: {e}")


@app.get("/", response_class=HTMLResponse, tags=["Web Terminal"])
def serve_web_terminal():
    """Serves the institutional TradingView Web Terminal UI."""
    return HTMLResponse(content=HTML_TERMINAL, status_code=200)


@app.get("/health", tags=["System"])
def health_check():
    """System health check and runtime status."""
    return {
        "status": "HEALTHY",
        "timestamp_ist": datetime.now(tz=IST).isoformat(),
        "registered_models_count": len(registry.list_models()),
        "is_trading_halted": paper_broker.is_halted,
        "liquid_cash_inr": paper_broker.liquid_cash,
        "neon_postgres_configured": neon_store.is_configured,
    }


@app.get("/api/v1/models", tags=["Model Registry"])
def list_registered_models():
    """Lists all models and active stages in the registry."""
    models = registry.list_models()
    return {
        "count": len(models),
        "models": [m.__dict__ for m in models],
    }


def _resolve_prediction_for_symbol(
    symbol: str,
    confidence_level: float = 0.90,
    custom_features: Optional[Dict[str, float]] = None,
) -> PredictionResponse:
    """Internal helper to compute calibrated predictions and price bounds."""
    # 1. Attempt to load production model for symbol, fallback to NIFTY 50 if needed
    bundle = registry.load_production_model(symbol)
    if bundle is None:
        bundle = registry.load_production_model("NIFTY 50")
        if bundle is None:
            # Fallback to any registered model
            models = registry.list_models()
            if not models:
                raise HTTPException(
                    status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                    detail="No models registered in registry. Train a model first.",
                )
            bundle = registry.load_production_model(models[-1].symbol)

    model_obj = bundle["model"]
    feature_names = bundle["feature_names"]
    model_name = bundle.get("model_name", "RegimeAware_Ensemble")
    model_version = bundle.get("version", "2.0.0")

    # 2. Retrieve latest feature vector
    try:
        df_feat = feature_store.load_features(symbol)
    except Exception:
        # Fallback to NIFTY 50 features if symbol features are absent
        df_feat = feature_store.load_features("NIFTY 50")

    if df_feat.empty:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No feature records found for symbol {symbol}",
        )

    latest_row = df_feat.iloc[[-1]].copy()
    current_price = float(latest_row["close"].iloc[0]) if "close" in latest_row.columns else 24500.0

    if custom_features:
        for k, v in custom_features.items():
            if k in latest_row.columns:
                latest_row[k] = v

    # Align feature columns
    missing_cols = [c for c in feature_names if c not in latest_row.columns]
    for c in missing_cols:
        latest_row[c] = 0.0

    X_in = latest_row[feature_names].fillna(0.0)

    now_ist = datetime.now(tz=IST).isoformat()

    # 3. Predict via Model Architecture
    cur_prices_series = pd.Series([current_price], index=X_in.index)

    if isinstance(model_obj, RegimeAwareEnsemble):
        pred = model_obj.predict(X_in, current_prices=cur_prices_series)
        prob_win = float(pred["prob_up"][0])
        direction = int(pred["pred_dir"][0])
        abstain = bool(pred["abstain"][0])
        abstain_reason = "Model disagreement or probability near 50% threshold" if abstain else None
        predicted_high = float(pred["pred_high_price_50"][0]) if "pred_high_price_50" in pred else round(current_price * np.exp(pred["pred_high_ratio_50"][0]), 2)
        predicted_low = float(pred["pred_low_price_50"][0]) if "pred_low_price_50" in pred else round(current_price * np.exp(pred["pred_low_ratio_50"][0]), 2)
        predicted_close = round(current_price * (1.0 + float(pred["pred_return_50"][0])), 2)
        conf_high = float(pred["conf_high_price"][0]) if "conf_high_price" in pred else round(predicted_high * 1.01, 2)
        conf_low = float(pred["conf_low_price"][0]) if "conf_low_price" in pred else round(predicted_low * 0.99, 2)
        q_low = float(pred["conf_ret_low"][0])
        q_high = float(pred["conf_ret_high"][0])
    elif isinstance(model_obj, LightGBMQuantileForecaster):
        prob_win = float(model_obj.predict_win_probability(X_in)[0])
        direction = 1 if prob_win >= 0.50 else 0
        abstain = bool(0.48 <= prob_win <= 0.52)
        abstain_reason = "Probabilistic uncertainty around 50%" if abstain else None
        bounds = model_obj.predict_high_low_bounds(X_in, current_price)
        predicted_high = float(bounds["predicted_high"].iloc[0])
        predicted_low = float(bounds["predicted_low"].iloc[0])
        q_df = model_obj.predict_quantiles(X_in)
        q50 = float(q_df[0.50].iloc[0])
        q10 = float(q_df[0.10].iloc[0])
        q90 = float(q_df[0.90].iloc[0])
        predicted_close = current_price * (1.0 + q50)
        conf_high = current_price * (1.0 + q90)
        conf_low = current_price * (1.0 + q10)
        q_low = q10
        q_high = q90
    else:
        # Generic fallback
        prob_win = 0.52
        direction = 1
        abstain = False
        abstain_reason = None
        predicted_high = current_price * 1.008
        predicted_low = current_price * 0.992
        predicted_close = current_price * 1.002
        conf_high = current_price * 1.015
        conf_low = current_price * 0.985
        q_low = -0.015
        q_high = 0.015

    # Cryptographic audit logging for SEBI / governance compliance
    try:
        audit_logger.log_prediction(
            symbol=symbol,
            model_name=model_name,
            model_version=model_version,
            features=X_in.iloc[0].to_dict(),
            prob_win=round(prob_win, 4),
            direction=direction,
            predicted_high=round(predicted_high, 2),
            predicted_low=round(predicted_low, 2),
            abstain=abstain,
        )
    except Exception as log_ex:
        logger.warning(f"Audit log failed: {log_ex}")

    # Persist live prediction to Neon Cloud Postgres if configured
    if neon_store.is_configured:
        try:
            neon_store.save_prediction({
                "timestamp_ist": now_ist,
                "symbol": symbol,
                "model_name": model_name,
                "model_version": model_version,
                "current_price": round(current_price, 2),
                "prob_win": round(prob_win, 4),
                "direction": direction,
                "predicted_high": round(predicted_high, 2),
                "predicted_low": round(predicted_low, 2),
                "predicted_close": round(predicted_close, 2),
                "conformal_high": round(conf_high, 2),
                "conformal_low": round(conf_low, 2),
                "abstain": abstain,
                "signature_sha256": audit_logger.compute_sha256({"sym": symbol, "p": prob_win, "t": now_ist}),
            })
        except Exception as n_ex:
            logger.warning(f"Neon prediction persist error: {n_ex}")

    return PredictionResponse(
        symbol=symbol,
        current_price=round(current_price, 2),
        prob_win=round(prob_win, 4),
        direction=direction,
        abstain=abstain,
        abstain_reason=abstain_reason,
        predicted_high=round(predicted_high, 2),
        predicted_low=round(predicted_low, 2),
        predicted_close=round(predicted_close, 2),
        conformal_high_bound=round(conf_high, 2),
        conformal_low_bound=round(conf_low, 2),
        conformal_return_interval=(round(q_low, 4), round(q_high, 4)),
        model_name=model_name,
        model_version=model_version,
        timestamp_ist=now_ist,
    )


@app.post("/api/v1/predict/direction-and-range", response_model=PredictionResponse, tags=["Predictions"])
def predict_direction_and_range(request: PredictionRequest):
    """
    Returns calibrated win probability, direction, Next-Day High and Low bounds,
    conformal prediction intervals, and uncertainty abstention flag.
    """
    return _resolve_prediction_for_symbol(
        symbol=request.symbol,
        confidence_level=request.confidence_level,
        custom_features=request.custom_features,
    )


@app.get("/api/v1/screener", response_model=ScreenerResponse, tags=["Screener"])
def run_market_screener():
    """
    Scans tracked index and equity universe, generating calibrated signals
    and ranking by directional probability edge and risk-reward ratio.
    """
    universe = ["NIFTY 50", "NIFTY BANK"]
    items: List[ScreenerItem] = []

    for sym in universe:
        try:
            pred = _resolve_prediction_for_symbol(symbol=sym)
            upside = max(0.1, pred.predicted_high - pred.current_price)
            downside = max(0.1, pred.current_price - pred.predicted_low)
            rr_ratio = upside / downside

            items.append(
                ScreenerItem(
                    symbol=sym,
                    current_price=pred.current_price,
                    prob_win=pred.prob_win,
                    direction=pred.direction,
                    abstain=pred.abstain,
                    predicted_high=pred.predicted_high,
                    predicted_low=pred.predicted_low,
                    risk_reward_ratio=round(rr_ratio, 2),
                )
            )
        except Exception as e:
            logger.warning(f"Screener evaluation failed for {sym}: {e}")

    # Rank by probability edge |p - 0.5| descending
    items.sort(key=lambda x: abs(x.prob_win - 0.5), reverse=True)

    return ScreenerResponse(
        total_symbols=len(items),
        ranked_signals=items,
        timestamp_ist=datetime.now(tz=IST).isoformat(),
    )


@app.post("/api/v1/paper-trading/order", response_model=PaperOrderResponse, tags=["Paper Trading"])
def place_paper_order(order: PaperOrderRequest):
    """
    Executes a paper order with realistic Indian friction, STT, 18% GST, and slippage.
    """
    try:
        res = paper_broker.execute_order(
            symbol=order.symbol,
            side=order.side,
            quantity=order.quantity,
            price=order.price,
            order_type=order.order_type,
            instrument=InstrumentType.FUTURES,
        )
        if neon_store.is_configured:
            neon_store.save_paper_order(res.model_dump())
        return res
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


@app.get("/api/v1/paper-trading/portfolio", response_model=PortfolioStatusResponse, tags=["Paper Trading"])
def get_paper_portfolio():
    """Returns current liquid cash, T+1 unsettled cash, MTM positions, and drawdown."""
    return paper_broker.get_portfolio_status()


@app.post("/api/v1/paper-trading/settle", tags=["Paper Trading"])
def trigger_t1_settlement():
    """Simulates end-of-day T+1 settlement: credits unsettled cash to liquid cash."""
    paper_broker.settle_t1()
    return {"message": "T+1 settlement processed successfully."}


@app.post("/api/v1/risk/kill-switch", response_model=KillSwitchResponse, tags=["Risk & Governance"])
def emergency_kill_switch():
    """
    EMERGENCY KILL SWITCH: Immediately halts trading, closes all open positions,
    and locks execution to prevent catastrophic drawdowns.
    """
    return paper_broker.kill_switch()


@app.post("/api/v1/risk/resume", tags=["Risk & Governance"])
def resume_trading():
    """Resets trading halt and enables order placement after manual review."""
    paper_broker.resume_trading()
    return {"message": "Trading resumed successfully. Circuit breaker cleared."}


@app.get("/api/v1/compliance/disclaimers", tags=["SEBI & Regulatory Compliance"])
def get_regulatory_disclaimers():
    """Returns statutory disclaimers under SEBI regulations."""
    return {
        "research_analyst_regulations_2014": SEBI_RESEARCH_ANALYST_DISCLAIMER,
        "algo_trading_framework": SEBI_ALGO_TRADING_DISCLAIMER,
        "jurisdiction": "Securities and Exchange Board of India (SEBI), Mumbai",
        "mode": "SIMULATION_RESEARCH_ONLY",
    }


@app.get("/api/v1/compliance/audit-trail", tags=["SEBI & Regulatory Compliance"])
def get_audit_trail(limit: int = Query(default=20, ge=1, le=100)):
    """Returns immutable cryptographic SHA-256 prediction audit records."""
    records = audit_logger.load_recent_audit_records(limit=limit)
    return {
        "count": len(records),
        "records": [asdict(r) for r in records],
    }

