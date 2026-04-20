import { useEffect, useState, useCallback } from 'react';
import { bookingApi, driverApi } from '../services/api';

// If backend doesn't expose pending rides endpoint, set to false to avoid repeated calls.
let pendingRidesAvailable: boolean | null = null; // null = unknown, true = available, false = not available

export interface NewRideRequest {
    rideId: string;
    bookingId: string;
    customerId: string;
    userId: string;
    customerName: string;
    pickupLocation: string;
    dropLocation: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropoffLatitude: number;
    dropoffLongitude: number;
    estimatedFare?: number;
    estimatedDistance?: number;
    rideOtp?: string;
}

interface CustomerLocation {
    customerId: string;
    rideId: string;
    latitude: number;
    longitude: number;
    timestamp: number;
}

/**
 * Hook for driver to receive real-time ride notifications via Server-Sent Events (SSE)
 * Falls back to REST API polling for drivers not connected to SSE
 */
export const useDriverRideListener = (driverId: string, enabled: boolean = true) => {
    const [newRideRequest, setNewRideRequest] = useState<NewRideRequest | null>(null);
    const [customerLocation, setCustomerLocation] = useState<CustomerLocation | null>(null);
    const [acceptSuccess, setAcceptSuccess] = useState(false);
    const [arrivedSuccess, setArrivedSuccess] = useState(false);
    const [rideStarted, setRideStarted] = useState(false);
    const [rideCompleted, setRideCompleted] = useState(false);
    const [currentRideId, setCurrentRideId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    // SSE & polling removed — use explicit one-off fetches (fetchPendingRides, pollRideStatus, pollCustomerLocation) instead.

    // No interval refs or EventSource refs — polling and SSE removed.

    // One-off fetch to get pending ride requests (SSE removed)
    const fetchPendingRidesOnce = useCallback(async () => {
        // Short-circuit if we've previously detected endpoint is unavailable
        if (pendingRidesAvailable === false) return;
        if (!enabled || !driverId) return;
        try {
            const response = await bookingApi.get('/ride-requests/pending');
            const payload = response.data;

            if (!payload) {
                setError('Failed to fetch pending rides');
                return;
            }

            // On success mark endpoint available (in case it was unknown)
            pendingRidesAvailable = true;

            const rides = Array.isArray(payload?.bookings)
                ? payload.bookings
                : Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.requests)
                        ? payload.requests
                        : Array.isArray(payload?.rides)
                            ? payload.rides
                            : [];

            if (rides.length > 0) {
                const ride = rides[0];
                const booking = ride?.booking || {};
                setNewRideRequest({
                    rideId: ride.bookingId || booking._id || ride._id,
                    bookingId: ride.bookingId || booking._id || ride._id,
                    customerId: ride.customerId || booking.userId,
                    userId: ride.customerId || booking.userId,
                    customerName: ride.customerName || ride.userInfo?.name || 'Customer',
                    pickupLocation: ride.pickupLocation || ride.pickupAddress || booking.origin?.address || '',
                    dropLocation: ride.dropoffLocation || ride.dropoffAddress || booking.destination?.address || '',
                    pickupLatitude: ride.pickupLatitude || booking.origin?.coordinates?.lat || 0,
                    pickupLongitude: ride.pickupLongitude || booking.origin?.coordinates?.lng || 0,
                    dropoffLatitude: ride.dropoffLatitude || booking.destination?.coordinates?.lat || 0,
                    dropoffLongitude: ride.dropoffLongitude || booking.destination?.coordinates?.lng || 0,
                    estimatedFare: ride.estimatedFare || booking.fare || 0,
                    estimatedDistance: ride.estimatedDistance || ride.distance || undefined,
                    rideOtp: ride.rideOtp,
                });
                setError(null);
            } else {
                setNewRideRequest(null);
            }
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 404) {
                  pendingRidesAvailable = false;
                console.warn('[useDriverRideListener] /ride-requests/pending not available — disabling further checks');
                  setError('Pending rides endpoint not available');
                  return;
            }

            console.error('Error fetching pending rides:', err);
            // Network / connection errors — disable further attempts to avoid console spam while backend is down
            pendingRidesAvailable = false;
            setError(err?.response?.data?.message || err?.message || 'Error fetching pending rides');
        }
    }, [driverId, enabled]);

    // Polling fallback removed — use fetchPendingRidesOnce() for on-demand checks.

    // Poll current ride status every 3 seconds
    const pollRideStatus = useCallback(async () => {
        if (!currentRideId) return;

        try {
            const token = localStorage.getItem('token');

            // If this hook was initialized with a driverId, use the driver booking endpoint
            if (driverId) {
                const response = await bookingApi.get(`/bookings/${currentRideId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                const booking = response.data;
                if (!booking) {
                    throw new Error('Failed to fetch booking status for driver');
                }

                const status = booking?.status || booking?.booking?.status;

                if (status === 'ACCEPTED') {
                    setAcceptSuccess(true);
                } else if (status === 'IN_PROGRESS' || status === 'STARTED') {
                    setRideStarted(true);
                    setArrivedSuccess(false);
                } else if (status === 'COMPLETED') {
                    setRideCompleted(true);
                    setAcceptSuccess(false);
                    setRideStarted(false);
                    setCurrentRideId(null);
                } else if (status === 'CANCELLED') {
                    setAcceptSuccess(false);
                    setRideStarted(false);
                    setCurrentRideId(null);
                }

                return;
            }

            const response = await bookingApi.get(`/bookings/${currentRideId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = response.data;

            if (data.status === 'ACCEPTED') {
                setAcceptSuccess(true);
            } else if (data.status === 'STARTED') {
                setRideStarted(true);
                setArrivedSuccess(false);
            } else if (data.status === 'COMPLETED') {
                setRideCompleted(true);
                setAcceptSuccess(false);
                setRideStarted(false);
                setCurrentRideId(null);
            } else if (data.status === 'CANCELLED') {
                setAcceptSuccess(false);
                setRideStarted(false);
                setCurrentRideId(null);
            }
        } catch (err) {
            console.error('Error polling ride status:', err);
        }
    }, [currentRideId, driverId]);

    // Poll customer location every 2 seconds
    const pollCustomerLocation = useCallback(async () => {
        if (!currentRideId) return;

        // customer-location endpoint is not exposed in current booking microservice API.
        setCustomerLocation(null);
    }, [currentRideId]);

    // On init fetch pending rides once (SSE and polling removed)
    useEffect(() => {
        if (!enabled || !driverId) return;

        fetchPendingRidesOnce();

        return () => {
            // no SSE connection or polling to clean up
        };
    }, [driverId, enabled, fetchPendingRidesOnce]);

    // Start ride status check (periodic polling removed — single fetch only)
    useEffect(() => {
        if (!enabled || !currentRideId) return;

        // Single status fetch
        pollRideStatus();
    }, [currentRideId, enabled, pollRideStatus]);

    // Start customer location check (periodic polling removed — single fetch only)
    useEffect(() => {
        if (!enabled || !currentRideId) return;

        // Single location fetch
        pollCustomerLocation();
    }, [currentRideId, enabled, pollCustomerLocation]);

    const acceptRide = useCallback(
        async (rideId: string) => {
            try {
                setLoading(true);
                await bookingApi.post(`/bookings/${rideId}/accept`);
                setAcceptSuccess(true);
                setCurrentRideId(rideId);
                setNewRideRequest(null);
                setError(null);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Error accepting ride';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        },
        [driverId]
    );

    const rejectRide = useCallback(
        async (rideId: string) => {
            try {
                setLoading(true);
                await bookingApi.post(`/api/rides/${rideId}/reject`);

                setNewRideRequest(null);
                setError(null);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Error rejecting ride';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        },
        [driverId]
    );

    const updateLocation = useCallback(
        async (_rideId: string, latitude: number, longitude: number) => {
            const payload = {
                latitude,
                longitude,
                isOnline: true,
            };

            try {
                await driverApi.patch('/driver-profiles/me/location', payload);
            } catch (err) {
                console.warn('Warning: /driver-profiles/me/location failed, trying /drivers/location/update', err);
                try {
                    await driverApi.post('/drivers/location/update', payload);
                } catch (finalError) {
                    console.error('Error updating driver location on all endpoints:', finalError);
                }
            }
        },
        [driverId]
    );

    const notifyArrival = useCallback(
        async (rideId: string) => {
            try {
                setLoading(true);
                await bookingApi.patch(`/bookings/${rideId}/arrived`);

                setArrivedSuccess(true);
                setError(null);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Error notifying arrival';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        },
        [driverId]
    );

    const startRide = useCallback(
        async (rideId: string, otp: string) => {
            try {
                setLoading(true);
                await bookingApi.post(`/bookings/${rideId}/verify-otp`, { otp });

                setRideStarted(true);
                setArrivedSuccess(false);
                setError(null);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Error starting ride';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        },
        [driverId]
    );

    const completeRide = useCallback(
        async (rideId: string) => {
            try {
                setLoading(true);
                await bookingApi.post(`/bookings/${rideId}/complete`);

                setRideCompleted(true);
                setAcceptSuccess(false);
                setRideStarted(false);
                setCurrentRideId(null);
                setError(null);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Error completing ride';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const cancelRide = useCallback(
        async (rideId: string, _reason?: string) => {
            try {
                setLoading(true);
                await bookingApi.patch(`/bookings/${rideId}/cancel`);

                setAcceptSuccess(false);
                setRideStarted(false);
                setCurrentRideId(null);
                setError(null);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Error cancelling ride';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const reset = useCallback(() => {
        setNewRideRequest(null);
        setCustomerLocation(null);
        setAcceptSuccess(false);
        setArrivedSuccess(false);
        setRideStarted(false);
        setRideCompleted(false);
        setCurrentRideId(null);
        setError(null);

        // No periodic timers to clear (polling removed)
    }, []);

    return {
        newRideRequest,
        customerLocation,
        acceptSuccess,
        arrivedSuccess,
        rideStarted,
        rideCompleted,
        currentRideId,
        error,
        loading,
        fetchPendingRides: fetchPendingRidesOnce,
        acceptRide,
        rejectRide,
        updateLocation,
        notifyArrival,
        startRide,
        completeRide,
        cancelRide,
        reset,
    };
};