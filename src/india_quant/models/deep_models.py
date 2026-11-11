"""
Deep Sequence Modeling for IndiaQuant using PyTorch.
Implements a multi-task Bidirectional LSTM architecture predicting:
1. Directional win probability P(R_{t+1} > 0)
2. Expected forward return
3. Next-Day High and Low log-ratios with monotonic bounds.
"""

from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, TensorDataset
    HAS_TORCH = True
    _BaseModule = nn.Module
except ImportError:
    torch = None
    nn = None
    DataLoader = None
    TensorDataset = None
    HAS_TORCH = False
    _BaseModule = object


class _MultiTaskLSTMNetwork(_BaseModule):
    """PyTorch multi-task recurrent sequence architecture."""

    def __init__(self, input_dim: int, hidden_dim: int = 64, num_layers: int = 2, dropout: float = 0.2):
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        lstm_out_dim = hidden_dim * 2

        self.shared_fc = nn.Sequential(
            nn.Linear(lstm_out_dim, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
        )

        # Multi-task prediction heads
        self.head_dir = nn.Sequential(nn.Linear(64, 1), nn.Sigmoid())
        self.head_ret = nn.Linear(64, 1)
        self.head_high = nn.Sequential(nn.Linear(64, 1), nn.Softplus())  # Strictly >= 0
        self.head_low = nn.Sequential(nn.Linear(64, 1), nn.Softplus())   # Will be negated <= 0

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
        out, _ = self.lstm(x)
        # Take final sequence state
        last_hidden = out[:, -1, :]
        feat = self.shared_fc(last_hidden)

        p_dir = self.head_dir(feat)
        p_ret = self.head_ret(feat)
        p_high = self.head_high(feat)
        p_low = -self.head_low(feat)  # Negated to enforce <= 0

        return p_dir, p_ret, p_high, p_low


class LSTMSequenceForecaster:
    """
    Scikit-learn compatible wrapper around the PyTorch Bidirectional LSTM multi-task forecaster.
    """

    def __init__(
        self,
        lookback_window: int = 15,
        hidden_dim: int = 48,
        num_layers: int = 2,
        dropout: float = 0.2,
        batch_size: int = 64,
        epochs: int = 20,
        learning_rate: float = 0.003,
    ):
        self.lookback_window = lookback_window
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.dropout = dropout
        self.batch_size = batch_size
        self.epochs = epochs
        self.learning_rate = learning_rate

        self.scaler = StandardScaler()
        self.net: Optional[_MultiTaskLSTMNetwork] = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def _create_sequences(
        self,
        X_scaled: np.ndarray,
        y_dir: Optional[np.ndarray] = None,
        y_ret: Optional[np.ndarray] = None,
        y_high: Optional[np.ndarray] = None,
        y_low: Optional[np.ndarray] = None,
    ):
        seqs = []
        L = self.lookback_window
        n = len(X_scaled)

        for i in range(L, n):
            seqs.append(X_scaled[i - L : i])

        X_seq = np.array(seqs, dtype=np.float32)
        if y_dir is None:
            return X_seq

        y_dir_seq = y_dir[L:]
        y_ret_seq = y_ret[L:]
        y_high_seq = y_high[L:]
        y_low_seq = y_low[L:]

        return X_seq, y_dir_seq, y_ret_seq, y_high_seq, y_low_seq

    def fit(
        self,
        X: pd.DataFrame,
        y_dir: pd.Series,
        y_ret: pd.Series,
        y_high: pd.Series,
        y_low: pd.Series,
    ):
        X_clean = X.fillna(0.0).values
        X_scaled = self.scaler.fit_transform(X_clean)

        res = self._create_sequences(
            X_scaled,
            y_dir.values.astype(np.float32),
            y_ret.values.astype(np.float32),
            y_high.values.astype(np.float32),
            y_low.values.astype(np.float32),
        )
        X_seq, yd, yr, yh, yl = res

        # Filter NaNs in target sequences
        valid_mask = ~np.isnan(yd) & ~np.isnan(yr) & ~np.isnan(yh) & ~np.isnan(yl)
        X_seq = X_seq[valid_mask]
        yd = yd[valid_mask]
        yr = yr[valid_mask]
        yh = yh[valid_mask]
        yl = yl[valid_mask]

        if len(X_seq) < 30:
            return self

        dataset = TensorDataset(
            torch.tensor(X_seq),
            torch.tensor(yd).unsqueeze(1),
            torch.tensor(yr).unsqueeze(1),
            torch.tensor(yh).unsqueeze(1),
            torch.tensor(yl).unsqueeze(1),
        )
        loader = DataLoader(dataset, batch_size=self.batch_size, shuffle=True)

        input_dim = X.shape[1]
        self.net = _MultiTaskLSTMNetwork(
            input_dim=input_dim,
            hidden_dim=self.hidden_dim,
            num_layers=self.num_layers,
            dropout=self.dropout,
        ).to(self.device)

        optimizer = torch.optim.Adam(self.net.parameters(), lr=self.learning_rate)
        bce_loss = nn.BCELoss()
        mse_loss = nn.MSELoss()

        self.net.train()
        for epoch in range(self.epochs):
            for batch_x, b_yd, b_yr, b_yh, b_yl in loader:
                batch_x = batch_x.to(self.device)
                b_yd = b_yd.to(self.device)
                b_yr = b_yr.to(self.device)
                b_yh = b_yh.to(self.device)
                b_yl = b_yl.to(self.device)

                optimizer.zero_grad()
                p_dir, p_ret, p_high, p_low = self.net(batch_x)

                loss = (
                    bce_loss(p_dir, b_yd)
                    + 100.0 * mse_loss(p_ret, b_yr)
                    + 50.0 * mse_loss(p_high, b_yh)
                    + 50.0 * mse_loss(p_low, b_yl)
                )
                loss.backward()
                optimizer.step()

        return self

    def predict(self, X: pd.DataFrame, current_prices: Optional[pd.Series] = None) -> Dict[str, np.ndarray]:
        n = len(X)
        if self.net is None:
            return {
                "prob_up": np.full(n, 0.50),
                "pred_dir": np.zeros(n, dtype=int),
                "pred_return_50": np.zeros(n),
                "pred_high_ratio_50": np.full(n, 0.008),
                "pred_low_ratio_50": np.full(n, -0.008),
            }

        X_clean = X.fillna(0.0).values
        X_scaled = self.scaler.transform(X_clean)
        L = self.lookback_window

        # Prepend initial rows so output length matches n exactly
        pad = np.repeat(X_scaled[:1], L, axis=0)
        padded_X = np.vstack([pad, X_scaled])
        X_seq = self._create_sequences(padded_X)

        self.net.eval()
        with torch.no_grad():
            t_x = torch.tensor(X_seq, dtype=torch.float32).to(self.device)
            p_dir, p_ret, p_high, p_low = self.net(t_x)

            prob_up = np.atleast_1d(p_dir.cpu().squeeze().numpy())[-n:]
            pred_ret = np.atleast_1d(p_ret.cpu().squeeze().numpy())[-n:]
            pred_high = np.atleast_1d(p_high.cpu().squeeze().numpy())[-n:]
            pred_low = np.atleast_1d(p_low.cpu().squeeze().numpy())[-n:]

        pred_dir = (prob_up >= 0.50).astype(int)

        out = {
            "prob_up": np.clip(prob_up, 0.01, 0.99),
            "pred_dir": pred_dir,
            "pred_return_50": pred_ret,
            "pred_high_ratio_50": pred_high,
            "pred_low_ratio_50": pred_low,
        }

        if current_prices is not None:
            c = current_prices.values
            out["pred_high_price_50"] = np.round(c * np.exp(pred_high), 2)
            out["pred_low_price_50"] = np.round(c * np.exp(pred_low), 2)

        return out
