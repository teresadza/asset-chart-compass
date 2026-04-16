import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { loadWorkbook, WorkbookData, AssetMeta } from "@/lib/dataLoader";

interface DataContextValue extends WorkbookData {
  loading: boolean;
  error: string | null;
  getAsset: (ticker: string) => AssetMeta | undefined;
  getSeries: (ticker: string) => { date: string; price: number }[];
  portfolioNames: string[];
  getHoldings: (name: string) => { ticker: string; weight: number }[];
  getBenchmark: (name: string) => string | undefined;
}

const DataContext = createContext<DataContextValue | null>(null);

const EMPTY: WorkbookData = { assets: [], prices: [], holdings: [], benchmarks: [], priceSeries: {} };

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<WorkbookData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkbook()
      .then((d) => setData(d))
      .catch((e) => setError(e.message ?? String(e)))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<DataContextValue>(() => {
    const assetMap = new Map(data.assets.map((a) => [a.ticker, a]));
    const portfolioNames = Array.from(new Set(data.holdings.map((h) => h.portfolio_name)));
    return {
      ...data,
      loading,
      error,
      getAsset: (t) => assetMap.get(t),
      getSeries: (t) => data.priceSeries[t] ?? [],
      portfolioNames,
      getHoldings: (name) =>
        data.holdings
          .filter((h) => h.portfolio_name === name)
          .map((h) => ({ ticker: h.ticker, weight: h.weight })),
      getBenchmark: (name) => data.benchmarks.find((b) => b.portfolio_name === name)?.benchmark_ticker,
    };
  }, [data, loading, error]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
