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
import { Droplets, LogOut, FileText, Users, Clock, MapPin, Plus, Loader2, AlertCircle, CheckCircle2, Settings, Calendar, Shield, UserPlus, Trash2, BarChart3, Camera } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MapView from "@/components/MapView";
import ReportsAnalytics from "@/components/ReportsAnalytics";
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
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ id: string; name: string; role: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const deleteUser = async (userId: string) => {
    setIsDeleting(true);
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
      
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        toast({
          title: "User deleted",
          description: "The user has been removed successfully.",
        });
        setShowDeleteDialog(null);
        fetchUsers(); // Refresh users
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete user');
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Deletion failed",
        description: error.message || "Unable to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
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
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              Panchayat Officer Dashboard
            </h1>
            <p className="text-gray-600">Welcome back, {profile.full_name}</p>
          </div>
          <Button onClick={signOut} variant="outline" className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="stat-card-reports animate-slide-in" style={{animationDelay: '0.1s'}}>
            <div className="stat-card-icon">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div className="stat-card-value">{stats.totalReports}</div>
            <div className="stat-card-label">Total Reports</div>
            <div className="stat-card-trend positive">↗ +12% this month</div>
          </div>
          <div className="stat-card-users animate-slide-in" style={{animationDelay: '0.2s'}}>
            <div className="stat-card-icon">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div className="stat-card-value">{stats.totalUsers}</div>
            <div className="stat-card-label">Total Users</div>
            <div className="stat-card-trend positive">↗ +14% this month</div>
          </div>
          <div className="stat-card-schedules animate-slide-in" style={{animationDelay: '0.3s'}}>
            <div className="stat-card-icon">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div className="stat-card-value">{stats.totalSchedules}</div>
            <div className="stat-card-label">Active Schedules</div>
            <div className="stat-card-trend stable">→ Stable</div>
          </div>
          <div className="stat-card-tasks animate-slide-in" style={{animationDelay: '0.4s'}}>
            <div className="stat-card-icon">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div className="stat-card-value">{stats.completedTasks}</div>
            <div className="stat-card-label">Completed Tasks</div>
            <div className="stat-card-trend positive">↗ +15% this week</div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="glass-effect rounded-2xl p-2 mb-6">
          <Tabs defaultValue="complaints" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-transparent gap-2">
              <TabsTrigger value="complaints" className="nav-tab data-[state=active]:shadow-medium">
                <FileText className="w-4 h-4 mr-2" />
                Complaints
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
              <TabsTrigger value="reports" className="nav-tab data-[state=active]:shadow-medium">
                <BarChart3 className="w-4 h-4 mr-2" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="complaints" className="space-y-6 animate-fade-in">
              <div className="dashboard-card">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold font-display">Pipe Damage Complaints</h2>
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
                  <div className="max-w-5xl mx-auto space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300">
                        {/* Header Section with Professional Background */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-gradient-to-br from-blue-500 to-indigo-500 w-10 h-10 rounded-lg flex items-center justify-center shadow-md">
                                <span className="text-lg font-bold text-white">{report.full_name.charAt(0).toUpperCase()}</span>
                              </div>
                              <div>
                                <h3 className="text-base font-bold text-gray-800">{report.full_name}</h3>
                                <p className="text-gray-600 text-xs font-medium">Report ID: #{report.id.slice(0, 8)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {getStatusBadge(report.status)}
                              {report.photo_url && (
                                <button
                                  type="button"
                                  onClick={() => window.open(`${API_URL}${report.photo_url}`, '_blank')}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                                >
                                  📷 View Photo
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Content Section */}
                        <div className="px-4 py-3 space-y-3">
                          {/* Photo Thumbnail */}
                          {report.photo_url && report.photo_url.trim() !== '' && (
                            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                              <div className="bg-blue-100 p-1.5 rounded-lg">
                                <Camera className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">📷 DAMAGE PHOTO</p>
                                <div className="relative">
                                  <img 
                                    src={report.photo_url.startsWith('http') ? report.photo_url : `${API_URL}${report.photo_url}`}
                                    alt="Pipe Damage" 
                                    style={{
                                      width: '96px',
                                      height: '80px',
                                      objectFit: 'cover',
                                      borderRadius: '8px',
                                      border: '1px solid #d1d5db',
                                      cursor: 'pointer',
                                      display: 'block'
                                    }}
                                    onLoad={(e) => {
                                      console.log('✅ Image loaded:', e.currentTarget.src);
                                      e.currentTarget.style.border = '2px solid #10b981';
                                    }}
                                    onClick={() => {
                                      const imageUrl = report.photo_url.startsWith('http') ? report.photo_url : `${API_URL}${report.photo_url}`;
                                      window.open(imageUrl, '_blank');
                                    }}
                                    onError={(e) => {
                                      console.error('❌ Image failed to load:', report.photo_url);
                                      const target = e.currentTarget;
                                      target.style.display = 'none';
                                      const placeholder = document.createElement('div');
                                      placeholder.className = 'w-24 h-20 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center text-xs text-gray-500';
                                      placeholder.textContent = 'Image not available';
                                      target.parentElement?.appendChild(placeholder);
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Click to enlarge</p>
                              </div>
                            </div>
                          )}
                          
                          {/* Location */}
                          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                            <div className="bg-blue-100 p-1.5 rounded-lg">
                              <MapPin className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">📍 LOCATION</p>
                              <p className="text-sm font-medium text-gray-800">{report.address || 'Location not specified'}</p>
                              {report.location_lat && report.location_lng ? (
                                <div className="mt-2 space-y-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setSelectedLocation({
                                        lat: report.location_lat!,
                                        lng: report.location_lng!,
                                        address: report.address || 'Reported location',
                                        userName: report.full_name
                                      });
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                                  >
                                    <MapPin className="w-3 h-3" />
                                    📍 View on Map
                                  </button>
                                  <p className="text-xs text-gray-500 font-mono">
                                    Coordinates: {Number(report.location_lat).toFixed(4)}, {Number(report.location_lng).toFixed(4)}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500 mt-1">No GPS coordinates available</p>
                              )}
                            </div>
                          </div>
                          {/* Issue Description */}
                          {report.notes && (
                            <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-l-3 border-amber-500 rounded-lg">
                              <p className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-1">💧 REPORTED ISSUE</p>
                              <p className="text-sm text-gray-700 leading-relaxed italic">"{report.notes}"</p>
                            </div>
                          )}
                          
                          {/* Technician Assignment Info */}
                          {report.assigned_technician_id && report.technician_name && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="bg-blue-100 p-1.5 rounded-lg">
                                <UserPlus className="w-4 h-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">👷 ASSIGNED TECHNICIAN</p>
                                <p className="text-sm font-bold text-blue-900">{report.technician_name}</p>
                              </div>
                            </div>
                          )}
                            
                            {/* Completion Notes */}
                            {report.completion_notes && (
                              <div className="bg-blue-50 p-2 rounded border mb-2">
                                <p className="text-sm font-medium text-blue-800">✅ Completion Report:</p>
                                <p className="text-sm text-blue-700">{report.completion_notes}</p>
                                {report.completed_at && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    📅 Completed on: {formatDate(report.completed_at)}
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
                            
                          <p className="text-xs text-gray-400 mt-2">
                            📅 Submitted on {formatDate(report.created_at)}
                          </p>

                          {/* Action Buttons Section */}
                          <div className="border-t pt-3 mt-3 flex gap-2 flex-wrap">
                            {/* Assignment and Status Controls */}
                            {report.status !== 'approved' && report.status !== 'rejected' && (
                              <>
                                {/* For pending reports: Show dropdown + Assign button */}
                                {report.status === 'pending' && (
                                  <div className="flex gap-2 items-center bg-blue-50 p-3 rounded-lg border border-blue-200 flex-1">
                                    <Select
                                    value={selectedTechnicians[report.id] || ""}
                                    onValueChange={(value) => setSelectedTechnicians(prev => ({
                                      ...prev,
                                      [report.id]: value
                                    }))}
                                  >
                                    <SelectTrigger className="flex-1 bg-white border-blue-300 focus:ring-2 focus:ring-blue-500">
                                      <SelectValue placeholder="👨‍🔧 Select technician" />
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
                                      size="default"
                                      onClick={() => {
                                        if (selectedTechnicians[report.id]) {
                                          assignTechnician(report.id, selectedTechnicians[report.id]);
                                        }
                                      }}
                                      disabled={!selectedTechnicians[report.id]}
                                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
                                    >
                                      <UserPlus className="w-4 h-4 mr-2" />
                                      Assign Technician
                                    </Button>
                                  </div>
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
                  <div className="user-list">
                    {residents.map((resident) => (
                      <div key={resident.id} className="user-card">
                        <div className="user-card-header">
                          <div className="flex-1">
                            <h3 className="user-name">👤 {resident.full_name}</h3>
                            {resident.email && (
                              <p className="user-email">📧 {resident.email}</p>
                            )}
                            {resident.phone && (
                              <p className="user-phone">📱 {resident.phone}</p>
                            )}
                            {resident.address && (
                              <p className="user-address">
                                <span>📍</span>
                                <span>{resident.address}</span>
                              </p>
                            )}
                            <p className="user-meta">
                              Registered: {formatDate(resident.created_at)}
                            </p>
                          </div>
                          <div className="user-actions">
                            <span className="user-role-badge resident">Resident</span>
                          </div>
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
                  <div className="user-list">
                    {technicians.map((tech) => (
                      <div key={tech.id} className="user-card">
                        <div className="user-card-header">
                          <div className="flex-1">
                            <h3 className="user-name">👷 {tech.full_name}</h3>
                            {tech.email && (
                              <p className="user-email">📧 {tech.email}</p>
                            )}
                            {tech.phone && (
                              <p className="user-phone">📱 {tech.phone}</p>
                            )}
                            {tech.address && (
                              <p className="user-address">
                                <span>📍</span>
                                <span>{tech.address}</span>
                              </p>
                            )}
                            <p className="user-meta">
                              Created: {formatDate(tech.created_at)}
                            </p>
                          </div>
                          <div className="user-actions">
                            <span className="user-role-badge technician">Technician</span>
                            <button
                              onClick={() => setShowDeleteDialog({ id: tech.id, name: tech.full_name, role: 'Maintenance Technician' })}
                              className="user-delete-btn"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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
                  <div className="user-list">
                    {waterControllers.map((controller) => (
                      <div key={controller.id} className="user-card">
                        <div className="user-card-header">
                          <div className="flex-1">
                            <h3 className="user-name">💧 {controller.full_name}</h3>
                            {controller.email && (
                              <p className="user-email">📧 {controller.email}</p>
                            )}
                            {controller.phone && (
                              <p className="user-phone">📱 {controller.phone}</p>
                            )}
                            {controller.address && (
                              <p className="user-address">
                                <span>📍</span>
                                <span>{controller.address}</span>
                              </p>
                            )}
                            <p className="user-meta">
                              Created: {formatDate(controller.created_at)}
                            </p>
                          </div>
                          <div className="user-actions">
                            <span className="user-role-badge controller">Water Controller</span>
                            <button
                              onClick={() => setShowDeleteDialog({ id: controller.id, name: controller.full_name, role: 'Water Flow Controller' })}
                              className="user-delete-btn"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports & Analytics Tab */}
          <TabsContent value="reports" className="space-y-6 animate-fade-in">
            <ReportsAnalytics userRole="panchayat_officer" />
          </TabsContent>

        </Tabs>
        
        {/* Delete Confirmation Dialog */}
        {showDeleteDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold">Delete {showDeleteDialog.role}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Are you sure you want to delete <strong>{showDeleteDialog.name}</strong>?
              </p>
              <p className="text-sm text-red-600 mb-4">
                This action cannot be undone. All associated data will be permanently removed.
              </p>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteDialog(null)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => deleteUser(showDeleteDialog.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
        
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
        
        </div>
      </div>
    </div>

    {/* Map View Dialog - Outside main container for proper z-index */}
    {selectedLocation && (
      <>
        {console.log('Rendering MapView with:', selectedLocation)}
        <MapView
          latitude={selectedLocation.lat}
          longitude={selectedLocation.lng}
          address={selectedLocation.address}
          userName={selectedLocation.userName}
          onClose={() => {
            console.log('Closing map');
            setSelectedLocation(null);
          }}
        />
      </>
    )}
  </>
  );
};

export default PanchayatOfficerDashboard;
