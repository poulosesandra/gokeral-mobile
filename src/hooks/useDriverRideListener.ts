import { useEffect, useState, useCallback } from 'react';
import socketService from '../services/socketService';

export interface NewRideRequest {
    rideId: string;
    customerId: string;
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

interface RideEvent {
    rideId: string;
    message?: string;
    status?: string;
    [key: string]: any;
}

/**
 * Hook for driver to listen for new ride requests and customer updates
 */
export const useDriverRideListener = (driverId: string, enabled: boolean = true) => {
    const [newRideRequest, setNewRideRequest] = useState<NewRideRequest | null>(null);
    const [customerLocation, setCustomerLocation] = useState<CustomerLocation | null>(null);
    const [acceptSuccess, setAcceptSuccess] = useState(false);
    const [arrivedSuccess, setArrivedSuccess] = useState(false);
    const [rideStarted, setRideStarted] = useState(false);
    const [currentRideId, setCurrentRideId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled || !driverId) return;

        // Authenticate on socket
        socketService.authenticate(driverId, 'DRIVER');

        // Listen for new ride requests
        const handleNewRideRequest = (data: NewRideRequest) => {
            setNewRideRequest(data);
            setError(null);
        };

        // Listen for customer location updates
        const handleCustomerLocation = (data: CustomerLocation) => {
            setCustomerLocation(data);
        };

        // Listen for accept ride success
        const handleAcceptSuccess = (data: RideEvent) => {
            setAcceptSuccess(true);
            setCurrentRideId(data.rideId);
            setNewRideRequest(null);
            setError(null);
        };

        // Listen for arrival success
        const handleArrivedSuccess = (data: RideEvent) => {
            setArrivedSuccess(true);
            setError(null);
        };

        // Listen for ride started
        const handleRideStarted = (data: RideEvent) => {
            setRideStarted(true);
            setArrivedSuccess(false);
            setError(null);
        };

        // Listen for errors
        const handleError = (data: any) => {
            setError(data.message);
        };

        socketService.on('new_ride_request', handleNewRideRequest);
        socketService.on('customer_location_update', handleCustomerLocation);
        socketService.on('accept_ride_success', handleAcceptSuccess);
        socketService.on('driver_arrived_success', handleArrivedSuccess);
        socketService.on('start_ride_success', handleRideStarted);
        socketService.on('accept_ride_error', handleError);
        socketService.on('driver_arrived_error', handleError);
        socketService.on('start_ride_error', handleError);
        socketService.on('auth_success', () => {
            console.log('Driver authenticated on socket');
        });

        // Cleanup
        return () => {
            socketService.off('new_ride_request', handleNewRideRequest);
            socketService.off('customer_location_update', handleCustomerLocation);
            socketService.off('accept_ride_success', handleAcceptSuccess);
            socketService.off('driver_arrived_success', handleArrivedSuccess);
            socketService.off('start_ride_success', handleRideStarted);
            socketService.off('accept_ride_error', handleError);
            socketService.off('driver_arrived_error', handleError);
            socketService.off('start_ride_error', handleError);
        };
    }, [driverId, enabled]);

    const acceptRide = useCallback(
        (rideId: string) => {
            socketService.acceptRide(rideId, driverId);
        },
        [driverId]
    );

    const rejectRide = useCallback(
        (rideId: string) => {
            socketService.rejectRide(rideId, driverId);
            setNewRideRequest(null);
        },
        [driverId]
    );

    const updateLocation = useCallback(
        (rideId: string, latitude: number, longitude: number) => {
            socketService.updateDriverLocation(driverId, rideId, latitude, longitude);
        },
        [driverId]
    );

    const notifyArrival = useCallback((rideId: string) => {
        socketService.notifyArrival(driverId, rideId);
    }, [driverId]);

    const startRide = useCallback(
        (rideId: string, otp: string) => {
            socketService.startRide(driverId, rideId, otp);
        },
        [driverId]
    );

    const completeRide = useCallback((rideId: string) => {
        socketService.completeRide(driverId, rideId);
        setAcceptSuccess(false);
        setRideStarted(false);
        setCurrentRideId(null);
    }, [driverId]);

    const cancelRide = useCallback(
        (rideId: string, reason?: string) => {
            socketService.cancelRide(rideId, driverId, reason);
            setAcceptSuccess(false);
            setRideStarted(false);
            setCurrentRideId(null);
        },
        [driverId]
    );

    const reset = useCallback(() => {
        setNewRideRequest(null);
        setCustomerLocation(null);
        setAcceptSuccess(false);
        setArrivedSuccess(false);
        setRideStarted(false);
        setCurrentRideId(null);
        setError(null);
    }, []);

    return {
        newRideRequest,
        customerLocation,
        acceptSuccess,
        arrivedSuccess,
        rideStarted,
        currentRideId,
        error,
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
