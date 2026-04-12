import { Asset, ASSETS } from "@/lib/mockData";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssetSelectorProps {
  selected: string;
  onSelect: (ticker: string) => void;
}

export function AssetSelector({ selected, onSelect }: AssetSelectorProps) {
  const stocks = ASSETS.filter((a) => a.type === "stock");
  const funds = ASSETS.filter((a) => a.type === "mutual_fund");

  return (
    <Select value={selected} onValueChange={onSelect}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select an asset" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Stocks</SelectLabel>
          {stocks.map((a) => (
            <SelectItem key={a.ticker} value={a.ticker}>
              <span className="font-semibold">{a.ticker}</span>
              <span className="ml-2 text-muted-foreground">{a.name}</span>
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Mutual Funds</SelectLabel>
          {funds.map((a) => (
            <SelectItem key={a.ticker} value={a.ticker}>
              <span className="font-semibold">{a.ticker}</span>
              <span className="ml-2 text-muted-foreground">{a.name}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
