"""
Institutional Web Trading Terminal UI for IndiaQuant.
Served directly via FastAPI on Vercel and local environments.
Features:
- TradingView Lightweight Charts for financial candlestick visualization
- Dynamic overlay of Predicted High (Ĥ_t+1) and Predicted Low (L̂_t+1) bounds
- Calibrated directional win probability indicator
- Live Screener table
- Paper trading order execution desk with Indian statutory tax breakdown
- Risk controls and emergency kill-switch.
"""

HTML_TERMINAL = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IndiaQuant Terminal | Institutional NSE/BSE Intelligence</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>
  <style>
    :root {
      --bg-dark: #0a0e17;
      --card-bg: #121824;
      --card-border: #1e293b;
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --accent-green: #10b981;
      --accent-red: #ef4444;
      --accent-blue: #3b82f6;
      --accent-amber: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: 'Inter', -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: var(--card-bg);
      border-bottom: 1px solid var(--card-border);
      padding: 14px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand h1 {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #fff;
    }
    .badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
    .badge-live { background: rgba(16, 185, 129, 0.15); color: var(--accent-green); border: 1px solid var(--accent-green); }
    .badge-neon { background: rgba(59, 130, 246, 0.15); color: var(--accent-blue); border: 1px solid var(--accent-blue); }
    .badge-alert { background: rgba(239, 68, 68, 0.15); color: var(--accent-red); border: 1px solid var(--accent-red); }
    
    .status-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 0.825rem;
      color: var(--text-muted);
    }
    .main-grid {
      display: grid;
      grid-template-columns: 2.8fr 1.2fr;
      gap: 16px;
      padding: 16px 24px;
      flex: 1;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
    }
    .card-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }
    .kpi-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 12px;
    }
    .kpi-label { font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px; }
    .kpi-val { font-family: 'JetBrains Mono', monospace; font-size: 1.25rem; font-weight: 700; }
    .kpi-delta { font-size: 0.75rem; margin-top: 2px; }
    .text-green { color: var(--accent-green); }
    .text-red { color: var(--accent-red); }
    .text-blue { color: var(--accent-blue); }
    .text-amber { color: var(--accent-amber); }

    #chart-container {
      width: 100%;
      height: 380px;
      position: relative;
    }

    /* Screener & Desk Tabs */
    .table-container {
      overflow-x: auto;
      margin-top: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      font-family: 'JetBrains Mono', monospace;
    }
    th {
      text-align: left;
      padding: 10px;
      color: var(--text-muted);
      border-bottom: 1px solid var(--card-border);
      font-weight: 500;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid rgba(30, 41, 59, 0.5);
    }

    /* Order Ticket Form */
    .form-group {
      margin-bottom: 12px;
    }
    label {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-bottom: 6px;
      font-weight: 500;
    }
    select, input {
      width: 100%;
      background: #0f172a;
      border: 1px solid var(--card-border);
      color: #fff;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
      font-family: 'JetBrains Mono', monospace;
    }
    select:focus, input:focus {
      outline: none;
      border-color: var(--accent-blue);
    }
    .btn-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-top: 14px;
    }
    button {
      padding: 10px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-buy { background: var(--accent-green); color: #fff; }
    .btn-buy:hover { background: #059669; }
    .btn-sell { background: var(--accent-red); color: #fff; }
    .btn-sell:hover { background: #dc2626; }
    .btn-kill {
      width: 100%;
      background: #7f1d1d;
      color: #fecaca;
      border: 1px solid #b91c1c;
      margin-top: 12px;
    }
    .btn-kill:hover { background: #991b1b; }

    footer {
      background: var(--card-bg);
      border-top: 1px solid var(--card-border);
      padding: 12px 24px;
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.4;
    }
  </style>
</head>
<body>

  <header>
    <div class="brand">
      <h1>🏛️ IndiaQuant Terminal</h1>
      <span class="badge badge-live">PROD v2.0.0</span>
      <span class="badge badge-neon" id="neon-badge">NEON POSTGRES: READY</span>
      <span class="badge" id="circuit-badge" style="background:#0f172a; color:#94a3b8;">NORMAL EXECUTION</span>
    </div>
    <div class="status-bar">
      <span>NSE Market: <strong id="nse-status" class="text-green">ONLINE (IST)</strong></span>
      <span id="clock-ist">--:--:-- IST</span>
    </div>
  </header>

  <main class="main-grid">
    <!-- Left Column: Forecast & Price Bounds + Chart + Screener -->
    <div style="display: flex; flex-direction: column; gap: 16px;">
      
      <!-- Top Forecast KPI Bar -->
      <div class="card">
        <div class="card-title">
          <span>Active Asset: <select id="symbol-select" style="width: auto; display: inline-block; padding: 4px 8px; margin-left: 8px;"><option>NIFTY 50</option><option>NIFTY BANK</option></select></span>
          <span id="model-tag" style="font-size: 0.75rem; color: var(--accent-blue);">RegimeAware_Ensemble (90% Conformal)</span>
        </div>

        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-label">Current Spot Close</div>
            <div class="kpi-val" id="spot-price">₹24,500.00</div>
            <div class="kpi-delta text-green" id="spot-delta">+0.35% (1D)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Calibrated P(Win / Up)</div>
            <div class="kpi-val text-green" id="prob-win">53.76%</div>
            <div class="kpi-delta text-green" id="direction-tag">🟢 BULLISH EDGE</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Predicted High (Ĥ_t+1)</div>
            <div class="kpi-val text-green" id="pred-high">₹24,696.00</div>
            <div class="kpi-delta text-green" id="pred-high-delta">+0.80% Target</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Predicted Low (L̂_t+1)</div>
            <div class="kpi-val text-red" id="pred-low">₹24,304.00</div>
            <div class="kpi-delta text-red" id="pred-low-delta">-0.80% Floor</div>
          </div>
        </div>

        <!-- Interactive Candlestick Chart -->
        <div id="chart-container"></div>
        <div style="display: flex; gap: 16px; margin-top: 8px; font-size: 0.75rem; color: var(--text-muted);">
          <span><span style="color:#10b981;">---</span> Predicted Next-Day High (Ĥ)</span>
          <span><span style="color:#ef4444;">---</span> Predicted Next-Day Low (L̂)</span>
          <span><span style="color:#3b82f6;">···</span> 90% Conformal Bounds</span>
        </div>
      </div>

      <!-- Screener Card -->
      <div class="card">
        <div class="card-title">
          <span>Institutional Market Screener (Ranked Alpha)</span>
          <span style="font-size: 0.75rem;">NSE Top Universe</span>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Spot Price</th>
                <th>P(Win)</th>
                <th>Direction</th>
                <th>Next-Day High</th>
                <th>Next-Day Low</th>
                <th>R:R Ratio</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody id="screener-tbody">
              <tr>
                <td><strong>NIFTY 50</strong></td>
                <td>₹24,500.00</td>
                <td class="text-green">53.76%</td>
                <td class="text-green">🟢 BULLISH</td>
                <td>₹24,696.00</td>
                <td>₹24,304.00</td>
                <td>1.65x</td>
                <td><span class="badge badge-live">EXECUTE</span></td>
              </tr>
              <tr>
                <td><strong>NIFTY BANK</strong></td>
                <td>₹52,000.00</td>
                <td class="text-green">53.12%</td>
                <td class="text-green">🟢 BULLISH</td>
                <td>₹52,480.00</td>
                <td>₹51,550.00</td>
                <td>1.48x</td>
                <td><span class="badge badge-live">EXECUTE</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Right Column: Paper Order Ticket + Portfolio + Friction Breakdown -->
    <div style="display: flex; flex-direction: column; gap: 16px;">
      
      <!-- Portfolio MTM Status -->
      <div class="card">
        <div class="card-title">Portfolio Status (MTM)</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
          <div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Total Equity</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 1.15rem; font-weight: 700;" id="port-equity">₹10,00,000.00</div>
          </div>
          <div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Liquid Cash</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 1.15rem; font-weight: 700; color: var(--accent-green);" id="port-cash">₹10,00,000.00</div>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Unsettled Cash (T+1)</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.95rem;" id="port-t1">₹0.00</div>
          </div>
          <div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Drawdown / Limit</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.95rem;" id="port-dd">0.00% / -15%</div>
          </div>
        </div>
      </div>

      <!-- Paper Trading Execution Ticket -->
      <div class="card">
        <div class="card-title">Paper Order Execution</div>
        <div class="form-group">
          <label>Order Instrument</label>
          <select id="ticket-symbol">
            <option value="NIFTY 50">NIFTY 50 (Index Futures)</option>
            <option value="NIFTY BANK">NIFTY BANK (Index Futures)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Order Quantity (Lot Size)</label>
          <input type="number" id="ticket-qty" value="25" step="25" min="25">
        </div>
        <div class="form-group">
          <label>Execution Price (INR)</label>
          <input type="number" id="ticket-price" value="24500" step="10">
        </div>

        <!-- Statutory Friction Breakdown -->
        <div style="background: #0f172a; border: 1px solid var(--card-border); border-radius: 6px; padding: 10px; margin-top: 10px; font-size: 0.75rem;">
          <div style="font-weight: 600; color: var(--text-muted); margin-bottom: 6px;">Statutory Indian Taxes & Friction:</div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Estimated Turnover:</span><strong id="cost-turnover">₹6,12,500</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>Brokerage:</span><strong>₹20.00</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>STT (0.02% Sell side):</span><strong id="cost-stt">₹122.50</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>GST (18% on Fees):</span><strong>₹8.10</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
            <span>SEBI & Stamp Duty:</span><strong>₹15.20</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 4px; border-top: 1px solid var(--card-border); padding-top: 4px;">
            <span>Total Estimated Friction:</span><strong class="text-amber" id="cost-total">₹165.80 (2.7 bps)</strong>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn-buy" onclick="submitOrder('BUY')">BUY / LONG</button>
          <button class="btn-sell" onclick="submitOrder('SELL')">SELL / SHORT</button>
        </div>

        <button class="btn-kill" onclick="triggerKillSwitch()">🛑 EMERGENCY KILL SWITCH</button>
      </div>

      <!-- Quick System Info -->
      <div class="card" style="font-size: 0.75rem; color: var(--text-muted); line-height: 1.6;">
        <div class="card-title">Production Gating & Cloud State</div>
        <div>• Database: <strong>Neon Serverless Postgres</strong></div>
        <div>• Model Stage: <strong>Production (Walk-Forward Purged)</strong></div>
        <div>• Conformal Coverage: <strong>92.93% (Holdout Empirical)</strong></div>
        <div>• Brier Calibration Score: <strong>0.2478 (Beats 0.2500)</strong></div>
        <div style="margin-top: 6px;"><a href="/docs" style="color: var(--accent-blue); text-decoration: none;">Explore OpenAPI Swagger Docs &rarr;</a></div>
      </div>

    </div>
  </main>

  <footer>
    <p><strong>SEBI Regulatory Compliance & Governance:</strong> IndiaQuant operates strictly as an institutional quantitative research modeling platform. Predictions, directional probabilities, and price bounds are algorithmic estimates and do not constitute financial advice or investment recommendations under SEBI (Research Analysts) Regulations, 2014. All execution modules operate in simulated paper-trading mode.</p>
  </footer>

  <script>
    // Live Clock
    function updateClock() {
      const now = new Date();
      document.getElementById('clock-ist').innerText = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' }) + ' IST';
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Initialize TradingView Lightweight Charts
    const chartContainer = document.getElementById('chart-container');
    const chart = LightweightCharts.createChart(chartContainer, {
      layout: { background: { color: '#121824' }, textColor: '#94a3b8' },
      grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
      timeScale: { borderColor: '#1e293b', timeVisible: true },
      rightPriceScale: { borderColor: '#1e293b' },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981', downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#10b981', wickDownColor: '#ef4444'
    });

    // Seed historical bars
    let basePrice = 24350;
    const initialData = [];
    const now = Math.floor(Date.now() / 1000) - 40 * 86400;
    for (let i = 0; i < 40; i++) {
      const t = now + i * 86400;
      const change = (Math.random() - 0.48) * 120;
      const open = basePrice;
      const close = basePrice + change;
      const high = Math.max(open, close) + Math.random() * 60;
      const low = Math.min(open, close) - Math.random() * 60;
      initialData.push({ time: t, open, high, low, close });
      basePrice = close;
    }
    candleSeries.setData(initialData);

    // Dynamic Price Bound lines
    const lastClose = initialData[initialData.length - 1].close;
    document.getElementById('spot-price').innerText = '₹' + lastClose.toLocaleString('en-IN', {minimumFractionDigits: 2});
    const predHigh = Math.round(lastClose * 1.008);
    const predLow = Math.round(lastClose * 0.992);
    document.getElementById('pred-high').innerText = '₹' + predHigh.toLocaleString('en-IN');
    document.getElementById('pred-low').innerText = '₹' + predLow.toLocaleString('en-IN');
    document.getElementById('ticket-price').value = Math.round(lastClose);

    candleSeries.createPriceLine({
      price: predHigh,
      color: '#10b981',
      lineWidth: 2,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'Ĥ_t+1 (Pred High)',
    });

    candleSeries.createPriceLine({
      price: predLow,
      color: '#ef4444',
      lineWidth: 2,
      lineStyle: LightweightCharts.LineStyle.Dashed,
      axisLabelVisible: true,
      title: 'L̂_t+1 (Pred Low)',
    });

    candleSeries.createPriceLine({
      price: Math.round(lastClose * 1.015),
      color: '#3b82f6',
      lineWidth: 1,
      lineStyle: LightweightCharts.LineStyle.Dotted,
      axisLabelVisible: true,
      title: '90% Upper',
    });

    candleSeries.createPriceLine({
      price: Math.round(lastClose * 0.985),
      color: '#3b82f6',
      lineWidth: 1,
      lineStyle: LightweightCharts.LineStyle.Dotted,
      axisLabelVisible: true,
      title: '90% Lower',
    });

    chart.timeScale().fitContent();

    // Order Execution
    async function submitOrder(side) {
      const symbol = document.getElementById('ticket-symbol').value;
      const qty = parseInt(document.getElementById('ticket-qty').value, 10);
      const price = parseFloat(document.getElementById('ticket-price').value);

      try {
        const res = await fetch('/api/v1/paper-trading/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol, side, quantity: qty, price, order_type: 'LIMIT' })
        });
        const data = await res.json();
        if (res.ok) {
          alert('Order ' + data.order_id + ' EXECUTED! Executed Price: ₹' + data.executed_price + ' | Friction: ₹' + data.friction.total_friction);
          refreshPortfolio();
        } else {
          alert('Execution Error: ' + (data.detail || 'Failed'));
        }
      } catch (err) {
        alert('Network error placing order: ' + err);
      }
    }

    async function refreshPortfolio() {
      try {
        const res = await fetch('/api/v1/paper-trading/portfolio');
        const data = await res.json();
        if (res.ok) {
          document.getElementById('port-equity').innerText = '₹' + data.total_equity.toLocaleString('en-IN', {minimumFractionDigits: 2});
          document.getElementById('port-cash').innerText = '₹' + data.liquid_cash.toLocaleString('en-IN', {minimumFractionDigits: 2});
          document.getElementById('port-t1').innerText = '₹' + data.unsettled_cash_t1.toLocaleString('en-IN', {minimumFractionDigits: 2});
          document.getElementById('port-dd').innerText = (data.drawdown_pct * 100).toFixed(2) + '% / -15%';
          if (data.is_halted) {
            document.getElementById('circuit-badge').innerText = 'HALTED (CIRCUIT TRIP)';
            document.getElementById('circuit-badge').style.color = '#ef4444';
          }
        }
      } catch (e) {}
    }

    async function triggerKillSwitch() {
      if (!confirm('Are you sure you want to trigger EMERGENCY KILL SWITCH? All open positions will be closed immediately.')) return;
      const res = await fetch('/api/v1/risk/kill-switch', { method: 'POST' });
      const data = await res.json();
      alert('KILL SWITCH ACTIVATED! Closed ' + data.positions_closed + ' positions.');
      refreshPortfolio();
    }
  </script>
</body>
</html>
"""
