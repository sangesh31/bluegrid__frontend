import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { FileText, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const statusColors = {
  pending: "bg-warning",
  assigned: "bg-primary",
  in_progress: "bg-secondary",
  completed: "bg-success",
};

const statusLabels = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
};

// Define types for our data
interface Plumber {
  id: string;
  full_name: string;
  phone?: string;
  address?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface PipeReport {
  id: string;
  full_name: string;
  address: string;
  notes?: string;
  location_lat?: number;
  location_lng?: number;
  status: keyof typeof statusLabels;
  assigned_plumber_id?: string;
  created_at: string;
  completed_at?: string;
  assigned_plumber?: {
    full_name: string;
  };
}

const AdminReportsView = () => {
  const [reports, setReports] = useState<PipeReport[]>([]);
  const [plumbers, setPlumbers] = useState<Plumber[]>([]);
  const { toast } = useToast();
  const { token } = useAuth();

  useEffect(() => {
    fetchReports();
    fetchPlumbers();
  }, []);

  const fetchReports = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/admin/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch reports",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  const fetchPlumbers = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/admin/plumbers', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPlumbers(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch plumbers",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  const assignPlumber = async (reportId: string, plumberId: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/admin/reports/${reportId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plumberId }),
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Plumber assigned successfully",
        });
        fetchReports(); // Refresh the reports
      } else {
        toast({
          title: "Error",
          description: "Failed to assign plumber",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  const updateStatus = async (reportId: string, newStatus: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/admin/reports/${reportId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Status updated successfully",
        });
        fetchReports(); // Refresh the reports
      } else {
        toast({
          title: "Error",
          description: "Failed to update status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No reports available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <Card key={report.id} className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold">{report.full_name}</h4>
                <p className="text-sm text-muted-foreground">{report.address}</p>
                {report.notes && (
                  <p className="text-sm mt-2">{report.notes}</p>
                )}
              </div>
              <Badge className={statusColors[report.status]}>
                {statusLabels[report.status]}
              </Badge>
            </div>

            {(report.location_lat && report.location_lng) && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>
                  Location: {report.location_lat.toFixed(6)}, {report.location_lng.toFixed(6)}
                </span>
              </div>
            )}

            {report.assigned_plumber && (
              <div className="text-sm">
                <span className="text-muted-foreground">Assigned to: </span>
                <span className="font-medium">{report.assigned_plumber.full_name}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Select
                value={report.assigned_plumber_id || ""}
                onValueChange={(value) => assignPlumber(report.id, value)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Assign plumber" />
                </SelectTrigger>
                <SelectContent>
                  {plumbers.map((plumber) => (
                    <SelectItem key={plumber.id} value={plumber.id}>
                      {plumber.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={report.status}
                onValueChange={(value) => updateStatus(report.id, value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              Submitted on {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default AdminReportsView;
