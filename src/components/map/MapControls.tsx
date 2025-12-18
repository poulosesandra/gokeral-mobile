import React, { useRef, useState } from 'react';
import { Autocomplete } from '@react-google-maps/api';

interface MapControlsProps {
  onDirectionsCalculated: (result: google.maps.DirectionsResult) => void;
  onClearRoute: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({ onDirectionsCalculated, onClearRoute }) => {
  const originRef = useRef<HTMLInputElement>(null);
  const destinationRef = useRef<HTMLInputElement>(null);
  
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');

  async function calculateRoute() {
    if (!originRef.current || !destinationRef.current) return;
    if (originRef.current.value === '' || destinationRef.current.value === '') {
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    
    try {
      const results = await directionsService.route({
        origin: originRef.current.value,
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
    if (originRef.current) originRef.current.value = '';
    if (destinationRef.current) destinationRef.current.value = '';
  }

  return (
    <div className="w-[350px] h-full bg-white p-4 shadow-lg flex flex-col gap-4 border-r border-gray-200 z-20">
      <h2 className="text-lg font-bold text-gray-800">Plan Your Trip</h2>
      <div className="flex flex-col gap-3">
        <Autocomplete>
          <input 
            type='text' 
            placeholder='Origin' 
            ref={originRef} 
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </div>
      
      <div className="flex gap-3">
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