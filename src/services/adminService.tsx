import api, { driverApi, bookingApi } from "./api";

export type StandPayload = {
  name: string;
  latitude: number;
  longitude: number;
  radiusKm?: number;
  isActive?: boolean;
};

export const adminService = {
  listStands: async (params?: { isActive?: boolean; search?: string }) => {
    const res = await driverApi.get("/admin/stands", { params });
    return res.data;
  },
  createStand: async (payload: StandPayload) => {
    const res = await driverApi.post("/admin/stands", payload);
    return res.data;
  },
  updateStand: async (id: string, payload: Partial<StandPayload>) => {
    const res = await driverApi.put(`/admin/stands/${id}`, payload);
    return res.data;
  },
  updateStandStatus: async (id: string, isActive: boolean) => {
    const res = await driverApi.patch(`/admin/stands/${id}/status`, { isActive });
    return res.data;
  },
  deleteStand: async (id: string) => {
    const res = await driverApi.delete(`/admin/stands/${id}`);
    return res.data;
  },

  listDrivers: async (params?: {
    isVerified?: boolean;
    verificationStatus?: string;
    isOnline?: boolean;
    assignedStandId?: string;
    search?: string;
  }) => {
    const res = await driverApi.get("/admin/drivers", { params });
    return res.data;
  },
  assignDriverStand: async (accountId: string, assignedStandId?: string) => {
    const res = await driverApi.patch(`/admin/drivers/${accountId}/stand`, { assignedStandId });
    return res.data;
  },
  updateDriverVerification: async (
    accountId: string,
    payload: { isVerified?: boolean; verificationStatus?: string; verificationNotes?: string },
  ) => {
    const res = await driverApi.patch(`/admin/drivers/${accountId}/verification`, payload);
    return res.data;
  },

  listVehicles: async (params?: { verificationStatus?: string; isActive?: boolean; driverId?: string }) => {
    const res = await driverApi.get("/admin/vehicles", { params });
    return res.data;
  },
  updateVehicleVerification: async (
    id: string,
    payload: { verificationStatus?: string; verificationNotes?: string },
  ) => {
    const res = await driverApi.patch(`/admin/vehicles/${id}/verification`, payload);
    return res.data;
  },

  listBookings: async (params?: { status?: string; userId?: string; driverId?: string; page?: number; limit?: number }) => {
    const res = await bookingApi.get("/admin/bookings", { params });
    return res.data;
  },
  getBooking: async (id: string) => {
    const res = await bookingApi.get(`/admin/bookings/${id}`);
    return res.data;
  },
  cancelBooking: async (id: string, reason?: string) => {
    const res = await bookingApi.patch(`/admin/bookings/${id}/cancel`, { reason });
    return res.data;
  },
  assignBookingDriver: async (id: string, driverId: string) => {
    const res = await bookingApi.patch(`/admin/bookings/${id}/assign-driver`, { driverId });
    return res.data;
  },

  listAccounts: async (params?: { role?: string; isActive?: boolean; search?: string }) => {
    const res = await api.get("/admin/accounts", { params });
    return res.data;
  },
  updateAccountStatus: async (id: string, isActive: boolean) => {
    const res = await api.patch(`/admin/accounts/${id}/status`, { isActive });
    return res.data;
  },
  updateAccountRole: async (id: string, role: string) => {
    const res = await api.patch(`/admin/accounts/${id}/role`, { role });
    return res.data;
  },
};
