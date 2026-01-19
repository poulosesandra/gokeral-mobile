// Shared booking modal types.
// Kept in a standalone file so the UI can change (e.g., removing a modal)
// without breaking type imports across components.

export interface VehicleData {
  vehicleId: string;
  id: string;
  driverName: string;
  make: string;
  vehicleModel: string;
  year: number;
  seatsNo: number;
  licensePlate: string;
  vehicleImage?: string;
  rating?: number;
  // Use numeric price to avoid string parsing in multiple places
  price?: number;
  vehicleType?: string;
  distance?: number;
  phoneNumber?: string;
} 
