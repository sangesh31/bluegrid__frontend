import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResidentDashboard from "./pages/ResidentDashboard";
import PanchayatOfficerDashboard from "./pages/PanchayatOfficerDashboard";
import MaintenanceTechnicianDashboard from "./pages/MaintenanceTechnicianDashboard";
import WaterFlowControllerDashboard from "./pages/WaterFlowControllerDashboard";
import NotFound from "./pages/NotFound";
import AIChatbot from "./components/AIChatbot";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AIChatbot />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/resident" element={<ResidentDashboard />} />
            <Route path="/panchayat-officer" element={<PanchayatOfficerDashboard />} />
            <Route path="/pam/layout-officer" element={<PanchayatOfficerDashboard />} />
            <Route path="/maintenance-technician" element={<MaintenanceTechnicianDashboard />} />
            <Route path="/water-controller" element={<WaterFlowControllerDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;