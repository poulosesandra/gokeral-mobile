import React from 'react';
import { GoogleMap, DirectionsRenderer, OverlayView, Polyline } from '@react-google-maps/api';

interface MapAreaProps {
  onLoad: (map: google.maps.Map) => void;
  directionsResponse: google.maps.DirectionsResult | null;
  center: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  onUserLocationClick?: () => void;
  selectedRouteIndex?: number;
  onRouteClick?: (index: number) => void;
  map?: google.maps.Map | null;
}

const MapArea: React.FC<MapAreaProps> = ({ onLoad, directionsResponse, center, userLocation, onUserLocationClick, selectedRouteIndex = 0, onRouteClick, map }) => {
  const [highlightPulse, setHighlightPulse] = React.useState(false);
  const [hoveredRouteIndex, setHoveredRouteIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    // brief highlight when selection changes
    setHighlightPulse(true);
    const t = setTimeout(() => setHighlightPulse(false), 420);
    return () => clearTimeout(t);
  }, [selectedRouteIndex]);

  React.useEffect(() => {
    // Fit the map to the selected route so it's clearly visible
    if (!map || !directionsResponse) return;
    const route = directionsResponse.routes[selectedRouteIndex];
    if (!route) return;

    const bounds = new google.maps.LatLngBounds();

    if (route.overview_path && route.overview_path.length) {
      route.overview_path.forEach((p) => bounds.extend(p));
    } else {
      // fallback to leg endpoints
      route.legs.forEach((leg) => {
        bounds.extend(leg.start_location);
        bounds.extend(leg.end_location);
      });
    }

    // Fit bounds to selected route
    map.fitBounds(bounds);
  }, [map, directionsResponse, selectedRouteIndex]);

  // Helper to derive a LatLngLiteral[] path from a route (handles LatLng or LatLngLiteral)
  const derivePathFromRoute = (route: google.maps.DirectionsRoute) => {
    if (route.overview_path && route.overview_path.length) {
      return route.overview_path.map((p) => (typeof (p as any).lat === 'function' ? { lat: (p as any).lat(), lng: (p as any).lng() } : (p as any)));
    }

    const pts: google.maps.LatLngLiteral[] = [];
    route.legs.forEach((leg) => {
      // normalize start location to LatLngLiteral
      const start = leg.start_location as any;
      pts.push({ lat: typeof start.lat === 'function' ? start.lat() : start.lat, lng: typeof start.lng === 'function' ? start.lng() : start.lng });

      leg.steps?.forEach((step) => {
        if (step.path && step.path.length) {
          step.path.forEach((p) => pts.push(typeof (p as any).lat === 'function' ? { lat: (p as any).lat(), lng: (p as any).lng() } : (p as any)));
        }
      });

      const end = leg.end_location as any;
      pts.push({ lat: typeof end.lat === 'function' ? end.lat() : end.lat, lng: typeof end.lng === 'function' ? end.lng() : end.lng });
    });

    return pts;
  };

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

        {/* Render selected route by DirectionsRenderer so only it is highlighted */}
        {directionsResponse && (
          <DirectionsRenderer
            directions={directionsResponse}
            routeIndex={selectedRouteIndex}
            options={{
              preserveViewport: true,
              polylineOptions: {
                strokeColor: '#1E90FF',
                strokeWeight: highlightPulse ? 5 : 5,
                strokeOpacity: 1.0,
                zIndex: 50,
              },
              suppressMarkers: true, // we render our own start/end markers
            }}
          />
        )}

        {/* Render other alternative routes as dimmed clickable polylines */}
        {directionsResponse && directionsResponse.routes.map((route, index) => {
          if (index === selectedRouteIndex) return null;
          const isHovered = hoveredRouteIndex === index;

          return (
            <Polyline
              key={index}
              path={derivePathFromRoute(route)}
              options={{
                strokeColor: '#E5E7EB',
                strokeOpacity: isHovered ? 0.35 : 0.06,
                strokeWeight: isHovered ? 6 : 2,
                zIndex: isHovered ? 10 : 1,
                clickable: true,
              }}
              onClick={() => onRouteClick && onRouteClick(index)}
              onMouseOver={() => setHoveredRouteIndex(index)}
              onMouseOut={() => setHoveredRouteIndex(null)}
            />
          );
        })}

        {/* If this is the selected route render start/end markers as OverlayView */}
        {directionsResponse && directionsResponse.routes[selectedRouteIndex] && directionsResponse.routes[selectedRouteIndex].legs[0] && (
          <>
            <OverlayView position={directionsResponse.routes[selectedRouteIndex].legs[0].start_location} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <div style={{ transform: `translate(-50%, -50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(30,144,255,0.08)',
                  boxShadow: `0 0 ${highlightPulse ? 16 : 8}px rgba(30,144,255,0.35)`,
                  transform: `scale(${highlightPulse ? 1.25 : 1})`,
                  transition: 'transform 220ms ease-out, box-shadow 220ms ease-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 120,
                }} />

                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', border: '3px solid #1E90FF', boxShadow: '0 0 10px rgba(30,144,255,0.8)', position: 'absolute' }} />
              </div>
            </OverlayView>

            <OverlayView position={directionsResponse.routes[selectedRouteIndex].legs[0].end_location} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <div style={{ transform: `translate(-50%, -50%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'rgba(30,144,255,0.08)',
                  boxShadow: `0 0 ${highlightPulse ? 16 : 8}px rgba(30,144,255,0.35)`,
                  transform: `scale(${highlightPulse ? 1.25 : 1})`,
                  transition: 'transform 220ms ease-out, box-shadow 220ms ease-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 120,
                }} />

                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', border: '3px solid #1E90FF', boxShadow: '0 0 10px rgba(30,144,255,0.8)', position: 'absolute' }} />
              </div>
            </OverlayView>
          </>
        )}
      </GoogleMap>
    </div>
  );
};

export default MapArea;