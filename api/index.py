"""
Vercel Serverless Function Entrypoint for IndiaQuant Platform.
Exposes the FastAPI application as a serverless ASGI handler.
"""

import sys
import os
import ctypes
import traceback
from pathlib import Path

# Add project root and src/ to sys.path for Vercel Serverless runtime
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
SRC_DIR = PROJECT_ROOT / "src"
LIB_DIR = PROJECT_ROOT / "lib"

for path in [str(PROJECT_ROOT), str(SRC_DIR)]:
    if path not in sys.path:
        sys.path.insert(0, path)

# Preload libgomp.so.1 for OpenMP runtime on AWS Lambda / Vercel Serverless
if sys.platform != "win32":
    os.environ["LD_LIBRARY_PATH"] = f"{str(LIB_DIR)}:{os.environ.get('LD_LIBRARY_PATH', '')}"

    for _lib_cand in [LIB_DIR / "libgomp.so.1", Path("/var/task/lib/libgomp.so.1")]:
        if _lib_cand.exists():
            try:
                ctypes.CDLL(str(_lib_cand))
                break
            except Exception as _e:
                print(f"Notice: Preload {_lib_cand} returned: {_e}", file=sys.stderr)

try:
    from india_quant.serving.app import app as _fastapi_app, serve_web_terminal

    # Add explicit route aliases for /api/index in case of direct rewrite hit
    @_fastapi_app.get("/api/index", include_in_schema=False)
    @_fastapi_app.get("/api/index/", include_in_schema=False)
    def vercel_root_alias():
        return serve_web_terminal()

    _app_instance = _fastapi_app

except Exception as e:
    err_trace = traceback.format_exc()
    print(f"CRITICAL: IndiaQuant Serverless Initialization Error:\n{err_trace}", file=sys.stderr, flush=True)

    from fastapi import FastAPI
    from fastapi.responses import HTMLResponse

    _fallback_app = FastAPI(title="IndiaQuant Emergency Fallback")

    error_html = (
        "<!DOCTYPE html>"
        "<html><head><title>IndiaQuant - Deployment Error</title>"
        "<style>body{font-family:sans-serif;background:#0d1117;color:#c9d1d9;padding:40px;line-height:1.6}"
        "h1{color:#f85149}pre{background:#161b22;padding:20px;border-radius:8px;overflow-x:auto;color:#79c0ff;font-size:14px;border:1px solid #30363d}"
        "</style></head><body>"
        "<h1>IndiaQuant Serverless Initialization Error</h1>"
        "<p>The application encountered an unhandled exception during serverless cold start:</p>"
        f"<pre>{err_trace}</pre>"
        "</body></html>"
    )

    @_fallback_app.get("/", response_class=HTMLResponse)
    def root_error():
        return HTMLResponse(content=error_html, status_code=500)

    @_fallback_app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"], response_class=HTMLResponse)
    def catch_all_error(full_path: str = ""):
        return HTMLResponse(content=error_html, status_code=500)

    _app_instance = _fallback_app

# Top-level ASGI entrypoints explicitly detected by Vercel Python runtime AST scanner
app = _app_instance
application = app
handler = app
