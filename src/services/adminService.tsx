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
  getDriver: async (accountId: string) => {
    const res = await driverApi.get(`/admin/drivers/${accountId}`);
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
  bulkApproveDrivers: async () => {
    const res = await driverApi.patch("/admin/drivers/bulk-approve");
    return res.data;
  },

  listVehicles: async (params?: { verificationStatus?: string; isActive?: boolean; driverId?: string }) => {
    const res = await driverApi.get("/admin/vehicles", { params });
    return res.data;
  },
  getVehicle: async (id: string) => {
    const res = await driverApi.get(`/admin/vehicles/${id}`);
    return res.data;
  },
  updateVehicleVerification: async (
    id: string,
    payload: { verificationStatus?: string; verificationNotes?: string },
  ) => {
    const res = await driverApi.patch(`/admin/vehicles/${id}/verification`, payload);
    return res.data;
  },
  bulkApproveVehicles: async () => {
    const res = await driverApi.patch("/admin/vehicles/bulk-approve");
    return res.data;
  },

  listBookings: async (params?: { status?: string; userId?: string; driverId?: string; page?: number; limit?: number }) => {
    const res = await bookingApi.get("/admin/bookings", { params });
    return res.data;
  },
  exportBookings: async (params?: { status?: string; userId?: string; driverId?: string; from?: string; to?: string }) => {
    const res = await bookingApi.get("/admin/bookings/export", { params, responseType: "blob" });
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

  listPayments: async (params?: {
    status?: string;
    method?: string;
    gateway?: string;
    bookingId?: string;
    userId?: string;
    driverId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await bookingApi.get("/admin/payments", { params });
    return res.data;
  },
  getPayment: async (id: string) => {
    const res = await bookingApi.get(`/admin/payments/${id}`);
    return res.data;
  },
  exportPayments: async (params?: {
    status?: string;
    method?: string;
    gateway?: string;
    bookingId?: string;
    userId?: string;
    driverId?: string;
    from?: string;
    to?: string;
  }) => {
    const res = await bookingApi.get("/admin/payments/export", { params, responseType: "blob" });
    return res.data;
  },

  listAccounts: async (params?: { role?: string; isActive?: boolean; search?: string }) => {
    const res = await api.get("/admin/accounts", { params });
    return res.data;
  },
  exportAccounts: async (params?: { role?: string; isActive?: boolean; search?: string }) => {
    const res = await api.get("/admin/accounts/export", { params, responseType: "blob" });
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
  exportDrivers: async (params?: {
    isVerified?: boolean;
    verificationStatus?: string;
    isOnline?: boolean;
    assignedStandId?: string;
    search?: string;
  }) => {
    const res = await driverApi.get("/admin/drivers/export", { params, responseType: "blob" });
    return res.data;
  },
  listDriverLocations: async (params?: { assignedStandId?: string }) => {
    const res = await driverApi.get("/admin/driver-locations", { params });
    return res.data;
  },
};
