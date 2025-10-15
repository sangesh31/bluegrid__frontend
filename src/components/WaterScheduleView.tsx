import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const WaterScheduleView = () => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [activeSchedule, setActiveSchedule] = useState<any>(null);

  useEffect(() => {
    const fetchSchedules = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data } = await supabase
        .from('water_schedules')
        .select('*')
        .gte('scheduled_open_time', today)
        .order('scheduled_open_time', { ascending: true });

      if (data) {
        setSchedules(data);
        const active = data.find(s => s.is_active);
        setActiveSchedule(active);
      }
    };

    fetchSchedules();

    const channel = supabase
      .channel('water_schedules')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'water_schedules'
      }, () => {
        fetchSchedules();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="space-y-4">
      {activeSchedule?.interrupted && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Water supply interrupted: {activeSchedule.interruption_reason}
          </AlertDescription>
        </Alert>
      )}

      {schedules.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No water schedules available</p>
        </div>
      ) : (
        schedules.map((schedule) => (
          <Card key={schedule.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">
                    {new Date(schedule.scheduled_open_time).toLocaleDateString()}
                  </h4>
                  {schedule.is_active && (
                    <Badge className="bg-success">Active</Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Scheduled Open</p>
                    <p className="font-medium">
                      {new Date(schedule.scheduled_open_time).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Scheduled Close</p>
                    <p className="font-medium">
                      {new Date(schedule.scheduled_close_time).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>

                {schedule.actual_open_time && (
                  <div className="text-sm text-muted-foreground">
                    Actually opened at: {new Date(schedule.actual_open_time).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};

export default WaterScheduleView;
