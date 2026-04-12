import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Spin, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import {
  DirectionsRenderer,
  GoogleMap,
  MarkerF,
  useJsApiLoader,
} from '@react-google-maps/api';

type LatLng = { lat: number; lng: number };

interface DriverRideNavigatorCardProps {
  booking: any;
  driverCoords: LatLng | null;
  onRefreshLocation?: () => Promise<void> | void;
  refreshing?: boolean;
}

const mapLibraries: ('places')[] = ['places'];

const parseLatLng = (latRaw: unknown, lngRaw: unknown): LatLng | null => {
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const getCoords = (input: any): LatLng | null => {
  if (!input) return null;

  if (Array.isArray(input) && input.length >= 2) {
    return parseLatLng(input[1], input[0]);
  }

  if (Array.isArray(input?.coordinates) && input.coordinates.length >= 2) {
    return parseLatLng(input.coordinates[1], input.coordinates[0]);
  }

  return (
    parseLatLng(input?.lat, input?.lng) ||
    parseLatLng(input?.latitude, input?.longitude)
  );
};

const getStatusColor = (status?: string) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'IN_PROGRESS') return 'processing';
  if (normalized === 'DRIVER_ARRIVED') return 'orange';
  if (normalized === 'ACCEPTED') return 'cyan';
  if (normalized === 'COMPLETED') return 'success';
  return 'default';
};

const DriverRideNavigatorCard: React.FC<DriverRideNavigatorCardProps> = ({
  booking,
  driverCoords,
  onRefreshLocation,
  refreshing = false,
}) => {
  const rideStatus = String(booking?.status || '').toUpperCase();
  const pickup = useMemo(
    () =>
      getCoords(booking?.origin?.coordinates) ||
      getCoords({
        lat: booking?.pickupDetails?.latitude,
        lng: booking?.pickupDetails?.longitude,
      }),
    [booking],
  );

  const destination = useMemo(
    () =>
      getCoords(booking?.destination?.coordinates) ||
      getCoords({
        lat: booking?.dropDetails?.latitude,
        lng: booking?.dropDetails?.longitude,
      }),
    [booking],
  );

  const routeTarget =
    rideStatus === 'IN_PROGRESS'
      ? destination
      : rideStatus === 'ACCEPTED' || rideStatus === 'DRIVER_ARRIVED'
        ? pickup
        : destination;

  const routeLabel =
    rideStatus === 'IN_PROGRESS'
      ? 'To drop location'
      : 'To pickup location';

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE',
    libraries: mapLibraries,
  });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    const computeRoute = async () => {
      if (!isLoaded || !driverCoords || !routeTarget || !(window as any)?.google) {
        setDirections(null);
        return;
      }

      try {
        const service = new google.maps.DirectionsService();
        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          service.route(
            {
              origin: driverCoords,
              destination: routeTarget,
              travelMode: google.maps.TravelMode.DRIVING,
              provideRouteAlternatives: false,
            },
            (res, status) => {
              if (status === 'OK' && res) resolve(res);
              else reject(new Error(String(status)));
            },
          );
        });

        if (!cancelled) {
          setDirections(result);
        }
      } catch {
        if (!cancelled) {
          setDirections(null);
        }
      }
    };

    void computeRoute();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, driverCoords?.lat, driverCoords?.lng, routeTarget?.lat, routeTarget?.lng]);

  const center = driverCoords || routeTarget || pickup || destination || { lat: 9.9312, lng: 76.2673 };

  return (
    <Card size="small" className="bg-gray-50 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-700 text-sm font-semibold">Driver Navigation</p>
        <div className="flex items-center gap-2">
          <Tag color={getStatusColor(rideStatus)}>{rideStatus || 'UNKNOWN'}</Tag>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => void onRefreshLocation?.()}
            loading={refreshing}
          >
            Refresh
          </Button>
        </div>
      </div>

      {!isLoaded ? (
        <div className="h-56 flex items-center justify-center">
          <Spin size="small" />
        </div>
      ) : !driverCoords ? (
        <Empty description="Enable GPS to start navigation" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : !routeTarget ? (
        <Empty description="Route coordinates unavailable" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
          <GoogleMap
            center={center}
            zoom={14}
            mapContainerStyle={{ width: '100%', height: '100%' }}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            {pickup && <MarkerF position={pickup} label="P" />}
            {destination && <MarkerF position={destination} label="D" />}
            {driverCoords && <MarkerF position={driverCoords} label="🚕" />}

            {directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true,
                  preserveViewport: false,
                  polylineOptions: {
                    strokeColor: '#2563EB',
                    strokeWeight: 5,
                    strokeOpacity: 0.9,
                  },
                }}
              />
            )}
          </GoogleMap>
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500">
        {driverCoords
          ? `${routeLabel}. Location updates are sent while ride is IN_PROGRESS.`
          : 'Share location from your browser to begin live navigation.'}
      </div>
    </Card>
  );
};

export default DriverRideNavigatorCard;
