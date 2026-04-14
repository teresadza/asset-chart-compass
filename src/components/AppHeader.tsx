import { NavLink } from "./NavLink";

export function AppHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center gap-6 py-3 px-4">
        <span className="text-lg font-bold tracking-tight">Market Data</span>
        <nav className="flex items-center gap-1">
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/portfolio">Portfolio</NavLink>
        </nav>
      </div>
    </header>
  );
}
