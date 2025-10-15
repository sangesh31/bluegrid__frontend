import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Droplets, LogOut, FileText, Users, Clock, MapPin, Plus, Loader2, AlertCircle, CheckCircle2, Settings, Calendar, Shield, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MapView from "@/components/MapView";
import { API_URL } from "@/lib/api";

interface PipeReport {
  id: string;
  user_id: string;
  full_name: string;
  address: string;
  location_lat: number | null;
  location_lng: number | null;
  photo_url: string | null;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'awaiting_approval' | 'approved' | 'rejected';
  notes: string | null;
  assigned_technician_id: string | null;
  technician_name?: string;
  completion_notes: string | null;
  approved_by: string | null;
  approved_by_name?: string;
  approved_at: string | null;
  completed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  id: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  email?: string;
  role: 'resident' | 'panchayat_officer' | 'maintenance_technician' | 'water_flow_controller';
  created_at: string;
  updated_at: string;
}

interface WaterSchedule {
  id: string;
  area: string;
  scheduled_open_time: string;
  scheduled_close_time: string;
  actual_open_time: string | null;
  actual_close_time: string | null;
  is_active: boolean;
  interrupted: boolean;
  interruption_reason: string | null;
  controller_id?: string;
  controller_name?: string;
  controller_phone?: string;
  controller_address?: string;
  created_at: string;
}

const PanchayatOfficerDashboard = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [reports, setReports] = useState<PipeReport[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [schedules, setSchedules] = useState<WaterSchedule[]>([]);
  const [technicians, setTechnicians] = useState<UserProfile[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectionDialog, setShowRejectionDialog] = useState<string | null>(null);
  const [showCreateStaffDialog, setShowCreateStaffDialog] = useState<'maintenance_technician' | 'water_flow_controller' | null>(null);
  const [selectedTechnicians, setSelectedTechnicians] = useState<Record<string, string>>({});
  const [newStaff, setNewStaff] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    address: '',
  });
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
    userName: string;
  } | null>(null);

  const residents = users.filter(u => u.role === 'resident');
  const waterControllers = users.filter(u => u.role === 'water_flow_controller');

  // Computed stats from existing data
  const stats = {
    totalReports: reports.length,
    totalUsers: users.length,
    totalSchedules: schedules.length,
    completedTasks: reports.filter(r => r.status === 'approved').length
  };

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'panchayat_officer')) {
      navigate("/auth");
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (user && profile?.role === 'panchayat_officer') {
      fetchAllReports();
      fetchUsers();
      fetchSchedules();
    }
  }, [user, profile]);

  const fetchAllReports = async () => {
    setIsLoadingReports(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/reports/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch reports:', response.status);
        setReports([]);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setReports([]);
    } finally {
      setIsLoadingReports(false);
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      // Note: We'll need to add a users endpoint to the backend
      // For now, we'll extract technicians from reports or use a placeholder
      const response = await fetch(`${API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const allUsers = Array.isArray(data) ? data : [];
        setUsers(allUsers);
        setTechnicians(allUsers.filter(u => u.role === 'maintenance_technician'));
      } else {
        // Fallback: create mock technicians for assignment
        const mockTechnicians = [
          { id: 'tech1', full_name: 'John Technician', role: 'maintenance_technician' as const, phone: null, address: null, created_at: '', updated_at: '' },
          { id: 'tech2', full_name: 'Jane Repair', role: 'maintenance_technician' as const, phone: null, address: null, created_at: '', updated_at: '' }
        ];
        setTechnicians(mockTechnicians);
        setUsers(mockTechnicians);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Fallback technicians
      const mockTechnicians = [
        { id: 'tech1', full_name: 'John Technician', role: 'maintenance_technician' as const, phone: null, address: null, created_at: '', updated_at: '' },
        { id: 'tech2', full_name: 'Jane Repair', role: 'maintenance_technician' as const, phone: null, address: null, created_at: '', updated_at: '' }
      ];
      setTechnicians(mockTechnicians);
      setUsers(mockTechnicians);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/api/schedules/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchedules(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch schedules:', response.status);
        setSchedules([]);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const assignTechnician = async (reportId: string, technicianId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/reports/${reportId}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ assigned_technician_id: technicianId, status: 'assigned' }),
      });
      
      if (response.ok) {
        toast({
          title: "Technician assigned",
          description: "Report has been assigned successfully.",
        });
        fetchAllReports(); // Refresh reports
      } else {
        throw new Error('Failed to assign technician');
      }
    } catch (error) {
      console.error('Error assigning technician:', error);
      toast({
        title: "Assignment failed",
        description: "Unable to assign technician. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/reports/${reportId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        toast({
          title: "Status updated",
          description: "Report status has been updated successfully.",
        });
        fetchAllReports(); // Refresh reports
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Update failed",
        description: "Unable to update status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.email || !newStaff.password || !newStaff.full_name || !showCreateStaffDialog) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast({
          title: "Authentication error",
          description: "Please login again.",
          variant: "destructive",
        });
        return;
      }
      
      const requestData = {
        ...newStaff,
        role: showCreateStaffDialog,
      };
      
      console.log('Creating staff with data:', requestData);
      
      const response = await fetch(`${API_URL}/api/users/create-staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Success result:', result);
        toast({
          title: "Staff created successfully",
          description: `${showCreateStaffDialog.replace('_', ' ')} has been created successfully.`,
        });
        setNewStaff({ email: '', password: '', full_name: '', phone: '', address: '' });
        setShowCreateStaffDialog(null);
        fetchUsers(); // Refresh users
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let errorMessage = 'Failed to create staff';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('Error creating staff:', error);
      toast({
        title: "Creation failed",
        description: error.message || "Unable to create staff. Please try again.",
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

  const approveReport = async (reportId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/reports/${reportId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'approve' }),
      });
      
      if (response.ok) {
        toast({
          title: "Report approved",
          description: "The repair work has been approved successfully.",
        });
        fetchAllReports(); // Refresh reports
      } else {
        throw new Error('Failed to approve report');
      }
    } catch (error) {
      console.error('Error approving report:', error);
      toast({
        title: "Approval failed",
        description: "Unable to approve report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const rejectReport = async (reportId: string, reason: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/reports/${reportId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'reject', rejection_reason: reason }),
      });
      
      if (response.ok) {
        toast({
          title: "Report rejected",
          description: "The repair work has been rejected.",
        });
        setShowRejectionDialog(null);
        setRejectionReason('');
        fetchAllReports(); // Refresh reports
      } else {
        throw new Error('Failed to reject report');
      }
    } catch (error) {
      console.error('Error rejecting report:', error);
      toast({
        title: "Rejection failed",
        description: "Unable to reject report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-300 border' },
      assigned: { label: 'Assigned', className: 'bg-blue-100 text-blue-800 border-blue-300 border' },
      in_progress: { label: 'In Progress', className: 'bg-purple-100 text-purple-800 border-purple-300 border' },
      completed: { label: 'Completed', className: 'bg-orange-100 text-orange-800 border-orange-300 border' },
      awaiting_approval: { label: 'Awaiting Approval', className: 'bg-indigo-100 text-indigo-800 border-indigo-300 border' },
      approved: { label: 'Approved', className: 'bg-green-100 text-green-800 border-green-300 border' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-300 border' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile || profile.role !== 'panchayat_officer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="glass-effect rounded-2xl p-6 mb-8 animate-fade-in">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-medium">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse-soft"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold gradient-text font-display">Panchayat Officer</h1>
                <p className="text-lg text-muted-foreground font-medium">Welcome back, {profile.full_name}</p>
                <p className="text-sm text-muted-foreground">Managing water infrastructure efficiently</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Last login</p>
                <p className="text-sm font-medium">{new Date().toLocaleDateString()}</p>
              </div>
              <Button variant="outline" onClick={handleSignOut} className="btn-secondary">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="stats-card animate-slide-in" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Reports</p>
                <p className="text-3xl font-bold text-blue-600 mb-1">{stats.totalReports}</p>
                <p className="text-xs text-green-600 font-medium">↗ +12% this month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="stats-card animate-slide-in" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
                <p className="text-3xl font-bold text-green-600 mb-1">{stats.totalUsers}</p>
                <p className="text-xs text-green-600 font-medium">↗ +8% this month</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
          <div className="stats-card animate-slide-in" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Active Schedules</p>
                <p className="text-3xl font-bold text-purple-600 mb-1">{stats.totalSchedules}</p>
                <p className="text-xs text-purple-600 font-medium">→ Stable</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="stats-card animate-slide-in" style={{animationDelay: '0.4s'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Completed Tasks</p>
                <p className="text-3xl font-bold text-emerald-600 mb-1">{stats.completedTasks}</p>
                <p className="text-xs text-emerald-600 font-medium">↗ +15% this week</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="glass-effect rounded-2xl p-2 mb-6">
          <Tabs defaultValue="reports" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-transparent gap-2">
              <TabsTrigger value="reports" className="nav-tab data-[state=active]:shadow-medium">
                <FileText className="w-4 h-4 mr-2" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="residents" className="nav-tab data-[state=active]:shadow-medium">
                <Users className="w-4 h-4 mr-2" />
                Residents
              </TabsTrigger>
              <TabsTrigger value="technicians" className="nav-tab data-[state=active]:shadow-medium">
                <Settings className="w-4 h-4 mr-2" />
                Technicians
              </TabsTrigger>
              <TabsTrigger value="controllers" className="nav-tab data-[state=active]:shadow-medium">
                <Droplets className="w-4 h-4 mr-2" />
                Water Controllers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reports" className="space-y-6 animate-fade-in">
              <div className="dashboard-card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold font-display">Pipe Damage Reports</h2>
                    <p className="text-muted-foreground">Manage and assign repair tasks efficiently</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="status-badge">
                      {reports.filter(r => r.status === 'pending').length} Pending
                    </Badge>
                    <Badge variant="outline" className="status-badge">
                      {reports.filter(r => r.status === 'in_progress').length} In Progress
                    </Badge>
                  </div>
                </div>
                {isLoadingReports ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No reports available yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Users can submit pipe damage reports from their dashboard
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{report.full_name}</h4>
                              {getStatusBadge(report.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{report.address}</p>
                            {report.notes && (
                              <p className="text-sm mb-2"><strong>Issue:</strong> {report.notes}</p>
                            )}
                            {report.location_lat && report.location_lng && (
                              <div className="mb-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedLocation({
                                    lat: report.location_lat!,
                                    lng: report.location_lng!,
                                    address: report.address,
                                    userName: report.full_name
                                  })}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <MapPin className="w-4 h-4 mr-2" />
                                  View Location on Map
                                </Button>
                                <p className="text-xs text-muted-foreground mt-1 ml-1">
                                  {Number(report.location_lat).toFixed(4)}, {Number(report.location_lng).toFixed(4)}
                                </p>
                              </div>
                            )}
                            
                            {/* Technician Assignment Info */}
                            {report.assigned_technician_id && report.technician_name && (
                              <p className="text-sm text-blue-600 mb-2">
                                <strong>Assigned to:</strong> {report.technician_name}
                              </p>
                            )}
                            
                            {/* Completion Notes */}
                            {report.completion_notes && (
                              <div className="bg-blue-50 p-3 rounded border mb-2">
                                <p className="text-sm font-medium text-blue-800">Completion Report:</p>
                                <p className="text-sm text-blue-700">{report.completion_notes}</p>
                                {report.completed_at && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    Completed on: {formatDate(report.completed_at)}
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {/* Approval Info */}
                            {report.approved_by_name && report.approved_at && (
                              <div className={`p-3 rounded border mb-2 ${
                                report.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                              }`}>
                                <p className={`text-sm font-medium ${
                                  report.status === 'approved' ? 'text-green-800' : 'text-red-800'
                                }`}>
                                  {report.status === 'approved' ? 'Approved by:' : 'Rejected by:'} {report.approved_by_name}
                                </p>
                                {report.rejection_reason && (
                                  <p className="text-sm text-red-700 mt-1">
                                    <strong>Reason:</strong> {report.rejection_reason}
                                  </p>
                                )}
                                <p className={`text-xs mt-1 ${
                                  report.status === 'approved' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatDate(report.approved_at)}
                                </p>
                              </div>
                            )}
                            
                            <p className="text-xs text-muted-foreground">
                              Submitted on {formatDate(report.created_at)}
                            </p>
                          </div>
                          {report.photo_url && (
                            <div className="ml-4">
                              <img 
                                src={`${API_URL}${report.photo_url}`} 
                                alt="Damage photo" 
                                className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-75"
                                onClick={() => window.open(`${API_URL}${report.photo_url}`, '_blank')}
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {/* Assignment and Status Controls */}
                          {report.status !== 'approved' && report.status !== 'rejected' && (
                            <>
                              {/* For pending reports: Show dropdown + Assign button */}
                              {report.status === 'pending' && (
                                <>
                                  <Select
                                    value={selectedTechnicians[report.id] || ""}
                                    onValueChange={(value) => setSelectedTechnicians(prev => ({
                                      ...prev,
                                      [report.id]: value
                                    }))}
                                  >
                                    <SelectTrigger className="w-[200px]">
                                      <SelectValue placeholder="Select technician" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {technicians.map((tech) => (
                                        <SelectItem key={tech.id} value={tech.id}>
                                          {tech.full_name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  <Button 
                                    size="sm"
                                    onClick={() => {
                                      if (selectedTechnicians[report.id]) {
                                        assignTechnician(report.id, selectedTechnicians[report.id]);
                                      }
                                    }}
                                    disabled={!selectedTechnicians[report.id]}
                                    className="bg-blue-600 hover:bg-blue-700"
                                  >
                                    <UserPlus className="w-4 h-4 mr-1" />
                                    Assign
                                  </Button>
                                </>
                              )}
                              
                              {/* For assigned/in-progress reports: Show status dropdown */}
                              {(report.status === 'assigned' || report.status === 'in_progress') && (
                                <Select
                                  value={report.status}
                                  onValueChange={(value) => updateReportStatus(report.id, value)}
                                >
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="assigned">Assigned</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </>
                          )}
                          
                          {/* Show assignment status for assigned reports */}
                          {report.status === 'assigned' && report.assigned_technician_id && (
                            <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded">
                              ✓ Assigned to {report.technician_name} - Waiting for technician to accept
                            </div>
                          )}
                          
                          {/* Approval Controls */}
                          {report.status === 'awaiting_approval' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => approveReport(report.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => setShowRejectionDialog(report.id)}
                              >
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

          <TabsContent value="residents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Residents Management</CardTitle>
                <CardDescription>View registered residents in the system</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : residents.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No residents registered yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Residents can register themselves through the registration page
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {residents.map((resident) => (
                      <div key={resident.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{resident.full_name}</p>
                            {resident.email && (
                              <p className="text-sm text-muted-foreground">{resident.email}</p>
                            )}
                            {resident.phone && (
                              <p className="text-sm text-muted-foreground">{resident.phone}</p>
                            )}
                            {resident.address && (
                              <p className="text-sm text-muted-foreground">{resident.address}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Registered: {formatDate(resident.created_at)}
                            </p>
                          </div>
                          <Badge variant="outline">
                            Resident
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technicians" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Maintenance Technicians</CardTitle>
                    <CardDescription>Manage maintenance technicians who handle pipe repairs</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateStaffDialog('maintenance_technician')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Technician
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : technicians.length === 0 ? (
                  <div className="text-center py-8">
                    <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No maintenance technicians created yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Create technicians to assign pipe repair tasks
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {technicians.map((tech) => (
                      <div key={tech.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{tech.full_name}</p>
                            {tech.email && (
                              <p className="text-sm text-muted-foreground">{tech.email}</p>
                            )}
                            {tech.phone && (
                              <p className="text-sm text-muted-foreground">{tech.phone}</p>
                            )}
                            {tech.address && (
                              <p className="text-sm text-muted-foreground">{tech.address}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Created: {formatDate(tech.created_at)}
                            </p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">
                            Technician
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="controllers" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Water Flow Controllers</CardTitle>
                    <CardDescription>Manage water flow controllers who handle water supply schedules</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateStaffDialog('water_flow_controller')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Controller
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingUsers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : waterControllers.length === 0 ? (
                  <div className="text-center py-8">
                    <Droplets className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No water flow controllers created yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Create controllers to manage water supply schedules
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {waterControllers.map((controller) => (
                      <div key={controller.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{controller.full_name}</p>
                            {controller.email && (
                              <p className="text-sm text-muted-foreground">{controller.email}</p>
                            )}
                            {controller.phone && (
                              <p className="text-sm text-muted-foreground">{controller.phone}</p>
                            )}
                            {controller.address && (
                              <p className="text-sm text-muted-foreground">{controller.address}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              Created: {formatDate(controller.created_at)}
                            </p>
                          </div>
                          <Badge className="bg-cyan-100 text-cyan-800">
                            Water Controller
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
        
        {/* Rejection Dialog */}
        {showRejectionDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Reject Report</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please provide a reason for rejecting this repair work:
              </p>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={3}
                className="mb-4"
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowRejectionDialog(null);
                    setRejectionReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => rejectReport(showRejectionDialog, rejectionReason)}
                  disabled={!rejectionReason.trim()}
                >
                  Reject Report
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {/* Create Staff Dialog */}
        {showCreateStaffDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Create {showCreateStaffDialog.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <form onSubmit={createStaff} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staff_email">Email *</Label>
                  <Input
                    id="staff_email"
                    type="email"
                    value={newStaff.email}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff_password">Password *</Label>
                  <Input
                    id="staff_password"
                    type="password"
                    value={newStaff.password}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter password"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff_name">Full Name *</Label>
                  <Input
                    id="staff_name"
                    value={newStaff.full_name}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff_phone">Phone</Label>
                  <Input
                    id="staff_phone"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff_address">Address</Label>
                  <Textarea
                    id="staff_address"
                    value={newStaff.address}
                    onChange={(e) => setNewStaff(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => {
                      setShowCreateStaffDialog(null);
                      setNewStaff({ email: '', password: '', full_name: '', phone: '', address: '' });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSubmitting || !newStaff.email || !newStaff.password || !newStaff.full_name}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Staff'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Map View Dialog */}
        {selectedLocation && (
          <MapView
            latitude={selectedLocation.lat}
            longitude={selectedLocation.lng}
            address={selectedLocation.address}
            userName={selectedLocation.userName}
            onClose={() => setSelectedLocation(null)}
          />
        )}
        </div>
      </div>
    </div>
  );
};

export default PanchayatOfficerDashboard;
