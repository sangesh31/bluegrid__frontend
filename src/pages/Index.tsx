import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Droplets } from "lucide-react";
import heroImage from "@/assets/hero-water.jpg";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
            <Droplets className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            BlueGrid
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
            Smart Panchayat Water Management System
          </p>
          <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
            Empowering Panchayats with digital tools for efficient water supply management, 
            pipe damage reporting, and real-time schedule coordination
          </p>
        </div>

        <div className="max-w-5xl mx-auto mb-12 rounded-2xl overflow-hidden shadow-2xl">
          <img 
            src={heroImage} 
            alt="Modern water infrastructure management"
            className="w-full h-auto"
          />
        </div>

        <div className="text-center space-y-4">
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
            className="text-lg px-8"
          >
            Get Started
          </Button>
          <p className="text-sm text-muted-foreground">
            For Residents • Panchayat Officers • Maintenance Technicians • Water Flow Controllers
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
