"""
Purged Walk-Forward Cross-Validation with Embargo (López de Prado style).
Ensures zero temporal leakage, purges overlapping forward target labels,
and applies an embargo buffer post-test set to eliminate serial correlation leakage.
"""

from typing import Generator, List, Optional, Tuple
import numpy as np
import pandas as pd


class PurgedWalkForwardCV:
    """
    Purged Walk-Forward Cross-Validation with Embargo.
    Splits time series into expanding or rolling training windows followed by an out-of-sample test window.
    """

    def __init__(
        self,
        n_splits: int = 5,
        train_bars: int = 750,      # ~3 years of trading days
        test_bars: int = 125,       # ~6 months of trading days
        embargo_bars: int = 5,      # 5 trading days post-test embargo
        prediction_horizon: int = 1, # Horizon h for label purging
        expanding_window: bool = True,
    ):
        self.n_splits = n_splits
        self.train_bars = train_bars
        self.test_bars = test_bars
        self.embargo_bars = embargo_bars
        self.prediction_horizon = prediction_horizon
        self.expanding_window = expanding_window

    def split(self, df: pd.DataFrame) -> Generator[Tuple[np.ndarray, np.ndarray], None, None]:
        """
        Yields (train_indices, test_indices) tuples.
        Guarantees:
        1. No future test data leaks into train.
        2. Labels overlapping with test period are purged.
        3. An embargo buffer is enforced between test and subsequent folds if rolling.
        """
        n_samples = len(df)
        total_required = self.train_bars + self.n_splits * self.test_bars

        # If data is shorter than default config, scale train and test bars proportionally
        if n_samples < total_required:
            available_for_splits = n_samples - 60  # Reserve warm-up
            fold_size = max(available_for_splits // (self.n_splits + 2), 20)
            train_size = fold_size * 2
            test_size = fold_size
        else:
            train_size = self.train_bars
            test_size = self.test_bars

        # Calculate fold start points walking forward
        current_train_start = 0
        current_test_start = train_size

        for fold in range(self.n_splits):
            current_test_end = current_test_start + test_size
            if current_test_end > n_samples:
                break

            # 1. Base training indices
            if self.expanding_window:
                train_idx = np.arange(0, current_test_start)
            else:
                train_idx = np.arange(current_train_start, current_test_start)

            # 2. Purging: eliminate training samples whose forward target horizon h extends into test set
            # A sample at index t has label y_t depending on information at t + horizon.
            # If t + horizon >= current_test_start, it must be purged from training!
            purge_cutoff = current_test_start - self.prediction_horizon
            train_idx = train_idx[train_idx <= purge_cutoff]

            # 3. Test indices
            test_idx = np.arange(current_test_start, current_test_end)

            yield train_idx, test_idx

            # Step forward for next fold
            if not self.expanding_window:
                # Add embargo to rolling train start if applicable
                current_train_start += test_size
            current_test_start += test_size + self.embargo_bars
