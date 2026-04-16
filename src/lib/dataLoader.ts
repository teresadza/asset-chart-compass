import * as XLSX from "xlsx";

export interface AssetMeta {
  ticker: string;
  name: string;
  asset_class: string;
  sector: string;
  region: string;
  currency: string;
  is_benchmark: boolean;
}

export interface PriceRow {
  date: string;
  ticker: string;
  price: number;
}

export interface HoldingRow {
  portfolio_name: string;
  ticker: string;
  weight: number;
}

export interface BenchmarkRow {
  portfolio_name: string;
  benchmark_ticker: string;
}

export interface WorkbookData {
  assets: AssetMeta[];
  prices: PriceRow[];
  holdings: HoldingRow[];
  benchmarks: BenchmarkRow[];
  // derived: ticker -> sorted price points
  priceSeries: Record<string, { date: string; price: number }[]>;
}

function normDate(v: any): string {
  if (v == null) return "";
  if (typeof v === "string") return v.length >= 10 ? v.slice(0, 10) : v;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  // Excel serial number
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

export async function loadWorkbook(url = "/data/portfolio_data.xlsx"): Promise<WorkbookData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load workbook: ${res.status}`);
  const buf = await res.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  const sheet = (name: string) =>
    wb.Sheets[name] ? XLSX.utils.sheet_to_json<any>(wb.Sheets[name], { defval: null }) : [];

  const assets: AssetMeta[] = sheet("assets").map((r) => ({
    ticker: String(r.ticker),
    name: String(r.name ?? r.ticker),
    asset_class: String(r.asset_class ?? ""),
    sector: String(r.sector ?? ""),
    region: String(r.region ?? ""),
    currency: String(r.currency ?? ""),
    is_benchmark: toBool(r.is_benchmark),
  }));

  const prices: PriceRow[] = sheet("prices")
    .map((r) => ({
      date: normDate(r.date),
      ticker: String(r.ticker),
      price: Number(r.price),
    }))
    .filter((r) => r.date && r.ticker && Number.isFinite(r.price));

  const holdings: HoldingRow[] = sheet("portfolio_holdings").map((r) => ({
    portfolio_name: String(r.portfolio_name),
    ticker: String(r.ticker),
    weight: Number(r.weight),
  }));

  const benchmarks: BenchmarkRow[] = sheet("benchmarks").map((r) => ({
    portfolio_name: String(r.portfolio_name),
    benchmark_ticker: String(r.benchmark_ticker),
  }));

  const priceSeries: Record<string, { date: string; price: number }[]> = {};
  for (const p of prices) {
    (priceSeries[p.ticker] ||= []).push({ date: p.date, price: p.price });
  }
  for (const t of Object.keys(priceSeries)) {
    priceSeries[t].sort((a, b) => a.date.localeCompare(b.date));
  }

  return { assets, prices, holdings, benchmarks, priceSeries };
}
