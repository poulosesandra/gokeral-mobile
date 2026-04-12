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
  vehicleType?: string;
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

interface CreatePaymentOrderData {
  paymentMethod?: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'CASH';
  currency?: string;
}

interface VerifyPaymentData {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

interface DriverPayoutData {
  amount?: number;
  upiId?: string;
  note?: string;
}

interface RideLocationData {
  lat: number;
  lng: number;
  speedKmph?: number;
  heading?: number;
  accuracyMeters?: number;
}

type RazorpaySuccessPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayWindow = Window & {
  Razorpay?: new (options: Record<string, unknown>) => {
    open: () => void;
  };
};

const loadRazorpayScript = async (): Promise<boolean> => {
  const existing = document.querySelector('script[data-razorpay="sdk"]');
  if (existing) return true;

  return new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.setAttribute('data-razorpay', 'sdk');
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

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
      params: {
        pickupLat: latitude,
        pickupLng: longitude,
        vehicleType,
        radiusKm: radius,
      }
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
  async getUserBookings(params?: { page?: number; limit?: number }) {
    const res = await bookingApi.get('/bookings/my-bookings', {
      params: {
        page: params?.page,
        limit: params?.limit,
      },
    });
    return res.data;
  },

  /**
   * Get all bookings for the authenticated driver
   * Endpoint: GET /bookings/driver/my-bookings
   * Auth: Required (DRIVER role)
   */
  async getDriverBookings(params?: { page?: number; limit?: number }) {
    const res = await bookingApi.get('/bookings/driver/my-bookings', {
      params: {
        page: params?.page,
        limit: params?.limit,
      },
    });
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

  async createPaymentOrder(bookingId: string, payload: CreatePaymentOrderData) {
    const res = await bookingApi.post(`/payments/bookings/${bookingId}/order`, payload);
    return res.data;
  },

  async verifyPayment(bookingId: string, payload: VerifyPaymentData) {
    const res = await bookingApi.post(`/payments/bookings/${bookingId}/verify`, payload);
    return res.data;
  },

  async confirmCashPayment(bookingId: string) {
    const res = await bookingApi.post(`/payments/bookings/${bookingId}/cash/confirm`);
    return res.data;
  },

  async getPaymentSummary(bookingId: string) {
    const res = await bookingApi.get(`/payments/bookings/${bookingId}/summary`);
    return res.data;
  },

  async getDriverWalletBalance() {
    const res = await bookingApi.get('/payments/wallets/driver/me');
    return res.data;
  },

  async triggerDriverPayout(payload: DriverPayoutData) {
    const res = await bookingApi.post('/payments/wallets/driver/payout', payload);
    return res.data;
  },

  async createRefund(bookingId: string, payload: { amount?: number; reason?: string }) {
    const res = await bookingApi.post(`/payments/bookings/${bookingId}/refund`, payload);
    return res.data;
  },

  async updateRideLocation(bookingId: string, payload: RideLocationData) {
    const res = await bookingApi.post(`/bookings/${bookingId}/location`, payload);
    return res.data;
  },

  async getRideLocation(bookingId: string) {
    const res = await bookingApi.get(`/bookings/${bookingId}/location`);
    return res.data;
  },

  async openRazorpayCheckout(args: {
    keyId: string;
    amount: number;
    currency: string;
    orderId: string;
    name?: string;
    description?: string;
    prefill?: { name?: string; email?: string; contact?: string };
    onSuccess: (payload: RazorpaySuccessPayload) => Promise<void> | void;
    onFailure?: (error: unknown) => void;
    onDismiss?: () => void;
  }) {
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay checkout SDK');
    }

    const razorpayWindow = window as RazorpayWindow;
    if (!razorpayWindow.Razorpay) {
      throw new Error('Razorpay SDK unavailable');
    }

    const options = {
      key: args.keyId,
      amount: args.amount,
      currency: args.currency,
      name: args.name || 'Kerides',
      description: args.description || 'Ride payment',
      order_id: args.orderId,
      prefill: args.prefill || {},
      theme: { color: '#1677ff' },
      modal: {
        ondismiss: () => {
          args.onDismiss?.();
        },
      },
      handler: async (response: RazorpaySuccessPayload) => {
        await args.onSuccess(response);
      },
    };

    const checkout = new razorpayWindow.Razorpay(options);
    try {
      (checkout as any).on?.('payment.failed', (error: unknown) => {
        args.onFailure?.(error);
      });
    } catch {
      // ignore if SDK version doesn't expose event hooks
    }
    checkout.open();
  },

  /**
   * Stream real-time ride requests for driver (SSE)
   * Endpoint: GET /ride-requests/stream
   * Auth: Required (DRIVER role)
   * Returns: EventSource for Server-Sent Events
   */
  createRideRequestStream() {
    const token = localStorage.getItem('token');
    const bookingBase = import.meta.env.VITE_BOOKING_SERVICE_URL || (import.meta.env.DEV ? 'http://localhost:3004' : '');
    const url = `${bookingBase}/ride-requests/stream`;
    
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
export type {
  CreateBookingData,
  EstimateFareData,
  RateBookingData,
  VerifyOtpData,
  CreatePaymentOrderData,
  VerifyPaymentData,
  RideLocationData,
  Location,
};
