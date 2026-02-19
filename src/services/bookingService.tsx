import api from './api';

/**
 * ⚠️ BOOKING SERVICE - SPRINT 2 FEATURE
 * 
 * This service uses the OLD monolithic backend (Gokeral_Backend).
 * Booking functionality has NOT been migrated to microservices yet.
 * 
 * Current status:
 * - These endpoints exist in Gokeral_Backend/src/booking/
 * - NOT in Kerides_Backend_V1 microservices
 * - Will be migrated to a separate Booking Service in Sprint 2
 * 
 * For now, these endpoints will return errors unless you:
 * 1. Run the old Gokeral_Backend alongside microservices, OR
 * 2. Wait for Sprint 2 booking microservice implementation
 */

interface CreateBookingData {
  [key: string]: unknown;
}

const bookingService = {

  async findNearestDrivers(pickupLatitude: number, pickupLongitude: number, vehicleType: string) {
    const body = {
      pickupLatitude,
      pickupLongitude,
      vehicleType,
    };

    const res = await api.post('/bookings/find-nearest-drivers', body);
    return res.data;
  },

  async createBooking(createBookingData: CreateBookingData) {
    const res = await api.post('/bookings/create', createBookingData);
    return res.data;
  },

  // User booking endpoints
  async getUserBookings() {
    const res = await api.get('/bookings/my-bookings');
    return res.data;
  },

  async getUserPendingBookings() {
    const res = await api.get('/bookings/my-bookings/pending');
    return res.data;
  },

  async getBookingById(bookingId: string) {
    const res = await api.get(`/bookings/${bookingId}`);
    return res.data;
  },

  async cancelBooking(bookingId: string) {
    const res = await api.patch(`/bookings/${bookingId}/cancel`);
    return res.data;
  },

  async rateBooking(bookingId: string, rateBookingDto: { rating: number; review?: string }) {
    const res = await api.post(`/bookings/${bookingId}/rate`, rateBookingDto);
    return res.data;
  },
};

export default bookingService;
