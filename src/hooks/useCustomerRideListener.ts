import { useEffect, useState, useCallback } from 'react';
import { bookingApi } from '../services/api';

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
            const response = await bookingApi.get(`/bookings/${rideId}`);
            const data = response.data;

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
            } else if (data.status === 'DRIVER_ARRIVED') {
                setDriverArrived(true);
                setError(null);
            } else if (data.status === 'IN_PROGRESS' || data.status === 'STARTED') {
                setRideStarted(true);
                setDriverArrived(false);
                setError(null);
            } else if (data.status === 'COMPLETED') {
                setRideCompleted(true);
                setRideAccepted(null);
                setDriverLocation(null);
                setRideStarted(false);
                setDriverArrived(false);
            } else if (data.status === 'CANCELLED') {
                setRideCancelled(true);
                setRideAccepted(null);
                setDriverLocation(null);
                setRideStarted(false);
                setDriverArrived(false);
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
            // Driver live-location endpoint is not exposed by booking-service currently.
            setDriverLocation(null);
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
                const payload = {
                    origin: {
                        address: rideData.pickupLocation,
                        coordinates: {
                            lat: rideData.pickupLatitude,
                            lng: rideData.pickupLongitude,
                        },
                    },
                    destination: {
                        address: rideData.dropLocation,
                        coordinates: {
                            lat: rideData.dropoffLatitude,
                            lng: rideData.dropoffLongitude,
                        },
                    },
                    distance: {
                        text: rideData.estimatedDistance ? `${rideData.estimatedDistance} km` : 'N/A',
                        value: rideData.estimatedDistance ? Math.max(0, Math.round(rideData.estimatedDistance * 1000)) : 0,
                    },
                    duration: {
                        text: 'N/A',
                        value: 0,
                    },
                };

                const response = await bookingApi.post('/bookings', payload);
                const data = response.data;
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
                void rideId;
                void latitude;
                void longitude;
                void userId;
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
                await bookingApi.patch(`/bookings/${rideId}/status`, {
                    status: 'CANCELLED',
                    cancelReason: reason || 'Customer cancelled',
                });

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