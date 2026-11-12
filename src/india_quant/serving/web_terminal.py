"""
Institutional Web Trading Terminal UI for IndiaQuant.
Served directly via FastAPI on Vercel and local environments.
Features:
- Full Indian Market Universe: 18 Indices, 32 F&O Equities, 9 MCX Commodities, 6 Currencies
- TradingView Lightweight Charts with Dynamic Forecast Price Cone Overlay
- Real-Time Market Breadth Sentiment Ribbon (Bull/Bear Ratio, Top Sectors, VIX)
- Multi-Category Screener with Instant Search & 1-Click Asset Analysis
- Paper trading order execution desk with Indian statutory tax breakdown
- Risk controls and emergency kill-switch.
"""

HTML_TERMINAL = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IndiaQuant Terminal | Whole Indian Market Predictor (NSE/BSE/MCX)</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>
  <style>
    :root {
      --bg-dark: #080c14;
      --card-bg: #0f1623;
      --card-border: #1e293b;
      --card-border-subtle: rgba(255, 255, 255, 0.06);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent-green: #10b981;
      --accent-red: #ef4444;
      --accent-blue: #3b82f6;
      --accent-cyan: #06b6d4;
      --accent-amber: #f59e0b;
      --accent-purple: #8b5cf6;
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
      padding: 12px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand h1 {
      font-size: 1.3rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, #fff 40%, var(--accent-cyan) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .badge-live { background: rgba(16, 185, 129, 0.15); color: var(--accent-green); border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-neon { background: rgba(59, 130, 246, 0.15); color: var(--accent-blue); border: 1px solid rgba(59, 130, 246, 0.3); }
    .badge-mcx { background: rgba(245, 158, 11, 0.15); color: var(--accent-amber); border: 1px solid rgba(245, 158, 11, 0.3); }

    .status-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      font-size: 0.8rem;
      color: var(--text-muted);
      font-family: 'JetBrains Mono', monospace;
    }

    /* Market Breadth Ribbon */
    .breadth-ribbon {
      background: rgba(15, 22, 35, 0.95);
      border-bottom: 1px solid var(--card-border);
      padding: 8px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.78rem;
      font-family: 'JetBrains Mono', monospace;
      overflow-x: auto;
      gap: 16px;
    }
    .breadth-item { display: flex; align-items: center; gap: 6px; }
    .breadth-bar {
      width: 140px;
      height: 6px;
      background: #1e293b;
      border-radius: 3px;
      overflow: hidden;
      display: flex;
    }
    .breadth-bull { background: var(--accent-green); height: 100%; }
    .breadth-bear { background: var(--accent-red); height: 100%; }

    /* Category Nav Tabs */
    .category-nav {
      display: flex;
      gap: 8px;
      padding: 12px 24px 0 24px;
      overflow-x: auto;
    }
    .cat-btn {
      background: rgba(30, 41, 59, 0.4);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 7px 14px;
      border-radius: 6px 6px 0 0;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .cat-btn:hover { color: #fff; background: rgba(59, 130, 246, 0.1); }
    .cat-btn.active {
      color: #fff;
      background: var(--card-bg);
      border-bottom-color: var(--card-bg);
      border-top: 2px solid var(--accent-cyan);
    }

    .main-grid {
      display: grid;
      grid-template-columns: 2.7fr 1.3fr;
      gap: 16px;
      padding: 12px 24px 24px 24px;
      flex: 1;
    }
    @media (max-width: 1200px) {
      .main-grid { grid-template-columns: 1fr; }
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
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    /* KPI Row */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    @media (max-width: 768px) {
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
    }
    .kpi-card {
      background: rgba(10, 14, 23, 0.6);
      border: 1px solid var(--card-border);
      border-radius: 6px;
      padding: 10px 12px;
    }
    .kpi-label { font-size: 0.72rem; color: var(--text-muted); margin-bottom: 4px; }
    .kpi-val { font-family: 'JetBrains Mono', monospace; font-size: 1.2rem; font-weight: 700; }
    .kpi-sub { font-size: 0.72rem; margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
    
    .text-green { color: var(--accent-green); }
    .text-red { color: var(--accent-red); }
    .text-blue { color: var(--accent-blue); }
    .text-cyan { color: var(--accent-cyan); }
    .text-amber { color: var(--accent-amber); }
    .text-purple { color: var(--accent-purple); }

    /* Chart Container */
    #chart-container {
      width: 100%;
      height: 380px;
      position: relative;
      background: #080c14;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.04);
    }

    /* Controls Bar */
    .controls-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .search-box {
      background: #090e17;
      border: 1px solid var(--card-border);
      color: #fff;
      padding: 6px 10px;
      border-radius: 5px;
      font-size: 0.8rem;
      font-family: 'JetBrains Mono', monospace;
      width: 180px;
    }
    .search-box:focus { outline: none; border-color: var(--accent-cyan); }
    .select-asset {
      background: #090e17;
      border: 1px solid var(--card-border);
      color: #fff;
      padding: 6px 10px;
      border-radius: 5px;
      font-size: 0.8rem;
      font-family: 'JetBrains Mono', monospace;
    }
    .btn-action {
      background: var(--accent-cyan);
      color: #000;
      font-weight: 700;
      font-size: 0.78rem;
      padding: 6px 12px;
      border-radius: 5px;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-action:hover { filter: brightness(1.15); transform: translateY(-1px); }

    /* Screener Table */
    .table-container {
      overflow-x: auto;
      max-height: 480px;
      margin-top: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
      font-family: 'JetBrains Mono', monospace;
    }
    th {
      position: sticky;
      top: 0;
      background: #111a29;
      text-align: left;
      padding: 8px 10px;
      color: var(--text-muted);
      border-bottom: 1px solid var(--card-border);
      font-weight: 600;
      font-size: 0.75rem;
      letter-spacing: 0.03em;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      white-space: nowrap;
    }
    tr:hover { background: rgba(59, 130, 246, 0.05); }

    .signal-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .sig-strong-buy { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; }
    .sig-buy { background: rgba(16, 185, 129, 0.1); color: var(--accent-green); }
    .sig-neutral { background: rgba(148, 163, 184, 0.1); color: var(--text-muted); }
    .sig-sell { background: rgba(239, 68, 68, 0.1); color: var(--accent-red); }
    .sig-strong-sell { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; }

    /* Order Desk */
    .form-group { margin-bottom: 10px; }
    label { display: block; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 4px; font-weight: 600; }
    .form-control {
      width: 100%;
      background: #090e17;
      border: 1px solid var(--card-border);
      color: #fff;
      padding: 8px 10px;
      border-radius: 5px;
      font-size: 0.82rem;
      font-family: 'JetBrains Mono', monospace;
    }
    .btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
    button.desk-btn {
      padding: 9px;
      border-radius: 5px;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-buy { background: var(--accent-green); color: #000; }
    .btn-buy:hover { filter: brightness(1.15); }
    .btn-sell { background: var(--accent-red); color: #fff; }
    .btn-sell:hover { filter: brightness(1.15); }
    .btn-kill {
      width: 100%;
      background: #450a0a;
      color: #fca5a5;
      border: 1px solid #991b1b;
      margin-top: 10px;
    }
    .btn-kill:hover { background: #7f1d1d; }

    footer {
      background: var(--card-bg);
      border-top: 1px solid var(--card-border);
      padding: 10px 24px;
      font-size: 0.72rem;
      color: var(--text-muted);
      line-height: 1.4;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
    }
  </style>
</head>
<body>

  <!-- Top Header -->
  <header>
    <div class="brand">
      <h1>🏛️ IndiaQuant Market Predictor</h1>
      <span class="badge badge-live">NSE / BSE / MCX</span>
      <span class="badge badge-neon" id="neon-badge">NEON POSTGRES: SYNCED</span>
      <span class="badge badge-mcx">100+ STOCKS & UNIVERSAL LOOKUP (2000+ NSE/BSE)</span>
    </div>
    <div class="status-bar">
      <span>India Market: <strong id="market-status" class="text-green">TRADING ACTIVE (IST)</strong></span>
      <span id="clock-ist">--:--:-- IST</span>
    </div>
  </header>

  <!-- Live Market Breadth Ribbon -->
  <div class="breadth-ribbon">
    <div class="breadth-item">
      <span>Market Breadth:</span>
      <div class="breadth-bar">
        <div class="breadth-bull" id="breadth-bull-bar" style="width: 58%;"></div>
        <div class="breadth-bear" id="breadth-bear-bar" style="width: 42%;"></div>
      </div>
      <strong id="breadth-ratio" class="text-green">58% BULLISH</strong>
    </div>
    <div class="breadth-item">
      <span>Sentiment: <strong id="overall-sentiment" class="text-cyan">MODERATELY BULLISH</strong></span>
    </div>
    <div class="breadth-item">
      <span>Leading Sector: <strong id="top-sector" class="text-green">Technology</strong></span>
    </div>
    <div class="breadth-item">
      <span>India VIX: <strong id="vix-val" class="text-amber">13.80 (-2.1%)</strong></span>
    </div>
    <button class="btn-action" onclick="runMarketScan()">⚡ SCAN ENTIRE MARKET</button>
  </div>

  <!-- Asset Category Filter Tabs -->
  <div class="category-nav">
    <button class="cat-btn active" onclick="switchCategory('all', this)">🌐 All Market (130+)</button>
    <button class="cat-btn" onclick="switchCategory('indices', this)">📊 Indices (18)</button>
    <button class="cat-btn" onclick="switchCategory('equities', this)">⚡ Indian Stocks (100+)</button>
    <button class="cat-btn" onclick="switchCategory('commodities', this)">🪙 MCX Commodities (9)</button>
    <button class="cat-btn" onclick="switchCategory('currencies', this)">💱 Currencies & Macro (6)</button>
  </div>

  <main class="main-grid">
    <!-- Left Column: Forecast & Active Chart & Full Screener -->
    <div style="display: flex; flex-direction: column; gap: 14px;">
      
      <!-- Top Forecast KPI Bar for Selected Asset -->
      <div class="card">
        <div class="card-title">
          <div class="controls-bar" style="flex-wrap: wrap; width: 100%;">
            <span>Asset:</span>
            <select id="symbol-select" class="select-asset" onchange="selectAsset(this.value)">
              <!-- Populated dynamically via /api/v1/market/universe -->
              <option value="NIFTY 50">NIFTY 50 (Benchmark)</option>
              <option value="NIFTY BANK">NIFTY BANK (Banking)</option>
              <option value="GOLD">GOLD (MCX Bullion)</option>
              <option value="CRUDE OIL">CRUDE OIL (MCX Energy)</option>
              <option value="RELIANCE">RELIANCE (NSE Heavyweight)</option>
              <option value="USDINR">USDINR (Forex)</option>
            </select>
            <input type="text" id="asset-search" class="search-box" placeholder="Filter tracked list..." oninput="filterAssets(this.value)">
            <div style="display: flex; gap: 6px; align-items: center; margin-left: auto;">
              <input type="text" id="custom-stock-input" class="search-box" style="width: 250px; border: 1px solid var(--accent-cyan);" placeholder="Type ANY Stock (e.g. HAL, SUZLON, TRENT)..." onkeydown="if(event.key==='Enter') lookupCustomStock()">
              <button class="btn-action" style="background: linear-gradient(135deg, #0284c7, #06b6d4);" onclick="lookupCustomStock()">🔍 PREDICT ANY STOCK</button>
            </div>
          </div>
          <span id="model-tag" class="text-cyan" style="font-size: 0.75rem; font-family: 'JetBrains Mono', monospace;">
            Conformal 90% Monotonic Projection
          </span>
        </div>

        <div class="kpi-row">
          <div class="kpi-card">
            <div class="kpi-label">Spot Price</div>
            <div class="kpi-val" id="spot-price">₹25,350.00</div>
            <div class="kpi-sub text-green" id="spot-delta">+0.45% (1D)</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Win Probability P(Up)</div>
            <div class="kpi-val text-green" id="win-prob">56.2%</div>
            <div class="kpi-sub" id="sig-label"><span class="signal-badge sig-buy">BUY</span></div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Next-Day Target High</div>
            <div class="kpi-val text-cyan" id="pred-high">₹25,489.00</div>
            <div class="kpi-sub" id="conf-high-label">Upper 90%: ₹25,744.00</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Next-Day Target Low</div>
            <div class="kpi-val text-red" id="pred-low">₹25,239.00</div>
            <div class="kpi-sub" id="conf-low-label">Lower 90%: ₹24,987.00</div>
          </div>
        </div>

        <!-- TradingView Lightweight Candlestick Chart -->
        <div id="chart-container"></div>
      </div>

      <!-- Whole Market Screener & Conviction Ranking -->
      <div class="card">
        <div class="card-title">
          <span>Whole Market Screener (<span id="screener-count">65</span> Assets Scanned)</span>
          <span style="font-size: 0.72rem; color: var(--text-muted);">Ranked by Conviction Edge</span>
        </div>
        <div class="table-container">
          <table id="screener-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Asset Class</th>
                <th>Sector</th>
                <th>Spot Price</th>
                <th>1D Change</th>
                <th>P(Up) Prob</th>
                <th>Signal</th>
                <th>Target High (Ĥ)</th>
                <th>Target Low (L̂)</th>
                <th>R:R</th>
                <th>Regime</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="screener-body">
              <tr><td colspan="12" style="text-align: center; color: var(--text-muted); padding: 20px;">Loading live market universe predictions...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Right Column: Institutional Order Desk & Portfolio Status -->
    <div style="display: flex; flex-direction: column; gap: 14px;">
      
      <!-- Paper Execution Desk -->
      <div class="card">
        <div class="card-title">
          <span>⚡ Paper Execution Desk</span>
          <span class="badge badge-live">NSE / MCX T+1</span>
        </div>
        <div class="form-group">
          <label>Selected Symbol</label>
          <input type="text" id="order-symbol" class="form-control" value="NIFTY 50" readonly>
        </div>
        <div class="form-group">
          <label>Order Type</label>
          <select id="order-type" class="form-control">
            <option>MARKET</option>
            <option>LIMIT</option>
          </select>
        </div>
        <div class="form-group">
          <label>Quantity (Shares / Units)</label>
          <input type="number" id="order-qty" class="form-control" value="25" min="1">
        </div>
        <div class="form-group">
          <label>Execution Price (Est.)</label>
          <input type="number" id="order-price" class="form-control" value="25350.00">
        </div>

        <div class="btn-row">
          <button class="desk-btn btn-buy" onclick="placeOrder('BUY')">BUY / LONG</button>
          <button class="desk-btn btn-sell" onclick="placeOrder('SELL')">SELL / SHORT</button>
        </div>

        <button class="desk-btn btn-kill" onclick="triggerKillSwitch()">🚨 EMERGENCY KILL-SWITCH (SQUARE OFF)</button>
        <div id="order-alert" style="margin-top: 10px; font-size: 0.75rem; font-family: 'JetBrains Mono', monospace;"></div>
      </div>

      <!-- Portfolio Status & Risk Controls -->
      <div class="card">
        <div class="card-title">
          <span>💼 Simulated Portfolio</span>
          <span class="badge" id="risk-badge" style="background:#090e17; color:#10b981;">RISK NORMAL</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">Total Equity:</span>
            <strong id="port-equity">₹10,00,000.00</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">Liquid Cash:</span>
            <strong id="port-cash" class="text-green">₹10,00,000.00</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">Unsettled Cash (T+1):</span>
            <strong id="port-unsettled">₹0.00</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">Max Drawdown:</span>
            <strong id="port-dd" class="text-cyan">0.00% (Limit: 15%)</strong>
          </div>
        </div>
      </div>

      <!-- Statutory Indian Market Charges Breakdown -->
      <div class="card">
        <div class="card-title">
          <span>🏛️ Indian Statutory Friction</span>
          <span style="font-size: 0.7rem; color: var(--text-muted);">SEBI / Exchange Rates</span>
        </div>
        <div style="font-size: 0.72rem; color: var(--text-muted); line-height: 1.5; font-family: 'JetBrains Mono', monospace;">
          <div>• STT / CTT: 0.0125% - 0.1% on Turnover</div>
          <div>• Exchange Charges: 0.00345% (NSE) / 0.0026% (MCX)</div>
          <div>• SEBI Turnover Fee: ₹10 / Crore</div>
          <div>• GST: 18% on Brokerage & Exchange Fees</div>
          <div>• Stamp Duty: 0.003% (Futures) / 0.015% (Delivery)</div>
          <div>• Settlement: Strict T+1 Clearing Standard</div>
        </div>
      </div>

    </div>
  </main>

  <!-- Footer Disclaimers -->
  <footer>
    <div>
      <strong>SEBI REGULATORY NOTICE:</strong> Algorithmic market prediction software for quantitative research only. Not financial advice. Past performance does not guarantee future market returns.
    </div>
    <div>
      Powered by <strong>IndiaQuant Engine v2.0</strong> | Neon Serverless PostgreSQL | TradingView Lightweight Charts
    </div>
  </footer>

  <script>
    let activeSymbol = "NIFTY 50";
    let activeCategory = "all";
    let chart, candleSeries, highLine, lowLine, closeLine;
    let allPredictions = [];

    // Initialize Lightweight Chart
    function initChart() {
      const container = document.getElementById("chart-container");
      chart = LightweightCharts.createChart(container, {
        layout: {
          background: { color: "#080c14" },
          textColor: "#94a3b8",
          fontFamily: "'JetBrains Mono', monospace",
        },
        grid: {
          vertLines: { color: "rgba(255, 255, 255, 0.04)" },
          horzLines: { color: "rgba(255, 255, 255, 0.04)" },
        },
        timeScale: {
          borderColor: "#1e293b",
          timeVisible: true,
        },
        rightPriceScale: {
          borderColor: "#1e293b",
        },
      });

      candleSeries = chart.addCandlestickSeries({
        upColor: "#10b981",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
      });

      highLine = chart.addLineSeries({ color: "#06b6d4", lineWidth: 2, lineStyle: 2, title: "Target High Ĥ" });
      lowLine = chart.addLineSeries({ color: "#ef4444", lineWidth: 2, lineStyle: 2, title: "Target Low L̂" });
      closeLine = chart.addLineSeries({ color: "#3b82f6", lineWidth: 1, lineStyle: 3, title: "Pred Close Ĉ" });

      window.addEventListener("resize", () => {
        chart.resize(container.clientWidth, container.clientHeight);
      });
    }

    // Populate Symbol Select Dropdown with all 65 Assets
    async function loadUniverse() {
      try {
        const res = await fetch("/api/v1/market/scan?category=all");
        const data = await res.json();
        allPredictions = data.predictions || [];

        const sel = document.getElementById("symbol-select");
        sel.innerHTML = "";

        // Group by Asset Class
        const groups = { "INDEX": "Indices (18)", "EQUITY_FUTURE": "F&O Equities (32)", "COMMODITY": "MCX Commodities (9)", "CURRENCY_MACRO": "Currencies & Macro (6)" };
        const grouped = {};
        allPredictions.forEach(p => {
          if (!grouped[p.asset_class]) grouped[p.asset_class] = [];
          grouped[p.asset_class].push(p);
        });

        for (const [cls, list] of Object.entries(grouped)) {
          const optGroup = document.createElement("optgroup");
          optGroup.label = groups[cls] || cls;
          list.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.symbol;
            opt.textContent = `${p.symbol} - ${p.name}`;
            optGroup.appendChild(opt);
          });
          sel.appendChild(optGroup);
        }

        renderScreenerTable(allPredictions);
        loadBreadth();
        loadChartData(activeSymbol);
      } catch (err) {
        console.error("Failed to load market universe:", err);
      }
    }

    // Load Candlestick & Forecast Data
    async function loadChartData(symbol) {
      try {
        const res = await fetch(`/api/v1/chart/${encodeURIComponent(symbol)}`);
        const data = await res.json();

        if (data.candles && data.candles.length > 0) {
          candleSeries.setData(data.candles);

          // Update KPIs
          const f = data.forecast;
          const lastCandle = data.candles[data.candles.length - 1];
          document.getElementById("spot-price").textContent = "₹" + f.current_price.toLocaleString("en-IN", { minimumFractionDigits: 2 });
          document.getElementById("win-prob").textContent = (f.prob_win * 100).toFixed(1) + "%";
          document.getElementById("pred-high").textContent = "₹" + f.predicted_high.toLocaleString("en-IN", { minimumFractionDigits: 2 });
          document.getElementById("pred-low").textContent = "₹" + f.predicted_low.toLocaleString("en-IN", { minimumFractionDigits: 2 });
          document.getElementById("conf-high-label").textContent = "Upper 90%: ₹" + f.conformal_high.toLocaleString("en-IN", { minimumFractionDigits: 2 });
          document.getElementById("conf-low-label").textContent = "Lower 90%: ₹" + f.conformal_low.toLocaleString("en-IN", { minimumFractionDigits: 2 });

          // Signal badge
          const sigEl = document.getElementById("sig-label");
          let sigClass = "sig-neutral";
          if (f.signal === "STRONG BUY") sigClass = "sig-strong-buy";
          else if (f.signal === "BUY") sigClass = "sig-buy";
          else if (f.signal === "SELL") sigClass = "sig-sell";
          else if (f.signal === "STRONG SELL") sigClass = "sig-strong-sell";
          sigEl.innerHTML = `<span class="signal-badge ${sigClass}">${f.signal}</span>`;

          // Order Desk update
          document.getElementById("order-symbol").value = symbol;
          document.getElementById("order-price").value = f.current_price.toFixed(2);

          // Forecast Cone overlays
          const lastTime = lastCandle.time;
          highLine.setData([
            { time: lastTime, value: f.current_price },
            { time: lastTime, value: f.predicted_high }
          ]);
          lowLine.setData([
            { time: lastTime, value: f.current_price },
            { time: lastTime, value: f.predicted_low }
          ]);
          closeLine.setData([
            { time: lastTime, value: f.current_price },
            { time: lastTime, value: f.predicted_close }
          ]);

          chart.timeScale().fitContent();
        }
      } catch (e) {
        console.error("Chart load error:", e);
      }
    }

    // Lookup ANY Indian Stock (2000+ NSE/BSE)
    async function lookupCustomStock() {
      const input = document.getElementById("custom-stock-input");
      let sym = (input.value || "").trim().toUpperCase();
      if (!sym) return;

      document.getElementById("spot-price").textContent = "Analyzing " + sym + "...";
      document.getElementById("win-prob").textContent = "...";
      selectAsset(sym);
    }

    // Select Asset with Dynamic Auto-Addition
    function selectAsset(sym) {
      activeSymbol = sym;
      const sel = document.getElementById("symbol-select");
      let found = false;
      for (let i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === sym) {
          sel.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found) {
        const opt = document.createElement("option");
        opt.value = sym;
        opt.textContent = `${sym} (Dynamic Stock)`;
        opt.selected = true;
        sel.prepend(opt);
        sel.selectedIndex = 0;
      }
      loadChartData(sym);
    }

    // Switch Category Tabs
    function switchCategory(cat, btn) {
      activeCategory = cat;
      document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
      if (btn) btn.classList.add("active");

      runMarketScan(cat);
    }

    // Run Live Market Scan
    async function runMarketScan(cat = activeCategory) {
      try {
        const res = await fetch(`/api/v1/market/scan?category=${cat}`);
        const data = await res.json();
        allPredictions = data.predictions || [];
        renderScreenerTable(allPredictions);
        loadBreadth();
      } catch (e) {
        console.error("Scan error:", e);
      }
    }

    // Render Screener Table
    function renderScreenerTable(list) {
      const tbody = document.getElementById("screener-body");
      document.getElementById("screener-count").textContent = list.length;
      tbody.innerHTML = "";

      list.forEach(p => {
        const tr = document.createElement("tr");

        let sigClass = "sig-neutral";
        if (p.signal === "STRONG BUY") sigClass = "sig-strong-buy";
        else if (p.signal === "BUY") sigClass = "sig-buy";
        else if (p.signal === "SELL") sigClass = "sig-sell";
        else if (p.signal === "STRONG SELL") sigClass = "sig-strong-sell";

        const deltaClass = p.change_1d_pct >= 0 ? "text-green" : "text-red";
        const deltaSign = p.change_1d_pct >= 0 ? "+" : "";

        tr.innerHTML = `
          <td><strong>${p.symbol}</strong></td>
          <td><span class="badge" style="background:#1e293b; color:#94a3b8;">${p.asset_class}</span></td>
          <td style="color: var(--text-muted);">${p.sector}</td>
          <td><strong>₹${p.current_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></td>
          <td class="${deltaClass}">${deltaSign}${p.change_1d_pct}%</td>
          <td><strong class="${p.prob_win >= 0.5 ? 'text-green' : 'text-red'}">${(p.prob_win * 100).toFixed(1)}%</strong></td>
          <td><span class="signal-badge ${sigClass}">${p.signal}</span></td>
          <td class="text-cyan">₹${p.predicted_high.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td class="text-red">₹${p.predicted_low.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td><strong>${p.risk_reward_ratio}:1</strong></td>
          <td style="font-size: 0.72rem; color: var(--text-muted);">${p.regime_label}</td>
          <td><button class="btn-action" style="padding: 3px 8px; font-size: 0.7rem;" onclick="selectAsset('${p.symbol}')">ANALYZE</button></td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Filter Assets on search input
    function filterAssets(q) {
      const filtered = allPredictions.filter(p =>
        p.symbol.toLowerCase().includes(q.toLowerCase()) ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.sector.toLowerCase().includes(q.toLowerCase())
      );
      renderScreenerTable(filtered);
    }

    // Load Market Breadth
    async function loadBreadth() {
      try {
        const res = await fetch("/api/v1/market/breadth");
        const b = await res.json();

        document.getElementById("breadth-bull-bar").style.width = b.bullish_pct + "%";
        document.getElementById("breadth-bear-bar").style.width = b.bearish_pct + "%";
        document.getElementById("breadth-ratio").textContent = `${b.bullish_pct}% BULLISH (${b.bullish_count}/${b.total_scanned})`;
        document.getElementById("overall-sentiment").textContent = b.overall_sentiment;
        document.getElementById("top-sector").textContent = b.top_bullish_sector;
        document.getElementById("vix-val").textContent = b.vix_level.toFixed(2);
      } catch (e) {
        console.error("Breadth error:", e);
      }
    }

    // Place Paper Trading Order
    async function placeOrder(side) {
      const sym = document.getElementById("order-symbol").value;
      const qty = parseInt(document.getElementById("order-qty").value) || 25;
      const type = document.getElementById("order-type").value;
      const price = parseFloat(document.getElementById("order-price").value) || null;

      const alertEl = document.getElementById("order-alert");
      alertEl.innerHTML = `<span style="color: var(--accent-blue);">Executing ${side} order on NSE/MCX...</span>`;

      try {
        const res = await fetch("/api/v1/paper-trading/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ symbol: sym, side, quantity: qty, order_type: type, price })
        });
        const d = await res.json();
        alertEl.innerHTML = `<span style="color: var(--accent-green);">✔ Executed #${d.order_id.slice(0,8)} @ ₹${d.executed_price.toFixed(2)} | Total Friction: ₹${d.friction.total_friction.toFixed(2)}</span>`;
        loadPortfolio();
      } catch (e) {
        alertEl.innerHTML = `<span style="color: var(--accent-red);">✖ Execution Failed: ${e}</span>`;
      }
    }

    // Load Portfolio
    async function loadPortfolio() {
      try {
        const res = await fetch("/api/v1/paper-trading/portfolio");
        const p = await res.json();
        document.getElementById("port-equity").textContent = "₹" + p.total_equity.toLocaleString("en-IN", { minimumFractionDigits: 2 });
        document.getElementById("port-cash").textContent = "₹" + p.liquid_cash.toLocaleString("en-IN", { minimumFractionDigits: 2 });
        document.getElementById("port-unsettled").textContent = "₹" + p.unsettled_cash_t1.toLocaleString("en-IN", { minimumFractionDigits: 2 });
        document.getElementById("port-dd").textContent = (p.drawdown_pct * 100).toFixed(2) + "% (Limit: 15%)";
      } catch (e) {
        console.error("Portfolio load error:", e);
      }
    }

    // Emergency Kill Switch
    async function triggerKillSwitch() {
      if (!confirm("EMERGENCY KILL-SWITCH: Square off all open positions immediately?")) return;
      try {
        const res = await fetch("/api/v1/risk/kill-switch", { method: "POST" });
        const d = await res.json();
        alert(`Kill-switch triggered! Closed ${d.positions_closed} positions. Freed cash: ₹${d.freed_cash_inr.toFixed(2)}`);
        loadPortfolio();
      } catch (e) {
        alert("Kill-switch error: " + e);
      }
    }

    // Clock IST
    function updateClock() {
      const now = new Date();
      const istOptions = { timeZone: "Asia/Kolkata", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" };
      document.getElementById("clock-ist").textContent = now.toLocaleTimeString("en-GB", istOptions) + " IST";
    }
    setInterval(updateClock, 1000);
    updateClock();

    // Init
    window.addEventListener("DOMContentLoaded", () => {
      initChart();
      loadUniverse();
      loadPortfolio();
    });
  </script>
</body>
</html>
"""
