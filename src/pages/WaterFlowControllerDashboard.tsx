import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Droplets, LogOut, Clock, Play, Square, AlertTriangle, Calendar, MapPin } from "lucide-react";

interface WaterSchedule {
  id: string;
  area: string;
  user_id?: string;
  user_name?: string;
  scheduled_open_time: string;
  scheduled_close_time: string;
  actual_open_time?: string;
  actual_close_time?: string;
  is_active: boolean;
  interrupted: boolean;
  interruption_reason?: string;
  created_at: string;
}

interface ResidentUser {
  id: string;
  full_name: string;
  address: string;
  phone?: string;
}

const WaterFlowControllerDashboard = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [schedules, setSchedules] = useState<WaterSchedule[]>([]);
  const [activeSchedule, setActiveSchedule] = useState<WaterSchedule | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [residents, setResidents] = useState<ResidentUser[]>([]);
  const [newSchedule, setNewSchedule] = useState({
    area: '',
    user_id: '',
    scheduled_open_time: '',
    scheduled_close_time: ''
  });
  const [interruptionReason, setInterruptionReason] = useState('');
  const [showInterruptDialog, setShowInterruptDialog] = useState(false);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'water_flow_controller')) {
      navigate("/auth");
    }
    if (user && profile?.role === 'water_flow_controller') {
      fetchSchedules();
      fetchResidents();
    }
  }, [user, profile, loading, navigate]);

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch('http://localhost:3001/api/schedules/my-schedules', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
        
        // Find active schedule
        const active = data.find((s: WaterSchedule) => s.is_active && !s.interrupted);
        setActiveSchedule(active || null);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchResidents = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch('http://localhost:3001/api/users/residents', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setResidents(data);
      }
    } catch (error) {
      console.error('Error fetching residents:', error);
    }
  };

  const createSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchedule.user_id || !newSchedule.scheduled_open_time || !newSchedule.scheduled_close_time) {
      toast({
        title: "Missing information",
        description: "Please select a resident and fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch('http://localhost:3001/api/schedules/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newSchedule),
      });
      
      if (response.ok) {
        toast({
          title: "Schedule created",
          description: "Water supply schedule has been created successfully.",
        });
        setNewSchedule({ area: '', scheduled_open_time: '', scheduled_close_time: '' });
        fetchSchedules();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create schedule');
      }
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      toast({
        title: "Creation failed",
        description: error.message || "Unable to create schedule. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWaterNow = async (scheduleId: string) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`http://localhost:3001/api/schedules/${scheduleId}/open`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        toast({
          title: "Water opened",
          description: "Water supply has been opened successfully.",
        });
        fetchSchedules();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to open water');
      }
    } catch (error: any) {
      console.error('Error opening water:', error);
      toast({
        title: "Operation failed",
        description: error.message || "Unable to open water. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeWaterNow = async (scheduleId: string) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`http://localhost:3001/api/schedules/${scheduleId}/close`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        toast({
          title: "Water closed",
          description: "Water supply has been closed successfully.",
        });
        fetchSchedules();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to close water');
      }
    } catch (error: any) {
      console.error('Error closing water:', error);
      toast({
        title: "Operation failed",
        description: error.message || "Unable to close water. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const interruptWater = async (scheduleId: string) => {
    if (!interruptionReason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for interruption.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`http://localhost:3001/api/schedules/${scheduleId}/interrupt`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: interruptionReason }),
      });
      
      if (response.ok) {
        toast({
          title: "Water interrupted",
          description: "Water supply has been interrupted successfully.",
        });
        setInterruptionReason('');
        setShowInterruptDialog(false);
        fetchSchedules();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to interrupt water');
      }
    } catch (error: any) {
      console.error('Error interrupting water:', error);
      toast({
        title: "Operation failed",
        description: error.message || "Unable to interrupt water. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'water_flow_controller') {
    return null;
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="glass-effect rounded-2xl p-6 mb-8 animate-fade-in">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-medium">
                  <Droplets className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white animate-pulse-soft"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text font-display">Water Flow Controller</h1>
                <p className="text-lg text-muted-foreground font-medium">Welcome back, {profile.full_name}</p>
                <p className="text-sm text-muted-foreground">Managing water supply operations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">System Status</p>
                <p className="text-sm font-medium text-green-600">● Online</p>
              </div>
              <Button variant="outline" onClick={handleSignOut} className="btn-secondary">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Active Schedule Status */}
        {activeSchedule && (
          <div className="dashboard-card mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 animate-slide-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Droplets className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-800 font-display">Active Water Supply</h2>
                  <p className="text-blue-600 font-medium">{activeSchedule.area}</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                🟢 Live
              </Badge>
            </div>
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled Time</p>
                    <p className="font-medium">
                      {formatTime(activeSchedule.scheduled_open_time)} - {formatTime(activeSchedule.scheduled_close_time)}
                    </p>
                  </div>
                  {activeSchedule.actual_open_time && (
                    <div>
                      <p className="text-sm text-muted-foreground">Actual Open Time</p>
                      <p className="font-medium text-green-600">{formatTime(activeSchedule.actual_open_time)}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {!activeSchedule.actual_open_time ? (
                    <Button 
                      onClick={() => openWaterNow(activeSchedule.id)}
                      disabled={isSubmitting}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Open Now
                    </Button>
                  ) : !activeSchedule.actual_close_time ? (
                    <>
                      <Button 
                        onClick={() => closeWaterNow(activeSchedule.id)}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Close Now
                      </Button>
                      <Button 
                        onClick={() => setShowInterruptDialog(true)}
                        disabled={isSubmitting}
                        variant="destructive"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Emergency Stop
                      </Button>
                    </>
                  ) : (
                    <Badge variant="secondary" className="text-green-600">
                      Completed at {formatTime(activeSchedule.actual_close_time)}
                    </Badge>
                  )}
                </div>
              </div>
          </div>
        )}

        <div className="glass-effect rounded-2xl p-2 mb-6">
          <Tabs defaultValue="control" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-transparent gap-2">
              <TabsTrigger value="control" className="nav-tab data-[state=active]:shadow-medium">
                <Droplets className="w-4 h-4 mr-2" />
                Water Control
              </TabsTrigger>
              <TabsTrigger value="schedule" className="nav-tab data-[state=active]:shadow-medium">
                <Calendar className="w-4 h-4 mr-2" />
                Create Schedule
              </TabsTrigger>
              <TabsTrigger value="history" className="nav-tab data-[state=active]:shadow-medium">
                <Clock className="w-4 h-4 mr-2" />
                Schedule History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="control" className="space-y-6 animate-fade-in">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="dashboard-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Droplets className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-display">Current Status</h3>
                      <p className="text-sm text-muted-foreground">Water supply control status</p>
                    </div>
                  </div>
                  {activeSchedule ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={activeSchedule.actual_open_time ? "default" : "secondary"}>
                          {activeSchedule.actual_open_time ? "Water Open" : "Scheduled"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{activeSchedule.area}</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><strong>Scheduled:</strong> {formatTime(activeSchedule.scheduled_open_time)} - {formatTime(activeSchedule.scheduled_close_time)}</p>
                        {activeSchedule.actual_open_time && (
                          <p><strong>Opened:</strong> {formatTime(activeSchedule.actual_open_time)}</p>
                        )}
                        {activeSchedule.actual_close_time && (
                          <p><strong>Closed:</strong> {formatTime(activeSchedule.actual_close_time)}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span className="text-muted-foreground">No active schedule</span>
                    </div>
                  )}
                </div>

                <div className="dashboard-card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Play className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-display">Quick Actions</h3>
                      <p className="text-sm text-muted-foreground">Emergency water control</p>
                    </div>
                  </div>
                  {activeSchedule ? (
                    <div className="space-y-3">
                      {!activeSchedule.actual_open_time ? (
                        <Button 
                          onClick={() => openWaterNow(activeSchedule.id)}
                          disabled={isSubmitting}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Open Water Supply
                        </Button>
                      ) : !activeSchedule.actual_close_time ? (
                        <>
                          <Button 
                            onClick={() => closeWaterNow(activeSchedule.id)}
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            <Square className="w-4 h-4 mr-2" />
                            Close Water Supply
                          </Button>
                          <Button 
                            onClick={() => setShowInterruptDialog(true)}
                            disabled={isSubmitting}
                            variant="destructive"
                            className="w-full"
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Emergency Stop
                          </Button>
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <Badge variant="secondary" className="text-green-600">
                            Schedule Completed
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No active schedule to control
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Schedule</CardTitle>
                <CardDescription>Schedule water supply for specific areas</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createSchedule} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resident">Select Resident Address *</Label>
                    <Select
                      value={newSchedule.user_id}
                      onValueChange={(value) => {
                        const selectedResident = residents.find(r => r.id === value);
                        setNewSchedule(prev => ({
                          ...prev,
                          user_id: value,
                          area: selectedResident?.address || ''
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select resident address" />
                      </SelectTrigger>
                      <SelectContent>
                        {residents.map((resident) => (
                          <SelectItem key={resident.id} value={resident.id}>
                            {resident.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="open_time">Open Time *</Label>
                      <Input
                        id="open_time"
                        type="datetime-local"
                        value={newSchedule.scheduled_open_time}
                        onChange={(e) => setNewSchedule(prev => ({ ...prev, scheduled_open_time: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="close_time">Close Time *</Label>
                      <Input
                        id="close_time"
                        type="datetime-local"
                        value={newSchedule.scheduled_close_time}
                        onChange={(e) => setNewSchedule(prev => ({ ...prev, scheduled_close_time: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? 'Creating...' : 'Create Schedule'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Schedule History</CardTitle>
                <CardDescription>Previous and upcoming water supply schedules</CardDescription>
              </CardHeader>
              <CardContent>
                {schedules.length > 0 ? (
                  <div className="space-y-4">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{schedule.area}</span>
                            <Badge variant={schedule.is_active ? "default" : schedule.interrupted ? "destructive" : "secondary"}>
                              {schedule.interrupted ? "Interrupted" : schedule.is_active ? "Active" : "Completed"}
                            </Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">{formatDate(schedule.created_at)}</span>
                        </div>
                        <div className="text-sm space-y-1">
                          <p><strong>Scheduled:</strong> {formatTime(schedule.scheduled_open_time)} - {formatTime(schedule.scheduled_close_time)}</p>
                          {schedule.actual_open_time && (
                            <p><strong>Actual Open:</strong> {formatTime(schedule.actual_open_time)}</p>
                          )}
                          {schedule.actual_close_time && (
                            <p><strong>Actual Close:</strong> {formatTime(schedule.actual_close_time)}</p>
                          )}
                          {schedule.interrupted && schedule.interruption_reason && (
                            <p><strong>Interruption Reason:</strong> {schedule.interruption_reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No schedules found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          </Tabs>
        </div>

        {/* Emergency Stop Dialog */}
        {showInterruptDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4 text-red-600">
                <AlertTriangle className="w-5 h-5 inline mr-2" />
                Emergency Stop
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please provide a reason for stopping the water supply:
              </p>
              <Textarea
                value={interruptionReason}
                onChange={(e) => setInterruptionReason(e.target.value)}
                placeholder="Enter reason for interruption..."
                className="mb-4"
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowInterruptDialog(false);
                    setInterruptionReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => activeSchedule && interruptWater(activeSchedule.id)}
                  disabled={isSubmitting || !interruptionReason.trim()}
                >
                  {isSubmitting ? 'Stopping...' : 'Stop Water Supply'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaterFlowControllerDashboard;
