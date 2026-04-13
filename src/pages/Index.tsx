import { useState, useMemo, useCallback } from "react";
import { subYears } from "date-fns";
import { ASSETS, generatePriceData, filterByDateRange } from "@/lib/mockData";
import { AssetSelector } from "@/components/AssetSelector";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { AssetSummary } from "@/components/AssetSummary";
import { PriceChart } from "@/components/PriceChart";
import { ComparisonSelector } from "@/components/ComparisonSelector";

const Index = () => {
  const [ticker, setTicker] = useState("AAPL");
  const [compareTickers, setCompareTickers] = useState<string[]>([]);
  const [normalized, setNormalized] = useState(false);
  const [startDate, setStartDate] = useState(() => subYears(new Date(), 1));
  const [endDate, setEndDate] = useState(() => new Date());

  const asset = ASSETS.find((a) => a.ticker === ticker)!;

  const allData = useMemo(() => generatePriceData(asset), [asset]);
  const filteredData = useMemo(
    () => filterByDateRange(allData, startDate, endDate),
    [allData, startDate, endDate]
  );

  const compareSeries = useMemo(() => {
    return compareTickers.map((t) => {
      const a = ASSETS.find((x) => x.ticker === t)!;
      const all = generatePriceData(a);
      return { ticker: t, data: filterByDateRange(all, startDate, endDate) };
    });
  }, [compareTickers, startDate, endDate]);

  const toggleCompare = (t: string) => {
    setCompareTickers((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 px-4">
          <h1 className="text-xl font-bold tracking-tight">Market Data</h1>
          <AssetSelector selected={ticker} onSelect={setTicker} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-4">
        <AssetSummary asset={asset} data={filteredData} />

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
          <div className="flex items-center gap-3">
            <ComparisonSelector
              primaryTicker={ticker}
              compareTickers={compareTickers}
              onToggle={toggleCompare}
            />
            {compareTickers.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="normalized" className="text-xs text-muted-foreground whitespace-nowrap">% Change</label>
                <Switch id="normalized" checked={normalized} onCheckedChange={setNormalized} />
              </div>
            )}
          </div>
        </div>

        <PriceChart data={filteredData} ticker={ticker} compareSeries={compareSeries} />
      </main>
    </div>
  );
};

export default Index;
