import api from './api';

export interface VehicleData {
  companyName: string;
  model: string;
  year: number;
  seats: number;
  licensePlateNumber: string;
  vehicleType: string;
  vehicleClass: string;
  vehicleImage?: string;
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

  // Public listing for users — falls back to two dummy vehicles if API fails or returns none
  getAvailableVehicles: async (): Promise<any[]> => {
    try {
      const response = await api.get('/vehicles');
      const data = response.data;
      if (Array.isArray(data) && data.length > 0) return data;
    } catch (err) {
      // If the API isn't available, we'll return demo vehicles so the UI still works.
      // The error is logged for debugging; UI uses fallback.
      // eslint-disable-next-line no-console
      console.warn('vehicles API failed — using fallback demo vehicles', err);
    }

    // Fallback dummy vehicles (no images as requested)
    return [
      {
        id: 'demo-1',
        driverName: 'Rajesh Kumar',
        companyName: 'Maruti Suzuki',
        model: 'Dzire',
        year: 2022,
        seats: 4,
        licensePlateNumber: 'KL-07-BW-1234',
        vehicleImage: undefined,
        rating: 4.8,
        price: '₹450',
        vehicleType: 'Sedan',
      },
      {
        id: 'demo-2',
        driverName: 'Anil Menon',
        companyName: 'Toyota',
        model: 'Etios',
        year: 2021,
        seats: 4,
        licensePlateNumber: 'KL-07-CC-5678',
        vehicleImage: undefined,
        rating: 4.6,
        price: '₹480',
        vehicleType: 'Sedan',
      },
    ];
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
