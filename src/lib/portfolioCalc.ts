import { ASSETS, generatePriceData, filterByDateRange, PricePoint } from "./mockData";

export interface Allocation {
  ticker: string;
  weight: number; // 0-100
}

export interface PortfolioPoint {
  date: string;
  portfolio: number;
  [key: string]: number | string;
}

/**
 * Compute cumulative returns the canonical way:
 *   returns = price.pct_change()
 *   cumret = (1 + returns).cumprod() - 1
 *
 * Portfolio return at each step = sum(weight_i * daily_return_i),
 * then compounded into a cumulative series.
 */
export function calculatePortfolioReturns(
  allocations: Allocation[],
  startDate: Date,
  endDate: Date
): PortfolioPoint[] {
  if (allocations.length === 0) return [];

  // Get filtered data per ticker
  const seriesMap: Record<string, PricePoint[]> = {};
  for (const alloc of allocations) {
    const asset = ASSETS.find((a) => a.ticker === alloc.ticker);
    if (!asset) continue;
    const all = generatePriceData(asset);
    seriesMap[alloc.ticker] = filterByDateRange(all, startDate, endDate);
  }

  // Union of dates
  const allDates = new Set<string>();
  for (const series of Object.values(seriesMap)) {
    for (const p of series) allDates.add(p.date);
  }
  const sortedDates = Array.from(allDates).sort();
  if (sortedDates.length === 0) return [];

  // Price lookup per ticker
  const priceLookup: Record<string, Record<string, number>> = {};
  for (const [ticker, series] of Object.entries(seriesMap)) {
    priceLookup[ticker] = {};
    for (const p of series) priceLookup[ticker][p.date] = p.price;
  }

  // Compute per-asset cumulative returns: (1 + pct_change).cumprod() - 1
  // Tracks cumulative growth factor per ticker.
  const assetCumRet: Record<string, Record<string, number>> = {};
  const prevPrice: Record<string, number | null> = {};
  const cumFactor: Record<string, number> = {};
  for (const alloc of allocations) {
    prevPrice[alloc.ticker] = null;
    cumFactor[alloc.ticker] = 1;
    assetCumRet[alloc.ticker] = {};
  }

  // Portfolio cumulative growth factor
  let portfolioFactor = 1;
  const result: PortfolioPoint[] = [];

  for (const date of sortedDates) {
    // Compute weighted daily return across assets that have a prior price
    let weightedDaily = 0;
    let activeWeight = 0;

    for (const alloc of allocations) {
      const price = priceLookup[alloc.ticker]?.[date];
      if (price == null) continue;

      const prev = prevPrice[alloc.ticker];
      if (prev != null && prev !== 0) {
        const r = price / prev - 1;
        cumFactor[alloc.ticker] *= 1 + r;
        const w = alloc.weight / 100;
        weightedDaily += w * r;
        activeWeight += w;
      }
      prevPrice[alloc.ticker] = price;
      assetCumRet[alloc.ticker][date] = (cumFactor[alloc.ticker] - 1) * 100;
    }

    // Compound the portfolio with the weighted daily return.
    // First date has no prior price, so weighted return is 0.
    portfolioFactor *= 1 + weightedDaily;

    const row: PortfolioPoint = {
      date,
      portfolio: Math.round((portfolioFactor - 1) * 10000) / 100,
    };

    for (const alloc of allocations) {
      if (assetCumRet[alloc.ticker][date] != null) {
        row[alloc.ticker] = Math.round(assetCumRet[alloc.ticker][date] * 100) / 100;
      }
    }

    result.push(row);
  }

  return result;
}

/**
 * Cumulative return series for a single ticker using pct_change → cumprod.
 * Returns { date, cumret % } points.
 */
export function calculateCumulativeReturns(
  ticker: string,
  startDate: Date,
  endDate: Date
): { date: string; cumret: number }[] {
  const asset = ASSETS.find((a) => a.ticker === ticker);
  if (!asset) return [];
  const filtered = filterByDateRange(generatePriceData(asset), startDate, endDate);
  if (filtered.length === 0) return [];

  const out: { date: string; cumret: number }[] = [];
  let factor = 1;
  let prev: number | null = null;
  for (const p of filtered) {
    if (prev != null && prev !== 0) {
      factor *= p.price / prev;
    }
    prev = p.price;
    out.push({ date: p.date, cumret: Math.round((factor - 1) * 10000) / 100 });
  }
  return out;
}
