import { bookingApi } from './api';

/**
 * ✅ BOOKING SERVICE - SPRINT 2 MICROSERVICE
 * 
 * This service connects to the new Kerides Booking Service microservice.
 * Port: 3004 (http://localhost:3004)
 * 
 * Features:
 * - Ride booking creation
 * - Fare estimation with dynamic pricing
 * - Driver matching (geospatial)
 * - OTP verification for ride completion
 * - Real-time ride requests (SSE)
 * - Booking status management
 * - Rating system
 * 
 * Microservice Architecture:
 * - Auth: Port 3001 (JWT authentication)
 * - User: Port 3002 (User management)
 * - Driver: Port 3003 (Driver management)
 * - Booking: Port 3004 (Ride booking - Sprint 2) ✨
 */

// TypeScript Interfaces matching Kerides Backend DTOs

interface Coordinates {
  lat: number;
  lng: number;
}

interface Location {
  address: string;
  coordinates: Coordinates;
}

interface Distance {
  text: string;  // e.g., "5.2 km"
  value: number; // meters, e.g., 5200
}

interface Duration {
  text: string;  // e.g., "15 mins"
  value: number; // seconds, e.g., 900
}

interface CreateBookingData {
  origin: Location;
  destination: Location;
  distance: Distance;
  duration: Duration;
  vehicleId?: string;
  driverId?: string;
  paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'WALLET';
  scheduledAt?: string; // ISO 8601 format
  notes?: string;
}

interface EstimateFareData {
  distanceInMeters: number;  // Distance in meters (e.g., 5200)
  durationInSeconds: number; // Duration in seconds (e.g., 900)
  vehicleId?: string;
  vehicleType?: string;
}

interface RateBookingData {
  rating: number; // 1-5
  review?: string;
}

interface VerifyOtpData {
  otp: string;
}

const bookingService = {
  /**
   * Estimate fare for a trip
   * Endpoint: POST /bookings/estimate-fare
   * Auth: Required (USER or DRIVER role)
   */
  async estimateFare(estimateFareData: EstimateFareData) {
    const res = await bookingApi.post('/bookings/estimate-fare', estimateFareData);
    return res.data;
  },

  /**
   * Find nearby available drivers
   * Endpoint: GET /bookings/nearby-drivers
   * Auth: Required (USER role)
   */
  async findNearbyDrivers(latitude: number, longitude: number, vehicleType: string, radius: number = 5) {
    const res = await bookingApi.get('/bookings/nearby-drivers', {
      params: { latitude, longitude, vehicleType, radius }
    });
    return res.data;
  },

  /**
   * Create a new booking (ride request)
   * Endpoint: POST /bookings
   * Auth: Required (USER role)
   */
  async createBooking(createBookingData: CreateBookingData) {
    const res = await bookingApi.post('/bookings', createBookingData);
    return res.data;
  },

  /**
   * Get all bookings for the authenticated user
   * Endpoint: GET /bookings/my-bookings
   * Auth: Required (USER role)
   */
  async getUserBookings() {
    const res = await bookingApi.get('/bookings/my-bookings');
    return res.data;
  },

  /**
   * Get all bookings for the authenticated driver
   * Endpoint: GET /bookings/driver/my-bookings
   * Auth: Required (DRIVER role)
   */
  async getDriverBookings() {
    const res = await bookingApi.get('/bookings/driver/my-bookings');
    return res.data;
  },

  /**
   * Get all pending bookings (available rides for drivers)
   * Endpoint: GET /bookings/pending
   * Auth: Required (DRIVER role)
   */
  async getPendingBookings() {
    const res = await bookingApi.get('/bookings/pending');
    return res.data;
  },

  /**
   * Get booking details by ID
   * Endpoint: GET /bookings/:bookingId
   * Auth: Required (USER or DRIVER role)
   */
  async getBookingById(bookingId: string) {
    const res = await bookingApi.get(`/bookings/${bookingId}`);
    return res.data;
  },

  /**
   * Accept a booking (driver only)
   * Endpoint: POST /bookings/:bookingId/accept
   * Auth: Required (DRIVER role)
   */
  async acceptBooking(bookingId: string) {
    const res = await bookingApi.post(`/bookings/${bookingId}/accept`);
    return res.data;
  },

  /**
   * Reject a booking (driver only)
   * Endpoint: POST /bookings/:bookingId/reject
   * Auth: Required (DRIVER role)
   */
  async rejectBooking(bookingId: string) {
    const res = await bookingApi.post(`/bookings/${bookingId}/reject`);
    return res.data;
  },

  /**
   * Generate OTP for ride completion (user only)
   * Endpoint: POST /bookings/:bookingId/generate-otp
   * Auth: Required (USER role)
   */
  async generateOtp(bookingId: string) {
    const res = await bookingApi.post(`/bookings/${bookingId}/generate-otp`);
    return res.data;
  },

  /**
   * Verify OTP and complete ride (driver only)
   * Endpoint: POST /bookings/:bookingId/verify-otp
   * Auth: Required (DRIVER role)
   */
  async verifyOtpAndComplete(bookingId: string, verifyOtpData: VerifyOtpData) {
    const res = await bookingApi.post(`/bookings/${bookingId}/verify-otp`, verifyOtpData);
    return res.data;
  },

  /**
   * Rate a completed booking (user only)
   * Endpoint: POST /bookings/:bookingId/rate
   * Auth: Required (USER role)
   */
  async rateBooking(bookingId: string, rateBookingData: RateBookingData) {
    const res = await bookingApi.post(`/bookings/${bookingId}/rate`, rateBookingData);
    return res.data;
  },

  /**
   * Update booking status
   * Endpoint: PATCH /bookings/:bookingId/status
   * Auth: Required (USER or DRIVER role)
   */
  async updateBookingStatus(bookingId: string, status: string) {
    const res = await bookingApi.patch(`/bookings/${bookingId}/status`, { status });
    return res.data;
  },

  /**
   * Stream real-time ride requests for driver (SSE)
   * Endpoint: GET /ride-requests/stream
   * Auth: Required (DRIVER role)
   * Returns: EventSource for Server-Sent Events
   */
  createRideRequestStream() {
    const token = localStorage.getItem('token');
    const url = `${import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3004'}/ride-requests/stream`;
    
    // Create EventSource with authentication header (via query param as EventSource doesn't support custom headers)
    const eventSource = new EventSource(`${url}?token=${token}`);
    
    return eventSource;
  },

  /**
   * Get pending ride requests for driver
   * Endpoint: GET /ride-requests/pending
   * Auth: Required (DRIVER role)
   */
  async getPendingRideRequests() {
    const res = await bookingApi.get('/ride-requests/pending');
    return res.data;
  },
};

export default bookingService;
export type { CreateBookingData, EstimateFareData, RateBookingData, VerifyOtpData, Location };
