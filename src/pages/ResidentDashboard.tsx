import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Droplets, FileText, Clock, MapPin, Camera, Upload, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import CameraCapture from "@/components/CameraCapture";
import MapView from "@/components/MapView";

interface PipeReport {
  id: string;
  full_name: string;
  mobile_number: string;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  photo_url: string | null;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
  notes: string | null;
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
}

const ResidentDashboard = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reports, setReports] = useState<PipeReport[]>([]);
  const [schedules, setSchedules] = useState<WaterSchedule[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [hasError, setHasError] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    mobile_number: '',
    notes: '',
    photo: null as File | null,
    location_lat: null as number | null,
    location_lng: null as number | null,
    location_name: null as string | null,
  });
  const [showCamera, setShowCamera] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [gpsDebugInfo, setGpsDebugInfo] = useState<string>('');
  const [showManualLocation, setShowManualLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState('');
  const [gpsQuality, setGpsQuality] = useState<'excellent' | 'good' | 'fair' | 'poor' | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
    userName: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user && profile) {
      setFormData(prev => ({
        ...prev,
        full_name: profile.full_name || '',
        mobile_number: profile.phone || '',
      }));
      fetchReports();
      fetchSchedules();
    }
  }, [user, profile]);

  const fetchReports = async () => {
    setIsLoadingReports(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('No token found');
        setIsLoadingReports(false);
        return;
      }
      
      const response = await fetch('http://localhost:3001/api/reports', {
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

  const fetchSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3001/api/schedules/today', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSchedules(data);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const getLocationName = async (lat: number, lng: number): Promise<string> => {
    try {
      // Use multiple geocoding services for better accuracy
      const services = [
        // Nominatim OpenStreetMap (Free)
        {
          url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          parser: (data: any) => {
            if (data.display_name) {
              // Extract meaningful parts of the address
              const parts = [];
              if (data.address) {
                if (data.address.house_number && data.address.road) {
                  parts.push(`${data.address.house_number} ${data.address.road}`);
                } else if (data.address.road) {
                  parts.push(data.address.road);
                }
                if (data.address.neighbourhood) parts.push(data.address.neighbourhood);
                if (data.address.suburb) parts.push(data.address.suburb);
                if (data.address.city || data.address.town || data.address.village) {
                  parts.push(data.address.city || data.address.town || data.address.village);
                }
                if (data.address.state) parts.push(data.address.state);
              }
              return parts.length > 0 ? parts.join(', ') : data.display_name;
            }
            return null;
          }
        },
        // BigDataCloud (Free tier)
        {
          url: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
          parser: (data: any) => {
            const parts = [];
            if (data.locality) parts.push(data.locality);
            if (data.city) parts.push(data.city);
            if (data.principalSubdivision) parts.push(data.principalSubdivision);
            if (data.countryName) parts.push(data.countryName);
            return parts.length > 0 ? parts.join(', ') : null;
          }
        }
      ];

      // Try each service
      for (const service of services) {
        try {
          const response = await fetch(service.url, {
            headers: {
              'User-Agent': 'BlueGrid Water Management App'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const locationName = service.parser(data);
            if (locationName) {
              console.log('Location found:', locationName);
              return locationName;
            }
          }
        } catch (serviceError) {
          console.warn('Geocoding service failed:', serviceError);
          continue;
        }
      }
      
      // If all services fail, return coordinates
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Geocoding error:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const getUltraPreciseGPSLocation = async () => {
    if (!("geolocation" in navigator)) {
      toast({
        title: "GPS not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    if (isGettingLocation) return;
    
    setIsGettingLocation(true);
    setGpsDebugInfo('Initializing ultra-precise GPS...');
    setGpsQuality(null);
    
    try {
      // Show loading toast
      toast({
        title: "Ultra-precise GPS tracking...",
        description: "Please stay still outdoors for maximum accuracy. This may take up to 60 seconds.",
      });

      const positions: GeolocationPosition[] = [];
      let watchId: number | null = null;
      let timeoutId: NodeJS.Timeout;
      let stabilityCheckId: NodeJS.Timeout;
      
      const ultraPreciseOptions = {
        enableHighAccuracy: true,    // Force GPS usage
        timeout: 45000,             // 45 second timeout per reading
        maximumAge: 0               // Always get fresh position
      };

      const promise = new Promise<GeolocationPosition>((resolve, reject) => {
        let positionCount = 0;
        const maxPositions = 10;     // More readings for better accuracy
        const targetAccuracy = 3;    // Target 3 meter accuracy
        const stabilityThreshold = 5; // Positions must be within 5m of each other
        let stableReadings = 0;
        let lastStablePosition: GeolocationPosition | null = null;

        const calculateDistance = (pos1: GeolocationPosition, pos2: GeolocationPosition): number => {
          const R = 6371e3; // Earth's radius in meters
          const φ1 = pos1.coords.latitude * Math.PI/180;
          const φ2 = pos2.coords.latitude * Math.PI/180;
          const Δφ = (pos2.coords.latitude-pos1.coords.latitude) * Math.PI/180;
          const Δλ = (pos2.coords.longitude-pos1.coords.longitude) * Math.PI/180;

          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

          return R * c;
        };

        const calculateAveragePosition = (positions: GeolocationPosition[]): GeolocationPosition => {
          // Use weighted average based on accuracy (more accurate positions get higher weight)
          let totalWeight = 0;
          let weightedLat = 0;
          let weightedLng = 0;
          let bestAccuracy = Math.min(...positions.map(p => p.coords.accuracy));

          positions.forEach(pos => {
            const weight = bestAccuracy / pos.coords.accuracy; // Higher weight for better accuracy
            totalWeight += weight;
            weightedLat += pos.coords.latitude * weight;
            weightedLng += pos.coords.longitude * weight;
          });

          const avgLat = weightedLat / totalWeight;
          const avgLng = weightedLng / totalWeight;

          // Create a synthetic position with averaged coordinates
          return {
            coords: {
              latitude: avgLat,
              longitude: avgLng,
              accuracy: bestAccuracy,
              altitude: positions[0].coords.altitude,
              altitudeAccuracy: positions[0].coords.altitudeAccuracy,
              heading: positions[0].coords.heading,
              speed: positions[0].coords.speed,
              toJSON: positions[0].coords.toJSON
            },
            timestamp: Date.now()
          } as GeolocationPosition;
        };

        const assessGPSQuality = (accuracy: number, stabilityCount: number): 'excellent' | 'good' | 'fair' | 'poor' => {
          if (accuracy <= 3 && stabilityCount >= 3) return 'excellent';
          if (accuracy <= 8 && stabilityCount >= 2) return 'good';
          if (accuracy <= 20) return 'fair';
          return 'poor';
        };

        const successCallback = (position: GeolocationPosition) => {
          positionCount++;
          positions.push(position);
          
          const accuracy = position.coords.accuracy;
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          console.log(`Ultra GPS Reading ${positionCount}: ${lat}, ${lng} (±${accuracy}m)`);
          
          // Check stability with previous position
          if (lastStablePosition) {
            const distance = calculateDistance(lastStablePosition, position);
            if (distance <= stabilityThreshold) {
              stableReadings++;
              setGpsDebugInfo(`GPS Reading ${positionCount}: ±${Math.round(accuracy)}m (Stable: ${stableReadings})`);
            } else {
              stableReadings = 0;
              setGpsDebugInfo(`GPS Reading ${positionCount}: ±${Math.round(accuracy)}m (Unstable)`);
            }
          } else {
            setGpsDebugInfo(`GPS Reading ${positionCount}: ±${Math.round(accuracy)}m (Initializing)`);
          }

          lastStablePosition = position;
          
          // Update GPS quality indicator
          const quality = assessGPSQuality(accuracy, stableReadings);
          setGpsQuality(quality);
          
          // Stop conditions: excellent accuracy, enough stable readings, or max positions
          if ((accuracy <= targetAccuracy && stableReadings >= 3) || 
              (stableReadings >= 5) || 
              positionCount >= maxPositions) {
            
            if (watchId !== null) {
              navigator.geolocation.clearWatch(watchId);
            }
            clearTimeout(timeoutId);
            clearTimeout(stabilityCheckId);
            
            // Use averaged position for maximum accuracy
            const finalPosition = positions.length >= 3 ? calculateAveragePosition(positions) : position;
            resolve(finalPosition);
          }
        };

        const errorCallback = (error: GeolocationPositionError) => {
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
          }
          clearTimeout(timeoutId);
          clearTimeout(stabilityCheckId);
          reject(error);
        };

        // Use watchPosition for continuous ultra-precise GPS readings
        watchId = navigator.geolocation.watchPosition(
          successCallback,
          errorCallback,
          ultraPreciseOptions
        );

        // Extended timeout for ultra-precise mode - 60 seconds
        timeoutId = setTimeout(() => {
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
          }
          if (positions.length > 0) {
            const finalPosition = positions.length >= 3 ? calculateAveragePosition(positions) : positions[positions.length - 1];
            resolve(finalPosition);
          } else {
            reject(new Error('No GPS position obtained within extended timeout'));
          }
        }, 60000);

        // Stability check every 10 seconds
        stabilityCheckId = setTimeout(() => {
          if (stableReadings < 2 && positionCount > 5) {
            setGpsDebugInfo(`GPS unstable after ${positionCount} readings. Move to open area.`);
          }
        }, 10000);
      });

      const finalPosition = await promise;
      
      if (finalPosition) {
        const lat = finalPosition.coords.latitude;
        const lng = finalPosition.coords.longitude;
        const accuracy = finalPosition.coords.accuracy;
        const altitude = finalPosition.coords.altitude;
        
        console.log(`Ultra-Precise GPS Location: ${lat}, ${lng}`);
        console.log(`Final Accuracy: ±${accuracy}m from ${positions.length} readings`);
        console.log(`Altitude: ${altitude}m, Quality: ${gpsQuality}`);
        
        const finalQuality = accuracy <= 3 ? 'excellent' : 
                           accuracy <= 8 ? 'good' : 
                           accuracy <= 20 ? 'fair' : 'poor';
        
        setGpsQuality(finalQuality);
        setGpsDebugInfo(`Ultra-precise: ±${Math.round(accuracy)}m from ${positions.length} readings (${finalQuality})`);
        
        // Get location name from coordinates
        const locationName = await getLocationName(lat, lng);
        
        setFormData(prev => ({
          ...prev,
          location_lat: lat,
          location_lng: lng,
          location_name: locationName,
        }));
        
        const accuracyText = accuracy <= 3 ? "Ultra-precise" :
                           accuracy <= 8 ? "Excellent accuracy" :
                           accuracy <= 15 ? "High accuracy" : 
                           accuracy <= 50 ? "Good accuracy" : "Moderate accuracy";
        
        toast({
          title: "Ultra-precise GPS captured",
          description: `${locationName} (${accuracyText}: ±${Math.round(accuracy)}m)`,
        });
      }
    } catch (error: any) {
      let errorMessage = "Unable to get ultra-precise GPS location.";
      
      if (error.code) {
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "GPS access denied. Please enable precise location in browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "GPS unavailable. Please go outdoors with clear sky view and try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "GPS timeout. Please try in a completely open area away from all buildings.";
            break;
          default:
            errorMessage = `Ultra GPS error: ${error.message || 'Unknown error'}`;
            break;
        }
      }
      
      console.error('Ultra-precise GPS error:', error);
      setGpsDebugInfo(`Error: ${errorMessage}`);
      setGpsQuality('poor');
      toast({
        title: "Ultra-precise GPS error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Alias for backward compatibility
  const getLocation = getUltraPreciseGPSLocation;

  const handleManualLocation = () => {
    if (manualLocation.trim()) {
      setFormData(prev => ({
        ...prev,
        location_lat: null,
        location_lng: null,
        location_name: manualLocation.trim(),
      }));
      setShowManualLocation(false);
      setManualLocation('');
      toast({
        title: "Manual location set",
        description: `Location: ${manualLocation.trim()}`,
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 40 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 40MB",
          variant: "destructive",
        });
        return;
      }
      setFormData(prev => ({ ...prev, photo: file }));
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.mobile_number) {
      toast({
        title: "Missing information",
        description: "Please fill in your name and mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        throw new Error('Authentication required. Please sign in again.');
      }
      
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('full_name', formData.full_name);
      submitData.append('mobile_number', formData.mobile_number);
      submitData.append('notes', formData.notes || '');
      if (formData.location_lat) submitData.append('location_lat', formData.location_lat.toString());
      if (formData.location_lng) submitData.append('location_lng', formData.location_lng.toString());
      if (formData.location_name) submitData.append('location_name', formData.location_name);
      if (formData.photo) submitData.append('photo', formData.photo);

      console.log('Submitting report with data:', {
        full_name: formData.full_name,
        mobile_number: formData.mobile_number,
        notes: formData.notes,
        location_lat: formData.location_lat,
        location_lng: formData.location_lng,
        location_name: formData.location_name,
        has_photo: !!formData.photo
      });

      const response = await fetch('http://localhost:3001/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: submitData,
      });

      console.log('Report submission response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('Report submission successful:', responseData);
        
        toast({
          title: "Report submitted!",
          description: "Your pipe damage report has been submitted successfully.",
        });
        
        // Reset form
        setFormData(prev => ({
          ...prev,
          notes: '',
          photo: null,
          location_lat: null,
          location_lng: null,
          location_name: null,
        }));
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        // Refresh reports - with delay to ensure backend has saved
        setTimeout(() => {
          fetchReports();
        }, 500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Submit error response:', errorData);
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('Authentication failed. Please sign in again.');
        } else if (response.status === 400) {
          throw new Error(errorData.error || 'Please check your input and try again.');
        } else {
          throw new Error(errorData.error || `Server error (${response.status}). Please try again.`);
        }
      }
    } catch (error: any) {
      console.error('Submit report error:', error);
      toast({
        title: "Submission failed",
        description: error.message || "Unable to submit report. Please try again.",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-hero">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-hero">
        <div className="text-center">
          <p className="text-muted-foreground">Loading user data...</p>
          <Button onClick={() => navigate('/auth')} className="mt-4">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-hero">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>Please refresh the page or try again</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  try {
    return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Resident Dashboard</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Welcome, {profile.full_name}</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut} className="w-full sm:w-auto">
            <LogOut className="w-4 h-4 mr-2" />
            <span className="sm:inline">Sign Out</span>
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="report" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-full sm:max-w-md">
            <TabsTrigger value="report" className="text-xs sm:text-sm">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Report Damage</span>
              <span className="xs:hidden">Report</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Water Schedule</span>
              <span className="xs:hidden">Schedule</span>
            </TabsTrigger>
          </TabsList>

          {/* Report Damage Tab */}
          <TabsContent value="report" className="space-y-6">
            {/* Report Form */}
            <Card>
              <CardHeader>
                <CardTitle>Report Pipe Damage</CardTitle>
                <CardDescription>
                  Submit a report for damaged water pipes in your area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Your Name *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile_number">Mobile Number *</Label>
                      <Input
                        id="mobile_number"
                        type="tel"
                        placeholder="+91 9876543210"
                        value={formData.mobile_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, mobile_number: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Description</Label>
                    <Textarea
                      id="notes"
                      placeholder="Describe the damage (e.g., water leaking, pipe burst, etc.)"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={getLocation}
                          disabled={isGettingLocation}
                          className="flex-1"
                        >
                          {isGettingLocation ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Getting GPS...
                            </>
                          ) : (
                            <>
                              <MapPin className="w-4 h-4 mr-2" />
                              {formData.location_lat ? 'GPS Captured' : 'Use GPS Location'}
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowManualLocation(!showManualLocation)}
                          disabled={isGettingLocation}
                        >
                          Manual
                        </Button>
                      </div>
                      
                      {showManualLocation && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter location manually (e.g., Near Water Tank, Main Road)"
                            value={manualLocation}
                            onChange={(e) => setManualLocation(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={handleManualLocation}
                            disabled={!manualLocation.trim()}
                            size="sm"
                          >
                            Set
                          </Button>
                        </div>
                      )}
                      
                      {formData.location_name && (
                        <div className="flex gap-2 items-center">
                          <Badge variant="secondary" className="px-3 py-2 flex-1 justify-start">
                            <MapPin className="w-3 h-3 mr-1" />
                            {formData.location_name}
                          </Badge>
                          {gpsQuality && (
                            <Badge 
                              variant={gpsQuality === 'excellent' ? 'default' : 
                                     gpsQuality === 'good' ? 'secondary' : 
                                     gpsQuality === 'fair' ? 'outline' : 'destructive'}
                              className="px-2 py-1 text-xs"
                            >
                              {gpsQuality === 'excellent' ? '🎯 Ultra' : 
                               gpsQuality === 'good' ? '✅ Good' : 
                               gpsQuality === 'fair' ? '⚠️ Fair' : '❌ Poor'}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {gpsDebugInfo && (
                        <p className="text-xs text-muted-foreground">
                          {gpsDebugInfo}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Upload Photo</Label>
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          id="photo_gallery"
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 text-xs sm:text-sm"
                        >
                          <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Choose from Gallery
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCamera(true)}
                          className="flex-1 text-xs sm:text-sm"
                        >
                          <Camera className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Take Photo
                        </Button>
                      </div>
                      {formData.photo && (
                        <Badge variant="secondary" className="px-3 py-2 w-full justify-start">
                          <Camera className="w-4 h-4 mr-1" />
                          {formData.photo.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Maximum file size: 40MB
                    </p>
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* My Reports */}
            <Card>
              <CardHeader>
                <CardTitle>My Reports</CardTitle>
                <CardDescription>Track the status of your submitted reports</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingReports ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : reports.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No reports submitted yet
                  </p>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-3 sm:p-4 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-sm sm:text-base">{report.location_name || 'Location not available'}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Mobile: {report.mobile_number}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {new Date(report.created_at).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                          <div className="self-start">
                            {getStatusBadge(report.status)}
                          </div>
                        </div>
                        {report.notes && (
                          <p className="text-xs sm:text-sm text-muted-foreground">{report.notes}</p>
                        )}
                        {report.location_lat && report.location_lng && (
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedLocation({
                                lat: report.location_lat!,
                                lng: report.location_lng!,
                                address: report.location_name || 'Reported location',
                                userName: report.full_name
                              })}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full sm:w-auto text-xs sm:text-sm"
                            >
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                              View Location on Map
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1 ml-1">
                              {Number(report.location_lat).toFixed(4)}, {Number(report.location_lng).toFixed(4)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Water Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Water Supply Schedule</CardTitle>
                <CardDescription>
                  View water tap opening and closing times for your area
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSchedules ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : schedules.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No schedule available for today</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium text-lg">{schedule.area || 'Your Area'}</p>
                            <p className="text-sm text-muted-foreground">
                              Scheduled: {formatTime(schedule.scheduled_open_time)} - {formatTime(schedule.scheduled_close_time)}
                            </p>
                          </div>
                          {schedule.is_active ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Scheduled</Badge>
                          )}
                        </div>

                        {schedule.actual_open_time && (
                          <p className="text-sm text-muted-foreground">
                            Opened at: {formatTime(schedule.actual_open_time)}
                          </p>
                        )}

                        {schedule.interrupted && (
                          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-red-800">Supply Interrupted</p>
                                <p className="text-sm text-red-700">{schedule.interruption_reason}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Camera Capture Component */}
      <CameraCapture
        isOpen={showCamera}
        onCapture={(file) => {
          setFormData(prev => ({ ...prev, photo: file }));
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
    );
  } catch (error) {
    console.error('Render error:', error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-hero">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Dashboard</CardTitle>
            <CardDescription>An error occurred while loading the page</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
};

export default ResidentDashboard;
