import React from 'react';
import { GoogleMap, DirectionsRenderer, OverlayView } from '@react-google-maps/api';

interface MapAreaProps {
  onLoad: (map: google.maps.Map) => void;
  directionsResponse: google.maps.DirectionsResult | null;
  center: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  onUserLocationClick?: () => void;
}

const MapArea: React.FC<MapAreaProps> = ({ onLoad, directionsResponse, center, userLocation, onUserLocationClick }) => {
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
              aria-label="Your location"
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
        {directionsResponse && (
          <DirectionsRenderer directions={directionsResponse} />
        )}
      </GoogleMap>
    </div>
  );
};

export default MapArea;