import { cn } from "@/lib/utils";

interface Props {
  activeTab: "market" | "portfolio";
  onTabChange: (tab: "market" | "portfolio") => void;
}

export function AppHeader({ activeTab, onTabChange }: Props) {
  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center gap-6 py-3 px-4">
        <span className="text-lg font-bold tracking-tight">Market Data</span>
        <nav className="flex items-center gap-1">
          <button
            onClick={() => onTabChange("market")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === "market"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            Dashboard
          </button>
          <button
            onClick={() => onTabChange("portfolio")}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeTab === "portfolio"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
          >
            Portfolio
          </button>
        </nav>
      </div>
    </header>
  );
}
