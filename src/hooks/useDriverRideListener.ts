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
    const [sseConnected, setSseConnected] = useState(false);

<<<<<<< HEAD
    const rideRequestPollingRef = useRef<NodeJS.Timeout | null>(null);
    const customerLocationPollingRef = useRef<NodeJS.Timeout | null>(null);
    const sseEventSourceRef = useRef<EventSource | null>(null);
=======
    const rideRequestPollingRef = useRef<number | null>(null);
    const customerLocationPollingRef = useRef<number | null>(null);
>>>>>>> 2d87d45ba5e80b3377d833599bc50265ff5ab029

    // Subscribe to SSE notifications for new ride requests
    const subscribeToBokingNotifications = useCallback(() => {
        if (!enabled || !driverId) return;

        try {
            // Close any existing connection
            if (sseEventSourceRef.current) {
                sseEventSourceRef.current.close();
            }

            const token = localStorage.getItem('token');
            sseEventSourceRef.current = new EventSource(`/api/drivers/subscribe-to-bookings`, {
                withCredentials: false,
            });

            // Add authorization header (requires custom setup)
            const originalFetch = window.fetch;
            window.fetch = function (...args: any[]) {
                if (typeof args[0] === 'string' && args[0].includes('subscribe-to-bookings')) {
                    if (!args[1]) args[1] = {};
                    args[1].headers = {
                        ...args[1].headers,
                        'Authorization': `Bearer ${token}`,
                    };
                }
                return originalFetch.apply(this, args);
            };

            sseEventSourceRef.current.onopen = () => {
                console.log('✅ Connected to real-time ride notifications');
                setSseConnected(true);
                setError(null);
            };

            sseEventSourceRef.current.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📬 Received SSE notification:', data);

                    if (data.event === 'new_ride_request' && data.booking) {
                        const booking = data.booking;
                        setNewRideRequest({
                            rideId: booking.bookingId || booking._id,
                            bookingId: booking.bookingId,
                            customerId: booking.userId,
                            userId: booking.userId,
                            customerName: booking.userInfo?.name || 'Customer',
                            pickupLocation: booking.origin?.address || '',
                            dropLocation: booking.destination?.address || '',
                            pickupLatitude: booking.origin?.location?.lat || 0,
                            pickupLongitude: booking.origin?.location?.lng || 0,
                            dropoffLatitude: booking.destination?.location?.lat || 0,
                            dropoffLongitude: booking.destination?.location?.lng || 0,
                            estimatedFare: booking.price?.total || 0,
                            estimatedDistance: (booking.distance?.value || 0) / 1000,
                            rideOtp: booking.rideOtp,
                        });
                        setError(null);
                    }
                } catch (err) {
                    console.error('Error parsing SSE message:', err);
                }
            };

            sseEventSourceRef.current.onerror = (error) => {
                console.error('SSE Connection Error:', error);
                setSseConnected(false);
                sseEventSourceRef.current?.close();

                // Fallback to polling if SSE fails
                console.log('⚠️ SSE connection failed. Falling back to polling...');
                startFallbackPolling();
            };
        } catch (err) {
            console.error('Error setting up SSE subscription:', err);
            setSseConnected(false);
            // Fallback to polling
            startFallbackPolling();
        }
    }, [enabled, driverId]);

    // Poll pending ride requests every 5 seconds (fallback mechanism)
    const startFallbackPolling = useCallback(() => {
        const pollPendingRides = async () => {
            if (!enabled || !driverId) return;

            try {
                const response = await fetch('/api/bookings/pending-for-driver', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                });

                if (!response.ok) throw new Error('Failed to fetch pending rides');

                const rides = await response.json();

                if (rides && rides.length > 0) {
                    const ride = rides[0];
                    setNewRideRequest({
                        rideId: ride.bookingId || ride._id,
                        bookingId: ride.bookingId,
                        customerId: ride.userId,
                        userId: ride.userId,
                        customerName: ride.userInfo?.name || 'Customer',
                        pickupLocation: ride.origin?.address || ride.pickupLocation || '',
                        dropLocation: ride.destination?.address || ride.dropoffLocation || '',
                        pickupLatitude: ride.origin?.location?.lat || ride.pickupLatitude || 0,
                        pickupLongitude: ride.origin?.location?.lng || ride.pickupLongitude || 0,
                        dropoffLatitude: ride.destination?.location?.lat || ride.dropoffLatitude || 0,
                        dropoffLongitude: ride.destination?.location?.lng || ride.dropoffLongitude || 0,
                        estimatedFare: ride.price?.total || ride.estimatedFare,
                        estimatedDistance: (ride.distance?.value || ride.estimatedDistance * 1000) / 1000,
                        rideOtp: ride.rideOtp,
                    });
                    setError(null);
                } else {
                    setNewRideRequest(null);
                }
            } catch (err) {
                console.error('Error polling pending rides:', err);
            }
        };

        pollPendingRides();
        rideRequestPollingRef.current = setInterval(pollPendingRides, 5000);
    }, [driverId, enabled]);

    // Poll current ride status every 3 seconds
    const pollRideStatus = useCallback(async () => {
        if (!currentRideId) return;

        try {
            const response = await fetch(`/api/rides/${currentRideId}/status`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
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
    }, [currentRideId]);

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

    // Start SSE subscription and fallback polling
    useEffect(() => {
        if (!enabled || !driverId) return;

        subscribeToBokingNotifications();

        return () => {
            if (sseEventSourceRef.current) {
                sseEventSourceRef.current.close();
            }
            if (rideRequestPollingRef.current) {
                clearInterval(rideRequestPollingRef.current);
            }
        };
    }, [driverId, enabled, subscribeToBokingNotifications]);

    // Start polling ride status
    useEffect(() => {
        if (!enabled || !currentRideId) return;

        // Poll immediately
        pollRideStatus();

        // Poll every 3 seconds
        const statusPollingRef = setInterval(pollRideStatus, 3000);

        return () => {
            clearInterval(statusPollingRef);
        };
    }, [currentRideId, enabled, pollRideStatus]);

    // Start polling customer location
    useEffect(() => {
        if (!enabled || !currentRideId) return;

        // Poll immediately
        pollCustomerLocation();

        // Poll every 2 seconds
        customerLocationPollingRef.current = setInterval(pollCustomerLocation, 2000);

        return () => {
            if (customerLocationPollingRef.current) {
                clearInterval(customerLocationPollingRef.current);
            }
        };
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

        if (rideRequestPollingRef.current) {
            clearInterval(rideRequestPollingRef.current);
        }
        if (customerLocationPollingRef.current) {
            clearInterval(customerLocationPollingRef.current);
        }
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
        sseConnected,
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