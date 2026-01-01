import React, { useRef, useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';
import RouteList from './RouteList';

interface MapControlsProps {
  onDirectionsCalculated: (result: google.maps.DirectionsResult) => void;
  onClearRoute: () => void;
  onPanToLocation?: (lat: number, lng: number) => void;
  onSetCurrentLocationMarker?: (lat: number, lng: number) => void;
  onRouteSelected?: (index: number) => void; // New prop
  selectedRouteIndex?: number; // controlled prop from parent
}

const MapControls: React.FC<MapControlsProps> = ({
  onDirectionsCalculated,
  onClearRoute,
  onPanToLocation,
  onSetCurrentLocationMarker,
  onRouteSelected,
  selectedRouteIndex: selectedRouteIndexProp,
}) => {
  const originRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);

  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [originLoading, setOriginLoading] = useState(false);
  const [originIsCurrentLocation, setOriginIsCurrentLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  // store alternate routes
  const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // Keep internal selected index in sync when parent updates it
  React.useEffect(() => {
    if (typeof selectedRouteIndexProp === 'number') {
      setSelectedRouteIndex(selectedRouteIndexProp);
    }
  }, [selectedRouteIndexProp]);

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
        provideRouteAlternatives: true, // request alternates
      });

      onDirectionsCalculated(results);

      // save all routes so we can render list
      setRoutes(results.routes || []);
      setSelectedRouteIndex(0);
      if (onRouteSelected) onRouteSelected(0);

      if (results.routes[0]?.legs[0]?.distance && results.routes[0]?.legs[0]?.duration) {
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
    setRoutes([]);
    setSelectedRouteIndex(0);
    if (onRouteSelected) onRouteSelected(0);
    setDistance('');
    setDuration('');
    setOriginIsCurrentLocation(false);
    setCurrentLocation(null);
    if (originRef.current) originRef.current.value = '';
    if (destinationRef.current) destinationRef.current.value = '';
  }

  return (
    <div className="w-[350px] h-full min-h-0 bg-white p-4 shadow-lg flex flex-col gap-4 border-r border-gray-200 z-20">
      <h2 className="text-lg font-bold text-gray-800">Plan Your Trip</h2>
      <div className="flex flex-col gap-3">
        {/* Origin Input with Target Icon */}
        <div className="relative w-full">
          <Autocomplete className="w-full">
            <input
              type='text'
              placeholder='Origin'
              ref={originRef}
              // Added pr-10 to prevent text from overlapping the icon
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              defaultValue=""
              onChange={() => setOriginIsCurrentLocation(false)}
              readOnly={originIsCurrentLocation}
              style={originIsCurrentLocation ? { backgroundColor: "#f0f4ff", fontWeight: 600, color: '#2563EB' } : {}}
            />
          </Autocomplete>

          {/* Target Icon Button inside the input */}
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={originLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-blue-600 hover:bg-gray-100 transition-all"
            title="Use my current location"
          >
            {originLoading ? (
              // Loading Spinner
              <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              // Target / Crosshairs Icon
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>

        <Autocomplete>
          <input
            type='text'
            placeholder='Destination'
            ref={destinationRef}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Autocomplete>
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


      {/* Routes List (scrollable) */}
      <div className="flex-1 overflow-y-auto mt-4 pr-2">
        <RouteList
          routes={routes}
          selectedIndex={selectedRouteIndex}
          onSelect={(i) => {
            setSelectedRouteIndex(i);
            if (onRouteSelected) onRouteSelected(i);
          }}
        />
      </div>
    </div>
  );
};

export default MapControls;