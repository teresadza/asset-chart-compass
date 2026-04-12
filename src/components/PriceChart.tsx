import { PricePoint } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";

interface PriceChartProps {
  data: PricePoint[];
  ticker: string;
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as PricePoint;
  const isPos = d.change >= 0;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg text-sm">
      <div className="font-medium">{format(parseISO(d.date), "MMM d, yyyy")}</div>
      <div className="text-lg font-bold mt-1">${d.price.toFixed(2)}</div>
      <div className={`text-xs ${isPos ? "text-green-600" : "text-red-600"}`}>
        {isPos ? "+" : ""}
        {d.change.toFixed(2)} ({d.changePercent.toFixed(2)}%)
      </div>
    </div>
  );
}

export function PriceChart({ data, ticker }: PriceChartProps) {
  if (!data.length) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
          No data for selected range
        </CardContent>
      </Card>
    );
  }

  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = (max - min) * 0.1 || 5;

  const first = data[0].price;
  const last = data[data.length - 1].price;
  const isPositive = last >= first;

  // thin out tick labels
  const tickInterval = Math.max(1, Math.floor(data.length / 8));

  return (
    <Card>
      <CardContent className="p-4 pt-5">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? "#16a34a" : "#dc2626"} stopOpacity={0.15} />
                <stop offset="100%" stopColor={isPositive ? "#16a34a" : "#dc2626"} stopOpacity={0} />
              </linearGradient>
            </defs>
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
              tickFormatter={(v) => `$${v}`}
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={isPositive ? "#16a34a" : "#dc2626"}
              fill={`url(#grad-${ticker})`}
              strokeWidth={2}
              dot={false}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
