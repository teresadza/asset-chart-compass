import { useState, useMemo } from "react";
import { subYears } from "date-fns";
import { useData } from "@/contexts/DataContext";
import { toPricePoints, filterByDateRange } from "@/lib/priceSeries";

import { AssetSelector } from "@/components/AssetSelector";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { AssetSummary } from "@/components/AssetSummary";
import { PriceChart } from "@/components/PriceChart";
import { ComparisonSelector } from "@/components/ComparisonSelector";
import { Switch } from "@/components/ui/switch";

const Index = () => {
  const { assets, getSeries, getNzdSeries, loading, error } = useData();
  const defaultTicker = assets[0]?.ticker ?? "";
  const [ticker, setTicker] = useState(defaultTicker);
  const [compareTickers, setCompareTickers] = useState<string[]>([]);
  const [normalized, setNormalized] = useState(false);
  const [showPiecewise, setShowPiecewise] = useState(false);
  const [inNzd, setInNzd] = useState(true);
  const [startDate, setStartDate] = useState(() => subYears(new Date(), 1));
  const [endDate, setEndDate] = useState(() => new Date());

  const activeTicker = ticker || defaultTicker;
  const asset = assets.find((a) => a.ticker === activeTicker);
  const series = inNzd ? getNzdSeries : getSeries;

  const allData = useMemo(() => (asset ? toPricePoints(series(asset.ticker)) : []), [asset, series]);
  const filteredData = useMemo(() => filterByDateRange(allData, startDate, endDate), [allData, startDate, endDate]);

  const compareSeries = useMemo(() => {
    return compareTickers.map((t) => ({
      ticker: t,
      data: filterByDateRange(toPricePoints(series(t)), startDate, endDate),
    }));
  }, [compareTickers, startDate, endDate, series]);

  const toggleCompare = (t: string) => {
    setCompareTickers((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  if (loading) return <main className="container mx-auto px-4 py-10 text-muted-foreground">Loading data…</main>;
  if (error) return <main className="container mx-auto px-4 py-10 text-destructive">Error loading data: {error}</main>;
  if (!asset) return <main className="container mx-auto px-4 py-10 text-muted-foreground">No assets in workbook.</main>;

  return (
    <>
      <div className="container mx-auto flex items-center justify-end px-4 pt-4">
        <AssetSelector selected={activeTicker} onSelect={setTicker} />
      </div>

      <main className="container mx-auto px-4 py-6 space-y-4">
        <AssetSummary asset={asset} data={filteredData} />

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartChange={setStartDate}
            onEndChange={setEndDate}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <ComparisonSelector
              primaryTicker={activeTicker}
              compareTickers={compareTickers}
              onToggle={toggleCompare}
            />
            {compareTickers.length > 0 && (
              <div className="flex items-center gap-2">
                <label htmlFor="normalized" className="text-xs text-muted-foreground whitespace-nowrap">% Change</label>
                <Switch id="normalized" checked={normalized} onCheckedChange={setNormalized} />
              </div>
            )}
            <div className="flex items-center gap-2">
              <label htmlFor="nzd" className="text-xs text-muted-foreground whitespace-nowrap">NZD</label>
              <Switch id="nzd" checked={inNzd} onCheckedChange={setInNzd} />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="piecewise" className="text-xs text-muted-foreground whitespace-nowrap">Piecewise Fit</label>
              <Switch id="piecewise" checked={showPiecewise} onCheckedChange={setShowPiecewise} />
            </div>
          </div>
        </div>

        <PriceChart data={filteredData} ticker={activeTicker} compareSeries={compareSeries} normalized={normalized} showPiecewise={showPiecewise} />
      </main>
    </>
  );
};

export default Index;
