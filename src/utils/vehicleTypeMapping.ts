// Vehicle Type Mapping Utilities
// Maps between user-facing labels and backend enum values
// Standardized across all services after Feb 2026 update

/**
 * Backend Vehicle Types (used across all services)
 * From: common-types/enums/vehicle-type.enum.ts
 * Used by: driver-service (vehicle registration) and booking-service (fare calculation)
 */
export type VehicleType = 'AUTO' | 'BIKE' | 'HATCHBACK' | 'SEDAN' | 'SUV';

/**
 * User-Friendly Display Labels
 */
export type DisplayVehicleType = 'Auto Rickshaw' | 'Bike' | 'Hatchback' | 'Sedan' | 'SUV';

/**
 * Convert backend vehicle type to user-friendly display name
 * Used when: Displaying vehicle info in UI
 */
export const vehicleTypeToDisplay = (vehicleType: VehicleType | string): string => {
  const mapping: Record<VehicleType, string> = {
    'AUTO': 'Auto Rickshaw',
    'BIKE': 'Bike/Motorcycle',
    'HATCHBACK': 'Hatchback',
    'SEDAN': 'Sedan (4-5 Seater)',
    'SUV': 'SUV (6-7 Seater)',
  };
  return mapping[vehicleType as VehicleType] || vehicleType;
};

/**
 * Get all vehicle types with seat capacity
 */
export const getVehicleCapacity = (vehicleType: VehicleType): number => {
  const capacity: Record<VehicleType, number> = {
    'AUTO': 3,
    'BIKE': 1,
    'HATCHBACK': 4,
    'SEDAN': 4,
    'SUV': 7,
  };
  return capacity[vehicleType] || 4;
};

/**
 * Get all vehicle types for dropdowns (driver registration)
 */
export const getVehicleTypes = (): Array<{ value: VehicleType; label: string }> => [
  { value: 'AUTO', label: 'Auto Rickshaw (3-Seater)' },
  { value: 'BIKE', label: 'Bike/Motorcycle (1 Passenger)' },
  { value: 'HATCHBACK', label: 'Hatchback (4-Seater)' },
  { value: 'SEDAN', label: 'Sedan (4-5 Seater)' },
  { value: 'SUV', label: 'SUV (6-7 Seater)' },
];

/**
 * Get user-selectable vehicle types for bookings
 */
export const getBookingVehicleTypes = (): Array<{ value: VehicleType; label: string }> => [
  { value: 'AUTO', label: 'Auto Rickshaw' },
  { value: 'BIKE', label: 'Bike' },
  { value: 'HATCHBACK', label: 'Hatchback' },
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'SUV', label: 'SUV' },
];
