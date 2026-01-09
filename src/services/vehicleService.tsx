import api from './api';

export interface VehicleData {
  make: string;
  vehicleModel: string;
  year: number;
  seatsNo: number;
  licensePlate: string;
  vehicleType: string;
  vehicleClass: string;
  fareStructure: {
    minimumFare: number;
    perKilometerRate: number;
    waitingChargePerMinute: number;
  };
  vehicleImages?: string[];
  documents?: Record<string, string>;
}

export interface Vehicle extends VehicleData {
  _id: string;
  driverId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Vehicle Service (backend routes under /drivers/vehicles)
export const vehicleService = {
  addVehicle: async (vehicleData: VehicleData): Promise<Vehicle> => {
    const response = await api.post('/drivers/vehicles', vehicleData);
    return response.data;
  },

  getVehicles: async (): Promise<Vehicle[]> => {
    const response = await api.get('/drivers/vehicles');
    return response.data;
  },

  // Public listing for users — returns empty array if API fails
  getAvailableVehicles: async (): Promise<any[]> => {
    try {
      const response = await api.get('/drivers/vehicles/public');
      const data = response.data;
      if (Array.isArray(data)) return data;
      return [];
    } catch (err) {
      // Log error but return empty array - no more hardcoded fallback data
      // eslint-disable-next-line no-console
      console.warn('vehicles API failed:', err);
      return [];
    }
  },

  getVehicleById: async (id: string): Promise<Vehicle> => {
    const response = await api.get(`/drivers/vehicles/${id}`);
    return response.data;
  },

  updateVehicle: async (id: string, vehicleData: Partial<VehicleData>): Promise<Vehicle> => {
    const response = await api.patch(`/drivers/vehicles/${id}`, vehicleData);
    return response.data;
  },

  deleteVehicle: async (id: string): Promise<void> => {
    const response = await api.delete(`/drivers/vehicles/${id}`);
    return response.data;
  },

  // Upload a single document file (multipart form)
  uploadVehicleDocument: async (vehicleId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post(`/drivers/vehicles/${vehicleId}/upload-document`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // { url, key, ... }
  },

  // Register a document URL under vehicle (documentType should match DTO keys)
  addVehicleDocument: async (vehicleId: string, documentType: string, documentUrl: string) => {
    const response = await api.post(`/drivers/vehicles/${vehicleId}/documents/${documentType}`, { documentUrl });
    return response.data;
  },

  // Upload a vehicle image file
  uploadVehicleImage: async (vehicleId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    const response = await api.post(`/drivers/vehicles/${vehicleId}/upload-image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // { url, key, ... }
  },

  // Attach image URLs to vehicle
  addVehicleImages: async (vehicleId: string, imageUrls: string[]) => {
    const response = await api.post(`/drivers/vehicles/${vehicleId}/images`, { imageUrls });
    return response.data;
  },
};

// Default export
export default vehicleService;
