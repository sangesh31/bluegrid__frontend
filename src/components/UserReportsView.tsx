import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface UserReportsViewProps {
  userId: string;
}

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

const UserReportsView = ({ userId }: UserReportsViewProps) => {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      const { data } = await supabase
        .from('pipe_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data) setReports(data);
    };

    fetchReports();

    const channel = supabase
      .channel('user_reports')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pipe_reports',
        filter: `user_id=eq.${userId}`
      }, () => {
        fetchReports();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No reports submitted yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <Card key={report.id} className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold">{report.full_name}</h4>
              <p className="text-sm text-muted-foreground">{report.address}</p>
            </div>
            <Badge className={statusColors[report.status as keyof typeof statusColors]}>
              {statusLabels[report.status as keyof typeof statusLabels]}
            </Badge>
          </div>
          {report.notes && (
            <p className="text-sm mt-2">{report.notes}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            Submitted on {new Date(report.created_at).toLocaleDateString()}
          </p>
        </Card>
      ))}
    </div>
  );
};

export default UserReportsView;
