import { useEffect, useState, useCallback, useRef } from 'react';

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
        if (!enabled || !driverId) return;
        try {
            const response = await fetch('/api/rides/pending', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                const text = await response.text().catch(() => '');
                setError(`Failed to fetch pending rides (${response.status}) ${text}`);
                return;
            }

            const payload = await response.json();
            const rides = Array.isArray(payload?.rides) ? payload.rides : Array.isArray(payload) ? payload : [];

            if (rides.length > 0) {
                const ride = rides[0];
                setNewRideRequest({
                    rideId: ride.bookingId || ride._id,
                    bookingId: ride.bookingId,
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
        } catch (err) {
            console.error('Error fetching pending rides:', err);
            setError(err instanceof Error ? err.message : 'Error fetching pending rides');
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
                const response = await fetch(`/api/bookings/driver/booking/${currentRideId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const text = await response.text().catch(() => '');
                    console.error('Driver booking status fetch failed:', response.status, text);
                    throw new Error('Failed to fetch booking status for driver');
                }

                // Guard against non-JSON responses (e.g., HTML served by dev server)
                const text = await response.text();
                let booking: any;
                try {
                    booking = JSON.parse(text);
                } catch (parseErr) {
                    console.error('Unexpected non-JSON response when fetching booking status for driver:', text?.slice?.(0,200));
                    throw new Error('Unexpected non-JSON response when fetching booking status');
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

            // Default: customer-side ride status endpoint
            const response = await fetch(`/api/rides/${currentRideId}/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch ride status');

            const data = await response.json();

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

        try {
            const response = await fetch(`/api/rides/${currentRideId}/customer-location`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch customer location');

            const data = await response.json();
            setCustomerLocation({
                customerId: data.customerId,
                rideId: data.rideId,
                latitude: data.latitude,
                longitude: data.longitude,
                timestamp: Date.now(),
            });
        } catch (err) {
            console.error('Error polling customer location:', err);
        }
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
                const response = await fetch(`/api/rides/${rideId}/accept`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({
                        driverId,
                    }),
                });

                if (!response.ok) throw new Error('Failed to accept ride');

                await response.json();
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
                const response = await fetch(`/api/rides/${rideId}/reject`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({
                        driverId,
                    }),
                });

                if (!response.ok) throw new Error('Failed to reject ride');

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
        async (rideId: string, latitude: number, longitude: number) => {
            try {
                const response = await fetch('/api/drivers/location/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({
                        driverId,
                        rideId,
                        latitude,
                        longitude,
                        isOnline: true,
                    }),
                });

                if (!response.ok) throw new Error('Failed to update location');
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
                const response = await fetch(`/api/rides/${rideId}/arrived`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({
                        driverId,
                    }),
                });

                if (!response.ok) throw new Error('Failed to notify arrival');

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
                const response = await fetch(`/api/rides/${rideId}/start`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({
                        driverId,
                        otp,
                    }),
                });

                if (!response.ok) throw new Error('Failed to start ride');

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
                const response = await fetch(`/api/rides/${rideId}/complete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({
                        driverId,
                    }),
                });

                if (!response.ok) throw new Error('Failed to complete ride');

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
        [driverId]
    );

    const cancelRide = useCallback(
        async (rideId: string, reason?: string) => {
            try {
                setLoading(true);
                const response = await fetch(`/api/rides/${rideId}/cancel`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({
                        driverId,
                        reason: reason || 'Driver cancelled',
                    }),
                });

                if (!response.ok) throw new Error('Failed to cancel ride');

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
        [driverId]
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