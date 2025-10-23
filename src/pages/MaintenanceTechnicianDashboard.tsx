import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, LogOut, FileText, Clock, MapPin, CheckCircle2, AlertCircle, Upload, Settings, Camera, Eye, Award, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/lib/api";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import CameraCapture from "@/components/CameraCapture";
import MapView from "@/components/MapView";
import Certificate from "@/components/Certificate";
import ReportsAnalytics from "@/components/ReportsAnalytics";

interface PipeReport {
  id: string;
  user_id: string;
  full_name: string;
  address: string;
  location_lat?: number;
  location_lng?: number;
  photo_url?: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'awaiting_approval' | 'approved' | 'rejected';
  assigned_technician_id?: string;
  notes?: string;
  completion_notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  user_email?: string;
  technician_name?: string;
  approved_by_name?: string;
}

const MaintenanceTechnicianDashboard = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [reports, setReports] = useState<PipeReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<PipeReport | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [completionImage, setCompletionImage] = useState<File | null>(null);
  const completionImageRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
    userName: string;
  } | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'maintenance_technician')) {
      navigate("/auth");
    }
    if (user && profile?.role === 'maintenance_technician') {
      fetchAssignedReports();
    }
  }, [user, profile, loading, navigate]);

  const fetchAssignedReports = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/reports/assigned`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch (error) {
      console.error('Error fetching assigned reports:', error);
    }
  };

  const acceptAssignment = async (reportId: string) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const response = await fetch(`${API_URL}/api/reports/${reportId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        toast({
          title: "Assignment accepted",
          description: "You have accepted this repair task.",
        });
        fetchAssignedReports();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept assignment');
      }
    } catch (error: any) {
      console.error('Error accepting assignment:', error);
      toast({
        title: "Operation failed",
        description: error.message || "Unable to accept assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeTask = async () => {
    if (!selectedReport || !completionNotes.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide completion notes.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      
      const formData = new FormData();
      formData.append('completion_notes', completionNotes);
      if (completionImage) {
        formData.append('completion_image', completionImage);
      }
      
      const response = await fetch(`${API_URL}/api/reports/${selectedReport.id}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      if (response.ok) {
        toast({
          title: "Task completed",
          description: "Task has been marked as completed and sent for approval.",
        });
        setCompletionNotes('');
        setCompletionImage(null);
        setShowCompletionDialog(false);
        setSelectedReport(null);
        fetchAssignedReports();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete task');
      }
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast({
        title: "Operation failed",
        description: error.message || "Unable to complete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 40 * 1024 * 1024) { // 40MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 40MB.",
          variant: "destructive",
        });
        return;
      }
      setCompletionImage(file);
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

  if (!user || !profile || profile.role !== 'maintenance_technician') {
    return null;
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'assigned': { label: 'Assigned', className: 'bg-blue-100 text-blue-800 border-blue-300 border' },
      'in_progress': { label: 'In Progress', className: 'bg-orange-100 text-orange-800 border-orange-300 border' },
      'awaiting_approval': { label: 'Awaiting Approval', className: 'bg-purple-100 text-purple-800 border-purple-300 border' },
      'approved': { label: 'Approved', className: 'bg-green-100 text-green-800 border-green-300 border' },
      'rejected': { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-300 border' },
      'completed': { label: 'Completed', className: 'bg-emerald-100 text-emerald-800 border-emerald-300 border' },
      'pending': { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-300 border' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.assigned;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingReports = reports.filter(r => r.status === 'assigned');
  const inProgressReports = reports.filter(r => r.status === 'in_progress');
  const completedReports = reports.filter(r => ['awaiting_approval', 'approved', 'rejected'].includes(r.status));

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 mb-8 animate-fade-in shadow-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse-soft"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white font-display flex items-center gap-2">
                  🔧 Maintenance Technician
                </h1>
                <p className="text-lg text-white/90 font-medium">Welcome back, {profile.full_name}</p>
                <p className="text-sm text-white/80">Keeping infrastructure running smoothly</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                <p className="text-xs text-white/80">Tasks Status</p>
                <p className="text-sm font-bold text-orange-300">● {pendingReports.length + inProgressReports.length} Active</p>
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

        {/* Enhanced Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="stats-card animate-slide-in" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pending Tasks</p>
                <p className="text-3xl font-bold text-orange-600 mb-1">{pendingReports.length}</p>
                <p className="text-xs text-orange-600 font-medium">⚠ Requires attention</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="stats-card animate-slide-in" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">In Progress</p>
                <p className="text-3xl font-bold text-blue-600 mb-1">{inProgressReports.length}</p>
                <p className="text-xs text-blue-600 font-medium">🔧 Working on it</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="stats-card animate-slide-in" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600 mb-1">{completedReports.length}</p>
                <p className="text-xs text-green-600 font-medium">✓ Well done!</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Achievement Card */}
        {completedReports.filter(r => r.status === 'approved').length >= 2 && (
          <div className="glass-effect rounded-2xl p-6 mb-8 animate-fade-in border-2 border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">🎉 Achievement Unlocked!</h3>
                  <p className="text-gray-700 font-medium">
                    Congratulations! You've successfully completed {completedReports.filter(r => r.status === 'approved').length} tasks.
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    You've earned a Certificate of Appreciation for your outstanding service!
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setShowCertificate(true)}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 text-lg shadow-lg hover:shadow-xl transition-all"
              >
                <Award className="w-5 h-5 mr-2" />
                View Certificate
              </Button>
            </div>
          </div>
        )}

        <div className="glass-effect rounded-2xl p-2 mb-6">
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-transparent gap-2">
              <TabsTrigger value="pending" className="nav-tab data-[state=active]:shadow-medium">
                <AlertCircle className="w-4 h-4 mr-2" />
                Pending ({pendingReports.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="nav-tab data-[state=active]:shadow-medium">
                <Clock className="w-4 h-4 mr-2" />
                In Progress ({inProgressReports.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="nav-tab data-[state=active]:shadow-medium">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Completed ({completedReports.length})
              </TabsTrigger>
              <TabsTrigger value="reports" className="nav-tab data-[state=active]:shadow-medium">
                <BarChart3 className="w-4 h-4 mr-2" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4 animate-fade-in">
              {pendingReports.length > 0 ? (
                pendingReports.map((report, index) => (
                  <div 
                    key={report.id} 
                    className="group relative overflow-hidden rounded-xl border-2 border-blue-100 bg-gradient-to-br from-white to-blue-50/30 p-5 hover:shadow-xl hover:border-blue-300 transition-all duration-300 animate-slide-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Decorative gradient overlay */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/40 to-cyan-200/40 rounded-full blur-2xl -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                    
                    {/* Left accent bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-cyan-500"></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg border border-blue-200">
                            <Wrench className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">Pipe Damage Report</h3>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {formatDate(report.created_at)}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(report.status)}
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              Reporter
                            </p>
                            <p className="font-semibold text-gray-800">{report.full_name}</p>
                          </div>

                          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Location
                            </p>
                            <p className="font-medium text-gray-700 text-sm">{report.address}</p>
                          </div>

                          {report.notes && (
                            <div className="bg-amber-50/80 backdrop-blur-sm rounded-lg p-3 border border-amber-100">
                              <p className="text-xs text-amber-600 mb-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Notes
                              </p>
                              <p className="font-medium text-amber-700 text-sm">{report.notes}</p>
                            </div>
                          )}
                        </div>

                        {report.photo_url && (
                          <div className="flex-shrink-0">
                            <div className="relative group/img">
                              <img 
                                src={`${API_URL}${report.photo_url}`} 
                                alt="Damage photo" 
                                className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200 cursor-pointer transition-all duration-300 group-hover/img:scale-105 group-hover/img:shadow-lg"
                                onClick={() => setShowImageDialog(report.photo_url!)}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 rounded-xl transition-all duration-300 flex items-center justify-center">
                                <Eye className="w-6 h-6 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-gray-100">
                        {report.location_lat && report.location_lng && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedLocation({
                              lat: report.location_lat!,
                              lng: report.location_lng!,
                              address: report.address,
                              userName: report.full_name
                            })}
                            className="bg-white/80 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                          >
                            <MapPin className="w-4 h-4 mr-1" />
                            📍 Map
                          </Button>
                        )}
                        {report.photo_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowImageDialog(report.photo_url!)}
                            className="bg-white/80 border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            👁️ View Photo
                          </Button>
                        )}
                        <Button
                          onClick={() => acceptAssignment(report.id)}
                          disabled={isSubmitting}
                          className="ml-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
                          size="sm"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          ✓ Accept Task
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="dashboard-card text-center py-12">
                  <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No pending assignments</h3>
                  <p className="text-muted-foreground">All caught up! New tasks will appear here when assigned.</p>
                </div>
              )}
            </TabsContent>

          <TabsContent value="active" className="space-y-4 animate-fade-in">
            {inProgressReports.length > 0 ? (
              inProgressReports.map((report, index) => (
                <div 
                  key={report.id}
                  className="group relative overflow-hidden rounded-xl border-2 border-orange-100 bg-gradient-to-br from-white to-orange-50/30 p-5 hover:shadow-xl hover:border-orange-300 transition-all duration-300 animate-slide-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Decorative gradient overlay */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-200/40 to-amber-200/40 rounded-full blur-2xl -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                  
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-500 animate-pulse-soft"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg border border-orange-200">
                          <Settings className="w-5 h-5 text-orange-600 animate-spin-slow" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">Pipe Damage Report</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            Started: {formatDate(report.updated_at)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Reporter
                          </p>
                          <p className="font-semibold text-gray-800">{report.full_name}</p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Location
                          </p>
                          <p className="font-medium text-gray-700 text-sm">{report.address}</p>
                        </div>

                        {report.notes && (
                          <div className="bg-amber-50/80 backdrop-blur-sm rounded-lg p-3 border border-amber-100">
                            <p className="text-xs text-amber-600 mb-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Notes
                            </p>
                            <p className="font-medium text-amber-700 text-sm">{report.notes}</p>
                          </div>
                        )}
                      </div>

                      {report.photo_url && (
                        <div className="flex-shrink-0">
                          <div className="relative group/img">
                            <img 
                              src={`${API_URL}${report.photo_url}`} 
                              alt="Damage photo" 
                              className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200 cursor-pointer transition-all duration-300 group-hover/img:scale-105 group-hover/img:shadow-lg"
                              onClick={() => setShowImageDialog(report.photo_url!)}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 rounded-xl transition-all duration-300 flex items-center justify-center">
                              <Eye className="w-6 h-6 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-gray-100">
                      {report.location_lat && report.location_lng && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLocation({
                            lat: report.location_lat!,
                            lng: report.location_lng!,
                            address: report.address,
                            userName: report.full_name
                          })}
                          className="bg-white/80 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                        >
                          <MapPin className="w-4 h-4 mr-1" />
                          📍 Map
                        </Button>
                      )}
                      {report.photo_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowImageDialog(report.photo_url!)}
                          className="bg-white/80 border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          👁️ View Photo
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          setSelectedReport(report);
                          setShowCompletionDialog(true);
                        }}
                        disabled={isSubmitting}
                        className="ml-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all"
                        size="sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        ✓ Mark Complete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active tasks</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 animate-fade-in">
            {completedReports.length > 0 ? (
              completedReports.map((report, index) => (
                <div 
                  key={report.id}
                  className="group relative overflow-hidden rounded-xl border-2 border-green-100 bg-gradient-to-br from-white to-green-50/30 p-5 hover:shadow-xl hover:border-green-300 transition-all duration-300 animate-slide-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Decorative gradient overlay */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-200/40 to-emerald-200/40 rounded-full blur-2xl -z-0 group-hover:scale-150 transition-transform duration-500"></div>
                  
                  {/* Left accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-emerald-500"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg border border-green-200">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">Pipe Damage Report</h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            Completed: {report.completed_at ? formatDate(report.completed_at) : 'N/A'}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Reporter
                          </p>
                          <p className="font-semibold text-gray-800">{report.full_name}</p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-gray-100">
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Location
                          </p>
                          <p className="font-medium text-gray-700 text-sm">{report.address}</p>
                        </div>

                        {report.completion_notes && (
                          <div className="bg-green-50/80 backdrop-blur-sm rounded-lg p-3 border border-green-100">
                            <p className="text-xs text-green-600 mb-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Completion Notes
                            </p>
                            <p className="font-medium text-green-700 text-sm">{report.completion_notes}</p>
                          </div>
                        )}

                        {report.rejection_reason && (
                          <div className="bg-red-50/80 backdrop-blur-sm rounded-lg p-3 border border-red-100">
                            <p className="text-xs text-red-600 mb-1 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Rejection Reason
                            </p>
                            <p className="font-medium text-red-700 text-sm">{report.rejection_reason}</p>
                          </div>
                        )}
                      </div>

                      {report.photo_url && (
                        <div className="flex-shrink-0">
                          <div className="relative group/img">
                            <img 
                              src={`${API_URL}${report.photo_url}`} 
                              alt="Damage photo" 
                              className="w-32 h-32 object-cover rounded-xl border-2 border-gray-200 cursor-pointer transition-all duration-300 group-hover/img:scale-105 group-hover/img:shadow-lg"
                              onClick={() => setShowImageDialog(report.photo_url!)}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 rounded-xl transition-all duration-300 flex items-center justify-center">
                              <Eye className="w-6 h-6 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-gray-100">
                      {report.location_lat && report.location_lng && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLocation({
                            lat: report.location_lat!,
                            lng: report.location_lng!,
                            address: report.address,
                            userName: report.full_name
                          })}
                          className="bg-white/80 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                        >
                          <MapPin className="w-4 h-4 mr-1" />
                          📍 Map
                        </Button>
                      )}
                      {report.photo_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowImageDialog(report.photo_url!)}
                          className="bg-white/80 border-purple-200 text-purple-600 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          👁️ View Photo
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No completed tasks</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Reports & Analytics Tab */}
          <TabsContent value="reports" className="space-y-6 animate-fade-in">
            <ReportsAnalytics userRole="maintenance_technician" userId={user?.id} />
          </TabsContent>
          </Tabs>
        </div>

        {/* Task Completion Dialog */}
        {showCompletionDialog && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                <CheckCircle2 className="w-5 h-5 inline mr-2 text-green-600" />
                Complete Task
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Location:</strong> {selectedReport.address}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Reporter:</strong> {selectedReport.full_name}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="completion_notes">Completion Notes *</Label>
                  <Textarea
                    id="completion_notes"
                    value={completionNotes}
                    onChange={(e) => setCompletionNotes(e.target.value)}
                    placeholder="Describe the work completed, materials used, etc..."
                    rows={4}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Completion Photo (Optional)</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="completion_image_gallery"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        ref={completionImageRef}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => completionImageRef.current?.click()}
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose from Gallery
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCamera(true)}
                        className="flex-1"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                    {completionImage && (
                      <p className="text-sm text-green-600">
                        <Camera className="w-4 h-4 inline mr-1" />
                        {completionImage.name}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCompletionDialog(false);
                      setSelectedReport(null);
                      setCompletionNotes('');
                      setCompletionImage(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={completeTask}
                    disabled={isSubmitting || !completionNotes.trim()}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? 'Submitting...' : 'Complete Task'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image View Dialog */}
        {showImageDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 max-w-3xl max-h-[90vh] overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Damage Photo</h3>
                <Button
                  variant="outline"
                  onClick={() => setShowImageDialog(null)}
                >
                  Close
                </Button>
              </div>
              <img 
                src={showImageDialog.startsWith('http') ? showImageDialog : `${API_URL}${showImageDialog}`} 
                alt="Pipe damage" 
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Certificate Dialog */}
        {showCertificate && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Your Achievement Certificate</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowCertificate(false)}
                  className="hover:bg-gray-100"
                >
                  Close
                </Button>
              </div>
              <Certificate
                technicianName={profile?.full_name || 'Technician'}
                completedTasks={completedReports.filter(r => r.status === 'approved').length}
                issueDate={new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              />
            </div>
          </div>
        )}
        
        {/* Camera Capture Component */}
        <CameraCapture
          isOpen={showCamera}
          onCapture={(file) => {
            setCompletionImage(file);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
        
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
  );
};

export default MaintenanceTechnicianDashboard;
