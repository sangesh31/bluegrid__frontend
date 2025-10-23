import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplets, LogOut, FileText, Clock, MapPin, Camera, Upload, X, Loader2, CheckCircle2, AlertCircle, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import MapView from "@/components/MapView";
import CameraCapture from "@/components/CameraCapture";
import ReportsAnalytics from "@/components/ReportsAnalytics";
import { API_URL } from "@/lib/api";

interface PipeReport {
  id: string;
  full_name: string;
  mobile_number: string;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  photo_url: string | null;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'awaiting_approval' | 'approved' | 'rejected';
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
      
      const response = await fetch(`${API_URL}/api/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched reports:', data);
        // Log photo URLs for debugging
        if (Array.isArray(data)) {
          data.forEach((report: any) => {
            if (report.photo_url) {
              console.log(`Report ${report.id} photo_url:`, report.photo_url);
              const fullUrl = report.photo_url.startsWith('http') ? report.photo_url : `${API_URL}${report.photo_url}`;
              console.log(`Full image URL:`, fullUrl);
            }
          });
        }
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
      const response = await fetch(`${API_URL}/api/schedules/today`, {
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

  // Simple GPS fallback for quick location
  const getSimpleGPSLocation = async () => {
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
    setGpsDebugInfo('Getting GPS location...');
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      console.log(`GPS Location: ${lat}, ${lng} (±${accuracy}m)`);

      // Reverse geocode to get location name
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        const locationName = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        setFormData(prev => ({
          ...prev,
          location_lat: lat,
          location_lng: lng,
          location_name: locationName,
        }));

        setGpsDebugInfo(`GPS: ±${Math.round(accuracy)}m accuracy`);
        setGpsQuality(accuracy <= 10 ? 'excellent' : accuracy <= 30 ? 'good' : 'fair');

        toast({
          title: "GPS location captured",
          description: `${locationName} (±${Math.round(accuracy)}m)`,
        });
      } catch (geocodeError) {
        // Fallback if reverse geocoding fails
        const locationName = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        setFormData(prev => ({
          ...prev,
          location_lat: lat,
          location_lng: lng,
          location_name: locationName,
        }));

        toast({
          title: "GPS location captured",
          description: `Coordinates: ${locationName}`,
        });
      }
    } catch (error: any) {
      let errorMessage = "Unable to get GPS location.";
      
      if (error.code) {
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location permissions in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable. Please check your device's location settings.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
          default:
            errorMessage = `GPS error: ${error.message || 'Unknown error'}`;
            break;
        }
      }
      
      console.error('GPS error:', error);
      setGpsDebugInfo(`Error: ${errorMessage}`);
      toast({
        title: "GPS error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Use simple GPS by default, ultra-precise as option
  const getLocation = getSimpleGPSLocation;

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

      const response = await fetch(`${API_URL}/api/reports`, {
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
        <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                  <Droplets className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white animate-pulse-soft"></div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-2">
                  🏠 Resident Dashboard
                </h1>
                <p className="text-sm sm:text-base text-white/90">Welcome, {profile.full_name}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleSignOut} 
              className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="complaints" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-full sm:max-w-2xl">
            <TabsTrigger value="complaints" className="text-xs sm:text-sm">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Complaints</span>
              <span className="xs:hidden">Complaints</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs sm:text-sm">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Water Schedule</span>
              <span className="xs:hidden">Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Reports</span>
              <span className="xs:hidden">Reports</span>
            </TabsTrigger>
          </TabsList>

          {/* Complaints Tab (formerly Report Damage) */}
          <TabsContent value="complaints" className="space-y-6">
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
                    {reports.map((report) => {
                      // Format location address
                      const formatLocation = (location: string) => {
                        if (!location) return { main: 'Location not available', details: '' };
                        const parts = location.split(',').map(p => p.trim());
                        if (parts.length >= 3) {
                          return {
                            main: parts[0],
                            details: parts.slice(1).join(', ')
                          };
                        }
                        return { main: location, details: '' };
                      };
                      
                      const location = formatLocation(report.location_name || '');
                      
                      // Get status class name
                      const statusClass = report.status.replace('_', '-');
                      
                      // Get status message
                      const getStatusMessage = (status: string) => {
                        const messages: Record<string, string> = {
                          'pending': '⏱️ Waiting for review',
                          'assigned': '👷 Assigned to technician',
                          'in_progress': '🔧 Work in progress',
                          'completed': '✅ Work completed',
                          'awaiting_approval': '📋 Awaiting approval',
                          'approved': '✅ Approved and closed',
                          'rejected': '❌ Report rejected'
                        };
                        return messages[status] || 'Processing';
                      };
                      
                      return (
                        <div key={report.id} className={`report-card status-${statusClass}`}>
                          {/* Header Section */}
                          <div className="report-header">
                            <h3>🏢 {location.main}</h3>
                            {location.details && (
                              <div className="report-location">
                                <span>📍</span>
                                <span>{location.details}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Meta Information */}
                          <div className="meta-info">
                            <div className="meta-item">
                              <span>📱</span>
                              <span><strong>Mobile:</strong> {report.mobile_number}</span>
                            </div>
                            <div className="meta-item">
                              <span>📅</span>
                              <span><strong>Submitted:</strong> {new Date(report.created_at).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short', 
                                year: 'numeric' 
                              })}</span>
                            </div>
                          </div>
                          
                          {/* Issue Description */}
                          {report.notes && (
                            <div>
                              <div className="issue-description-label">💧 Issue Description</div>
                              <div className="issue-description">
                                "{report.notes}"
                              </div>
                            </div>
                          )}
                          
                          {/* Media Section */}
                          {(report.photo_url || (report.location_lat && report.location_lng)) && (
                            <div>
                              <div className="issue-description-label">🖼️ Evidence</div>
                              
                              {/* Photo Thumbnail */}
                              {report.photo_url && (
                                <div className="mb-3" style={{ minHeight: '200px' }}>
                                  <img 
                                    src={report.photo_url.startsWith('http') ? report.photo_url : `${API_URL}${report.photo_url}`}
                                    alt="Damage photo" 
                                    style={{ 
                                      width: '100%', 
                                      maxWidth: '400px', 
                                      height: '200px', 
                                      objectFit: 'cover',
                                      display: 'block',
                                      borderRadius: '8px',
                                      border: '2px solid #e5e7eb',
                                      cursor: 'pointer'
                                    }}
                                    onLoad={(e) => {
                                      console.log('✅ Image loaded successfully:', e.currentTarget.src);
                                      e.currentTarget.style.border = '2px solid #10b981';
                                    }}
                                    onError={(e) => {
                                      console.error('❌ Image failed to load:', report.photo_url);
                                      console.error('Attempted URL:', e.currentTarget.src);
                                      console.error('API_URL:', API_URL);
                                      // Show error placeholder
                                      const parent = e.currentTarget.parentElement;
                                      if (parent) {
                                        parent.innerHTML = `
                                          <div style="width: 100%; max-width: 400px; height: 200px; display: flex; align-items: center; justify-content: center; background-color: #f3f4f6; border-radius: 8px; border: 2px solid #ef4444;">
                                            <div style="text-align: center; padding: 16px;">
                                              <p style="color: #dc2626; font-weight: 600; margin-bottom: 8px;">⚠️ Image failed to load</p>
                                              <p style="font-size: 12px; color: #6b7280; word-break: break-all; margin-bottom: 8px;">${e.currentTarget.src}</p>
                                              <button 
                                                onclick="window.open('${e.currentTarget.src}', '_blank')" 
                                                style="margin-top: 8px; padding: 6px 12px; background-color: #3b82f6; color: white; font-size: 12px; border-radius: 4px; border: none; cursor: pointer;"
                                              >
                                                Try opening in new tab
                                              </button>
                                            </div>
                                          </div>
                                        `;
                                      }
                                    }}
                                    onClick={() => {
                                      const imageUrl = report.photo_url!.startsWith('http') 
                                        ? report.photo_url! 
                                        : `${API_URL}${report.photo_url}`;
                                      window.open(imageUrl, '_blank');
                                    }}
                                  />
                                </div>
                              )}
                              
                              <div className="media-section">
                                {report.photo_url && (
                                  <button
                                    className="media-btn"
                                    onClick={() => {
                                      const imageUrl = report.photo_url!.startsWith('http') 
                                        ? report.photo_url! 
                                        : `${API_URL}${report.photo_url}`;
                                      window.open(imageUrl, '_blank');
                                    }}
                                  >
                                    <Camera className="w-4 h-4" />
                                    📷 View Full Photo
                                  </button>
                                )}
                                {report.location_lat && report.location_lng && (
                                  <button
                                    className="media-btn"
                                    onClick={() => setSelectedLocation({
                                      lat: report.location_lat!,
                                      lng: report.location_lng!,
                                      address: report.location_name || 'Reported location',
                                      userName: report.full_name
                                    })}
                                  >
                                    <MapPin className="w-4 h-4" />
                                    📍 View on Map
                                  </button>
                                )}
                              </div>
                              {report.location_lat && report.location_lng && (
                                <div className="coordinates">
                                  Coordinates: {Number(report.location_lat).toFixed(4)}, {Number(report.location_lng).toFixed(4)}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Status Section */}
                          <div className={`report-status-section status-${statusClass}`}>
                            <span className={`report-status-badge ${statusClass}`}>
                              {report.status === 'pending' && '🟡'}
                              {report.status === 'assigned' && '🔵'}
                              {report.status === 'in_progress' && '🟣'}
                              {(report.status === 'completed' || report.status === 'approved') && '🟢'}
                              {report.status === 'rejected' && '🔴'}
                              {' '}
                              {report.status.toUpperCase().replace('_', ' ')}
                            </span>
                            <span className="status-message">
                              {getStatusMessage(report.status)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
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
                    {schedules.map((schedule) => {
                      // Determine status and card class
                      const getScheduleStatus = () => {
                        if (schedule.actual_open_time && schedule.actual_close_time) return 'completed';
                        if (schedule.is_active) return 'on-schedule';
                        if (schedule.interrupted) return 'delayed';
                        return 'not-started';
                      };
                      
                      const scheduleStatus = getScheduleStatus();
                      
                      // Calculate time difference if opened
                      const getTimeDifference = () => {
                        if (!schedule.actual_open_time) return null;
                        
                        const scheduled = new Date(schedule.scheduled_open_time).getTime();
                        const actual = new Date(schedule.actual_open_time).getTime();
                        const diffMs = actual - scheduled;
                        const diffMins = Math.abs(Math.floor(diffMs / 60000));
                        const diffHours = Math.floor(diffMins / 60);
                        const remainingMins = diffMins % 60;
                        
                        const timeStr = diffHours > 0 
                          ? `${diffHours}h ${remainingMins}m` 
                          : `${diffMins}m`;
                        
                        if (diffMs < -300000) return { text: `${timeStr} early`, type: 'early' }; // 5+ min early
                        if (diffMs > 300000) return { text: `${timeStr} late`, type: 'late' }; // 5+ min late
                        return { text: 'On time', type: 'on-time' };
                      };
                      
                      const timeDiff = getTimeDifference();
                      
                      // Format address parts
                      const formatAddress = (area: string) => {
                        if (!area) return { main: 'Your Area', location: '' };
                        const parts = area.split(',').map(p => p.trim());
                        if (parts.length >= 2) {
                          return {
                            main: parts.slice(0, 2).join(', '),
                            location: parts.slice(2).join(', ')
                          };
                        }
                        return { main: area, location: '' };
                      };
                      
                      const address = formatAddress(schedule.area);
                      
                      return (
                        <div key={schedule.id} className={`schedule-card ${scheduleStatus}`}>
                          {/* Address Section */}
                          <div className="schedule-address">
                            🏠 <span>{address.main || 'Your Area'}</span>
                          </div>
                          {address.location && (
                            <div className="schedule-location">
                              📍 {address.location}
                            </div>
                          )}
                          
                          {/* Scheduled Time Section */}
                          <div className="schedule-time-section">
                            <div className="schedule-time-label">⏰ Scheduled Time</div>
                            <div className="schedule-time-value">
                              🕛 {formatTime(schedule.scheduled_open_time)} - {formatTime(schedule.scheduled_close_time)}
                            </div>
                          </div>
                          
                          {/* Actual Opening Time */}
                          {schedule.actual_open_time && (
                            <div className="schedule-time-section">
                              <div className="schedule-time-label">✅ Actual Opening</div>
                              <div className="schedule-time-value">
                                🕡 {formatTime(schedule.actual_open_time)}
                                {timeDiff && (
                                  <span className={`time-difference ${timeDiff.type}`}>
                                    {timeDiff.type === 'early' && '🟡'} 
                                    {timeDiff.type === 'late' && '🔴'} 
                                    {timeDiff.type === 'on-time' && '🟢'} 
                                    {timeDiff.text}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Status Badge */}
                          <div className="flex justify-between items-center mt-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-700">📊 Status:</span>
                              {schedule.is_active && (
                                <span className="status-active">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Active
                                </span>
                              )}
                              {!schedule.is_active && !schedule.actual_open_time && (
                                <span className="status-scheduled">
                                  <Clock className="w-3 h-3" />
                                  Scheduled
                                </span>
                              )}
                              {schedule.actual_open_time && schedule.actual_close_time && (
                                <span className="status-completed">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Completed 🟢
                                </span>
                              )}
                              {schedule.interrupted && (
                                <span className="status-delayed">
                                  <AlertCircle className="w-3 h-3" />
                                  Interrupted
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Interruption Alert */}
                          {schedule.interrupted && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-red-800">⚠️ Supply Interrupted</p>
                                  <p className="text-sm text-red-700">{schedule.interruption_reason}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports & Analytics Tab */}
          <TabsContent value="reports" className="space-y-6">
            <ReportsAnalytics userRole="resident" userId={user?.id} />
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
