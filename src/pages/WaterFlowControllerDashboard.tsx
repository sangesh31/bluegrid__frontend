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
import { API_URL } from "@/lib/api";

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
      
      const response = await fetch(`${API_URL}/api/schedules/my-schedules`, {
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
      
      const response = await fetch(`${API_URL}/api/users/residents`, {
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
      
      const response = await fetch(`${API_URL}/api/schedules/create`, {
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
        setNewSchedule({
          area: '',
          user_id: '',
          scheduled_open_time: '',
          scheduled_close_time: ''
        });
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
      
      const response = await fetch(`${API_URL}/api/schedules/${scheduleId}/open`, {
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
      
      const response = await fetch(`${API_URL}/api/schedules/${scheduleId}/close`, {
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
      
      const response = await fetch(`${API_URL}/api/schedules/${scheduleId}/interrupt`, {
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
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 mb-8 animate-fade-in shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                  <Droplets className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse-soft"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white font-display flex items-center gap-2">
                  💧 Water Flow Controller
                </h1>
                <p className="text-lg text-white/90 font-medium">Welcome back, {profile.full_name}</p>
                <p className="text-sm text-white/80">Managing water supply operations</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <p className="text-xs text-white/80">System Status</p>
                <p className="text-sm font-bold text-green-300">● Online</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleSignOut} 
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:text-white"
              >
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
                <div className="flex gap-4">
                  {!activeSchedule.actual_open_time ? (
                    <button 
                      onClick={() => openWaterNow(activeSchedule.id)}
                      disabled={isSubmitting}
                      className="btn-3d-on"
                    >
                      ON
                    </button>
                  ) : !activeSchedule.actual_close_time ? (
                    <>
                      <button 
                        onClick={() => closeWaterNow(activeSchedule.id)}
                        disabled={isSubmitting}
                        className="btn-3d-off"
                      >
                        OFF
                      </button>
                      <button 
                        onClick={() => setShowInterruptDialog(true)}
                        disabled={isSubmitting}
                        className="btn-3d-emergency"
                      >
                        ⚠ STOP
                      </button>
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
                    <div className="space-y-4 flex flex-col items-center">
                      {!activeSchedule.actual_open_time ? (
                        <button 
                          onClick={() => openWaterNow(activeSchedule.id)}
                          disabled={isSubmitting}
                          className="btn-3d-on"
                        >
                          ON
                        </button>
                      ) : !activeSchedule.actual_close_time ? (
                        <>
                          <button 
                            onClick={() => closeWaterNow(activeSchedule.id)}
                            disabled={isSubmitting}
                            className="btn-3d-off"
                          >
                            OFF
                          </button>
                          <button 
                            onClick={() => setShowInterruptDialog(true)}
                            disabled={isSubmitting}
                            className="btn-3d-emergency"
                          >
                            ⚠ EMERGENCY STOP
                          </button>
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

          <TabsContent value="schedule" className="space-y-6 animate-fade-in">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b border-teal-200 px-6 py-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  📅 Create New Schedule
                </h2>
                <p className="text-sm text-gray-600 mt-1">Schedule water supply for specific areas</p>
              </div>
              <div className="p-6">
                <form onSubmit={createSchedule} className="space-y-5">
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
                  <Button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 hover:bg-teal-700">
                    {isSubmitting ? 'Creating...' : '📅 Create Schedule'}
                  </Button>
                </form>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6 animate-fade-in">
            <div className="dashboard-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-display bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Schedule History
                  </h3>
                  <p className="text-sm text-muted-foreground">Previous and upcoming water supply schedules</p>
                </div>
              </div>

              {schedules.length > 0 ? (
                <div className="space-y-4">
                  {schedules.map((schedule, index) => (
                    <div 
                      key={schedule.id} 
                      className="group relative overflow-hidden rounded-xl border-2 border-gray-100 bg-gradient-to-br from-white to-gray-50 p-5 hover:shadow-lg hover:border-blue-200 transition-all duration-300 animate-slide-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Decorative gradient overlay */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/50 to-cyan-100/50 rounded-full blur-2xl -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                              <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-lg text-gray-800">{schedule.area}</h4>
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(schedule.created_at)}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            className={`px-3 py-1 font-semibold ${
                              schedule.interrupted 
                                ? "bg-red-100 text-red-700 border-red-200" 
                                : schedule.is_active 
                                ? "bg-green-100 text-green-700 border-green-200 animate-pulse-soft" 
                                : "bg-gray-100 text-gray-700 border-gray-200"
                            }`}
                          >
                            {schedule.interrupted ? "⚠️ Interrupted" : schedule.is_active ? "🟢 Active" : "✓ Completed"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Scheduled Time
                            </p>
                            <p className="font-semibold text-gray-800">
                              {formatTime(schedule.scheduled_open_time)} - {formatTime(schedule.scheduled_close_time)}
                            </p>
                          </div>

                          {schedule.actual_open_time && (
                            <div className="bg-green-50/80 backdrop-blur-sm rounded-lg p-3 border border-green-100">
                              <p className="text-xs text-green-600 mb-1 flex items-center gap-1">
                                <Play className="w-3 h-3" />
                                Actual Open Time
                              </p>
                              <p className="font-semibold text-green-700">{formatTime(schedule.actual_open_time)}</p>
                            </div>
                          )}

                          {schedule.actual_close_time && (
                            <div className="bg-blue-50/80 backdrop-blur-sm rounded-lg p-3 border border-blue-100">
                              <p className="text-xs text-blue-600 mb-1 flex items-center gap-1">
                                <Square className="w-3 h-3" />
                                Actual Close Time
                              </p>
                              <p className="font-semibold text-blue-700">{formatTime(schedule.actual_close_time)}</p>
                            </div>
                          )}

                          {schedule.interrupted && schedule.interruption_reason && (
                            <div className="col-span-full bg-red-50/80 backdrop-blur-sm rounded-lg p-3 border border-red-100">
                              <p className="text-xs text-red-600 mb-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Interruption Reason
                              </p>
                              <p className="font-medium text-red-700">{schedule.interruption_reason}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 animate-fade-in">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-xl opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-full">
                      <Clock className="w-16 h-16 text-blue-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mt-6 mb-2">No Schedules Yet</h3>
                  <p className="text-gray-500">Schedule history will appear here once you create water supply schedules</p>
                </div>
              )}
            </div>
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
