"use client";

import { Card, Skeleton, Button, message } from "antd";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import MapArea from "../../map/MapArea";
import { authService } from "../../../services/authServices";
import { bookingApi } from "../../../services/api";

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

const getRoleFromToken = (): "DRIVER" | "USER" | null => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload?.role === "DRIVER" || payload?.role === "USER" ? payload.role : null;
  } catch {
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

export const DriverHomeTab: FC<DriverHomeTabProps> = () => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [sharingLocation, setSharingLocation] = useState(false);
  type ActiveBooking = { _id?: string; id?: string; status?: string; rideOtp?: string; pickupDetails?: Record<string, unknown>; dropDetails?: Record<string, unknown>; pickupLocation?: string; dropoffLocation?: string; [k: string]: unknown } | null;

  const [activeBooking, setActiveBooking] = useState<ActiveBooking>(null);
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<"DRIVER" | "USER" | null>(null);
  const [showOtpPanel, setShowOtpPanel] = useState(false);
  const [findingByOtp, setFindingByOtp] = useState(false);
  // bookingCandidate removed — it was assigned but never read
  const [arriving, setArriving] = useState(false);
  const [startingRide, setStartingRide] = useState(false);

  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(-1);

  const manualToggleRef = useRef(false);
  const locationRequestRef = useRef(false);

  const [lastOtpError, setLastOtpError] = useState<string | null>(null);

  const extractApiErrorMessage = (err: unknown, fallback: string): string => {
    const obj = err as Record<string, unknown>;
    const response = obj?.response as Record<string, unknown> | undefined;
    const data = response?.data as Record<string, unknown> | string | undefined;

    if (typeof data === 'string' && data.trim()) {
      return data;
    }

    if (data && typeof data === 'object') {
      const messageField = data.message;
      if (Array.isArray(messageField)) {
        const joined = messageField.map((m) => String(m)).join(', ').trim();
        if (joined) return joined;
      }
      if (typeof messageField === 'string' && messageField.trim()) {
        return messageField;
      }
      if (typeof data.error === 'string' && data.error.trim()) {
        return data.error;
      }
    }

    if (typeof obj?.message === 'string' && obj.message.trim()) {
      return obj.message;
    }

    return fallback;
  };

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
    } catch {
      locationRequestRef.current = false;
      setSharingLocation(false);
      message.error("Failed to get location");
    }
  };

  useEffect(() => {
    setRole(getRoleFromToken());
  }, []);

  const extractBookingFromResponse = useCallback((data: unknown): ActiveBooking => {
    if (!data) return null;
    const unwrap = (d: unknown): unknown => {
      if (!d || typeof d !== "object") return d;
      const obj = d as Record<string, unknown>;
      if ("booking" in obj) return unwrap(obj.booking);
      if ("data" in obj) return unwrap(obj.data);
      return d;
    };
    const b = unwrap(data);
    if (!b) {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj?.bookings) && obj.bookings.length > 0) return obj.bookings[0] as ActiveBooking;
      return null;
    }
    if (Array.isArray(b)) return (b[0] ?? null) as ActiveBooking;
    const o = b as Record<string, unknown>;
    if (o["_id"] || o["id"] || o["status"]) return o as ActiveBooking;
    return null;
  }, []);

  const fetchCurrent = useCallback(async () => {
    try {
      const url = role === "DRIVER" ? "/bookings/driver/my-bookings" : "/bookings/my-bookings";
      const res = await bookingApi.get(url);
      const data = res.data;

      if (res.status === 200) {
        const bookings = Array.isArray(data?.bookings) ? data.bookings : Array.isArray(data) ? data : [];
        const activeStatuses = ["ACCEPTED", "DRIVER_ARRIVED", "IN_PROGRESS"];
        const current = bookings.find((b: any) => activeStatuses.includes(String(b?.status || "").toUpperCase())) || null;
        const booking = current ? extractBookingFromResponse(current) : null;
        if (booking) {
          if (booking.status) booking.status = String(booking.status).toUpperCase();
          setActiveBooking(booking);
          if (role === "DRIVER" && ["ACCEPTED", "DRIVER_ARRIVED"].includes(booking.status ?? '')) {
            setShowOtpPanel(true);
          } else if (role === 'DRIVER' && booking.status === 'IN_PROGRESS' && !manualToggleRef.current) {
            setShowOtpPanel(false);
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
    } catch (err: unknown) {
      console.error("[DriverHome] Failed to fetch current booking", err);
    }
  }, [role, extractBookingFromResponse]);

  // --- helper: connect to SSE using fetch so we can send Authorization header --- 
  const connectSseWithAuth = useCallback((url: string, onMessage: (data: unknown) => void) => {
    const token = localStorage.getItem('token');
    const controller = new AbortController();

    fetch(url, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`SSE connect failed (${res.status})`);
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const readLoop = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split('\n\n');
            buffer = events.pop() ?? '';
            for (const ev of events) {
              const line = ev.split('\n').find(l => l.startsWith('data:'));
              if (!line) continue;
              const json = line.slice(5).trim();
              try {
                const parsed = JSON.parse(json);
                onMessage(parsed);
              } catch (parseErr) {
                console.warn('[SSE] could not parse data', parseErr);
              }
            }
          }
        };

        readLoop().catch((err: any) => {
          if (err?.name === 'AbortError') return;
          console.error('[SSE] read loop error', err);
        });
      })
      .catch((err: any) => {
        if (err?.name === 'AbortError') return;
        console.error('[SSE] connect error', err);
      });

    return () => controller.abort();
  }, []);

  // --- replace polling effect with event-driven logic ---
  useEffect(() => {
    let cleanup: undefined | (() => void);

    if (role === 'DRIVER') {
      // initial fetch
      fetchCurrent();

      const bookingBase = (import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3004').replace(/\/$/, '');
      const url = `${bookingBase}/ride-requests/stream`;

      cleanup = connectSseWithAuth(url, (payload: unknown) => {
        // payloads from server: { event: 'connected' } or { event: 'new_ride_request', booking: {...} }
        const p = payload as Record<string, unknown>;
        const bookingData = (p?.booking ?? p?.data ?? payload) as unknown;
        const booking = extractBookingFromResponse(bookingData);
        if (booking) {
          if (booking.status) booking.status = String(booking.status).toUpperCase();
          setActiveBooking(booking);
          if (["ACCEPTED", "DRIVER_ARRIVED"].includes(booking.status ?? '')) {
            setShowOtpPanel(true);
          } else if (booking.status === 'IN_PROGRESS' && !manualToggleRef.current) {
            setShowOtpPanel(false);
          }
        } else {
          setActiveBooking(null);
          if (role === 'DRIVER' && !manualToggleRef.current) setShowOtpPanel(false);
        }
        // Emit an app-wide event so Header can increment the bell in real-time
        if (p?.event === 'new_ride_request') {
          try {
            window.dispatchEvent(new CustomEvent('ride-request', { detail: { booking } }));
          } catch {
            // ignore if CustomEvent fails in older browsers
          }
        }
      });
    } else if (role === 'USER') {
      // single fetch on mount
      fetchCurrent();
      const onVisibility = () => { if (document.visibilityState === 'visible') fetchCurrent(); };
      window.addEventListener('visibilitychange', onVisibility);
      cleanup = () => window.removeEventListener('visibilitychange', onVisibility);
    }

    return () => { if (cleanup) cleanup(); };
  }, [role, fetchCurrent, connectSseWithAuth, extractBookingFromResponse]);

  const handleToggleOtp = () => {
    setShowOtpPanel((s) => {
      const next = !s;
      manualToggleRef.current = next;
      return next;
    });
  };

  // Compute route and show on map (uses Google DirectionsService)
  const computeAndShowRoute = async (origin: google.maps.LatLngLiteral | string, destination: google.maps.LatLngLiteral | string) => {
    if (!isLoaded || !(window as unknown as { google?: unknown }).google) {
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
    } catch (err: unknown) {
      console.error("Failed to compute route", err);
    }
  };

  const findBookingByOtp = useCallback(async (otpToFind: string, options?: { silent?: boolean }) => {
    if (!otpToFind) {
      if (!options?.silent) message.warning('Enter OTP first');
      return null;
    }

    setFindingByOtp(true);
    try {
      // Try active / pending / recent driver bookings (no new API needed)
      const endpoints = [
        '/ride-requests/pending',
        '/bookings/driver/my-bookings',
      ];

      let all: unknown[] = [];
      for (const ep of endpoints) {
        try {
          const r = await bookingApi.get(ep);
          const payload = r.data as unknown;
          if (payload && typeof payload === "object") {
            const p = payload as Record<string, unknown>;
            if (Array.isArray(p.bookings)) all = all.concat(p.bookings);
            else if (Array.isArray(payload)) all = all.concat(payload as unknown[]);
            else if (Array.isArray(p.data)) all = all.concat(p.data as unknown[]);
          }
        } catch {
          // ignore failures for individual endpoints
        }
      }

      // dedupe by _id
      const byId = new Map<string, unknown>();
      for (const b of all) {
        const o = b as Record<string, unknown>;
        const id = String(o['_id'] ?? o['id'] ?? '');
        if (id) byId.set(id, b);
      }

      const combined = Array.from(byId.values());
      const found = combined.find((b) => {
        const o = b as Record<string, unknown>;
        const ride = o['rideOtp'] ?? o['rideotp'] ?? o['ride_otp'] ?? '';
        return String(ride ?? '') === String(otpToFind);
      }) as ActiveBooking | undefined;

      const fallbackActive = combined.find((b) => {
        const o = b as Record<string, unknown>;
        const status = String(o['status'] ?? '').toUpperCase();
        return ['ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(status);
      }) as ActiveBooking | undefined;

      if (found) {
        if (found.status) found.status = String(found.status).toUpperCase();
        setActiveBooking(found);
        setShowOtpPanel(true);
        manualToggleRef.current = true; // keep OTP panel open
        if (!options?.silent) message.success('Booking connected — click "Start Ride" to confirm arrival and begin the trip');
        return found;
      } else if (fallbackActive) {
        if (fallbackActive.status) fallbackActive.status = String(fallbackActive.status).toUpperCase();
        setActiveBooking(fallbackActive);
        setShowOtpPanel(true);
        manualToggleRef.current = true;
        if (!options?.silent) message.info('Connected to your active booking. Click "Start Ride" to verify OTP.');
        return fallbackActive;
      } else {
        if (!options?.silent) message.error('No booking found for this OTP. Ask the passenger to confirm the number and try again.');
        return null;
      }
    } catch (err: unknown) {
      console.error('Error finding booking by OTP', err);
      message.error('Failed to search for booking');
      return null;
    } finally {
      setFindingByOtp(false);
    }
  }, [setActiveBooking]);

  const handleMarkArrived = async () => {
    // Resolve a usable booking id (try several fields)
    let bookingIdToUse =
      activeBooking?._id ||
      activeBooking?.id ||
      activeBooking?.bookingId ||
      activeBooking?.rideId ||
      undefined;

    // If we don't have one, try to find booking silently using the current OTP (if present)
    if (!bookingIdToUse) {
      try {
        const found = otp ? await findBookingByOtp(otp, { silent: true }) : null;
        bookingIdToUse = found?._id || found?.id || found?.bookingId || found?.rideId || undefined;
      } catch {
        /* ignore - will show message below */
      }
    }

    if (!bookingIdToUse) {
      message.error("Cannot mark arrival: no connected booking. Use Find & Connect first.");
      return;
    }

    setArriving(true);
    try {
      const res = await bookingApi.patch(`/bookings/${bookingIdToUse}/status`, { status: 'DRIVER_ARRIVED' });
      const data = res.data;

      const booking = extractBookingFromResponse(data) || data;
      if (booking) {
        if (booking.status) booking.status = String(booking.status).toUpperCase();
        setActiveBooking(booking);
        // notify other tabs
        window.dispatchEvent(new CustomEvent("booking:updated", { detail: { bookingId: bookingIdToUse, status: booking.status } }));
        message.success("Arrival confirmed — you can now start the ride.");
      } else {
        message.success("Arrival confirmed.");
        await fetchCurrent();
      }
    } catch (error: unknown) {
      console.error("[DriverHome] mark arrived failed", error);
      const err = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as { message?: string })?.message || "Failed to mark arrival";
      message.error(err);
    } finally {
      setArriving(false);
    }
  };

  const handleStartRide = async () => {
    if (!otp) {
      message.warning('Enter OTP first');
      return;
    }

    if (startingRide) return;
    setLastOtpError(null);
    setStartingRide(true);

    try {
      if (activeBooking?.status === 'IN_PROGRESS') {
        message.info('Ride already in progress.');
        setStartingRide(false);
        return;
      }

      // Prefer connected booking; fallback to all active bookings for this driver.
      const candidates: ActiveBooking[] = [];
      if (activeBooking) {
        candidates.push(activeBooking);
      } else {
        const res = await bookingApi.get('/bookings/driver/my-bookings');
        const payload = res.data;
        const bookings = Array.isArray(payload?.bookings)
          ? payload.bookings
          : Array.isArray(payload)
            ? payload
            : [];

        for (const b of bookings) {
          const extracted = extractBookingFromResponse(b);
          if (!extracted) continue;
          const status = String(extracted.status || '').toUpperCase();
          if (['ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(status)) {
            candidates.push({ ...extracted, status });
          }
        }
      }

      if (!candidates.length) {
        const warn = 'No active booking found for this driver. Accept a ride first.';
        setLastOtpError(warn);
        message.warning(warn);
        setShowOtpPanel(true);
        return;
      }

      let started = false;
      let lastErrorMessage = 'Invalid OTP or no eligible booking found.';

      for (const candidate of candidates) {
        const bookingId = candidate?._id || candidate?.id || candidate?.bookingId || candidate?.rideId;
        if (!bookingId) continue;

        try {
          const res = await bookingApi.post(`/bookings/${bookingId}/verify-otp`, { otp });
          const data = res.data;
          const bookingFromResponse = extractBookingFromResponse(data?.booking ?? data) || candidate;

          if (bookingFromResponse) {
            setActiveBooking({ ...bookingFromResponse, status: 'IN_PROGRESS' });
          }

          message.success('Ride started successfully');
          setOtp('');
          setShowOtpPanel(false);
          manualToggleRef.current = false;
          await fetchCurrent();

          const origin =
            bookingFromResponse?.pickupDetails && bookingFromResponse.pickupDetails.latitude && bookingFromResponse.pickupDetails.longitude
              ? { lat: Number(bookingFromResponse.pickupDetails.latitude), lng: Number(bookingFromResponse.pickupDetails.longitude) }
              : bookingFromResponse?.pickupLocation || null;

          const destination =
            bookingFromResponse?.dropDetails && bookingFromResponse.dropDetails.latitude && bookingFromResponse.dropDetails.longitude
              ? { lat: Number(bookingFromResponse.dropDetails.latitude), lng: Number(bookingFromResponse.dropDetails.longitude) }
              : bookingFromResponse?.dropoffLocation || null;

          if (origin && destination) {
            await computeAndShowRoute(origin as google.maps.LatLngLiteral, destination as google.maps.LatLngLiteral);
          }

          started = true;
          break;
        } catch (err: unknown) {
          lastErrorMessage = extractApiErrorMessage(err, 'Failed to verify OTP');
        }
      }

      if (!started) {
        setLastOtpError(lastErrorMessage);
        message.error(lastErrorMessage);
      }
    } catch (err: unknown) {
      console.error('[DriverHome] verify OTP failed', err);
      const msg = extractApiErrorMessage(err, 'Failed to verify OTP');
      setLastOtpError(msg);
      message.error(msg);
    } finally {
      setStartingRide(false);
    }
  };

  // notify other tabs that booking status changed
  const updatedId = activeBooking?._id || activeBooking?.id || activeBooking?.bookingId || activeBooking?.rideId;
  if (updatedId) window.dispatchEvent(new CustomEvent('booking:updated', { detail: { bookingId: updatedId, status: activeBooking?.status } }));

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
                {activeBooking
                  ? `Current status: ${activeBooking.status ?? "N/A"}`
                  : "No active booking. Type the OTP after asking the passenger."}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => fetchCurrent()}>Refresh Now</Button>
              <Button type="primary" onClick={() => findBookingByOtp(otp)} disabled={!otp} loading={findingByOtp}>
                Find & Connect
              </Button>
              {activeBooking && activeBooking.status === 'ACCEPTED' && (
                <Button onClick={handleMarkArrived} loading={arriving}>
                  Mark Arrival
                </Button>
              )}
              {activeBooking && (
                <Button danger onClick={() => { setActiveBooking(null); manualToggleRef.current = false; }}>
                  Disconnect Ride
                </Button>
              )}
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
            <Button
              type="primary"
              onClick={handleStartRide}
              disabled={!otp || startingRide}
              loading={startingRide}
            >
              Start Ride
            </Button>
          </div>

          {lastOtpError && (
            <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
              OTP status: {lastOtpError}
            </div>
          )}
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