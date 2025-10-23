import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Navigation, ExternalLink, Loader2 } from 'lucide-react';

// Fix for default marker icon in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  latitude: number;
  longitude: number;
  address: string;
  userName?: string;
  onClose?: () => void;
}

// Component to recenter map when coordinates change
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  
  return null;
}

const MapView = ({ latitude, longitude, address, userName, onClose }: MapViewProps) => {
  // Ensure latitude and longitude are numbers
  const lat = typeof latitude === 'number' ? latitude : parseFloat(String(latitude));
  const lng = typeof longitude === 'number' ? longitude : parseFloat(String(longitude));
  
  const position: [number, number] = [lat, lng];
  const [isMapReady, setIsMapReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  // Delay map rendering to ensure container is mounted
  useEffect(() => {
    console.log('MapView mounted with coordinates:', lat, lng);
    try {
      const timer = setTimeout(() => {
        console.log('Map ready to render');
        setIsMapReady(true);
      }, 100);
      return () => clearTimeout(timer);
    } catch (error) {
      console.error('Error initializing map:', error);
      setHasError(true);
    }
  }, [lat, lng]);
  
  // Google Maps directions URL
  const getDirectionsUrl = () => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  };
  
  // Google Maps view URL
  const openInGoogleMaps = () => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  };

  console.log('MapView rendering...', { lat, lng, address, userName });

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-2 sm:p-4" 
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.7)', 
        zIndex: 9999,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: 'fixed'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div 
        className="bg-white rounded-lg w-full max-w-4xl flex flex-col" 
        style={{ 
          height: '95vh', 
          maxHeight: '800px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 border-b flex justify-between items-start bg-white" style={{ flexShrink: 0 }}>
          <div className="flex-1 pr-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">Location on Map</h3>
            {userName && <p className="text-xs sm:text-sm text-gray-600">Report by: {userName}</p>}
            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{address}</p>
            <p className="text-xs text-gray-500 mt-1 hidden sm:block">
              Coordinates: {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
            ✕
          </Button>
        </div>
        
        {/* Map Container */}
        <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: '500px', backgroundColor: '#f0f0f0' }}>
          {hasError ? (
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '1rem',
              padding: '2rem'
            }}>
              <p className="text-red-600 font-semibold">Failed to load map</p>
              <p className="text-sm text-muted-foreground text-center">
                There was an error loading the map. Please check the browser console for details.
              </p>
            </div>
          ) : !isMapReady ? (
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground">Loading map...</p>
            </div>
          ) : (
            <MapContainer
              key={`${latitude}-${longitude}`}
              center={position}
              zoom={15}
              style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              scrollWheelZoom={true}
              zoomControl={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <Marker position={position}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{userName || 'Location'}</p>
                    <p className="text-xs mt-1">{address}</p>
                  </div>
                </Popup>
              </Marker>
              <RecenterMap lat={lat} lng={lng} />
            </MapContainer>
          )}
        </div>
        
        {/* Footer with Action Buttons */}
        <div className="p-3 sm:p-4 border-t flex flex-col sm:flex-row gap-2 sm:gap-3 bg-white" style={{ flexShrink: 0 }}>
          <Button
            onClick={() => window.open(getDirectionsUrl(), '_blank')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
          >
            <Navigation className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Get Directions
          </Button>
          <Button
            variant="outline"
            onClick={openInGoogleMaps}
            className="flex-1 text-xs sm:text-sm"
          >
            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            Open in Google Maps
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapView;
