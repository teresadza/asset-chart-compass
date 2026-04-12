
## Market Data Dashboard

### Overview
A clean market data visualization app for stocks and mutual funds, using mock data with a custom date range picker.

### Features

1. **Asset Selector** — Searchable dropdown to pick from a list of sample stocks (AAPL, MSFT, TSLA, AMZN, GOOGL) and mutual funds (VFIAX, FXAIX, SWPPX). Selecting an asset loads its chart.

2. **Price Chart** — Interactive line chart (using Recharts) showing the selected asset's price over time. Includes hover tooltips with date, price, and daily change. Y-axis auto-scales to the data range.

3. **Custom Date Range Filter** — Two date pickers (start date / end date) to filter the chart. Quick preset buttons (1D, 1W, 1M, 3M, 1Y, All) for convenience alongside the custom picker.

4. **Asset Summary Card** — Shows current price, daily change (%), and a small sparkline for at-a-glance performance above the main chart.

5. **Mock Data Engine** — Generates realistic historical price data (up to 5 years) for each asset using a random walk algorithm seeded per ticker, so data is consistent across visits.

### Design
- Light, clean layout with a top bar for asset selection and date filters
- Chart takes up the main content area
- Responsive: stacks controls vertically on mobile
