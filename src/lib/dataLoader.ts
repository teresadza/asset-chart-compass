import * as XLSX from "xlsx";

export type AssetType = "Asset" | "Benchmark" | "PortfolioNAV";

export interface AssetMeta {
  ticker: string;
  name: string;
  asset_type: AssetType;
  asset_class: string;
  sector: string;
  region: string;
  currency: string; // local currency
  is_benchmark: boolean;
}

export interface PriceRow {
  date: string;
  ticker: string;
  price: number; // local price
}

export interface FxRow {
  date: string;
  ccy: string;
  fx_to_nzd: number;
}

export interface HoldingRow {
  portfolio_name: string;
  effective_date: string;
  ticker: string;
  market_value_local: number;
  local_ccy: string;
  // legacy fallback for older simple format
  weight?: number;
}

export interface BenchmarkRow {
  portfolio_name: string;
  benchmark_ticker: string;
}

export interface WorkbookData {
  assets: AssetMeta[];
  prices: PriceRow[];
  fxRates: FxRow[];
  holdings: HoldingRow[];
  benchmarks: BenchmarkRow[];
  priceSeries: Record<string, { date: string; price: number }[]>;
  fxSeries: Record<string, { date: string; rate: number }[]>; // ccy -> sorted
}

function normDate(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v.length >= 10 ? v.slice(0, 10) : v;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) {
      const mm = String(d.m).padStart(2, "0");
      const dd = String(d.d).padStart(2, "0");
      return `${d.y}-${mm}-${dd}`;
    }
  }
  return String(v);
}

function toBool(v: any): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  if (typeof v === "string") return ["true", "1", "yes", "y"].includes(v.toLowerCase());
  return false;
}

function normAssetType(v: any, isBench: boolean): AssetType {
  const s = String(v ?? "").toLowerCase();
  if (s === "benchmark") return "Benchmark";
  if (s === "portfolionav" || s === "portfolio_nav" || s === "portfolio nav") return "PortfolioNAV";
  if (s === "asset") return "Asset";
  return isBench ? "Benchmark" : "Asset";
}

export async function loadWorkbook(url = "/data/portfolio_data.xlsx"): Promise<WorkbookData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load workbook: ${res.status}`);
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const sheet = (name: string) =>
    wb.Sheets[name] ? XLSX.utils.sheet_to_json<any>(wb.Sheets[name], { defval: null }) : [];

  const assets: AssetMeta[] = sheet("assets").map((r) => {
    const isBench = toBool(r.is_benchmark);
    return {
      ticker: String(r.ticker),
      name: String(r.name ?? r.ticker),
      asset_type: normAssetType(r.asset_type, isBench),
      asset_class: String(r.asset_class ?? ""),
      sector: String(r.sector ?? ""),
      region: String(r.region ?? ""),
      currency: String(r.local_ccy ?? r.currency ?? "NZD"),
      is_benchmark: isBench,
    };
  });

  const prices: PriceRow[] = sheet("prices")
    .map((r) => ({
      date: normDate(r.date),
      ticker: String(r.ticker),
      price: Number(r.price ?? r.price_local),
    }))
    .filter((r) => r.date && r.ticker && Number.isFinite(r.price));

  const fxRates: FxRow[] = sheet("fx_rates")
    .map((r) => ({
      date: normDate(r.date),
      ccy: String(r.ccy ?? "").toUpperCase(),
      fx_to_nzd: Number(r.fx_to_nzd),
    }))
    .filter((r) => r.date && r.ccy && Number.isFinite(r.fx_to_nzd));

  const holdings: HoldingRow[] = sheet("portfolio_holdings").map((r) => ({
    portfolio_name: String(r.portfolio_name),
    effective_date: normDate(r.effective_date ?? r.date ?? ""),
    ticker: String(r.ticker),
    market_value_local: Number(r.market_value_local ?? 0),
    local_ccy: String(r.local_ccy ?? "").toUpperCase(),
    weight: r.weight != null ? Number(r.weight) : undefined,
  }));

  const benchmarks: BenchmarkRow[] = sheet("benchmarks").map((r) => ({
    portfolio_name: String(r.portfolio_name),
    benchmark_ticker: String(r.benchmark_ticker),
  }));

  const priceSeries: Record<string, { date: string; price: number }[]> = {};
  for (const p of prices) (priceSeries[p.ticker] ||= []).push({ date: p.date, price: p.price });
  for (const t of Object.keys(priceSeries))
    priceSeries[t].sort((a, b) => a.date.localeCompare(b.date));

  const fxSeries: Record<string, { date: string; rate: number }[]> = {};
  for (const f of fxRates) (fxSeries[f.ccy] ||= []).push({ date: f.date, rate: f.fx_to_nzd });
  for (const c of Object.keys(fxSeries)) fxSeries[c].sort((a, b) => a.date.localeCompare(b.date));

  return { assets, prices, fxRates, holdings, benchmarks, priceSeries, fxSeries };
}
