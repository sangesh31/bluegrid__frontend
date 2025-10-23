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
import LanguageSwitcher from "./components/LanguageSwitcher";
import Header from "./components/Header";
import Footer from "./components/Footer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AIChatbot />
          <LanguageSwitcher />
          <BrowserRouter>
          <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/resident" element={<ResidentDashboard />} />
                <Route path="/panchayat-officer" element={<PanchayatOfficerDashboard />} />
                <Route path="/panchayat_officer" element={<PanchayatOfficerDashboard />} />
                <Route path="/pam/layout-officer" element={<PanchayatOfficerDashboard />} />
                <Route path="/maintenance-technician" element={<MaintenanceTechnicianDashboard />} />
                <Route path="/maintenance_technician" element={<MaintenanceTechnicianDashboard />} />
                <Route path="/water-controller" element={<WaterFlowControllerDashboard />} />
                <Route path="/water_controller" element={<WaterFlowControllerDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;