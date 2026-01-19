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
  type ActiveBooking = {
    _id: string;
    status: string;
    rideOtp?: string;
    // Add other properties as needed
  } | null;
  
  const [activeBooking, setActiveBooking] = useState<ActiveBooking>(null);
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<'DRIVER' | 'USER' | null>(null);
  const [showOtpPanel, setShowOtpPanel] = useState(false);
  const locationRequestRef = useRef(false);
  const locationFetchedRef = useRef(false);
  
  const getRoleFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(window.atob(token.split('.')[1]));
      return payload.role as 'DRIVER' | 'USER' | null;
    } catch {
      return null;
    }
  };
  
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

  useEffect(() => {
    setRole(getRoleFromToken());
  }, []);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    let intervalId: number | undefined;

    const fetchCurrent = async () => {
      try {
        const url = role === 'DRIVER' ? '/bookings/driver/current' : '/bookings/my-bookings/current';
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          setActiveBooking(data || null);
          // auto-show OTP for user when accepted briefly
          if (role === 'USER' && data?.status === 'ACCEPTED') {
            setShowOtpPanel(true);
            setTimeout(() => setShowOtpPanel(false), 4000);
          }
        } else if (res.status === 404) {
          setActiveBooking(null);
        }
      } catch (e) {
        console.error('Failed to fetch current booking', e);
      }
    };

    if (role === 'USER') {
      fetchCurrent();
      intervalId = window.setInterval(fetchCurrent, 2000);
    } else if (role === 'DRIVER') {
      fetchCurrent();
    }

    return () => { if (intervalId) clearInterval(intervalId); };
  }, [role]);

  const handleOtpSubmit = async () => {
    if (!activeBooking) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/bookings/${activeBooking._id}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (res.ok) {
        message.success('OTP verified, ride started');
        setShowOtpPanel(false);
        // refetch current booking to update UI
        // (simple approach: set activeBooking.status to 'IN_PROGRESS' locally if required)
      } else {
        message.error(data.message || 'Invalid OTP');
      }
    } catch (e) {
      console.error(e);
      message.error('Failed to verify OTP');
    }
  };

  return (
    <div className="w-full space-y-6">

      {/* DRIVER LOCATION MAP */}
      <Card className="shadow-md rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Your Location</h3>
          <div className="flex space-x-2">
            <Button
              type="primary"
              loading={sharingLocation}
              onClick={handleShareLocation}
              disabled={sharingLocation}
            >
              {driverLocation ? '🔄 Update Location' : '📍 Share Location'}
            </Button>
            {role === 'DRIVER' && (
              <Button onClick={() => setShowOtpPanel(s => !s)}>
                {showOtpPanel ? 'Hide OTP' : 'Open OTP'}
              </Button>
            )}
            {role === 'USER' && (
              <Button
                onClick={() => setShowOtpPanel(s => !s)}
                disabled={!activeBooking || activeBooking.status !== 'ACCEPTED'}
              >
                {showOtpPanel ? 'Hide OTP' : 'Show OTP'}
              </Button>
            )}
          </div>
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

      {/* OTP UI */}
      {/* Driver: provide panel when toggled and status DRIVER_ARRIVED */}
      {role === 'DRIVER' && showOtpPanel && (
        <Card className="shadow-md rounded-2xl">
          <h3 className="text-lg font-semibold mb-4">Enter OTP to Start Ride</h3>
          {activeBooking?.status !== 'DRIVER_ARRIVED' ? (
            <div className="text-sm text-gray-500">OTP can be entered after marking "Arrived". Current status: {activeBooking?.status ?? 'N/A'}</div>
          ) : (
            <div className="flex space-x-2">
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="flex-1 p-2 border rounded"
                placeholder="Enter OTP"
              />
              <Button
                type="primary"
                onClick={handleOtpSubmit}
                disabled={!otp}
              >
                Start Ride
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* User: show OTP when toggled and booking accepted */}
      {role === 'USER' && showOtpPanel && activeBooking && activeBooking.status === 'ACCEPTED' && (
        <Card className="shadow-md rounded-2xl">
          <h3 className="text-lg font-semibold mb-4">Your Ride OTP</h3>
          <div className="text-2xl font-bold">{activeBooking.rideOtp ?? '—'}</div>
        </Card>
      )}
 
    </div>
  );
};
