"use client";

import { Card, Skeleton, message, Button } from "antd";

import React, { useEffect, useState, useRef } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import MapArea from '../../map/MapArea';

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

export const DriverHomeTab = ({ driverData, loading, onEditPersonalInfo }: DriverHomeTabProps) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const locationRequestRef = useRef(false);
  const locationFetchedRef = useRef(false);

  useEffect(() => {
    // ✅ Prevent duplicate geolocation requests using a ref flag
    if (locationRequestRef.current) {
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      message.info('Geolocation is not supported by your browser.');
      return;
    }

    locationRequestRef.current = true;

    const allow = window.confirm('Allow Kerides to access your location to show it on your profile?');
    if (!allow) {
      message.info('Location access was not granted. You can enable it in browser settings.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        locationFetchedRef.current = true;
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          message.error('Location permission denied. Enable location in browser settings to show it here.');
        } else {
          message.error('Unable to get location: ' + err.message);
        }
        locationFetchedRef.current = true;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  return (
    <div className="w-full space-y-6">

      {/* DRIVER LOCATION MAP */}
      <Card className="shadow-md rounded-2xl">
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
              Location not available
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
