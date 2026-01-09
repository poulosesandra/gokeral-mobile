import React from 'react';

// Interface matching your DTO + the required driverName
export interface VehicleData {
  id: string;
  driverName: string; // Added as per requirement
  make: string;
  vehicleModel: string;
  year: number;
  seatsNo: number;
  licensePlate: string;
  vehicleImage?: string; // Optional URL
  rating?: number; // Optional visual flair
  price?: string; // Optional price estimate
  vehicleType?: string;
  distance?: number;      // NEW: Distance from pickup in km
  phoneNumber?: string;   // NEW: Driver's phone number
}

interface VehicleListModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: VehicleData[];
  onSelectVehicle: (vehicle: VehicleData) => void;
  loading?: boolean;
  errorMessage?: string | null; // NEW: optional error message
}

const VehicleListModal: React.FC<VehicleListModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  onSelectVehicle,
  loading,
  errorMessage = null, // ensure defined to avoid ReferenceError
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden animate-fadeIn">

        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-800">Available Rides</h3>
            <p className="text-xs text-gray-500">Select a driver to proceed</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-500 transition shadow-sm border border-gray-200"
          >
            ✕
          </button>
        </div>

        {/* List Content */}
        <div className="overflow-y-auto p-4 space-y-3 bg-gray-50/50 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500">Finding nearby drivers...</p>
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-3">
              <div className="text-4xl">🚗</div>
              <p className="text-sm text-gray-600 text-center">{errorMessage}</p>
              <button
                onClick={onClose}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
              >
                Try Again Later
              </button>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-3">
              <div className="text-4xl">🔍</div>
              <p className="text-sm text-gray-600 text-center">No drivers available nearby</p>
              <p className="text-xs text-gray-400 text-center">Please try again in a few minutes</p>
            </div>
          ) : (
            vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                onClick={() => onSelectVehicle(vehicle)}
                className="group bg-white p-3 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer transition-all flex items-center gap-4"
              >
                {/* Vehicle Image */}
                <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100">
                  {vehicle.vehicleImage ? (
                    <img
                      src={vehicle.vehicleImage}
                      alt={vehicle.model}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">No Img</span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-800 truncate">
                      {vehicle.make} {vehicle.vehicleModel}
                    </h4>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {vehicle.price || '₹250'}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-1">
                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                    {vehicle.driverName}
                  </p>

                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                      {vehicle.seatsNo} seats
                    </span>
                    <span className="flex items-center gap-1 text-yellow-500 font-medium">
                      ★ {vehicle.rating || '4.8'}
                    </span>

                    {/* NEW: Distance display */}
                    {vehicle.distance !== undefined && (
                      <span className="text-blue-600">
                        {vehicle.distance.toFixed(1)} km away
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleListModal;
