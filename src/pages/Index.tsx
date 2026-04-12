import { useState, useMemo } from "react";
import { subYears } from "date-fns";
import { ASSETS, generatePriceData, filterByDateRange } from "@/lib/mockData";
import { AssetSelector } from "@/components/AssetSelector";
import { DateRangeFilter } from "@/components/DateRangeFilter";
import { AssetSummary } from "@/components/AssetSummary";
import { PriceChart } from "@/components/PriceChart";

const Index = () => {
  const [ticker, setTicker] = useState("AAPL");
  const [startDate, setStartDate] = useState(() => subYears(new Date(), 1));
  const [endDate, setEndDate] = useState(() => new Date());

  const asset = ASSETS.find((a) => a.ticker === ticker)!;

  const allData = useMemo(() => generatePriceData(asset), [asset]);
  const filteredData = useMemo(
    () => filterByDateRange(allData, startDate, endDate),
    [allData, startDate, endDate]
  );

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

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
        />

        <PriceChart data={filteredData} ticker={ticker} />
      </main>
    </div>
  );
};

export default Index;
