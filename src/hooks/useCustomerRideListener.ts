import { useEffect, useState, useCallback, useRef } from 'react';

interface RideAcceptedData {
    rideId: string;
    driverId: string;
    driverName: string;
    driverPhoto?: string;
    driverRating?: number;
    vehicleNumber?: string;
    vehiclePhoto?: string;
    vehicleType?: string;
    status: string;
}

interface DriverLocation {
    driverId: string;
    rideId: string;
    latitude: number;
    longitude: number;
    timestamp: number;
}

/**
 * Hook for customer to poll ride status and driver updates via REST API
 * Replaces socket-based listener with REST API polling
 */
export const useCustomerRideListener = (userId: string, rideId?: string, enabled: boolean = true) => {
    const [rideAccepted, setRideAccepted] = useState<RideAcceptedData | null>(null);
    const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
    const [rideStarted, setRideStarted] = useState(false);
    const [rideCompleted, setRideCompleted] = useState(false);
    const [rideCancelled, setRideCancelled] = useState(false);
    const [driverArrived, setDriverArrived] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Periodic polling removed — one-off status/location checks only; consider SSE for real-time updates.

    // Poll ride status every 3 seconds
    const pollRideStatus = useCallback(async () => {
        if (!rideId) return;

        try {
            setLoading(true);
            const response = await fetch(`/api/rides/${rideId}/status`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch ride status');

            const data = await response.json();

            if (data.status === 'ACCEPTED') {
                setRideAccepted({
                    rideId: data.rideId,
                    driverId: data.driverId,
                    driverName: data.driverName,
                    driverPhoto: data.driverPhoto,
                    driverRating: data.driverRating,
                    vehicleNumber: data.vehicleNumber,
                    vehiclePhoto: data.vehiclePhoto,
                    status: data.status,
                });
                setError(null);
            } else if (data.status === 'STARTED') {
                setRideStarted(true);
                setError(null);
            } else if (data.status === 'COMPLETED') {
                setRideCompleted(true);
                setRideAccepted(null);
                setDriverLocation(null);
                setRideStarted(false);
            } else if (data.status === 'CANCELLED') {
                setRideCancelled(true);
                setRideAccepted(null);
                setDriverLocation(null);
                setRideStarted(false);
            }

            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error fetching ride status');
            setLoading(false);
        }
    }, [rideId]);

    // Poll driver location every 2 seconds
    const pollDriverLocation = useCallback(async () => {
        if (!rideId || !rideAccepted) return;

        try {
            const response = await fetch(`/api/rides/${rideId}/driver-location`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch driver location');

            const data = await response.json();
            setDriverLocation({
                driverId: data.driverId,
                rideId: data.rideId,
                latitude: data.latitude,
                longitude: data.longitude,
                timestamp: Date.now(),
            });
        } catch (err) {
            console.error('Error fetching driver location:', err);
        }
    }, [rideId, rideAccepted]);

    // Start ride status checks (periodic polling removed — single fetch only)
    useEffect(() => {
        if (!enabled || !rideId) return;

        // Single status fetch; caller components can call pollRideStatus again on demand
        pollRideStatus();
    }, [rideId, enabled, pollRideStatus]);

    // Start driver location check after ride is accepted (periodic polling removed — single fetch only)
    useEffect(() => {
        if (!enabled || !rideAccepted || !rideId) return;

        // Single location fetch; components may call pollDriverLocation on demand
        pollDriverLocation();
    }, [rideId, rideAccepted, enabled, pollDriverLocation]);

    const requestRide = useCallback(
        async (rideData: {
            customerId: string;
            pickupLocation: string;
            dropLocation: string;
            pickupLatitude: number;
            pickupLongitude: number;
            dropoffLatitude: number;
            dropoffLongitude: number;
            estimatedFare?: number;
            estimatedDistance?: number;
        }) => {
            try {
                setLoading(true);
                const response = await fetch('/api/rides/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify(rideData),
                });

                if (!response.ok) throw new Error('Failed to request ride');

                const data = await response.json();
                setError(null);
                return data;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Error requesting ride';
                setError(errorMessage);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        []
    );

    const updateLocation = useCallback(
        async (rideId: string, latitude: number, longitude: number) => {
            try {
                const response = await fetch('/api/customers/location/update', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: JSON.stringify({
                        customerId: userId,
                        rideId,
                        latitude,
                        longitude,
                    }),
                });

                if (!response.ok) throw new Error('Failed to update location');
            } catch (err) {
                console.error('Error updating customer location:', err);
            }
        },
        [userId]
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
                        customerId: userId,
                        reason: reason || 'Customer cancelled',
                    }),
                });

                if (!response.ok) throw new Error('Failed to cancel ride');

                setRideCancelled(true);
                setRideAccepted(null);
                setDriverLocation(null);
                setRideStarted(false);
                setError(null);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Error cancelling ride';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        },
        [userId]
    );

    const reset = useCallback(() => {
        setRideAccepted(null);
        setDriverLocation(null);
        setRideStarted(false);
        setRideCompleted(false);
        setRideCancelled(false);
        setDriverArrived(false);
        setError(null);

        // No periodic timers to clear (polling removed)
    }, []);

    return {
        rideAccepted,
        driverLocation,
        rideStarted,
        rideCompleted,
        rideCancelled,
        driverArrived,
        error,
        loading,
        requestRide,
        updateLocation,
        cancelRide,
        reset,
    };
};