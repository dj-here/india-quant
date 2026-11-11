"""
Neon PostgreSQL Provisioning & Schema Migration Script for IndiaQuant.
Usage:
    python scripts/setup_neon.py [optional_neon_connection_url]
"""

import sys
import os
from pathlib import Path

# Add src to PYTHONPATH
src_path = Path(__file__).resolve().parent.parent / "src"
if str(src_path) not in sys.path:
    sys.path.insert(0, str(src_path))

from india_quant.data.storage.neon_store import NeonDataStore


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else None
    store = NeonDataStore(connection_url=url)

    print("=" * 60)
    print("IndiaQuant -> Neon Serverless PostgreSQL Setup")
    print("=" * 60)

    if not store.is_configured:
        print("[!] No Neon connection URL detected.")
        print("    Set NEON_DATABASE_URL or DATABASE_URL in your .env, or pass it as an argument:")
        print("    python scripts/setup_neon.py 'postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require'")
        sys.exit(1)

    print(f"Connecting to Neon endpoint: {store.url.split('@')[-1] if '@' in store.url else 'configured'}")
    try:
        success = store.init_schema()
        if success:
            print("[✓] Neon PostgreSQL database successfully connected and provisioned!")
            print("    Tables created/verified:")
            print("    - market_bars (OHLCV, OI, Delivery)")
            print("    - model_predictions (Direction, High/Low bounds, Conformal intervals)")
            print("    - paper_orders (Executed trades, statutory friction breakdown)")
            print("    - portfolio_snapshots (MTM equity, liquid cash, drawdowns)")
            print("    - audit_trail (Cryptographic SHA-256 SEBI governance log)")
        else:
            print("[x] Neon setup encountered an error.")
    except Exception as e:
        print(f"[x] Connection failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
