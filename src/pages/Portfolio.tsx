import { useState, useMemo } from "react";
import { subYears } from "date-fns";
import { format, parseISO } from "date-fns";

import { PortfolioAllocator } from "@/components/PortfolioAllocator";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { Allocation, calculatePortfolioReturns } from "@/lib/portfolioCalc";
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

const COLORS = ["#16a34a", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const Portfolio = () => {
  const [allocations, setAllocations] = useState<Allocation[]>([
    { ticker: "AAPL", weight: 50 },
    { ticker: "MSFT", weight: 50 },
  ]);
  const [startDate, setStartDate] = useState(() => subYears(new Date(), 1));
  const [endDate, setEndDate] = useState(() => new Date());
  const [showComponents, setShowComponents] = useState(false);
  const [showPiecewise, setShowPiecewise] = useState(false);

  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0);
  const isValid = Math.abs(totalWeight - 100) < 0.01 && allocations.length > 0;

  const chartData = useMemo(() => {
    if (!isValid) return [];
    return calculatePortfolioReturns(allocations, startDate, endDate);
  }, [allocations, startDate, endDate, isValid]);

  // Piecewise fit on portfolio
  const piecewiseData = useMemo(() => {
    if (!showPiecewise || chartData.length < 10) return chartData;
    const vals = chartData.map((r) => r.portfolio);
    const { model } = greedyPiecewise(vals, 0.98, 15);
    return chartData.map((row, i) => ({ ...row, portfolio_fit: Math.round(model[i] * 100) / 100 }));
  }, [chartData, showPiecewise]);

  const displayData = showPiecewise ? piecewiseData : chartData;

  // Y domain
  const allVals: number[] = [];
  for (const row of displayData) {
    for (const [k, v] of Object.entries(row)) {
      if (k !== "date" && typeof v === "number") {
        if (showComponents || k === "portfolio" || k === "portfolio_fit") allVals.push(v);
      }
    }
  }
  const min = allVals.length ? Math.min(...allVals) : 0;
  const max = allVals.length ? Math.max(...allVals) : 10;
  const padding = (max - min) * 0.1 || 2;

  const tickInterval = Math.max(1, Math.floor(displayData.length / 8));

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
            <div className="flex items-center gap-2">
              <label htmlFor="show-components" className="text-xs text-muted-foreground whitespace-nowrap">
                Show Assets
              </label>
              <Switch id="show-components" checked={showComponents} onCheckedChange={setShowComponents} />
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
                  <Line
                    type="monotone"
                    dataKey="portfolio"
                    stroke="#16a34a"
                    strokeWidth={2.5}
                    dot={false}
                    animationDuration={500}
                    connectNulls
                  />
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
                  {showComponents &&
                    allocations.map((alloc, i) => (
                      <Line
                        key={alloc.ticker}
                        type="monotone"
                        dataKey={alloc.ticker}
                        stroke={COLORS[i % COLORS.length]}
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
      </main>
    </>
  );
};

export default Portfolio;
