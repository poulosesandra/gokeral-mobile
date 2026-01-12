import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import VehicleListModal from './modal/VehicleListModal';
import SelectDriverModal from './modal/SelectDriverModal';
import type { VehicleData } from './modal/VehicleListModal';

interface BookingPanelProps {
  visible: boolean;
  route?: google.maps.DirectionsRoute | null;
  onClose?: () => void;
  // Updated onConfirm to potentially handle final booking after modal selection
  onConfirm?: (vehicle: VehicleData) => void;
  // Pickup location for finding nearby drivers
  pickupLocation?: { lat: number; lng: number } | null;
}

const vehicleTypes = ['Auto', 'Five Seater', 'Seven Seater'];

const BookingPanel: React.FC<BookingPanelProps> = ({ visible, route, onClose, onConfirm, pickupLocation }) => {
  const [vehicleType, setVehicleType] = useState<string>(vehicleTypes[0]);

  // State for driver selection modal
  const [isSelectDriverModalOpen, setIsSelectDriverModalOpen] = useState(false);

  // State for the confirm booking modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState<VehicleData[]>([]);

  useEffect(() => {
    if (!visible) return;
    setVehicleType(vehicleTypes[0]);
    setIsSelectDriverModalOpen(false);
  }, [visible]);

  const leg = route?.legs?.[0];

  const handleProceed = () => {
    // ✅ Open driver selection modal
    if (!pickupLocation) {
      message.error('Please select a pickup location first');
      return;
    }
    setIsSelectDriverModalOpen(true);
  };

  const handleDriverSelected = async (driver: any) => {
    try {
      setIsLoadingVehicles(true);

      // ✅ Convert driver data to VehicleData format
      const vehicleData: VehicleData = {
        id: driver._id,
        driverName: driver.fullName,
        make: driver.vehicle?.make || 'Unknown',
        vehicleModel: driver.vehicle?.vehicleModel || 'Unknown',
        year: driver.vehicle?.year || 2020,
        seatsNo: driver.vehicle?.seatsNo || 4,
        licensePlate: driver.vehicle?.licensePlate || 'N/A',
        vehicleImage: driver.vehicle?.vehicleImages?.[0] || undefined,
        rating: driver.drivingExperience?.averageRating || 4.5,
        price: `₹150`, // Base fare
        vehicleType: driver.vehicle?.vehicleType || vehicleType,
        distance: driver.distance,
        phoneNumber: driver.phoneNumber,
      };

      setAvailableVehicles([vehicleData]);
      setIsSelectDriverModalOpen(false);
      setIsConfirmModalOpen(true);
    } catch (err) {
      message.error('Failed to select driver');
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const handleFinalSelection = (selectedVehicle: VehicleData) => {
    // ✅ Close modal and proceed with booking
    setIsConfirmModalOpen(false);
    if (onConfirm) onConfirm(selectedVehicle);
    message.success(`Booked ${selectedVehicle.make} ${selectedVehicle.vehicleModel} with ${selectedVehicle.driverName}`);
    if (onClose) onClose();
  };

  return (
    <>
      <div className={`h-full w-full bg-white p-4 shadow-lg border-l border-gray-200 flex flex-col transition-transform duration-300 ${visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0 pointer-events-none'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Trip Options</h3>
          <div className="flex gap-2 items-center">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded focus:outline-none"
              aria-label="Close panel"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable content area (add bottom padding so sticky footer doesn't overlap) */}
        <div className="flex-1 overflow-y-auto pr-2 pb-20">
          {route ? (
            <div className="mb-4 text-sm text-gray-600">
              <div className="font-medium text-gray-700">Selected route</div>
              <div className="mt-1">{route.summary || '—'}</div>
              <div className="mt-1 text-xs text-gray-500">{leg?.duration?.text} | {leg?.distance?.text}</div>
            </div>
          ) : (
            <div className="mb-4 text-sm text-gray-500">No route selected</div>
          )}

          {/* Vehicle Type Selector */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Vehicle type</div>
            <div className="flex flex-col items-center gap-3">
              {vehicleTypes.map((t) => (
                <label
                  key={t}
                  className={`flex items-center justify-center gap-2 py-5 px-8 rounded-lg border cursor-pointer transition-colors w-full max-w-[96%] mx-auto h-16 ${vehicleType === t ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <input
                    type="radio"
                    name="vehicle"
                    value={t}
                    checked={vehicleType === t}
                    onChange={() => setVehicleType(t)}
                    className="hidden" // Hiding default radio, using custom styling
                    aria-checked={vehicleType === t}
                  />
                  <span className={`text-lg ${vehicleType === t ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>{t}</span>
                </label>
              ))}
            </div>
          </div>


        </div>

        {/* Action Buttons - sticky footer */}
        <div className="sticky bottom-0 z-10 bg-white p-3 flex gap-3">
          <button
            onClick={handleProceed}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium shadow-sm active:scale-[0.98]"
          >
            Proceed
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Render the driver selection modal */}
      <SelectDriverModal
        isOpen={isSelectDriverModalOpen}
        onClose={() => setIsSelectDriverModalOpen(false)}
        onSelectDriver={handleDriverSelected}
        pickupLatitude={pickupLocation?.lat || 0}
        pickupLongitude={pickupLocation?.lng || 0}
        maxDrivers={10}
      />

      {/* Render the confirm booking modal */}
      <VehicleListModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        loading={isLoadingVehicles}
        vehicles={availableVehicles}
        onSelectVehicle={handleFinalSelection}
      />
    </>
  );
};

export default BookingPanel;
