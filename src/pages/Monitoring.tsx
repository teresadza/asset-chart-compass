import { useState, useMemo, useEffect } from "react";
import { subYears, format, parseISO } from "date-fns";

import { useData } from "@/contexts/DataContext";
import { PortfolioAllocator } from "@/components/PortfolioAllocator";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { PortfolioSummaryCards } from "@/components/PortfolioSummaryCards";
import { ContributionTable } from "@/components/ContributionTable";
import { Allocation, calculatePortfolioReturns, calculateCumulativeReturns } from "@/lib/portfolioCalc";
import { computeStats, computeStatsRelativeDrawdowns, PortfolioStats } from "@/lib/portfolioStats";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

const Monitoring = () => {
  const { portfolioNames, getHoldings, getBenchmark, getAsset, getSeries, loading, error } = useData();
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>("");
  const [startDate, setStartDate] = useState(() => subYears(new Date(), 1));
  const [endDate, setEndDate] = useState(() => new Date());

  useEffect(() => {
    if (!selectedPortfolio && portfolioNames.length) setSelectedPortfolio(portfolioNames[0]);
  }, [portfolioNames, selectedPortfolio]);

  const allocations: Allocation[] = useMemo(
    () => (selectedPortfolio ? getHoldings(selectedPortfolio) : []),
    [selectedPortfolio, getHoldings]
  );
  const benchmarkTicker = selectedPortfolio ? getBenchmark(selectedPortfolio) : undefined;

  const isValid = allocations.length > 0 && Math.abs(allocations.reduce((s, a) => s + a.weight, 0) - 100) < 0.01;

  const chartData = useMemo(() => {
    if (!isValid) return [];
    return calculatePortfolioReturns(allocations, startDate, endDate, getSeries);
  }, [allocations, startDate, endDate, isValid, getSeries]);

  const benchmarkLookup = useMemo(() => {
    if (!benchmarkTicker) return null;
    const series = calculateCumulativeReturns(benchmarkTicker, startDate, endDate, getSeries);
    const map: Record<string, number> = {};
    for (const p of series) map[p.date] = p.cumret;
    return map;
  }, [benchmarkTicker, startDate, endDate, getSeries]);

  const displayData = useMemo(() => {
    if (!benchmarkLookup) return chartData;
    return chartData.map((row) => ({ ...row, [benchmarkTicker!]: benchmarkLookup[row.date] ?? null }));
  }, [chartData, benchmarkLookup, benchmarkTicker]);

  const summaryStats = useMemo<PortfolioStats[]>(() => {
    if (chartData.length < 2) return [];
    const dates = chartData.map((r) => r.date);
    const portfolioVals = chartData.map((r) => r.portfolio);
    const portfolioStats = computeStats("Portfolio", dates, portfolioVals, 3);
    const stats: PortfolioStats[] = [portfolioStats];
    if (benchmarkTicker && benchmarkLookup) {
      const vals = dates.map((d) => benchmarkLookup[d] ?? 0);
      stats.push(computeStatsRelativeDrawdowns(`Benchmark: ${benchmarkTicker}`, dates, vals, portfolioStats));
    }
    return stats;
  }, [chartData, benchmarkTicker, benchmarkLookup]);

  const allVals: number[] = [];
  for (const row of displayData) {
    for (const [k, v] of Object.entries(row)) {
      if (k !== "date" && typeof v === "number") allVals.push(v);
    }
  }
  const min = allVals.length ? Math.min(...allVals) : 0;
  const max = allVals.length ? Math.max(...allVals) : 10;
  const padding = (max - min) * 0.1 || 2;
  const tickInterval = Math.max(1, Math.floor(displayData.length / 8));

  if (loading) return <main className="container mx-auto px-4 py-10 text-muted-foreground">Loading data…</main>;
  if (error) return <main className="container mx-auto px-4 py-10 text-destructive">Error loading data: {error}</main>;

  if (!portfolioNames.length) {
    return (
      <main className="container mx-auto px-4 py-10">
        <Card><CardContent className="py-10 text-center text-muted-foreground">
          No portfolios configured. Add rows to the <code className="text-xs">portfolio_holdings</code> sheet.
        </CardContent></Card>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Portfolio Monitoring</h2>
          <Badge variant="secondary">Actual</Badge>
        </div>
        <Select value={selectedPortfolio} onValueChange={setSelectedPortfolio}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Choose portfolio" /></SelectTrigger>
          <SelectContent>
            {portfolioNames.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground mb-3">Holdings</div>
            <PortfolioAllocator allocations={allocations} onChange={() => {}} readOnly />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-muted-foreground mb-3">Composition</div>
            <div className="space-y-1.5">
              {allocations.map((a) => (
                <div key={a.ticker} className="flex items-center gap-2 text-xs">
                  <div className="w-16 font-semibold">{a.ticker}</div>
                  <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${a.weight}%` }} />
                  </div>
                  <div className="w-12 text-right font-mono">{a.weight.toFixed(1)}%</div>
                  <div className="w-32 truncate text-muted-foreground">{getAsset(a.ticker)?.asset_class}</div>
                </div>
              ))}
            </div>
            {benchmarkTicker && (
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                Benchmark: <span className="font-semibold text-foreground">{benchmarkTicker}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DateRangeFilter startDate={startDate} endDate={endDate} onStartChange={setStartDate} onEndChange={setEndDate} />

      {!isValid ? (
        <Card><CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
          Holdings must sum to 100%
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-4 pt-5">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={displayData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="date" tickFormatter={(v) => format(parseISO(v), "MMM yy")} interval={tickInterval} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis domain={[Math.floor(min - padding), Math.ceil(max + padding)]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} className="fill-muted-foreground" width={60} />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-lg text-sm min-w-[140px]">
                        <div className="font-medium mb-1.5">{format(parseISO(label), "MMM d, yyyy")}</div>
                        {payload.map((entry: any) => (
                          <div key={entry.dataKey} className="flex justify-between gap-4 items-center">
                            <span style={{ color: entry.stroke }} className="font-semibold text-xs">{entry.dataKey}</span>
                            <span className="font-mono text-xs">{entry.value != null ? `${Number(entry.value).toFixed(2)}%` : "—"}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="portfolio" stroke="#16a34a" strokeWidth={2.5} dot={false} animationDuration={500} connectNulls />
                {benchmarkTicker && (
                  <Line type="monotone" dataKey={benchmarkTicker} stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" dot={false} animationDuration={500} connectNulls name={`${benchmarkTicker} (benchmark)`} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <PortfolioSummaryCards stats={summaryStats} />

      {isValid && <ContributionTable allocations={allocations} startDate={startDate} endDate={endDate} />}
    </main>
  );
};

export default Monitoring;
