import React, { useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import MapControls from '../../components/map/MapControls';
import MapArea from '../../components/map/MapArea';
import BookingPanel from '../../components/map/BookingPanel';
import { UserHeader } from '../../components/user/UserHeader';
import { authService } from '../../services/authServices';

// Define libraries array outside component to prevent re-renders
const libraries: ("places")[] = ['places'];

const Maps: React.FC = () => {
  const navigate = useNavigate();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE",
    libraries: libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(-1); // confirmed selection (-1 = none)
  const [highlightedRouteIndex, setHighlightedRouteIndex] = useState<number>(-1); // transient highlight
  const panelVisible = Boolean(directionsResponse && directionsResponse.routes && directionsResponse.routes.length > 0 && selectedRouteIndex >= 0);
  const selectedRoute = directionsResponse?.routes?.[selectedRouteIndex] ?? null;
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Get user data for header
  const currentUser = authService.getCurrentUser();
  const username = currentUser?.fullName || currentUser?.name || 'User';

  // 1. Add center state with fallback to Kochi
  const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 9.9312, lng: 76.2673 });
  // 2. On mount, try to get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          setCenter(coords);
          setUserLocation(coords); // place a pin at exact user location
        },
        (error) => {
          console.warn('Geolocation error:', error);
          message.info('Location access denied or unavailable. Using default location.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Add effect to pan map to center on change
  useEffect(() => {
    if (
      map &&
      center &&
      typeof center.lat === "number" &&
      typeof center.lng === "number" &&
      isFinite(center.lat) &&
      isFinite(center.lng)
    ) {
      map.panTo(center);
    }
  }, [center, map]);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    authService.logout();
    message.success('Logged out successfully');
    navigate('/user/login');
  };

  // Smoothly animate the map to a target location over `duration` ms (returns a Promise)
  const smoothPanTo = (map: google.maps.Map, target: { lat: number; lng: number }, duration = 600): Promise<void> => {
    return new Promise((resolve) => {
      if (!map) { resolve(); return; }

      const start = map.getCenter();
      if (!start) { resolve(); return; }

      const startLat = start.lat();
      const startLng = start.lng();
      const deltaLat = target.lat - startLat;
      const deltaLng = target.lng - startLng;

      const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

      const startTime = performance.now();

      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = easeInOutQuad(t);

        const lat = startLat + deltaLat * eased;
        const lng = startLng + deltaLng * eased;

        map.panTo({ lat, lng });

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(step);
    });
  };

  // Smoothly animate the map zoom level to `targetZoom` over `duration` ms
  const smoothZoom = (map: google.maps.Map, targetZoom: number, duration = 500) => {
    const startZoom = map.getZoom() ?? 15;
    if (startZoom === targetZoom) return;

    const delta = targetZoom - startZoom;
    const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeInOutQuad(t);
      const zoom = startZoom + delta * eased;
      // setZoom expects an integer; round to nearest
      map.setZoom(Math.round(zoom));

      if (t < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  // Create a transient pulsing circle at `center` which expands and fades
  const createPulse = (map: google.maps.Map, center: { lat: number; lng: number }, maxRadius = 80, duration = 800): Promise<void> => {
    return new Promise((resolve) => {
      const circle = new google.maps.Circle({
        strokeColor: '#1E90FF',
        strokeOpacity: 0.75,
        strokeWeight: 2,
        fillColor: '#1E90FF',
        fillOpacity: 0.45,
        center,
        radius: 8,
        map,
        zIndex: 100,
      });

      const startTime = performance.now();
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

      const step = (now: number) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = easeOut(t);

        const radius = 8 + (maxRadius - 8) * eased;
        const fillOpacity = 0.45 * (1 - eased);
        const strokeOpacity = 0.75 * (1 - eased);

        circle.setRadius(radius);
        circle.setOptions({ fillOpacity, strokeOpacity });

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          circle.setMap(null);
          resolve();
        }
      };

      requestAnimationFrame(step);
    });
  };

  const handleUserLocationClick = async () => {
    if (!map || !userLocation) return;

    const key = 'centering-msg';
    message.open({ key, type: 'loading', content: 'Centering on you...', duration: 0 });

    const mediumZoom = 15; // medium distance zoom level
    await smoothPanTo(map, userLocation, 700);
    smoothZoom(map, mediumZoom, 500);

    // show a pulse effect and then show success
    await createPulse(map, userLocation, 80, 900);

    message.open({ key, type: 'success', content: 'Centered', duration: 2 });
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-100">
        <div className="text-xl font-semibold text-gray-600">Loading Map...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-50">
      {/* Header Component */}
      <UserHeader 
        navigate={handleNavigate}
        handleLogout={handleLogout}
        username={username}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 w-full pt-2 pb-2 px-2 gap-2">
        <div className={`transition-all duration-300 w-[400px]`}>
          <MapControls 
            onDirectionsCalculated={(result) => setDirectionsResponse(result)}
            onClearRoute={() => {
              setDirectionsResponse(null);
              setSelectedRouteIndex(-1);
              setHighlightedRouteIndex(-1);
            }}
            onPanToLocation={(lat, lng) => setCenter({ lat, lng })}
            onRouteSelected={(index) => setSelectedRouteIndex(index)}
            selectedRouteIndex={selectedRouteIndex}
            highlightedIndex={highlightedRouteIndex}
            onHighlightRoute={(i) => setHighlightedRouteIndex(i)}
          />
        </div>

        <div className={`transition-all duration-300 ${panelVisible ? 'w-[400px]' : 'w-0 overflow-hidden'}`}>
          <BookingPanel
            visible={panelVisible}
            route={selectedRoute}
            onClose={() => setSelectedRouteIndex(-1)}
            onConfirm={(vehicle, passengers) => {
              console.log('Booking options', { vehicle, passengers, selectedRouteIndex });
              message.success('Options saved');
            }}
          />
        </div>

        <div className={`transition-all duration-300 flex-1`}>
          <MapArea 
            onLoad={(map) => setMap(map)}
            directionsResponse={directionsResponse}
            center={center} // Pass center here
            userLocation={userLocation}
            onUserLocationClick={handleUserLocationClick}
            selectedRouteIndex={selectedRouteIndex}
            highlightedRouteIndex={highlightedRouteIndex}
            onHighlightRoute={(i) => setHighlightedRouteIndex(i)}
            map={map}
          />
        </div>
      </div>
    </div>
  );
};

export default Maps;