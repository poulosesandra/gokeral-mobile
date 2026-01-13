import { useEffect, useState, useCallback, useRef } from 'react';

export interface NewRideRequest {
    rideId: string;
    customerId: string;
    customerName: string;
    pickupLocation: string;
    dropLocation: string;
    pickupLatitude: number;
    pickupLongitude: number;
    dropoffLatitude: number;
    dropoffLongitude: number;
    estimatedFare?: number;
    estimatedDistance?: number;
}

interface CustomerLocation {
    customerId: string;
    rideId: string;
    latitude: number;
    longitude: number;
    timestamp: number;
}

/**
 * Hook for driver to poll new ride requests and customer updates via REST API
 * Replaces socket-based listener with REST API polling
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

    const rideRequestPollingRef = useRef<number | null>(null);
    const customerLocationPollingRef = useRef<number | null>(null);

    // Poll pending ride requests every 5 seconds
    const pollPendingRides = useCallback(async () => {
        if (!enabled || !driverId) return;

        try {
            // ✅ Updated endpoint to call the new backend method
            const response = await fetch('/api/bookings/pending-for-driver', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch pending rides');

            const rides = await response.json();

            // Get the first pending ride request
            if (rides && rides.length > 0) {
                const ride = rides[0];
                setNewRideRequest({
                    rideId: ride.rideId || ride._id,
                    customerId: ride.customerId,
                    customerName: ride.customerName,
                    pickupLocation: ride.pickupLocation,
                    dropLocation: ride.dropLocation || ride.dropoffLocation,
                    pickupLatitude: ride.pickupLatitude,
                    pickupLongitude: ride.pickupLongitude,
                    dropoffLatitude: ride.dropoffLatitude,
                    dropoffLongitude: ride.dropoffLongitude,
                    estimatedFare: ride.estimatedFare,
                    estimatedDistance: ride.estimatedDistance,
                });
                setError(null);
            } else {
                setNewRideRequest(null);
            }
        } catch (err) {
            console.error('Error polling pending rides:', err);
        }
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

    // Start polling pending rides
    useEffect(() => {
        if (!enabled || !driverId) return;

        // Poll immediately
        pollPendingRides();

        // Poll every 5 seconds for new ride requests
        rideRequestPollingRef.current = setInterval(pollPendingRides, 5000);

        return () => {
            if (rideRequestPollingRef.current) {
                clearInterval(rideRequestPollingRef.current);
            }
        };
    }, [driverId, enabled, pollPendingRides]);

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

                const data = await response.json();
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