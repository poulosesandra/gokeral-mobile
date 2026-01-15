"use client";

import { Card, Skeleton, message, Button } from "antd";

import { useEffect, useState, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import MapArea from '../../map/MapArea';
import { authService } from '../../../services/authServices';

// Define libraries outside component to prevent recreation on each render
const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

export type DriverData = {
  fullName: string;
  email: string;
  phoneNumber: string;
  driverLicenseNumber: string;
  address?: string;
  profileImage: string | null;
  personalInfo?: {
    bloodGroup?: string;
    dob?: string;
    languages?: string[];
    certificates?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
};

export type BookingStatus = "Completed" | "Upcoming" | "Cancelled";

interface DriverHomeTabProps {
  driverData: DriverData;
  loading: boolean;
  onEditPersonalInfo: () => void;
}

export const DriverHomeTab = (_props: DriverHomeTabProps) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [sharingLocation, setSharingLocation] = useState(false);
  const locationRequestRef = useRef(false);
  const locationFetchedRef = useRef(false);

  const handleShareLocation = async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      message.error('Geolocation is not supported by your browser.');
      return;
    }

    setSharingLocation(true);
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setDriverLocation({ lat, lng });

          try {
            await authService.requestAndUpdateDriverLocation();
            message.success('Location updated successfully! You are now visible to customers.');
          } catch (error) {
            console.error('Failed to update location on backend:', error);
            message.error('Failed to sync location with server');
          }
          setSharingLocation(false);
        },
        (err) => {
          setSharingLocation(false);
          if (err.code === 1) {
            message.error('Location permission denied. Please enable it in browser settings.');
          } else {
            message.error('Unable to get location: ' + err.message);
          }
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
      );
    } catch (error) {
      setSharingLocation(false);
      message.error('Failed to get location');
    }
  };

  useEffect(() => {
    // Don't request geolocation on profile load
    // Driver will share location only when going online to accept rides
    locationFetchedRef.current = true;
  }, []);

  return (
    <div className="w-full space-y-6">

      {/* DRIVER LOCATION MAP */}
      <Card className="shadow-md rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Your Location</h3>
          <Button
            type="primary"
            loading={sharingLocation}
            onClick={handleShareLocation}
            disabled={sharingLocation}
          >
            {driverLocation ? '🔄 Update Location' : '📍 Share Location'}
          </Button>
        </div>
        {isLoaded ? (
          driverLocation ? (
            <div style={{ width: '100%', height: 320 }}>
              <MapArea
                onLoad={(m) => setMap(m)}
                directionsResponse={null}
                center={driverLocation}
                userLocation={driverLocation}
                selectedRouteIndex={-1}
                highlightedRouteIndex={-1}
                onUserLocationClick={() => {
                  if (map && driverLocation) {
                    map.panTo(driverLocation);
                    map.setZoom(15);
                  }
                }}
              />
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-sm text-gray-500">
              Click "Share Location" to show your location on the map and start receiving ride requests
            </div>
          )
        ) : (
          <div className="h-40 flex items-center justify-center">
            <Skeleton active paragraph={{ rows: 4 }} />
          </div>
        )}
      </Card>



    </div>
  );
};
