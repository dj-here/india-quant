"""
Vercel Serverless Function Entrypoint for IndiaQuant Platform.
Exposes the FastAPI application as a serverless ASGI handler.
"""

import sys
import os
from pathlib import Path

# Add project root and src/ to sys.path for Vercel Serverless runtime
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
SRC_DIR = PROJECT_ROOT / "src"

for path in [str(PROJECT_ROOT), str(SRC_DIR)]:
    if path not in sys.path:
        sys.path.insert(0, path)

# Import the production FastAPI app
from india_quant.serving.app import app

# Vercel looks for the ASGI callable `app`
app = app
