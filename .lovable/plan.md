

## Restructure App: Spreadsheet-Driven, 3-Layer Portfolio Tool

### Goal
Replace mock data generator with a spreadsheet-driven data model. Reorganize the app into three layered use cases while preserving existing UI concepts (charts, compare, date filter, % change toggle, allocator, save/load, piecewise fit, summary stats).

### Data Model (Spreadsheet-Driven)

A single Excel workbook `public/data/portfolio_data.xlsx` (parsed at app load) with sheets:

| Sheet | Columns | Purpose |
|-------|---------|---------|
| `assets` | `ticker, name, asset_class, sector, region, currency, is_benchmark` | Asset metadata — drives selectors everywhere |
| `prices` | `date, ticker, price` (long format) | Time-series for every ticker incl. benchmarks |
| `portfolio_holdings` | `ticker, weight, portfolio_name` | Actual portfolio weights (supports multiple named portfolios) |
| `benchmarks` | `portfolio_name, benchmark_ticker` | Maps each portfolio to its benchmark |

A starter `.xlsx` ships in `public/data/` so the app runs out-of-the-box. Users can replace it.

### Architecture

```text
public/data/portfolio_data.xlsx
        │
        ▼
src/lib/dataLoader.ts   ← fetch + parse xlsx (SheetJS) once, cache in context
        │
        ▼
src/contexts/DataContext.tsx   ← exposes assets[], prices, holdings, benchmarks
        │
        ├── src/lib/priceSeries.ts   (lookup, filter, pct_change → cumprod)
        ├── src/lib/portfolioCalc.ts (weighted returns — no more ASSETS import)
        └── src/lib/portfolioStats.ts (unchanged)
```

All current files that import `ASSETS` / `generatePriceData` from `mockData.ts` are rewired to read from `DataContext`. `mockData.ts` is deleted.

### Three-Layer UI

Replace current 2-tab header (`Market Data` / `Portfolio`) with 3 tabs:

| Tab | Route concept | Reuses |
|-----|---------------|--------|
| **Portfolio Monitoring** | actual portfolio (from `portfolio_holdings`) | Allocator (read-only view), PriceChart, SummaryCards, benchmark overlay auto-loaded, contribution breakdown (new small component) |
| **Asset Exploration** | current Market Data page | AssetSelector, ComparisonSelector, PriceChart, DateRangeFilter, % change toggle, piecewise fit |
| **Portfolio Construction** | current Portfolio page (what-if) | PortfolioAllocator (editable), SaveLoad, SummaryCards, ComparisonSelector, ShowAssets toggle |

State is preserved across tabs (existing `display:none` pattern in `App.tsx` stays).

### Key Behaviors

- **Actual vs simulated separation**: Monitoring tab loads weights from `portfolio_holdings` sheet (read-only badge "Actual"). Construction tab starts blank or from a saved/loaded simulated portfolio. They never share state.
- **Benchmark auto-overlay**: Monitoring tab automatically overlays the mapped benchmark from `benchmarks` sheet; Construction tab lets the user pick.
- **Contribution breakdown** (new, small): in Monitoring — table of `weight × asset_return` summing to portfolio return for the selected period.
- **Empty / missing data**: graceful empty states if a sheet is absent.

### Files

| Action | File |
|--------|------|
| Create | `public/data/portfolio_data.xlsx` (starter workbook, generated via xlsx skill) |
| Create | `src/lib/dataLoader.ts` (SheetJS fetch + parse) |
| Create | `src/contexts/DataContext.tsx` |
| Create | `src/lib/priceSeries.ts` (replaces mockData helpers) |
| Create | `src/pages/Monitoring.tsx` |
| Create | `src/components/ContributionTable.tsx` |
| Rename | `src/pages/Index.tsx` → semantically "Asset Exploration" (label change only) |
| Rename | `src/pages/Portfolio.tsx` → "Portfolio Construction" (label change) |
| Update | `src/lib/portfolioCalc.ts`, `src/components/AssetSelector.tsx`, `src/components/PriceChart.tsx`, `src/components/PortfolioAllocator.tsx`, `src/components/ComparisonSelector.tsx` — read from context instead of `ASSETS` |
| Update | `src/App.tsx`, `src/components/AppHeader.tsx` — 3 tabs |
| Delete | `src/lib/mockData.ts` |
| Add dep | `xlsx` (SheetJS) for parsing |

### Open question

The starter workbook needs ticker universe + price history. I'll generate a small realistic starter (e.g. ~10 tickers across equities/bonds/benchmarks, ~5 years daily prices) using the xlsx skill so the app works immediately. The user can swap the file anytime.

