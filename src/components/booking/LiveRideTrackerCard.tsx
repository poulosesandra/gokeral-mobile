import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Spin, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useJsApiLoader, GoogleMap, MarkerF, Polyline } from '@react-google-maps/api';
import bookingService from '../../services/bookingService';

const mapLibraries: ("places")[] = ['places'];

type LatLng = { lat: number; lng: number };

interface LiveRideTrackerCardProps {
  booking: any;
}

const ACTIVE_STATUSES = new Set(['ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS']);

const statusColor = (status?: string) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'IN_PROGRESS') return 'processing';
  if (normalized === 'DRIVER_ARRIVED') return 'orange';
  if (normalized === 'ACCEPTED') return 'cyan';
  if (normalized === 'COMPLETED') return 'success';
  if (normalized === 'CANCELLED') return 'error';
  return 'default';
};

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

const distanceKm = (from: LatLng, to: LatLng): number => {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const LiveRideTrackerCard: React.FC<LiveRideTrackerCardProps> = ({ booking }) => {
  const bookingId = booking?._id || booking?.id;
  const initialStatus = String(booking?.status || '').toUpperCase();
  const isTrackable = ACTIVE_STATUSES.has(initialStatus);

  const pickup = useMemo(
    () =>
      getCoords(booking?.origin?.coordinates) ||
      getCoords({ lat: booking?.pickupDetails?.latitude, lng: booking?.pickupDetails?.longitude }),
    [booking],
  );

  const destination = useMemo(
    () =>
      getCoords(booking?.destination?.coordinates) ||
      getCoords({ lat: booking?.dropDetails?.latitude, lng: booking?.dropDetails?.longitude }),
    [booking],
  );

  const [rideStatus, setRideStatus] = useState(initialStatus || 'UNKNOWN');
  const [driverCoords, setDriverCoords] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY_HERE',
    libraries: mapLibraries,
  });

  useEffect(() => {
    setRideStatus(initialStatus || 'UNKNOWN');
  }, [initialStatus]);

  const fetchLocation = async () => {
    if (!bookingId || !isTrackable) return;

    try {
      setLoading(true);
      const response = await bookingService.getRideLocation(String(bookingId));

      const status = String(response?.status || booking?.status || '').toUpperCase();
      if (status) setRideStatus(status);

      const coords = getCoords(response?.location?.coordinates);
      setDriverCoords(coords);
    } catch {
      setDriverCoords(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLocation();
  }, [bookingId, isTrackable, booking?.status]);

  useEffect(() => {
    if (!bookingId || !isTrackable) return;

    const interval = window.setInterval(() => {
      void fetchLocation();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [bookingId, isTrackable, booking?.status]);

  if (!isTrackable) {
    return null;
  }

  const center = driverCoords || pickup || destination || { lat: 9.9312, lng: 76.2673 };
  const remainingDistanceKm =
    driverCoords && destination ? distanceKm(driverCoords, destination) : null;

  return (
    <Card size="small" className="bg-gray-50 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-700 text-sm font-semibold">Live Ride Tracking</p>
        <div className="flex items-center gap-2">
          <Tag color={statusColor(rideStatus)}>{rideStatus || 'UNKNOWN'}</Tag>
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => void fetchLocation()}
            loading={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {!isLoaded ? (
        <div className="h-52 flex items-center justify-center">
          <Spin size="small" />
        </div>
      ) : !pickup && !destination ? (
        <Empty description="Route coordinates unavailable" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className="h-56 rounded-lg overflow-hidden border border-gray-200">
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

            {pickup && destination && (
              <Polyline
                path={[pickup, destination]}
                options={{
                  strokeColor: '#60A5FA',
                  strokeOpacity: 0.8,
                  strokeWeight: 4,
                }}
              />
            )}
          </GoogleMap>
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500">
        {loading ? 'Refreshing location…' : driverCoords ? 'Driver location is live.' : 'Waiting for driver location updates.'}
      </div>
      {remainingDistanceKm !== null && (
        <div className="mt-1 text-xs text-blue-600 font-medium">
          Remaining distance: {remainingDistanceKm.toFixed(2)} km
        </div>
      )}
    </Card>
  );
};

export default LiveRideTrackerCard;
