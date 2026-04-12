export interface Asset {
  ticker: string;
  name: string;
  type: "stock" | "mutual_fund";
  basePrice: number;
  volatility: number;
}

export interface PricePoint {
  date: string;
  price: number;
  change: number;
  changePercent: number;
}

export const ASSETS: Asset[] = [
  { ticker: "AAPL", name: "Apple Inc.", type: "stock", basePrice: 150, volatility: 0.02 },
  { ticker: "MSFT", name: "Microsoft Corp.", type: "stock", basePrice: 330, volatility: 0.018 },
  { ticker: "TSLA", name: "Tesla Inc.", type: "stock", basePrice: 250, volatility: 0.035 },
  { ticker: "AMZN", name: "Amazon.com Inc.", type: "stock", basePrice: 140, volatility: 0.022 },
  { ticker: "GOOGL", name: "Alphabet Inc.", type: "stock", basePrice: 135, volatility: 0.019 },
  { ticker: "VFIAX", name: "Vanguard 500 Index Fund", type: "mutual_fund", basePrice: 420, volatility: 0.01 },
  { ticker: "FXAIX", name: "Fidelity 500 Index Fund", type: "mutual_fund", basePrice: 180, volatility: 0.01 },
  { ticker: "SWPPX", name: "Schwab S&P 500 Index Fund", type: "mutual_fund", basePrice: 75, volatility: 0.01 },
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generatePriceData(asset: Asset, days: number = 1825): PricePoint[] {
  const rand = seededRandom(hashString(asset.ticker));
  const data: PricePoint[] = [];
  let price = asset.basePrice;
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    // Skip weekends for stocks
    const dayOfWeek = date.getDay();
    if (asset.type === "stock" && (dayOfWeek === 0 || dayOfWeek === 6)) continue;

    const prevPrice = price;
    const drift = 0.0002; // slight upward bias
    const r = rand() * 2 - 1;
    price = price * (1 + drift + asset.volatility * r);
    price = Math.max(price * 0.5, price); // floor

    const change = price - prevPrice;
    const changePercent = (change / prevPrice) * 100;

    data.push({
      date: date.toISOString().split("T")[0],
      price: Math.round(price * 100) / 100,
      change: Math.round(change * 100) / 100,
      changePercent: Math.round(changePercent * 100) / 100,
    });
  }

  return data;
}

export function filterByDateRange(data: PricePoint[], start: Date, end: Date): PricePoint[] {
  const s = start.toISOString().split("T")[0];
  const e = end.toISOString().split("T")[0];
  return data.filter((d) => d.date >= s && d.date <= e);
}
