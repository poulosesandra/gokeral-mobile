import api from './api';

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

  async createBooking(bookingData: any) {
    const res = await api.post('/bookings/create', bookingData);
    return res.data;
  },

  async getUserBookings() {
    const res = await api.get('/bookings/my-bookings');
    return res.data;
  },

  async getUserCurrentBooking() {
    const res = await api.get('/bookings/my-bookings/current');
    return res.data;
  },

  async getUserPendingBookings() {
    const res = await api.get('/bookings/my-bookings/pending');
    return res.data;
  },
};

export default bookingService;
