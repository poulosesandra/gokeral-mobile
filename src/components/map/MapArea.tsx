import React from 'react';
import { GoogleMap, DirectionsRenderer, OverlayView, Polyline } from '@react-google-maps/api';

interface MapAreaProps {
  onLoad: (map: google.maps.Map) => void;
  directionsResponse: google.maps.DirectionsResult | null;
  center: { lat: number; lng: number };
  userLocation?: { lat: number; lng: number } | null;
  onUserLocationClick?: () => void;
  selectedRouteIndex?: number; // confirmed index
  highlightedRouteIndex?: number; // transient highlight
  onHighlightRoute?: (index: number) => void; // highlight handler
  map?: google.maps.Map | null;
}

const MapArea: React.FC<MapAreaProps> = ({ onLoad, directionsResponse, center, userLocation, onUserLocationClick, selectedRouteIndex = -1, highlightedRouteIndex, onHighlightRoute, map }) => {
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
    if (typeof selectedRouteIndex !== 'number' || selectedRouteIndex < 0) return;
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
      return route.overview_path.map((p) => {
        const cand = p as unknown;
        if (typeof (cand as google.maps.LatLng).lat === 'function') {
          const ll = cand as google.maps.LatLng;
          return { lat: ll.lat(), lng: ll.lng() } as google.maps.LatLngLiteral;
        }
        return cand as google.maps.LatLngLiteral;
      });
    }

    const pts: google.maps.LatLngLiteral[] = [];
    route.legs.forEach((leg) => {
      // normalize start location to LatLngLiteral
      const start = leg.start_location as unknown;
      if (typeof (start as google.maps.LatLng).lat === 'function') {
        const s = start as google.maps.LatLng;
        pts.push({ lat: s.lat(), lng: s.lng() });
      } else {
        const s = start as google.maps.LatLngLiteral;
        pts.push({ lat: s.lat, lng: s.lng });
      }

      leg.steps?.forEach((step) => {
        if (step.path && step.path.length) {
          step.path.forEach((p) => {
            const cand = p as unknown;
            if (typeof (cand as google.maps.LatLng).lat === 'function') {
              const ll = cand as google.maps.LatLng;
              pts.push({ lat: ll.lat(), lng: ll.lng() });
            } else {
              pts.push(cand as google.maps.LatLngLiteral);
            }
          });
        }
      });

      const end = leg.end_location as unknown;
      if (typeof (end as google.maps.LatLng).lat === 'function') {
        const e = end as google.maps.LatLng;
        pts.push({ lat: e.lat(), lng: e.lng() });
      } else {
        const e = end as google.maps.LatLngLiteral;
        pts.push({ lat: e.lat, lng: e.lng });
      }
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
        {directionsResponse && typeof selectedRouteIndex === 'number' && selectedRouteIndex >= 0 && (
          <DirectionsRenderer
            directions={directionsResponse}
            routeIndex={selectedRouteIndex}
            options={{
              preserveViewport: true,
              polylineOptions: {
                strokeColor: '#1E90FF',
                strokeWeight: highlightPulse ? 6 : 5,
                strokeOpacity: 1.0,
                zIndex: 60,
              },
              suppressMarkers: true, // we render our own start/end markers
            }}
          />
        )}

        {/* If there's no confirmed selection, render the transient highlighted route with a slightly lighter blue */}
        {directionsResponse && (typeof selectedRouteIndex !== 'number' || selectedRouteIndex < 0) && typeof highlightedRouteIndex === 'number' && highlightedRouteIndex >= 0 && (
          <DirectionsRenderer
            directions={directionsResponse}
            routeIndex={highlightedRouteIndex}
            options={{
              preserveViewport: true,
              polylineOptions: {
                strokeColor: '#60A5FA',
                strokeWeight: 5,
                strokeOpacity: 0.95,
                zIndex: 50,
              },
              suppressMarkers: true,
            }}
          />
        )}

        {/* Render other alternative routes as dimmed clickable polylines */}
        {directionsResponse && directionsResponse.routes.map((route, index) => {
          // do not render as dimmed polyline if this is the confirmed selected route, or the transient highlighted route (they are rendered via DirectionsRenderer)
          if (index === selectedRouteIndex || (typeof highlightedRouteIndex === 'number' && index === highlightedRouteIndex)) return null;
          const isHovered = hoveredRouteIndex === index;

          return (
            <Polyline
              key={index}
              path={derivePathFromRoute(route)}
              options={{
                strokeColor: '#E5E7EB',
                strokeOpacity: isHovered ? 0.35 : 0.08,
                strokeWeight: isHovered ? 6 : 2,
                zIndex: isHovered ? 10 : 1,
                clickable: true,
              }}
              onClick={() => onHighlightRoute && onHighlightRoute(index)}
              onMouseOver={() => setHoveredRouteIndex(index)}
              onMouseOut={() => setHoveredRouteIndex(null)}
            />
          );
        })}

        {/* If this is the selected route render start/end markers as OverlayView */}
        {(() => {
          const sel = (directionsResponse && typeof selectedRouteIndex === 'number' && selectedRouteIndex >= 0) ? directionsResponse.routes[selectedRouteIndex] : undefined;
          if (!sel || !sel.legs || !sel.legs[0]) return null;

          return (
            <>
              <OverlayView position={sel.legs[0].start_location} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
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

              <OverlayView position={sel.legs[0].end_location} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
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
          );
        })()}
      </GoogleMap>
    </div>
  );
};

export default MapArea;