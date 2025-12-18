import React from 'react';
import { GoogleMap, DirectionsRenderer } from '@react-google-maps/api';

const center = { lat: 9.9312, lng: 76.2673 }; // Default center (e.g., Kochi, Kerala)

interface MapAreaProps {
  onLoad: (map: google.maps.Map) => void;
  directionsResponse: google.maps.DirectionsResult | null;
}

const MapArea: React.FC<MapAreaProps> = ({ onLoad, directionsResponse }) => {
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
        {directionsResponse && (
          <DirectionsRenderer directions={directionsResponse} />
        )}
      </GoogleMap>
    </div>
  );
};

export default MapArea;