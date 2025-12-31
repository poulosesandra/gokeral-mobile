import React, { useRef, useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';

interface MapControlsProps {
  onDirectionsCalculated: (result: google.maps.DirectionsResult) => void;
  onClearRoute: () => void;
  onPanToLocation?: (lat: number, lng: number) => void; // Add this prop
  onSetCurrentLocationMarker?: (lat: number, lng: number) => void; // Add this prop
}

const MapControls: React.FC<MapControlsProps> = ({
  onDirectionsCalculated,
  onClearRoute,
  onPanToLocation,
  onSetCurrentLocationMarker,
}) => {
  const originRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);

  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [originLoading, setOriginLoading] = useState(false);
  const [originIsCurrentLocation, setOriginIsCurrentLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setOriginLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        setOriginIsCurrentLocation(true);
        if (originRef.current) {
          originRef.current.value = "Your location";
        }
        if (onPanToLocation) onPanToLocation(latitude, longitude);
        if (onSetCurrentLocationMarker) onSetCurrentLocationMarker(latitude, longitude);
        setOriginLoading(false);
      },
      (_error) => {
        alert("Unable to retrieve your location.");
        setOriginLoading(false);
      }
    );
  }

  async function calculateRoute() {
    if (!originRef.current || !destinationRef.current) return;
    if (originRef.current.value === '' || destinationRef.current.value === '') {
      return;
    }

    let originValue: string | google.maps.LatLngLiteral = originRef.current.value;
    if (originIsCurrentLocation && currentLocation) {
      originValue = currentLocation;
    }

    const directionsService = new google.maps.DirectionsService();

    try {
      const results = await directionsService.route({
        origin: originValue,
        destination: destinationRef.current.value,
        travelMode: google.maps.TravelMode.DRIVING,
      });

      onDirectionsCalculated(results);

      if (results.routes[0].legs[0].distance && results.routes[0].legs[0].duration) {
        setDistance(results.routes[0].legs[0].distance.text);
        setDuration(results.routes[0].legs[0].duration.text);
      }
    } catch (error) {
      console.error("Error calculating route:", error);
      alert("Could not calculate route. Please check the addresses.");
    }
  }

  function clearRoute() {
    onClearRoute();
    setDistance('');
    setDuration('');
    setOriginIsCurrentLocation(false);
    setCurrentLocation(null);
    if (originRef.current) originRef.current.value = '';
    if (destinationRef.current) destinationRef.current.value = '';
  }

  return (
    <div className="w-[350px] h-full bg-white p-4 shadow-lg flex flex-col gap-4 border-r border-gray-200 z-20">
      <h2 className="text-lg font-bold text-gray-800">Plan Your Trip</h2>
      <div className="flex flex-col gap-3">
        <Autocomplete className="flex-1">
          <input
            type='text'
            placeholder='Origin'
            ref={originRef}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue=""
            onChange={() => setOriginIsCurrentLocation(false)}
            readOnly={originIsCurrentLocation}
            style={originIsCurrentLocation ? { backgroundColor: "#f0f4ff", fontWeight: 600 } : {}}
          />
        </Autocomplete>
        <Autocomplete>
          <input
            type='text'
            placeholder='Destination'
            ref={destinationRef}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Autocomplete>
        {/* "Your location" button below the inputs */}
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={originLoading}
          className="flex items-center gap-2 px-4 py-3 mt-1 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-gray-800 font-medium shadow border border-gray-200"
          style={{ textAlign: "left" }}
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600">
            {/* Location icon SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
              <path stroke="currentColor" strokeWidth="2" d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07 7.07l-1.41-1.41M6.34 6.34l-1.41-1.41m12.02 0l-1.41 1.41M6.34 17.66l-1.41 1.41"/>
            </svg>
          </span>
          {originLoading ? "Locating..." : "Your location"}
        </button>
      </div>

      <div className="flex gap-3 mt-2">
        <button
          onClick={calculateRoute}
          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
        >
          Calculate
        </button>
        <button
          onClick={clearRoute}
          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium "
        >
          Clear
        </button>
      </div>

      {(distance && duration) && (
        <div className="mt-2 p-3 bg-blue-50 rounded-lg flex justify-between text-sm font-semibold text-blue-800">
          <span>Distance: {distance}</span>
          <span>Duration: {duration}</span>
        </div>
      )}
    </div>
  );
};

export default MapControls;