"""
Parquet Data Lake Storage Manager for IndiaQuant.
Handles atomic writes, partitioned reads, schema validation, and metadata tracking
under the local or AWS S3 lakehouse directory.
"""

from dataclasses import dataclass
from datetime import datetime
import json
import os
from pathlib import Path
import tempfile
from typing import Dict, List, Optional
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import pytz

IST = pytz.timezone("Asia/Kolkata")


@dataclass
class LakeMetadata:
    symbol: str
    asset_class: str
    total_bars: int
    first_timestamp: Optional[str]
    last_timestamp: Optional[str]
    file_size_bytes: int
    last_updated_ist: str


class ParquetDataStore:
    """
    Manages reading and writing columnar Parquet time-series datasets.
    Path layout: {lake_root}/{asset_class}/{symbol}.parquet
    """

    STANDARD_COLUMNS = ["open", "high", "low", "close", "volume", "oi"]

    def __init__(self, lake_root: str = "./data/lake"):
        self.lake_root = Path(lake_root)
        self.lake_root.mkdir(parents=True, exist_ok=True)

    def _get_file_path(self, asset_class: str, symbol: str) -> Path:
        sanitized_symbol = symbol.replace("/", "_").replace("^", "").strip()
        dir_path = self.lake_root / asset_class.lower()
        dir_path.mkdir(parents=True, exist_ok=True)
        return dir_path / f"{sanitized_symbol}.parquet"

    def write_ohlcv(
        self,
        df: pd.DataFrame,
        asset_class: str,
        symbol: str,
        compression: str = "snappy",
    ) -> Path:
        """
        Atomically writes or replaces an OHLCV DataFrame to Parquet.
        DataFrame must have a DatetimeIndex (localized or will be localized to Asia/Kolkata).
        """
        if df.empty:
            raise ValueError(f"Cannot save empty DataFrame for symbol {symbol}")

        out_df = df.copy()

        # Validate standard columns exist
        missing = [col for col in self.STANDARD_COLUMNS if col not in out_df.columns]
        if missing:
            # If oi is missing, default to 0
            for m in missing:
                if m == "oi":
                    out_df["oi"] = 0
                else:
                    raise ValueError(f"DataFrame missing required column: {m}")

        # Ensure index is DatetimeIndex
        if not isinstance(out_df.index, pd.DatetimeIndex):
            raise TypeError("DataFrame index must be a pandas DatetimeIndex.")

        # Localize or convert index to Asia/Kolkata
        if out_df.index.tz is None:
            out_df.index = out_df.index.tz_localize(IST)
        else:
            out_df.index = out_df.index.tz_convert(IST)

        # Sort chronologically
        out_df = out_df.sort_index()

        target_file = self._get_file_path(asset_class, symbol)

        # Convert index to explicit column 'timestamp' for Arrow compatibility
        reset_df = out_df.reset_index().rename(columns={"index": "timestamp"})
        table = pa.Table.from_pandas(reset_df, preserve_index=False)

        # Atomic write: write to a temp file in same directory then atomically rename
        temp_fd, temp_path = tempfile.mkstemp(
            prefix=f"{target_file.stem}_",
            suffix=".tmp",
            dir=str(target_file.parent),
        )
        os.close(temp_fd)

        try:
            pq.write_table(table, temp_path, compression=compression)
            # Atomic replace
            os.replace(temp_path, target_file)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

        # Save metadata sidecar
        self._write_metadata(target_file, asset_class, symbol, out_df)

        return target_file

    def read_ohlcv(
        self,
        asset_class: str,
        symbol: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        columns: Optional[List[str]] = None,
    ) -> pd.DataFrame:
        """
        Reads OHLCV dataset from Parquet, returning a DataFrame indexed by Asia/Kolkata timestamp.
        """
        target_file = self._get_file_path(asset_class, symbol)
        if not target_file.exists():
            raise FileNotFoundError(f"Parquet file not found: {target_file}")

        read_cols = ["timestamp"] + (columns if columns else self.STANDARD_COLUMNS)
        # Deduplicate while preserving order
        read_cols = list(dict.fromkeys(read_cols))

        table = pq.read_table(target_file, columns=read_cols)
        df = table.to_pandas()

        df["timestamp"] = pd.to_datetime(df["timestamp"])
        if df["timestamp"].dt.tz is None:
            df["timestamp"] = df["timestamp"].dt.tz_localize(IST)
        else:
            df["timestamp"] = df["timestamp"].dt.tz_convert(IST)

        df = df.set_index("timestamp").sort_index()

        if start_date is not None:
            if start_date.tzinfo is None:
                start_date = IST.localize(start_date)
            df = df[df.index >= start_date]

        if end_date is not None:
            if end_date.tzinfo is None:
                end_date = IST.localize(end_date)
            df = df[df.index <= end_date]

        return df

    def get_metadata(self, asset_class: str, symbol: str) -> Optional[LakeMetadata]:
        """Reads metadata sidecar for a given symbol."""
        target_file = self._get_file_path(asset_class, symbol)
        meta_file = target_file.with_suffix(".json")
        if not meta_file.exists():
            return None
        with open(meta_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        return LakeMetadata(**data)

    def _write_metadata(
        self,
        file_path: Path,
        asset_class: str,
        symbol: str,
        df: pd.DataFrame,
    ) -> None:
        meta = LakeMetadata(
            symbol=symbol,
            asset_class=asset_class,
            total_bars=len(df),
            first_timestamp=df.index[0].isoformat() if not df.empty else None,
            last_timestamp=df.index[-1].isoformat() if not df.empty else None,
            file_size_bytes=file_path.stat().st_size if file_path.exists() else 0,
            last_updated_ist=datetime.now(tz=IST).isoformat(),
        )
        meta_path = file_path.with_suffix(".json")
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(meta.__dict__, f, indent=2)

    def list_available_symbols(self, asset_class: Optional[str] = None) -> Dict[str, List[str]]:
        """Lists all symbols stored in the lake grouped by asset class."""
        result: Dict[str, List[str]] = {}
        if asset_class:
            class_dirs = [self.lake_root / asset_class.lower()]
        else:
            class_dirs = [d for d in self.lake_root.iterdir() if d.is_dir()]

        for c_dir in class_dirs:
            if c_dir.exists():
                symbols = [p.stem for p in c_dir.glob("*.parquet")]
                result[c_dir.name] = sorted(symbols)
        return result
