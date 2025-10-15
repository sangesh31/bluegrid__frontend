import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { FileText, MapPin, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const statusColors = {
  pending: "bg-warning",
  assigned: "bg-primary",
  in_progress: "bg-secondary",
  completed: "bg-success",
  awaiting_approval: "bg-info",
};

const statusLabels = {
  pending: "Pending",
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  awaiting_approval: "Awaiting Approval",
};

interface PipeReport {
  id: string;
  full_name: string;
  address: string;
  notes?: string;
  location_lat?: number;
  location_lng?: number;
  status: keyof typeof statusLabels;
  created_at: string;
}

interface PlumberTasksViewProps {
  plumberId: string;
}

const PlumberTasksView = ({ plumberId }: PlumberTasksViewProps) => {
  const [tasks, setTasks] = useState<PipeReport[]>([]);
  const { toast } = useToast();
  const { token } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, [plumberId]);

  const fetchTasks = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:3001/api/reports/assigned', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch tasks",
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

  const updateTaskStatus = async (taskId: string, newStatus: keyof typeof statusLabels) => {
    if (!token) return;
    
    try {
      const response = await fetch(`http://localhost:3001/api/reports/${taskId}/technician-update`, {
        method: 'PUT',
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
        fetchTasks(); // Refresh the tasks
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to update status",
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

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No tasks assigned yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card key={task.id} className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-semibold">{task.full_name}</h4>
                <p className="text-sm text-muted-foreground">{task.address}</p>
                {task.notes && (
                  <p className="text-sm mt-2">{task.notes}</p>
                )}
              </div>
              <Badge className={statusColors[task.status]}>
                {statusLabels[task.status]}
              </Badge>
            </div>

            {(task.location_lat && task.location_lng) && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <a
                  href={`https://www.google.com/maps?q=${task.location_lat},${task.location_lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View on Map
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="flex gap-2">
              {task.status === 'assigned' && (
                <Button 
                  size="sm"
                  onClick={() => updateTaskStatus(task.id, 'in_progress')}
                >
                  Start Work
                </Button>
              )}
              {task.status === 'in_progress' && (
                <Button 
                  size="sm"
                  onClick={() => updateTaskStatus(task.id, 'awaiting_approval')}
                  className="bg-success hover:bg-success/90"
                >
                  Mark Complete
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Assigned on {new Date(task.created_at).toLocaleDateString()}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default PlumberTasksView;