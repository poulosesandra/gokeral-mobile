"use client";

import { Card, Skeleton, Button, message } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import MapArea from "../../map/MapArea";
import { authService } from "../../../services/authServices";
import api from "../../../services/api";

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

const getRoleFromToken = (): "DRIVER" | "USER" | null => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload?.role === "DRIVER" || payload?.role === "USER" ? payload.role : null;
  } catch (e) {
    return null;
  }
};

export type DriverData = {
  fullName: string;
  email: string;
  phoneNumber: string;
  driverLicenseNumber: string;
  address?: string;
  profileImage: string | null;
};

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
  type ActiveBooking = { _id?: string; id?: string; status?: string; rideOtp?: string; pickupDetails?: any; dropDetails?: any; pickupLocation?: string; dropoffLocation?: string; [k: string]: any } | null;

  const [activeBooking, setActiveBooking] = useState<ActiveBooking>(null);
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<"DRIVER" | "USER" | null>(null);
  const [showOtpPanel, setShowOtpPanel] = useState(false);

  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(-1);

  const manualToggleRef = useRef(false);
  const locationRequestRef = useRef(false);

  // Debug states
  const [lastFetchStatus, setLastFetchStatus] = useState<number | null>(null);
  const [lastFetchDataSnippet, setLastFetchDataSnippet] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null);

  const handleShareLocation = async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      message.error("Geolocation is not supported by your browser.");
      return;
    }
    if (locationRequestRef.current) return;
    locationRequestRef.current = true;
    setSharingLocation(true);
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          try {
            await authService.requestAndUpdateDriverLocation();
            message.success("Location updated successfully! You are now visible to customers.");
          } catch (err) {
            console.error("Failed to update location on backend:", err);
            message.error("Failed to sync location with server");
          } finally {
            locationRequestRef.current = false;
            setSharingLocation(false);
          }
        },
        (err) => {
          locationRequestRef.current = false;
          setSharingLocation(false);
          if (err.code === 1) message.error("Location permission denied. Please enable it in browser settings.");
          else message.error("Unable to get location: " + err.message);
        },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
      );
    } catch (e) {
      locationRequestRef.current = false;
      setSharingLocation(false);
      message.error("Failed to get location");
    }
  };

  useEffect(() => {
    setRole(getRoleFromToken());
  }, []);

  const extractBookingFromResponse = (data: any) => {
    if (!data) return null;
    let b = data.booking ?? data.data?.booking ?? data.data ?? data;
    while (b && b.booking) b = b.booking;
    if (!b) {
      if (Array.isArray(data.bookings) && data.bookings.length > 0) return data.bookings[0];
      return null;
    }
    if (Array.isArray(b)) return b[0] ?? null;
    if (b._id || b.id || b.status) return b;
    return null;
  };

  const fetchCurrent = useCallback(async () => {
    const url = role === "DRIVER" ? "/bookings/driver/current" : "/bookings/my-bookings/current";
    try {
      const res = await api.get(url);
      const data = res.data;
      setLastFetchStatus(res.status);
      setLastFetchTime(new Date().toLocaleTimeString());
      setLastFetchDataSnippet(data ? JSON.stringify(data).slice(0, 500) + (JSON.stringify(data).length > 500 ? "…" : "") : String(data));
      console.debug("[DriverHome] fetchCurrent", { url, status: res.status, data });

      if (res.status === 200) {
        const booking = extractBookingFromResponse(data);
        if (booking) {
          if (booking.status) booking.status = String(booking.status).toUpperCase();
          setActiveBooking(booking);
          if (role === "DRIVER" && ["ACCEPTED", "DRIVER_ARRIVED", "IN_PROGRESS"].includes(booking.status)) {
            setShowOtpPanel(true);
          }
          if (role === "USER" && booking.status === "ACCEPTED") {
            setShowOtpPanel(true);
            setTimeout(() => setShowOtpPanel(false), 4000);
          }
        } else {
          setActiveBooking(null);
          if (role === "DRIVER" && !manualToggleRef.current) setShowOtpPanel(false);
        }
      } else if (res.status === 404) {
        setActiveBooking(null);
        if (role === "DRIVER" && !manualToggleRef.current) setShowOtpPanel(false);
      } else {
        console.warn("[DriverHome] Unexpected response", res.status, data);
      }
    } catch (e) {
      console.error("[DriverHome] Failed to fetch current booking", e);
      setLastFetchDataSnippet(String(e).slice(0, 500));
    }
  }, [role]);

  useEffect(() => {
    let intervalId: number | undefined;
    if (role === "DRIVER" || role === "USER") {
      fetchCurrent();
      intervalId = window.setInterval(fetchCurrent, 1500);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [role, fetchCurrent]);

  const handleToggleOtp = () => {
    setShowOtpPanel((s) => {
      const next = !s;
      manualToggleRef.current = next;
      return next;
    });
  };

  // Compute route and show on map (uses Google DirectionsService)
  const computeAndShowRoute = async (origin: google.maps.LatLngLiteral | string, destination: google.maps.LatLngLiteral | string) => {
    if (!isLoaded || !(window as any).google) {
      console.warn("Google API not loaded");
      return;
    }
    try {
      const service = new google.maps.DirectionsService();
      const result: google.maps.DirectionsResult = await new Promise((resolve, reject) => {
        service.route(
          {
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true,
          },
          (res, status) => {
            if (status === "OK" && res) resolve(res as google.maps.DirectionsResult);
            else reject(status);
          }
        );
      });
      setDirectionsResponse(result);
      setSelectedRouteIndex(0);
    } catch (e) {
      console.error("Failed to compute route", e);
    }
  };

  const handleStartRide = async () => {
    if (!otp) {
      message.warning("Enter OTP first");
      return;
    }
    if (!activeBooking || !activeBooking._id) {
      message.warning("No active booking to start. Refresh or check assignment.");
      return;
    }

    try {
      const res = await api.post(`/bookings/${activeBooking._id}/verify-otp`, { otp });
      const data = res.data;
      if (res.status === 200) {
        message.success("Ride started successfully");
        // update local booking state and refresh
        const bookingFromResponse = extractBookingFromResponse(data?.booking ?? data) || activeBooking;
        setActiveBooking((prev) => (prev ? { ...prev, status: "IN_PROGRESS" } : prev));
        setOtp("");
        setShowOtpPanel(false);
        manualToggleRef.current = false;
        await fetchCurrent();

        // compute & display route if we have pickup/drop info
        const origin =
          bookingFromResponse?.pickupDetails && bookingFromResponse.pickupDetails.latitude && bookingFromResponse.pickupDetails.longitude
            ? { lat: Number(bookingFromResponse.pickupDetails.latitude), lng: Number(bookingFromResponse.pickupDetails.longitude) }
            : bookingFromResponse?.pickupLocation || null;

        const destination =
          bookingFromResponse?.dropDetails && bookingFromResponse.dropDetails.latitude && bookingFromResponse.dropDetails.longitude
            ? { lat: Number(bookingFromResponse.dropDetails.latitude), lng: Number(bookingFromResponse.dropDetails.longitude) }
            : bookingFromResponse?.dropoffLocation || null;

        if (origin && destination) {
          await computeAndShowRoute(origin as any, destination as any);
          // center will be set by MapArea when selectedRouteIndex >= 0
        } else {
          console.warn("Insufficient pickup/drop info to compute route");
        }
      } else {
        message.error(data?.message || "Invalid OTP");
      }
    } catch (e) {
      console.error("[DriverHome] verify OTP failed", e);
      message.error("Failed to verify OTP");
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card className="shadow-md rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Your Location</h3>
          <div className="flex space-x-2">
            <Button type="primary" loading={sharingLocation} onClick={handleShareLocation} disabled={sharingLocation}>
              {driverLocation ? "🔄 Update Location" : "📍 Share Location"}
            </Button>
            {role === "DRIVER" && <Button onClick={handleToggleOtp}>{showOtpPanel ? "Hide OTP" : "Open OTP"}</Button>}
            {role === "USER" && (
              <Button onClick={() => setShowOtpPanel((s) => !s)} disabled={!activeBooking || activeBooking.status !== "ACCEPTED"}>
                {showOtpPanel ? "Hide OTP" : "Show OTP"}
              </Button>
            )}
          </div>
        </div>

        {isLoaded ? (
          driverLocation ? (
            <div style={{ width: "100%", height: 320 }}>
              <MapArea
                onLoad={(m) => setMap(m)}
                directionsResponse={directionsResponse}
                center={driverLocation}
                userLocation={driverLocation}
                selectedRouteIndex={selectedRouteIndex}
                highlightedRouteIndex={-1}
                onUserLocationClick={() => {
                  if (map && driverLocation) {
                    map.panTo(driverLocation);
                    map.setZoom(15);
                  }
                }}
                map={map}
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

      {role === "DRIVER" && showOtpPanel && (
        <Card className="shadow-md rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold mb-1">Enter OTP to Start Ride</h3>
              <div className="text-sm text-gray-500">
                {activeBooking ? `Current status: ${activeBooking.status ?? "N/A"}` : "No active booking. Type the OTP after asking the passenger."}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => fetchCurrent()}>Refresh Now</Button>
            </div>
          </div>

          <div className="flex space-x-2">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleStartRide(); }}
              className="flex-1 p-2 border rounded"
              placeholder="Enter OTP provided by passenger"
            />
            <Button type="primary" onClick={handleStartRide} disabled={!otp}>
              Start Ride
            </Button>
          </div>

          <div className="mt-3 text-xs text-gray-600">
            <div><strong>Debug:</strong></div>
            <div>Last fetch status: {lastFetchStatus ?? "-"}</div>
            <div>Last fetch time: {lastFetchTime ?? "-"}</div>
            <div style={{ marginTop: 6, whiteSpace: "pre-wrap", maxHeight: 120, overflow: "auto", background: "#f7f7f7", padding: 8, borderRadius: 6 }}>
              {lastFetchDataSnippet ?? "No response yet"}
            </div>
            <div className="mt-2 text-xxs text-gray-400">If booking still doesn't show, click <em>Refresh Now</em> and paste the debug text here.</div>
          </div>
        </Card>
      )}

      {role === "USER" && showOtpPanel && activeBooking && activeBooking.status === "ACCEPTED" && (
        <Card className="shadow-md rounded-2xl">
          <h3 className="text-lg font-semibold mb-4">Your Ride OTP</h3>
          <div className="text-2xl font-bold">{activeBooking.rideOtp ?? "—"}</div>
        </Card>
      )}
    </div>
  );
};