import React, { useState } from 'react';
import { message } from 'antd';
import ConfirmBookingModal from './modal/ConfirmBookingModal';
import SelectDriverModal from './modal/SelectDriverModal';
import type { VehicleData } from './modal/types';
import { calculateFare } from '../../utils/fareCalculation';

interface DriverData {
  _id: string;
  fullName: string;
  phoneNumber: string;
  distance?: number;
  vehicle?: {
    _id?: string;
    id?: string;
    make?: string;
    vehicleModel?: string;
    year?: number;
    seatsNo?: number;
    licensePlate?: string;
    vehicleImages?: string[];
    vehicleType?: string;
    fareStructure?: {
      minimumFare: number;
      perKilometerRate: number;
      waitingChargePerMinute: number;
      baseFare?: number;
      cancellationFee?: number;
    };
  };
  drivingExperience?: {
    averageRating?: number;
  };
}

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

  // State for the confirm booking modal (actual booking creation)
  const [isConfirmBookingModalOpen, setIsConfirmBookingModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);

  const resetPanelState = () => {
    setIsSelectDriverModalOpen(false);
    setIsConfirmBookingModalOpen(false);
    setSelectedVehicle(null);
  };

  const handleClosePanel = () => {
    resetPanelState();
    if (onClose) onClose();
  };

  const leg = route?.legs?.[0];

  const handleProceed = () => {
    // ✅ Open driver selection modal
    if (!pickupLocation) {
      message.error('Please select a pickup location first');
      return;
    }
    setIsSelectDriverModalOpen(true);
  };

  const handleDriverSelected = async (driver: DriverData) => {
    try {
      // Calculate fare based on route distance/duration and vehicle's fare structure
      let calculatedPrice = '₹150'; // Default fallback

      if (route?.legs?.[0]) {
        const leg = route.legs[0];
        const distanceInMeters = leg.distance?.value || 0;
        const durationInSeconds = leg.duration?.value || 0;
        const distanceInKm = distanceInMeters / 1000;

        // Get vehicle's fare structure if available
        const fareStructure = driver.vehicle?.fareStructure || {
          minimumFare: 50,
          perKilometerRate: 15,
          waitingChargePerMinute: 1,
        };

        // Calculate fare using the utility function
        const fare = calculateFare(distanceInKm, durationInSeconds, fareStructure);
        calculatedPrice = `₹${Math.round(fare)}`;
      }

      // ✅ Convert driver data to VehicleData format
      const vehicleData: VehicleData = {
        id: driver._id,
        vehicleId: driver.vehicle?._id || driver.vehicle?.id || 'Unknown_Vehicle_ID',
        driverName: driver.fullName,
        make: driver.vehicle?.make || 'Unknown',
        vehicleModel: driver.vehicle?.vehicleModel || 'Unknown',
        year: driver.vehicle?.year || 2020,
        seatsNo: driver.vehicle?.seatsNo || 4,
        licensePlate: driver.vehicle?.licensePlate || 'N/A',
        vehicleImage: driver.vehicle?.vehicleImages?.[0] || undefined,
        rating: driver.drivingExperience?.averageRating || 4.5,
        price: calculatedPrice, // Use calculated price
        vehicleType: driver.vehicle?.vehicleType || vehicleType,
        distance: driver.distance,
        phoneNumber: driver.phoneNumber,
      };

      // ✅ Directly open confirm booking modal after selecting a driver
      setSelectedVehicle(vehicleData);
      setIsSelectDriverModalOpen(false);
      setIsConfirmBookingModalOpen(true);
    } catch {
      message.error('Failed to select driver');
    }
  };

  const handleBookingSuccess = () => {
    // ✅ Booking successfully created in database
    setIsConfirmBookingModalOpen(false);
    setSelectedVehicle(null);
    message.success('Booking confirmed! Driver will arrive shortly.');
    if (onConfirm) onConfirm(selectedVehicle!);
    handleClosePanel();
  };

  return (
    <>
      <div className={`h-full w-full bg-white p-4 shadow-lg border-l border-gray-200 flex flex-col transition-transform duration-300 ${visible ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0 pointer-events-none'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Trip Options</h3>
          <div className="flex gap-2 items-center">
            <button
              onClick={handleClosePanel}
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
            onClick={handleClosePanel}
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
        route={route}
      />

      {/* Render the confirm booking modal (actual booking creation with payment & details) */}
      {selectedVehicle && route?.legs?.[0] && (
        <ConfirmBookingModal
          isOpen={isConfirmBookingModalOpen}
          onClose={() => {
            setIsConfirmBookingModalOpen(false);
            setSelectedVehicle(null);
          }}
          onSuccess={handleBookingSuccess}
          selectedVehicle={selectedVehicle}
          tripDetails={{
            pickup: route.legs[0].start_address || 'Pickup Location',
            destination: route.legs[0].end_address || 'Destination Location',
            distance: route.legs[0].distance?.text || '0 km',
            duration: route.legs[0].duration?.text || '0 mins',
            passengers: 1,
            pickupLocation: {
              lat: route.legs[0].start_location.lat(),
              lng: route.legs[0].start_location.lng(),
            },
            dropLocation: {
              lat: route.legs[0].end_location.lat(),
              lng: route.legs[0].end_location.lng(),
            },
            routeSummary: route.summary || 'Direct Route',
            polyline: typeof route.overview_polyline === 'string' ? route.overview_polyline : '',
          }}
        />
      )}
    </>
  );
};

export default BookingPanel;
