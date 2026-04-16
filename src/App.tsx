import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Portfolio from "./pages/Portfolio.tsx";
import Monitoring from "./pages/Monitoring.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AppHeader, AppTab } from "@/components/AppHeader";
import { DataProvider } from "@/contexts/DataContext";

const queryClient = new QueryClient();

function MainApp() {
  const [tab, setTab] = useState<AppTab>("monitoring");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activeTab={tab} onTabChange={setTab} />
      <div style={{ display: tab === "monitoring" ? "block" : "none" }}>
        <Monitoring />
      </div>
      <div style={{ display: tab === "exploration" ? "block" : "none" }}>
        <Index />
      </div>
      <div style={{ display: tab === "construction" ? "block" : "none" }}>
        <Portfolio />
      </div>
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainApp />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
