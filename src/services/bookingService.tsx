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
};

export default bookingService;
