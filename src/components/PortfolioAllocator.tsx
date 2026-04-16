import { useData } from "@/contexts/DataContext";
import { Allocation } from "@/lib/portfolioCalc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  allocations: Allocation[];
  onChange: (allocations: Allocation[]) => void;
  readOnly?: boolean;
}

export function PortfolioAllocator({ allocations, onChange, readOnly = false }: Props) {
  const { assets } = useData();
  const totalWeight = allocations.reduce((s, a) => s + a.weight, 0);
  const isValid = Math.abs(totalWeight - 100) < 0.01;
  const usedTickers = new Set(allocations.map((a) => a.ticker));

  const addRow = () => {
    const available = assets.find((a) => !usedTickers.has(a.ticker));
    if (!available) return;
    onChange([...allocations, { ticker: available.ticker, weight: 0 }]);
  };

  const removeRow = (index: number) => onChange(allocations.filter((_, i) => i !== index));
  const updateTicker = (index: number, ticker: string) => {
    const next = [...allocations];
    next[index] = { ...next[index], ticker };
    onChange(next);
  };
  const updateWeight = (index: number, value: string) => {
    const w = parseFloat(value) || 0;
    const next = [...allocations];
    next[index] = { ...next[index], weight: Math.min(100, Math.max(0, w)) };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {allocations.map((alloc, i) => (
        <div key={i} className="flex items-center gap-2">
          {readOnly ? (
            <div className="w-[200px] px-3 py-1.5 rounded-md border bg-muted/30 text-sm">
              <span className="font-semibold">{alloc.ticker}</span>
              <span className="ml-2 text-muted-foreground text-xs">
                {assets.find((a) => a.ticker === alloc.ticker)?.name ?? ""}
              </span>
            </div>
          ) : (
            <Select value={alloc.ticker} onValueChange={(v) => updateTicker(i, v)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assets.map((a) => (
                  <SelectItem
                    key={a.ticker}
                    value={a.ticker}
                    disabled={usedTickers.has(a.ticker) && a.ticker !== alloc.ticker}
                  >
                    <span className="font-semibold">{a.ticker}</span>
                    <span className="ml-2 text-muted-foreground text-xs">{a.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={0}
              max={100}
              step={1}
              value={alloc.weight}
              disabled={readOnly}
              onChange={(e) => updateWeight(i, e.target.value)}
              className="w-20 text-right"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          {!readOnly && (
            <Button variant="ghost" size="icon" onClick={() => removeRow(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}

      <div className="flex items-center gap-4">
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={addRow} disabled={usedTickers.size >= assets.length}>
            <Plus className="h-4 w-4 mr-1" /> Add Asset
          </Button>
        )}
        <span className={`text-sm font-medium ${isValid ? "text-green-600" : "text-destructive"}`}>
          Total: {totalWeight.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
