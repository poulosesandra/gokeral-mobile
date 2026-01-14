import api from './api';

interface CreateBookingData {
  [key: string]: unknown;
}

const bookingService = {

  async createBooking(createBookingData: CreateBookingData) {
    const res = await api.post('/bookings/create', createBookingData);
    return res.data;
  },

  async findNearestDrivers(pickupLatitude: number, pickupLongitude: number, vehicleType: string) {
    const body = {
      pickupLatitude,
      pickupLongitude,
      vehicleType,
    };

    const res = await api.post('/bookings/find-nearest-drivers', body);
    return res.data;
  },

  // Create a new booking
  async createBooking(bookingData: any) {
    const res = await api.post('/bookings/create', bookingData);
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
