import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class SocketService {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<Function>> = new Map();

    /**
     * Initialize socket connection
     */
    connect() {
        if (this.socket?.connected) {
            console.log('Socket already connected');
            return;
        }

        this.socket = io(SOCKET_URL, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            console.log('Socket connected:', this.socket?.id);
        });

        this.socket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        return this.socket;
    }

    /**
     * Authenticate user on socket
     */
    authenticate(userId: string, userType: 'CUSTOMER' | 'DRIVER') {
        if (!this.socket?.connected) {
            this.connect();
        }

        this.socket?.emit('auth', { userId, userType });
    }

    /**
     * Disconnect socket
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    /**
     * Register event listener
     */
    on(event: string, callback: Function) {
        if (!this.socket) {
            this.connect();
        }

        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }

        this.listeners.get(event)?.add(callback);
        this.socket?.on(event, callback as any);
    }

    /**
     * Remove event listener
     */
    off(event: string, callback?: Function) {
        if (!this.socket) return;

        if (callback) {
            this.listeners.get(event)?.delete(callback);
            this.socket.off(event, callback as any);
        } else {
            this.listeners.delete(event);
            this.socket.off(event);
        }
    }

    /**
     * Emit event
     */
    emit(event: string, data: any) {
        if (!this.socket?.connected) {
            console.warn('Socket not connected, cannot emit:', event);
            return;
        }

        this.socket.emit(event, data);
    }

    /**
     * CUSTOMER: Request a ride
     */
    requestRide(rideData: {
        customerId: string;
        pickupLocation: string;
        dropLocation: string;
        pickupLatitude: number;
        pickupLongitude: number;
        dropoffLatitude: number;
        dropoffLongitude: number;
        estimatedFare?: number;
        estimatedDistance?: number;
    }) {
        this.emit('ride_request', rideData);
    }

    /**
     * DRIVER: Accept ride request
     */
    acceptRide(rideId: string, driverId: string) {
        this.emit('accept_ride', { rideId, driverId });
    }

    /**
     * DRIVER: Reject ride request
     */
    rejectRide(rideId: string, driverId: string) {
        this.emit('reject_ride', { rideId, driverId });
    }

    /**
     * DRIVER: Update live location
     */
    updateDriverLocation(
        driverId: string,
        rideId: string,
        latitude: number,
        longitude: number
    ) {
        this.emit('driver_location_update', {
            driverId,
            rideId,
            latitude,
            longitude,
        });
    }

    /**
     * CUSTOMER: Update location
     */
    updateCustomerLocation(
        customerId: string,
        rideId: string,
        latitude: number,
        longitude: number
    ) {
        this.emit('customer_location_update', {
            customerId,
            rideId,
            latitude,
            longitude,
        });
    }

    /**
     * DRIVER: Notify arrival
     */
    notifyArrival(driverId: string, rideId: string) {
        this.emit('driver_arrived', { driverId, rideId });
    }

    /**
     * DRIVER: Start ride (with OTP verification)
     */
    startRide(driverId: string, rideId: string, otp: string) {
        this.emit('start_ride', { driverId, rideId, otp });
    }

    /**
     * DRIVER: Complete ride
     */
    completeRide(driverId: string, rideId: string) {
        this.emit('complete_ride', { driverId, rideId });
    }

    /**
     * CUSTOMER or DRIVER: Cancel ride
     */
    cancelRide(rideId: string, userId: string, reason?: string) {
        this.emit('cancel_ride', { rideId, userId, reason });
    }

    /**
     * Test connection
     */
    ping() {
        this.emit('ping', {});
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    /**
     * Get socket ID
     */
    getSocketId(): string | undefined {
        return this.socket?.id;
    }
}

export const socketService = new SocketService();
export default socketService;
