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

export function calculatePortfolioReturns(
  allocations: Allocation[],
  startDate: Date,
  endDate: Date
): PortfolioPoint[] {
  if (allocations.length === 0) return [];

  // Get filtered data for each allocation
  const seriesMap: Record<string, PricePoint[]> = {};
  for (const alloc of allocations) {
    const asset = ASSETS.find((a) => a.ticker === alloc.ticker);
    if (!asset) continue;
    const all = generatePriceData(asset);
    seriesMap[alloc.ticker] = filterByDateRange(all, startDate, endDate);
  }

  // Collect all dates
  const allDates = new Set<string>();
  for (const series of Object.values(seriesMap)) {
    for (const p of series) allDates.add(p.date);
  }
  const sortedDates = Array.from(allDates).sort();
  if (sortedDates.length === 0) return [];

  // Build price lookup
  const priceLookup: Record<string, Record<string, number>> = {};
  for (const [ticker, series] of Object.entries(seriesMap)) {
    priceLookup[ticker] = {};
    for (const p of series) priceLookup[ticker][p.date] = p.price;
  }

  // Calculate weighted cumulative return
  const result: PortfolioPoint[] = [];
  const basePrices: Record<string, number> = {};

  for (const date of sortedDates) {
    let portfolioReturn = 0;
    let totalWeight = 0;

    for (const alloc of allocations) {
      const price = priceLookup[alloc.ticker]?.[date];
      if (price == null) continue;

      if (basePrices[alloc.ticker] == null) {
        basePrices[alloc.ticker] = price;
      }

      const w = alloc.weight / 100;
      const cumRet = ((price - basePrices[alloc.ticker]) / basePrices[alloc.ticker]) * 100;
      portfolioReturn += w * cumRet;
      totalWeight += w;
    }

    if (totalWeight === 0) continue;

    const row: PortfolioPoint = {
      date,
      portfolio: Math.round(portfolioReturn * 100) / 100,
    };

    // Individual asset cumulative returns
    for (const alloc of allocations) {
      const price = priceLookup[alloc.ticker]?.[date];
      if (price == null || basePrices[alloc.ticker] == null) continue;
      row[alloc.ticker] =
        Math.round(((price - basePrices[alloc.ticker]) / basePrices[alloc.ticker]) * 10000) / 100;
    }

    result.push(row);
  }

  return result;
}
