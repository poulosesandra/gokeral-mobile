import React from 'react';
import { GoogleMap, DirectionsRenderer, OverlayView } from '@react-google-maps/api';

interface MapAreaProps {
  onLoad: (map: google.maps.Map) => void;
  directionsResponse: google.maps.DirectionsResult | null;
  center: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  onUserLocationClick?: () => void;
  selectedRouteIndex?: number;
}

const MapArea: React.FC<MapAreaProps> = ({ onLoad, directionsResponse, center, userLocation, onUserLocationClick, selectedRouteIndex = 0 }) => {
  const [highlightPulse, setHighlightPulse] = React.useState(false);

  React.useEffect(() => {
    // brief highlight when selection changes
    setHighlightPulse(true);
    const t = setTimeout(() => setHighlightPulse(false), 420);
    return () => clearTimeout(t);
  }, [selectedRouteIndex]);

  return (
    <div className="flex-1 h-full relative rounded-2xl overflow-hidden shadow-lg border border-gray-200">
      <GoogleMap
        center={center}
        zoom={15}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{
          zoomControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
        onLoad={onLoad}
      >
        {userLocation && (
          <OverlayView
            position={userLocation}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
          >
            <div
              onClick={() => onUserLocationClick && onUserLocationClick()}
              title="Your location"
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#1E90FF',
                boxShadow: '0 0 8px rgba(30,144,255,0.6)',
                border: '2px solid white',
                cursor: 'pointer',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
              }}
            />
          </OverlayView>
        )}

        {/* Render all routes: selected one styled as active */}
        {directionsResponse && directionsResponse.routes.map((route, index) => (
          <React.Fragment key={index}>
            <DirectionsRenderer
              directions={directionsResponse}
              routeIndex={index}
              options={{
                polylineOptions: {
                  strokeColor: index === selectedRouteIndex ? '#1E90FF' : '#9CA3AF',
                  strokeWeight: index === selectedRouteIndex ? (highlightPulse ? 10 : 6) : 4,
                  strokeOpacity: index === selectedRouteIndex ? 1.0 : 0.6,
                  zIndex: index === selectedRouteIndex ? 50 : 1,
                },
                suppressMarkers: index !== selectedRouteIndex,
              }}
            />

            {/* If this is the selected route render start/end markers as OverlayView to avoid duplicate map pins */}
            {index === selectedRouteIndex && route.legs[0] && (
              <>
                <OverlayView position={route.legs[0].start_location} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                  <div style={{ transform: `translate(-50%, -50%) scale(${highlightPulse ? 1.2 : 1})`, transition: 'transform 220ms ease-out' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', border: '3px solid #1E90FF', boxShadow: '0 0 8px rgba(30,144,255,0.6)' }} />
                  </div>
                </OverlayView>

                <OverlayView position={route.legs[0].end_location} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                  <div style={{ transform: `translate(-50%, -50%) scale(${highlightPulse ? 1.2 : 1})`, transition: 'transform 220ms ease-out' }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', border: '3px solid #1E90FF', boxShadow: '0 0 8px rgba(30,144,255,0.6)' }} />
                  </div>
                </OverlayView>
              </>
            )}
          </React.Fragment>
        ))}
      </GoogleMap>
    </div>
  );
};

export default MapArea;