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

            const rides = Array.isArray(payload?.rides) ? payload.rides : Array.isArray(payload) ? payload : [];

            if (rides.length > 0) {
                const ride = rides[0];
                setNewRideRequest({
                    rideId: ride.bookingId || ride._id,
                    bookingId: ride.bookingId || ride._id,
                    customerId: ride.customerId || ride.userId,
                    userId: ride.customerId || ride.userId,
                    customerName: ride.customerName || ride.userInfo?.name || 'Customer',
                    pickupLocation: ride.pickupLocation || ride.pickupAddress || '',
                    dropLocation: ride.dropoffLocation || ride.dropoffAddress || '',
                    pickupLatitude: ride.pickupLatitude || 0,
                    pickupLongitude: ride.pickupLongitude || 0,
                    dropoffLatitude: ride.dropoffLatitude || 0,
                    dropoffLongitude: ride.dropoffLongitude || 0,
                    estimatedFare: ride.estimatedFare || 0,
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
                await bookingApi.post(`/bookings/${rideId}/reject`);

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
            try {
                await driverApi.patch('/driver-profiles/me/location', {
                    latitude,
                    longitude,
                    isOnline: true,
                });
            } catch (err) {
                console.error('Error updating driver location:', err);
            }
        },
        [driverId]
    );

    const notifyArrival = useCallback(
        async (rideId: string) => {
            try {
                setLoading(true);
                await bookingApi.patch(`/bookings/${rideId}/status`, { status: 'DRIVER_ARRIVED' });

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
        async (rideId: string, _otp: string) => {
            try {
                setLoading(true);
                await bookingApi.patch(`/bookings/${rideId}/status`, { status: 'IN_PROGRESS' });

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
                await bookingApi.patch(`/bookings/${rideId}/status`, { status: 'COMPLETED' });

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
        async (rideId: string, reason?: string) => {
            try {
                setLoading(true);
                await bookingApi.patch(`/bookings/${rideId}/status`, {
                    status: 'CANCELLED',
                    reason: reason || 'Driver cancelled',
                });

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