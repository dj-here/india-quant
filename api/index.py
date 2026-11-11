"""
Vercel Serverless Function Entrypoint for IndiaQuant Platform.
Exposes the FastAPI application as a serverless ASGI handler.
"""

import sys
import os
import traceback
from pathlib import Path

# Add project root and src/ to sys.path for Vercel Serverless runtime
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
SRC_DIR = PROJECT_ROOT / "src"

for path in [str(PROJECT_ROOT), str(SRC_DIR)]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from india_quant.serving.app import app
except Exception as e:
    from fastapi import FastAPI
    from fastapi.responses import HTMLResponse
    err_trace = traceback.format_exc()
    app = FastAPI(title="IndiaQuant Emergency Fallback")

    @app.get("/{full_path:path}", response_class=HTMLResponse)
    def handle_error(full_path: str = ""):
        return HTMLResponse(
            f"<h2>IndiaQuant Serverless Initialization Error</h2><pre>{err_trace}</pre>",
            status_code=500,
        )
