import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Portfolio from "./pages/Portfolio.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AppHeader } from "@/components/AppHeader";

const queryClient = new QueryClient();

function MainApp() {
  const [tab, setTab] = useState<"market" | "portfolio">("market");

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activeTab={tab} onTabChange={setTab} />
      <div style={{ display: tab === "market" ? "block" : "none" }}>
        <Index />
      </div>
      <div style={{ display: tab === "portfolio" ? "block" : "none" }}>
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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
