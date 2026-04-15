import { useState, useMemo } from "react";
import { subYears } from "date-fns";
import { format, parseISO } from "date-fns";

import { PortfolioAllocator } from "@/components/PortfolioAllocator";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { ComparisonSelector } from "@/components/ComparisonSelector";
import { PortfolioSummaryCards } from "@/components/PortfolioSummaryCards";
import { Allocation, calculatePortfolioReturns } from "@/lib/portfolioCalc";
import { computeStats, PortfolioStats } from "@/lib/portfolioStats";
import { ASSETS, generatePriceData, filterByDateRange } from "@/lib/mockData";
import { greedyPiecewise } from "@/lib/piecewiseModel";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

const OVERLAY_COLORS = ["#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f59e0b", "#d97706"];
const CONSTITUENT_COLORS = ["#64748b", "#94a3b8", "#78716c", "#a1a1aa", "#737373", "#9ca3af", "#a3a3a3", "#6b7280"];

const Portfolio = () => {
  const [allocations, setAllocations] = useState<Allocation[]>([
    { ticker: "AAPL", weight: 50 },
    { ticker: "MSFT", weight: 50 },
  ]);
  const [startDate, setStartDate] = useState(() => subYears(new Date(), 1));
  const [endDate, setEndDate] = useState(() => new Date());
  const [overlayTickers, setOverlayTickers] = useState<string[]>([]);
  const [showPiecewise, setShowPiecewise] = useState(false);
  const [showAssets, setShowAssets] = useState(false);

  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0);
  const isValid = Math.abs(totalWeight - 100) < 0.01 && allocations.length > 0;

  const chartData = useMemo(() => {
    if (!isValid) return [];
    return calculatePortfolioReturns(allocations, startDate, endDate);
  }, [allocations, startDate, endDate, isValid]);

  // Build overlay cum returns for compare assets
  const overlaySeriesMap = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const t of overlayTickers) {
      const asset = ASSETS.find((a) => a.ticker === t);
      if (!asset) continue;
      const all = generatePriceData(asset);
      const filtered = filterByDateRange(all, startDate, endDate);
      if (filtered.length === 0) continue;
      const base = filtered[0].price;
      const lookup: Record<string, number> = {};
      for (const p of filtered) {
        lookup[p.date] = Math.round(((p.price - base) / base) * 10000) / 100;
      }
      map[t] = lookup;
    }
    return map;
  }, [overlayTickers, startDate, endDate]);

  // Merge overlay data onto chart data
  const mergedData = useMemo(() => {
    if (overlayTickers.length === 0) return chartData;
    return chartData.map((row) => {
      const next: any = { ...row };
      for (const t of overlayTickers) {
        if (overlaySeriesMap[t]?.[row.date] != null) {
          next[t] = overlaySeriesMap[t][row.date];
        }
      }
      return next;
    });
  }, [chartData, overlayTickers, overlaySeriesMap]);

  // Piecewise fit
  const piecewiseData = useMemo(() => {
    if (!showPiecewise || mergedData.length < 10) return mergedData;
    const vals = mergedData.map((r) => r.portfolio);
    const { model } = greedyPiecewise(vals, 0.98, 15);
    return mergedData.map((row, i) => ({ ...row, portfolio_fit: Math.round(model[i] * 100) / 100 }));
  }, [mergedData, showPiecewise]);

  const displayData = showPiecewise ? piecewiseData : mergedData;

  // Constituent tickers for Show Assets
  const constituentTickers = allocations.map((a) => a.ticker);

  // Stats computation
  const summaryStats = useMemo<PortfolioStats[]>(() => {
    if (chartData.length < 2) return [];
    const dates = chartData.map((r) => r.date);
    const stats: PortfolioStats[] = [];

    // Portfolio stats
    const portfolioVals = chartData.map((r) => r.portfolio);
    stats.push(computeStats("Portfolio", dates, portfolioVals, 3));

    // Compare asset stats
    for (const t of overlayTickers) {
      const lookup = overlaySeriesMap[t];
      if (!lookup) continue;
      const vals = dates.map((d) => lookup[d] ?? 0);
      stats.push(computeStats(t, dates, vals, 3));
    }

    return stats;
  }, [chartData, overlayTickers, overlaySeriesMap]);

  // Y domain
  const allVals: number[] = [];
  for (const row of displayData) {
    for (const [k, v] of Object.entries(row)) {
      if (k !== "date" && typeof v === "number") {
        // Skip constituent keys if showAssets is off
        if (!showAssets && constituentTickers.includes(k) && k !== "portfolio" && k !== "portfolio_fit" && !overlayTickers.includes(k)) continue;
        allVals.push(v);
      }
    }
  }
  const min = allVals.length ? Math.min(...allVals) : 0;
  const max = allVals.length ? Math.max(...allVals) : 10;
  const padding = (max - min) * 0.1 || 2;

  const tickInterval = Math.max(1, Math.floor(displayData.length / 8));

  const toggleOverlay = (t: string) => {
    setOverlayTickers((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  return (
    <>
      <main className="container mx-auto px-4 py-6 space-y-5">
        <h2 className="text-lg font-semibold">Portfolio Builder</h2>

        <PortfolioAllocator allocations={allocations} onChange={setAllocations} />

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
          <div className="flex items-center gap-4 flex-wrap">
            <ComparisonSelector
              primaryTicker=""
              compareTickers={overlayTickers}
              onToggle={toggleOverlay}
            />
            <div className="flex items-center gap-2">
              <label htmlFor="show-assets" className="text-xs text-muted-foreground whitespace-nowrap">
                Show Assets
              </label>
              <Switch id="show-assets" checked={showAssets} onCheckedChange={setShowAssets} />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="pw-fit" className="text-xs text-muted-foreground whitespace-nowrap">
                Piecewise Fit
              </label>
              <Switch id="pw-fit" checked={showPiecewise} onCheckedChange={setShowPiecewise} />
            </div>
          </div>
        </div>

        {!isValid ? (
          <Card>
            <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
              {allocations.length === 0
                ? "Add assets to build a portfolio"
                : "Weights must sum to 100%"}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 pt-5">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={displayData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => format(parseISO(v), "MMM yy")}
                    interval={tickInterval}
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    domain={[Math.floor(min - padding), Math.ceil(max + padding)]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11 }}
                    className="fill-muted-foreground"
                    width={60}
                  />
                  <Tooltip
                    content={({ active, payload, label }: any) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-lg border bg-background p-3 shadow-lg text-sm min-w-[140px]">
                          <div className="font-medium mb-1.5">{format(parseISO(label), "MMM d, yyyy")}</div>
                          {payload.map((entry: any) => (
                            <div key={entry.dataKey} className="flex justify-between gap-4 items-center">
                              <span style={{ color: entry.stroke }} className="font-semibold text-xs">
                                {entry.dataKey.replace("_fit", " fit")}
                              </span>
                              <span className="font-mono text-xs">
                                {entry.value != null ? `${Number(entry.value).toFixed(2)}%` : "—"}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  {/* Portfolio line */}
                  <Line
                    type="monotone"
                    dataKey="portfolio"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    dot={false}
                    animationDuration={500}
                    connectNulls
                  />
                  {/* Piecewise fit */}
                  {showPiecewise && (
                    <Line
                      type="linear"
                      dataKey="portfolio_fit"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={false}
                      animationDuration={500}
                      connectNulls
                      name="portfolio fit"
                    />
                  )}
                  {/* Constituent assets (Show Assets toggle) */}
                  {showAssets &&
                    constituentTickers.map((t, i) => (
                      <Line
                        key={`constituent-${t}`}
                        type="monotone"
                        dataKey={t}
                        stroke={CONSTITUENT_COLORS[i % CONSTITUENT_COLORS.length]}
                        strokeWidth={1}
                        strokeDasharray="2 2"
                        dot={false}
                        animationDuration={500}
                        connectNulls
                        name={`${t} (constituent)`}
                      />
                    ))}
                  {/* Compare overlay assets */}
                  {overlayTickers.map((t, i) => (
                    <Line
                      key={`compare-${t}`}
                      type="monotone"
                      dataKey={t}
                      stroke={OVERLAY_COLORS[i % OVERLAY_COLORS.length]}
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      dot={false}
                      animationDuration={500}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Summary stats cards */}
        <PortfolioSummaryCards stats={summaryStats} />
      </main>
    </>
  );
};

export default Portfolio;
