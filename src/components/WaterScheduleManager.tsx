import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, Power, AlertCircle } from "lucide-react";

interface WaterScheduleManagerProps {
  workerId: string;
}

const WaterScheduleManager = ({ workerId }: WaterScheduleManagerProps) => {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [activeSchedule, setActiveSchedule] = useState<any>(null);
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [interruptReason, setInterruptReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchSchedules();

    const channel = supabase
      .channel('worker_schedules')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'water_schedules',
        filter: `worker_id=eq.${workerId}`
      }, () => {
        fetchSchedules();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workerId]);

  const fetchSchedules = async () => {
    const { data } = await supabase
      .from('water_schedules')
      .select('*')
      .eq('worker_id', workerId)
      .order('scheduled_open_time', { ascending: false });

    if (data) {
      setSchedules(data);
      const active = data.find(s => s.is_active);
      setActiveSchedule(active);
    }
  };

  const createSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const today = new Date().toISOString().split('T')[0];
    const openDateTime = new Date(`${today}T${openTime}`).toISOString();
    const closeDateTime = new Date(`${today}T${closeTime}`).toISOString();

    const { error } = await supabase.from('water_schedules').insert({
      worker_id: workerId,
      scheduled_open_time: openDateTime,
      scheduled_close_time: closeDateTime,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create schedule",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Schedule created",
        description: "Water supply schedule has been set",
      });
      setOpenTime("");
      setCloseTime("");
    }
  };

  const openWaterNow = async (scheduleId: string) => {
    const { error } = await supabase
      .from('water_schedules')
      .update({
        actual_open_time: new Date().toISOString(),
        is_active: true,
      })
      .eq('id', scheduleId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to open water supply",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Water supply opened",
        description: "Water is now flowing",
      });
    }
  };

  const closeWaterNow = async (scheduleId: string) => {
    const { error } = await supabase
      .from('water_schedules')
      .update({
        actual_close_time: new Date().toISOString(),
        is_active: false,
      })
      .eq('id', scheduleId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to close water supply",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Water supply closed",
        description: "Water has been stopped",
      });
    }
  };

  const interruptSupply = async () => {
    if (!activeSchedule || !interruptReason) return;

    const { error } = await supabase
      .from('water_schedules')
      .update({
        interrupted: true,
        interruption_reason: interruptReason,
        is_active: false,
      })
      .eq('id', activeSchedule.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to interrupt supply",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Supply interrupted",
        description: "Water supply has been stopped",
      });
      setInterruptReason("");
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={createSchedule} className="space-y-4">
        <h3 className="font-semibold text-lg">Create New Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="openTime">Opening Time</Label>
            <Input
              id="openTime"
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="closeTime">Closing Time</Label>
            <Input
              id="closeTime"
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              required
            />
          </div>
        </div>
        <Button type="submit">Create Schedule</Button>
      </form>

      {activeSchedule && (
        <Card className="p-4 bg-primary/5 border-primary">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Power className="w-5 h-5 text-success" />
                Active Schedule
              </h3>
              <Badge className="bg-success">Running</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Scheduled Open</p>
                <p className="font-medium">
                  {new Date(activeSchedule.scheduled_open_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Scheduled Close</p>
                <p className="font-medium">
                  {new Date(activeSchedule.scheduled_close_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interruptReason">Interruption Reason (if needed)</Label>
              <Textarea
                id="interruptReason"
                value={interruptReason}
                onChange={(e) => setInterruptReason(e.target.value)}
                placeholder="Enter reason for interruption..."
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => closeWaterNow(activeSchedule.id)}
                variant="secondary"
              >
                Close Now
              </Button>
              <Button 
                onClick={interruptSupply}
                variant="destructive"
                disabled={!interruptReason}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Interrupt Supply
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        <h3 className="font-semibold">Recent Schedules</h3>
        {schedules.filter(s => !s.is_active).slice(0, 5).map((schedule) => (
          <Card key={schedule.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Scheduled</p>
                    <p className="font-medium">
                      {new Date(schedule.scheduled_open_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })} - {new Date(schedule.scheduled_close_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {schedule.interrupted && (
                  <div className="text-sm text-destructive">
                    Interrupted: {schedule.interruption_reason}
                  </div>
                )}
              </div>

              {!schedule.actual_open_time && new Date(schedule.scheduled_open_time) > new Date() && (
                <Button 
                  size="sm"
                  onClick={() => openWaterNow(schedule.id)}
                >
                  Open Now
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WaterScheduleManager;
