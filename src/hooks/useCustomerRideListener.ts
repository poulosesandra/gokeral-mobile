import { useEffect, useState, useCallback } from 'react';
import socketService from '../services/socketService';

interface RideAcceptedData {
    rideId: string;
    driverId: string;
    driverName: string;
    driverPhoto?: string;
    driverRating?: number;
    vehicleNumber?: string;
    vehiclePhoto?: string;
    status: string;
}

interface DriverLocation {
    driverId: string;
    rideId: string;
    latitude: number;
    longitude: number;
    timestamp: number;
}

interface RideEvent {
    rideId: string;
    driverId?: string;
    message?: string;
    status?: string;
    [key: string]: any;
}

/**
 * Hook for customer to listen for ride acceptance and driver updates
 */
export const useCustomerRideListener = (userId: string, enabled: boolean = true) => {
    const [rideAccepted, setRideAccepted] = useState<RideAcceptedData | null>(null);
    const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
    const [rideStarted, setRideStarted] = useState(false);
    const [rideCompleted, setRideCompleted] = useState(false);
    const [rideCancelled, setRideCancelled] = useState(false);
    const [driverArrived, setDriverArrived] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled || !userId) return;

        // Authenticate on socket
        socketService.authenticate(userId, 'CUSTOMER');

        // Listen for ride acceptance
        const handleRideAccepted = (data: RideAcceptedData) => {
            setRideAccepted(data);
            setError(null);
        };

        // Listen for driver location updates
        const handleDriverLocation = (data: DriverLocation) => {
            setDriverLocation(data);
        };

        // Listen for ride started
        const handleRideStarted = (data: RideEvent) => {
            setRideStarted(true);
            setError(null);
        };

        // Listen for ride completed
        const handleRideCompleted = (data: RideEvent) => {
            setRideCompleted(true);
            setRideAccepted(null);
            setDriverLocation(null);
            setRideStarted(false);
        };

        // Listen for ride cancelled
        const handleRideCancelled = (data: RideEvent) => {
            setRideCancelled(true);
            setRideAccepted(null);
            setDriverLocation(null);
            setRideStarted(false);
        };

        // Listen for driver arrived
        const handleDriverArrived = (data: RideEvent) => {
            setDriverArrived(true);
            setError(null);
        };

        // Listen for errors
        const handleError = (data: any) => {
            setError(data.message);
        };

        socketService.on('ride_accepted', handleRideAccepted);
        socketService.on('driver_location_update', handleDriverLocation);
        socketService.on('ride_started', handleRideStarted);
        socketService.on('ride_completed', handleRideCompleted);
        socketService.on('ride_cancelled', handleRideCancelled);
        socketService.on('driver_arrived', handleDriverArrived);
        socketService.on('ride_request_error', handleError);
        socketService.on('auth_success', () => {
            console.log('Customer authenticated on socket');
        });

        // Cleanup
        return () => {
            socketService.off('ride_accepted', handleRideAccepted);
            socketService.off('driver_location_update', handleDriverLocation);
            socketService.off('ride_started', handleRideStarted);
            socketService.off('ride_completed', handleRideCompleted);
            socketService.off('ride_cancelled', handleRideCancelled);
            socketService.off('driver_arrived', handleDriverArrived);
            socketService.off('ride_request_error', handleError);
        };
    }, [userId, enabled]);

    const requestRide = useCallback(
        (rideData: {
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
            socketService.requestRide(rideData);
        },
        []
    );

    const updateLocation = useCallback(
        (rideId: string, latitude: number, longitude: number) => {
            socketService.updateCustomerLocation(userId, rideId, latitude, longitude);
        },
        [userId]
    );

    const cancelRide = useCallback((rideId: string, reason?: string) => {
        socketService.cancelRide(rideId, userId, reason);
    }, [userId]);

    const reset = useCallback(() => {
        setRideAccepted(null);
        setDriverLocation(null);
        setRideStarted(false);
        setRideCompleted(false);
        setRideCancelled(false);
        setDriverArrived(false);
        setError(null);
    }, []);

    return {
        rideAccepted,
        driverLocation,
        rideStarted,
        rideCompleted,
        rideCancelled,
        driverArrived,
        error,
        requestRide,
        updateLocation,
        cancelRide,
        reset,
    };
};
