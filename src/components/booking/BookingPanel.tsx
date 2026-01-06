import React, { useEffect, useState } from 'react';
import { message } from 'antd';
import VehicleListModal from './modal/VehicleListModal';
import type { VehicleData } from './modal/VehicleListModal';
import vehicleService from '../../services/vehicleService';

interface BookingPanelProps {
  visible: boolean;
  route?: google.maps.DirectionsRoute | null;
  onClose?: () => void;
  // Updated onConfirm to potentially handle final booking after modal selection
  onConfirm?: (vehicle: VehicleData) => void; 
}

const vehicleTypes = ['Auto', 'Sedan', 'SUV'];

const BookingPanel: React.FC<BookingPanelProps> = ({ visible, route, onClose, onConfirm }) => {
  const [vehicleType, setVehicleType] = useState<string>(vehicleTypes[0]);
  const [passengers, setPassengers] = useState<number>(1);
  
  // State for the new Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState<VehicleData[]>([]);

  useEffect(() => {
    if (!visible) return;
    setVehicleType(vehicleTypes[0]);
    setPassengers(1);
    setIsModalOpen(false); // Reset modal when panel re-opens
  }, [visible]);

  const leg = route?.legs?.[0];

  const fetchVehicles = async (type: string, pax: number) => {
    setIsLoadingVehicles(true);
    try {
      const all = await vehicleService.getAvailableVehicles();
      let filtered = all;
      if (type === 'Auto') {
        filtered = all.filter((v: any) => v.vehicleType === 'Auto' || v.model === 'RE');
      } else if (type === 'SUV') {
        filtered = all.filter((v: any) => v.seats >= 6);
      } else {
        filtered = all.filter((v: any) => v.seats <= 5 && v.model !== 'RE');
      }
      setAvailableVehicles(filtered as VehicleData[]);
    } catch (err) {
      console.error('Failed to fetch vehicles', err);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  const handleProceed = () => {
    // 1. Open the modal immediately
    setIsModalOpen(true);
    // 2. Start fetching data
    fetchVehicles(vehicleType, passengers);
  };

  const handleFinalSelection = (selectedVehicle: VehicleData) => {
    // This is where you finalize the booking
    setIsModalOpen(false);
    if (onConfirm) onConfirm(selectedVehicle);
    message.success(`Booked ${selectedVehicle.companyName} ${selectedVehicle.model} with ${selectedVehicle.driverName}`);
    if (onClose) onClose(); // Close the main panel
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
            <div className="flex gap-3">
              {vehicleTypes.map((t) => (
                <label key={t} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${vehicleType === t ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="radio"
                    name="vehicle"
                    value={t}
                    checked={vehicleType === t}
                    onChange={() => setVehicleType(t)}
                    className="hidden" // Hiding default radio, using custom styling
                  />
                  <span className={`text-sm ${vehicleType === t ? 'text-blue-700 font-medium' : 'text-gray-600'}`}>{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Passenger Counter */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Passengers</div>
            <select
              value={passengers}
              onChange={(e) => setPassengers(Number(e.target.value))}
              className="border border-gray-300 rounded-lg p-2 w-24 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {[1,2,3,4,5,6].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
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

      {/* Render the new Modal Portal/Component */}
      <VehicleListModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        loading={isLoadingVehicles}
        vehicles={availableVehicles}
        onSelectVehicle={handleFinalSelection}
      />
    </>
  );
};

export default BookingPanel;
