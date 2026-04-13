import { PricePoint } from "@/lib/mockData";
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
import { format, parseISO } from "date-fns";
import { getCompareColor } from "./ComparisonSelector";

interface SeriesData {
  ticker: string;
  data: PricePoint[];
}

interface PriceChartProps {
  data: PricePoint[];
  ticker: string;
  compareSeries?: SeriesData[];
  normalized?: boolean;
}

function createTooltip(isNormalized: boolean) {
  return function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-lg text-sm min-w-[140px]">
        <div className="font-medium mb-1.5">{format(parseISO(label), "MMM d, yyyy")}</div>
        {payload.map((entry: any) => (
          <div key={entry.dataKey} className="flex justify-between gap-4 items-center">
            <span style={{ color: entry.stroke }} className="font-semibold text-xs">{entry.dataKey}</span>
            <span className="font-mono text-xs">
              {entry.value != null
                ? isNormalized
                  ? `${Number(entry.value).toFixed(2)}%`
                  : `$${Number(entry.value).toFixed(2)}`
                : "—"}
            </span>
          </div>
        ))}
      </div>
    );
  };
}

export function PriceChart({ data, ticker, compareSeries = [], normalized = false }: PriceChartProps) {
  const isComparing = compareSeries.length > 0;

  if (!data.length) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
          No data for selected range
        </CardContent>
      </Card>
    );
  }

  // Merge all series into a single dataset keyed by date
  const merged: Record<string, Record<string, number>> = {};
  for (const d of data) {
    if (!merged[d.date]) merged[d.date] = {};
    merged[d.date][ticker] = d.price;
  }
  for (const s of compareSeries) {
    for (const d of s.data) {
      if (!merged[d.date]) merged[d.date] = {};
      merged[d.date][s.ticker] = d.price;
    }
  }

  const sortedEntries = Object.entries(merged).sort(([a], [b]) => a.localeCompare(b));

  // Build chart data, optionally normalizing to % change from first value
  const allTickers = [ticker, ...compareSeries.map((s) => s.ticker)];
  const basePrices: Record<string, number | undefined> = {};

  if (normalized) {
    for (const t of allTickers) {
      for (const [, values] of sortedEntries) {
        if (values[t] != null) {
          basePrices[t] = values[t];
          break;
        }
      }
    }
  }

  const chartData = sortedEntries.map(([date, values]) => {
    const row: Record<string, any> = { date };
    for (const t of allTickers) {
      if (values[t] == null) continue;
      if (normalized && basePrices[t]) {
        row[t] = ((values[t] - basePrices[t]!) / basePrices[t]!) * 100;
      } else {
        row[t] = values[t];
      }
    }
    return row;
  });

  // Compute Y domain across all series
  const allPrices: number[] = [];
  for (const row of chartData) {
    for (const [k, v] of Object.entries(row)) {
      if (k !== "date" && typeof v === "number") allPrices.push(v);
    }
  }
  const min = Math.min(...allPrices);
  const max = Math.max(...allPrices);
  const padding = (max - min) * 0.1 || 5;

  const first = data[0].price;
  const last = data[data.length - 1].price;
  const isPositive = normalized ? (chartData[chartData.length - 1]?.[ticker] ?? 0) >= 0 : last >= first;

  const tickInterval = Math.max(1, Math.floor(chartData.length / 8));
  const primaryColor = isPositive ? "#16a34a" : "#dc2626";

  return (
    <Card>
      <CardContent className="p-4 pt-5">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
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
              tickFormatter={(v) => normalized ? `${v}%` : `$${v}`}
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />
            {isComparing && <Legend />}
            <Line
              type="monotone"
              dataKey={ticker}
              stroke={primaryColor}
              strokeWidth={2}
              dot={false}
              animationDuration={500}
              connectNulls
            />
            {compareSeries.map((s, i) => (
              <Line
                key={s.ticker}
                type="monotone"
                dataKey={s.ticker}
                stroke={getCompareColor(i)}
                strokeWidth={2}
                dot={false}
                animationDuration={500}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
