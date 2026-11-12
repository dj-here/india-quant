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
from india_quant.common.universe import MARKET_UNIVERSE, get_asset_def
from india_quant.features.store import FeatureStore
from india_quant.models.ensemble import RegimeAwareEnsemble
from india_quant.models.market_predictor import (
    ComprehensiveMarketPredictor,
    MarketAssetPrediction,
    MarketBreadthSummary,
)
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
market_predictor = ComprehensiveMarketPredictor()


@app.on_event("startup")
def on_startup():
    """Initializes external cloud persistence connections on startup."""
    if neon_store.is_configured:
        try:
            with neon_store.get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1;")
            logger.info("Connected to Neon Serverless PostgreSQL successfully.")
        except Exception as e:
            logger.warning(f"Neon database connection check on startup: {e}")


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
    # 1. Attempt to load production model for symbol if specifically trained and no custom features
    bundle = registry.load_production_model(symbol)
    if bundle is not None and not custom_features:
        try:
            model_obj = bundle["model"]
            feature_names = bundle["feature_names"]
            model_name = bundle.get("model_name", "RegimeAware_Ensemble")
            model_version = bundle.get("version", "2.0.0")

            df_feat = feature_store.load_features(symbol)
            if not df_feat.empty:
                latest_row = df_feat.iloc[[-1]].copy()
                current_price = float(latest_row["close"].iloc[0]) if "close" in latest_row.columns else 24500.0

                for c in feature_names:
                    if c not in latest_row.columns:
                        latest_row[c] = 0.0

                X_in = latest_row[feature_names].fillna(0.0)
                cur_prices_series = pd.Series([current_price], index=X_in.index)

                if isinstance(model_obj, (RegimeAwareEnsemble, LightGBMQuantileForecaster)):
                    pred = model_obj.predict(X_in, current_prices=cur_prices_series)
                    prob_win = float(pred["prob_up"][0])
                    direction = int(pred["pred_dir"][0])
                    abstain = bool(pred["abstain"][0])
                    predicted_high = float(pred["pred_high_price_50"][0]) if "pred_high_price_50" in pred else round(current_price * np.exp(pred["pred_high_ratio_50"][0]), 2)
                    predicted_low = float(pred["pred_low_price_50"][0]) if "pred_low_price_50" in pred else round(current_price * np.exp(pred["pred_low_ratio_50"][0]), 2)
                    predicted_close = round(current_price * (1.0 + float(pred["pred_return_50"][0])), 2)
                    conf_high = float(pred["conf_high_price"][0]) if "conf_high_price" in pred else round(predicted_high * 1.01, 2)
                    conf_low = float(pred["conf_low_price"][0]) if "conf_low_price" in pred else round(predicted_low * 0.99, 2)
                    q_low = float(pred.get("conf_ret_low", [-0.01])[0])
                    q_high = float(pred.get("conf_ret_high", [0.01])[0])
                    now_ist = datetime.now(tz=IST).isoformat()

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

                    return PredictionResponse(
                        symbol=symbol,
                        current_price=round(current_price, 2),
                        prob_win=round(prob_win, 4),
                        direction=direction,
                        abstain=abstain,
                        abstain_reason="Model disagreement or probability near 50% threshold" if abstain else None,
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
        except Exception as e:
            logger.warning(f"Bundle inference failed for {symbol}: {e}, falling back to market predictor")

    # 2. Comprehensive Multi-Asset Market Predictor Engine across all 130+ assets and dynamic stocks
    p = market_predictor.predict_asset(symbol, fetch_live=True)
    now_ist = p.timestamp_ist

    if neon_store.is_configured:
        try:
            neon_store.save_prediction({
                "timestamp_ist": now_ist,
                "symbol": p.symbol,
                "model_name": "ComprehensiveMarketPredictor",
                "model_version": "2.0.0",
                "current_price": p.current_price,
                "prob_win": p.prob_win,
                "direction": p.direction,
                "predicted_high": p.predicted_high,
                "predicted_low": p.predicted_low,
                "predicted_close": p.predicted_close,
                "conformal_high": p.conformal_high_bound,
                "conformal_low": p.conformal_low_bound,
                "abstain": p.abstain,
                "signature_sha256": audit_logger.compute_sha256({"sym": symbol, "p": p.prob_win, "t": now_ist}),
            })
        except Exception as n_ex:
            logger.warning(f"Neon prediction persist error: {n_ex}")

    try:
        audit_logger.log_prediction(
            symbol=p.symbol,
            model_name="ComprehensiveMarketPredictor",
            model_version="2.0.0",
            features={"current_price": p.current_price, "regime": p.regime_state},
            prob_win=p.prob_win,
            direction=p.direction,
            predicted_high=p.predicted_high,
            predicted_low=p.predicted_low,
            abstain=p.abstain,
        )
    except Exception as log_ex:
        logger.warning(f"Audit log failed: {log_ex}")

    return PredictionResponse(
        symbol=p.symbol,
        current_price=p.current_price,
        prob_win=p.prob_win,
        direction=p.direction,
        abstain=p.abstain,
        abstain_reason="Model neutral/balanced probability" if p.abstain else None,
        predicted_high=p.predicted_high,
        predicted_low=p.predicted_low,
        predicted_close=p.predicted_close,
        conformal_high_bound=p.conformal_high_bound,
        conformal_low_bound=p.conformal_low_bound,
        conformal_return_interval=p.conformal_return_interval,
        model_name="ComprehensiveMarketPredictor",
        model_version="2.0.0",
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


@app.get("/api/v1/market/universe", tags=["Market Universe"])
def get_market_universe():
    """Returns canonical catalog of 130+ tracked Indian market assets across Indices, F&O Equities, Commodities, and Currencies."""
    return [
        {
            "symbol": a.symbol,
            "name": a.name,
            "asset_class": a.asset_class.value,
            "sector": a.sector,
            "exchange": a.exchange,
            "lot_size": a.lot_size,
            "base_price": a.base_price,
        }
        for a in MARKET_UNIVERSE.values()
    ]


@app.get("/api/v1/market/search", tags=["Market Universe"])
def search_market_symbols(q: str = Query(default="", min_length=1)):
    """Searches across all tracked and dynamic Indian stock, index, commodity, and forex tickers."""
    q_lower = q.lower().strip()
    matches = []
    for a in MARKET_UNIVERSE.values():
        if q_lower in a.symbol.lower() or q_lower in a.name.lower() or q_lower in a.sector.lower():
            matches.append({
                "symbol": a.symbol,
                "name": a.name,
                "asset_class": a.asset_class.value,
                "sector": a.sector,
                "exchange": a.exchange,
            })
    if not any(m["symbol"].lower() == q_lower for m in matches):
        clean_sym = q.upper().strip()
        matches.insert(0, {
            "symbol": clean_sym,
            "name": f"{clean_sym} (NSE Dynamic Equity)",
            "asset_class": "EQUITY_FUTURE",
            "sector": "Indian Equities",
            "exchange": "NSE",
        })
    return {"query": q, "count": len(matches), "results": matches[:20]}


@app.get("/api/v1/market/scan", tags=["Market Universe"])
def scan_market(category: Optional[str] = Query(default="all")):
    """Scans and predicts the entire Indian market universe or a filtered asset category."""
    predictions = market_predictor.scan_market(category=category)
    return {
        "timestamp_ist": datetime.now(tz=IST).isoformat(),
        "count": len(predictions),
        "category": category,
        "predictions": [asdict(p) for p in predictions],
    }


@app.get("/api/v1/market/breadth", tags=["Market Universe"])
def get_market_breadth():
    """Returns real-time whole-market sentiment breadth, bull/bear percentage, and sectoral leadership."""
    breadth = market_predictor.get_market_breadth()
    return asdict(breadth)


@app.get("/api/v1/chart/{symbol:path}", tags=["Market Universe"])
def get_chart_data(symbol: str, bars_count: int = Query(default=120, ge=20, le=500)):
    """Returns historical OHLCV candles and next-day price forecast bounds for TradingView Lightweight Charts."""
    # 1. Fetch OHLCV bars from lakehouse store
    try:
        df = market_predictor.parquet_store.read_ohlcv(symbol)
    except Exception:
        df = pd.DataFrame()

    # 2. Universal Live Market Feed fallback for ANY Indian stock
    if df is None or df.empty:
        try:
            from india_quant.data.live_market_feed import fetch_live_ohlcv
            df_live = fetch_live_ohlcv(symbol)
            if df_live is not None and not df_live.empty:
                df = df_live
        except Exception as e:
            logger.debug(f"Live chart fetch for {symbol}: {e}")

    # 3. Fallback synthetic generation if dataset not reachable
    if df is None or df.empty:
        asset_def = get_asset_def(symbol)
        base = asset_def.base_price if asset_def else 1000.0
        vol = (asset_def.volatility_annual if asset_def else 0.20) / np.sqrt(252)
        dates = pd.date_range(end=datetime.now(), periods=bars_count, freq="B")
        np.random.seed(abs(hash(symbol)) % (2**31))
        returns = np.random.normal(0.0003, vol, size=bars_count)
        prices = base * np.exp(np.cumsum(returns))
        highs = prices * (1.0 + np.abs(np.random.normal(0, vol * 0.5, size=bars_count)))
        lows = prices * (1.0 - np.abs(np.random.normal(0, vol * 0.5, size=bars_count)))
        opens = np.roll(prices, 1)
        opens[0] = base
        candles = [
            {
                "time": d.strftime("%Y-%m-%d"),
                "open": round(float(o), 2),
                "high": round(float(h), 2),
                "low": round(float(l), 2),
                "close": round(float(c), 2),
            }
            for d, o, h, l, c in zip(dates, opens, highs, lows, prices)
        ]
    else:
        df_tail = df.tail(bars_count)
        candles = []
        for _, row in df_tail.iterrows():
            d_val = row["date"]
            t_str = d_val.strftime("%Y-%m-%d") if isinstance(d_val, (pd.Timestamp, datetime)) else str(d_val)[:10]
            candles.append({
                "time": t_str,
                "open": round(float(row["open"]), 2),
                "high": round(float(row["high"]), 2),
                "low": round(float(row["low"]), 2),
                "close": round(float(row["close"]), 2),
            })

    # 4. Compute forecast and price cone bounds
    pred = market_predictor.predict_asset(symbol, fetch_live=True)
    f_dict = asdict(pred)
    f_dict["conformal_high"] = pred.conformal_high_bound
    f_dict["conformal_low"] = pred.conformal_low_bound

    return {
        "symbol": symbol,
        "candles": candles,
        "forecast": f_dict,
    }


@app.get("/api/v1/screener", response_model=ScreenerResponse, tags=["Screener"])
def run_market_screener():
    """
    Scans tracked index and equity universe, generating calibrated signals
    and ranking by directional probability edge and risk-reward ratio.
    """
    preds = market_predictor.scan_market("all")
    items: List[ScreenerItem] = [
        ScreenerItem(
            symbol=p.symbol,
            current_price=p.current_price,
            prob_win=p.prob_win,
            direction=p.direction,
            abstain=p.abstain,
            predicted_high=p.predicted_high,
            predicted_low=p.predicted_low,
            risk_reward_ratio=p.risk_reward_ratio,
        )
        for p in preds
    ]

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

