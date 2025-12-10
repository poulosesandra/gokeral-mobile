import api from './api';

export interface Vehicle {
  _id?: string;
  driverId: string;
  make: string;
  model: string;
  year: number;
  seats: number;
  licensePlate: string;
  vehicleType: string;
  vehicleClass: string;
  documents?: {
    license?: string;
    insurance?: string;
    addressProof?: string;
    policeCertificate?: string;
  };
  vehicleImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVehicleDto {
  make: string;
  model: string;
  year: number;
  seats: number;
  licensePlate: string;
  vehicleType: string;
  vehicleClass: string;
  documents?: {
    license?: string;
    insurance?: string;
    addressProof?: string;
    policeCertificate?: string;
  };
  vehicleImage?: string;
}

export interface UpdateVehicleDto extends Partial<CreateVehicleDto> {}

export const vehicleService = {
  // Create a new vehicle
  createVehicle: async (vehicleData: CreateVehicleDto): Promise<Vehicle> => {
    const response = await api.post('/vehicles', vehicleData);
    return response.data;
  },

  // Get all vehicles (public)
  getAllVehicles: async (): Promise<Vehicle[]> => {
    const response = await api.get('/vehicles');
    return response.data;
  },

  // Get vehicles for current driver (requires auth)
  getMyVehicles: async (): Promise<Vehicle[]> => {
    const response = await api.get('/vehicles/my-list');
    return response.data;
  },

  // Update a vehicle
  updateVehicle: async (vehicleId: string, updateData: UpdateVehicleDto): Promise<Vehicle> => {
    const response = await api.put(`/vehicles/${vehicleId}`, updateData);
    return response.data;
  },

  // Upload vehicle documents (if you have a separate endpoint for file uploads)
  uploadDocument: async (vehicleId: string, formData: FormData): Promise<any> => {
    const response = await api.post(`/vehicles/${vehicleId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default vehicleService;
