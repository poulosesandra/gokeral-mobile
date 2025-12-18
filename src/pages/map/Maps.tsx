import React, { useState } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import MapControls from '../../components/map/MapControls';
import MapArea from '../../components/map/MapArea';
import Header from '../../components/Header';

// Define libraries array outside component to prevent re-renders
const libraries: ("places")[] = ['places'];

const Maps: React.FC = () => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE",
    libraries: libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  
  // State for Header menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <div className="text-xl font-semibold text-gray-600">Loading Google Maps...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-50">
      {/* Header Component */}
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* Main Content Area */}
      {/* Changed: Added padding (pt-24, pb-4, px-4) and gap-4 instead of margins on children */}
      <div className="flex flex-1 w-full pt-24 pb-4 px-4 gap-4">
        
        <MapControls 
          onDirectionsCalculated={(result) => setDirectionsResponse(result)}
          onClearRoute={() => setDirectionsResponse(null)}
        />

        <MapArea 
          onLoad={(map) => setMap(map)}
          directionsResponse={directionsResponse}
        />
      </div>
    </div>
  );
};

export default Maps;