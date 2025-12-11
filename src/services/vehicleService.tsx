import api from './api';

export interface VehicleData {
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  color?: string;
  type?: string;
}

export interface Vehicle extends VehicleData {
  _id: string;
  driverId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Vehicle Service
export const vehicleService = {
  addVehicle: async (vehicleData: VehicleData): Promise<Vehicle> => {
    const response = await api.post('/vehicle', vehicleData);
    return response.data;
  },

  getVehicles: async (): Promise<Vehicle[]> => {
    const response = await api.get('/vehicle');
    return response.data;
  },

  getVehicleById: async (id: string): Promise<Vehicle> => {
    const response = await api.get(`/vehicle/${id}`);
    return response.data;
  },

  updateVehicle: async (id: string, vehicleData: Partial<VehicleData>): Promise<Vehicle> => {
    const response = await api.patch(`/vehicle/${id}`, vehicleData);
    return response.data;
  },

  deleteVehicle: async (id: string): Promise<void> => {
    const response = await api.delete(`/vehicle/${id}`);
    return response.data;
  },
};

// Default export
export default vehicleService;
