

## Portfolio Builder Page

### Overview
A new `/portfolio` page where users dynamically add/remove assets with percentage weights, then visualize the blended portfolio return over time.

### Key Features

1. **Navigation** — Add a simple nav bar (or tabs) to switch between the existing Market Data page (`/`) and the new Portfolio page (`/portfolio`).

2. **Dynamic Asset Allocation UI** — A list of rows, each with:
   - Asset selector dropdown (reusing existing `ASSETS` list)
   - Percentage weight input (number field)
   - Remove button
   - An "Add Asset" button to append rows
   - Total weight indicator (highlights red if not 100%)

3. **Portfolio Return Calculation** — Using existing `generatePriceData` + `filterByDateRange`:
   - Compute daily returns for each selected asset
   - Blend them: `portfolioReturn[t] = Σ(weight_i × dailyReturn_i[t])`
   - Accumulate into a cumulative return series

4. **Portfolio Chart** — Recharts line chart showing cumulative portfolio return over time, with:
   - Date range filter (reuse `DateRangeFilter` component)
   - Optional piecewise fit toggle (reuse existing model)
   - Tooltip showing date and portfolio value/return

5. **Optional: Overlay individual assets** — Toggle to show each constituent's cumulative return alongside the blended portfolio line.

### Technical Plan

| Step | Files |
|------|-------|
| Add nav header component | `src/components/AppHeader.tsx` |
| Create portfolio page | `src/pages/Portfolio.tsx` |
| Create allocation editor component | `src/components/PortfolioAllocator.tsx` |
| Add portfolio return utility | `src/lib/portfolioCalc.ts` |
| Update routes | `src/App.tsx` |
| Update Index page to use shared header | `src/pages/Index.tsx` |

