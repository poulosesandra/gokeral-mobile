import { driverApi } from './api';

// Backend DTO structure (matches Kerides_Backend_V1/services/driver-service)
export interface VehicleData {
  make: string;                      // Toyota, Honda, etc.
  vehicleModel: string;              // Camry, Civic, etc. (NOT "model")
  year: number;                      // 1990 - current year
  registrationNumber: string;        // License plate (NOT "licensePlate")
  type: 'HATCHBACK' | 'SEDAN' | 'SUV' | 'VAN'; // Vehicle type (NOT "vehicleType")
  seatingCapacity: number;           // 1-8 passengers (NOT "seatsNo")
  color?: string;                    // Optional: White, Black, etc.
  insuranceExpiryDate?: string;      // Optional: ISO date
  rcExpiryDate?: string;             // Optional: ISO date
}

export interface Vehicle extends VehicleData {
  _id: string;
  accountId: string;                 // Driver's account ID
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vehicle Service - Microservices Architecture
 * Uses driverApi (http://localhost:3003)
 * All endpoints under /vehicles
 */
export const vehicleService = {
  /**
   * Add new vehicle
   * POST /vehicles
   */
  addVehicle: async (vehicleData: VehicleData): Promise<Vehicle> => {
    console.log('🔵 [VEHICLE SERVICE] Adding vehicle:', vehicleData);
    const response = await driverApi.post('/vehicles', vehicleData);
    console.log('✅ [VEHICLE SERVICE] Vehicle added:', response.data);
    return response.data;
  },

  /**
   * Get driver's own vehicles
   * GET /vehicles/my-vehicles
   */
  getVehicles: async (): Promise<Vehicle[]> => {
    console.log('🔵 [VEHICLE SERVICE] Fetching my vehicles');
    const response = await driverApi.get('/vehicles/my-vehicles');
    console.log('✅ [VEHICLE SERVICE] Vehicles fetched:', response.data);
    return response.data;
  },

  /**
   * Get specific vehicle by ID
   * GET /vehicles/:id
   */
  getVehicleById: async (id: string): Promise<Vehicle> => {
    console.log('🔵 [VEHICLE SERVICE] Fetching vehicle:', id);
    const response = await driverApi.get(`/vehicles/${id}`);
    console.log('✅ [VEHICLE SERVICE] Vehicle fetched:', response.data);
    return response.data;
  },

  /**
   * Update vehicle
   * PUT /vehicles/:id
   */
  updateVehicle: async (id: string, vehicleData: Partial<VehicleData>): Promise<Vehicle> => {
    console.log('🔵 [VEHICLE SERVICE] Updating vehicle:', id, vehicleData);
    const response = await driverApi.put(`/vehicles/${id}`, vehicleData);
    console.log('✅ [VEHICLE SERVICE] Vehicle updated:', response.data);
    return response.data;
  },

  /**
   * Deactivate vehicle (soft delete)
   * PATCH /vehicles/:id/deactivate
   */
  deactivateVehicle: async (id: string): Promise<Vehicle> => {
    console.log('🔵 [VEHICLE SERVICE] Deactivating vehicle:', id);
    const response = await driverApi.patch(`/vehicles/${id}/deactivate`);
    console.log('✅ [VEHICLE SERVICE] Vehicle deactivated:', response.data);
    return response.data;
  },

  // Legacy method names for backward compatibility
  deleteVehicle: async (id: string): Promise<Vehicle> => {
    return vehicleService.deactivateVehicle(id);
  },
};

// Default export
export default vehicleService;
