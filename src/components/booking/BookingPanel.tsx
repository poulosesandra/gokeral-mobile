import React, { useCallback, useMemo, useState } from 'react';
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

type VehicleType = 'AUTO' | 'BIKE' | 'HATCHBACK' | 'SEDAN' | 'SUV';
const vehicleTypes: VehicleType[] = ['AUTO', 'BIKE', 'HATCHBACK', 'SEDAN', 'SUV'];

const vehicleTypeLabels: Record<VehicleType, string> = {
  'AUTO': 'Auto Rickshaw',
  'BIKE': 'Bike',
  'HATCHBACK': 'Hatchback',
  'SEDAN': 'Sedan (4-5 Seater)',
  'SUV': 'SUV (6-7 Seater)',
};

const VehicleTypeSelector: React.FC<{ value: VehicleType; onChange: (v: VehicleType) => void }> = React.memo(({ value, onChange }) => {
  return (
    <div role="radiogroup" aria-label="Vehicle types" className="flex flex-col w-full gap-2">
      {vehicleTypes.map((t) => (
        <label
          key={t}
          role="radio"
          aria-checked={value === t}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onChange(t);
          }}
          className={`w-full flex items-center justify-center gap-3 h- min-h-[56px] px-4 rounded-lg border cursor-pointer transition-colors ${value === t ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
        >
          <input
            type="radio"
            name="vehicle"
            value={t}
            checked={value === t}
            onChange={() => onChange(t)}
            className="hidden"
            aria-hidden="true"
          />
          <span className="text-sm sm:text-base text-center flex-1">{vehicleTypeLabels[t]}</span>
        </label>
      ))}
    </div>
  );
});

const BookingPanel: React.FC<BookingPanelProps> = ({ visible, route, onClose, onConfirm, pickupLocation }) => {
  const [vehicleType, setVehicleType] = useState<VehicleType>(vehicleTypes[0]);

  // State for driver selection modal
  const [isSelectDriverModalOpen, setIsSelectDriverModalOpen] = useState(false);

  // State for the confirm booking modal (actual booking creation)
  const [isConfirmBookingModalOpen, setIsConfirmBookingModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleData | null>(null);

  const resetPanelState = useCallback(() => {
    setIsSelectDriverModalOpen(false);
    setIsConfirmBookingModalOpen(false);
    setSelectedVehicle(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    resetPanelState();
    onClose?.();
  }, [onClose, resetPanelState]);

  const leg = useMemo(() => route?.legs?.[0], [route]);

  const handleProceed = useCallback(() => {
    if (!pickupLocation) {
      message.error('Please select a pickup location first');
      return;
    }
    setIsSelectDriverModalOpen(true);
  }, [pickupLocation]);

  const handleDriverSelected = useCallback(async (driver: DriverData) => {
    try {
      let fareValue = 150;

      if (route?.legs?.[0]) {
        const rLeg = route.legs[0];
        const distanceInMeters = rLeg.distance?.value || 0;
        const durationInSeconds = rLeg.duration?.value || 0;
        const distanceInKm = distanceInMeters / 1000;

        const fareStructure = driver.vehicle?.fareStructure || {
          minimumFare: 50,
          perKilometerRate: 15,
          waitingChargePerMinute: 1,
        };

        fareValue = calculateFare(distanceInKm, durationInSeconds, fareStructure);
      }

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
        price: Math.round(fareValue),
        vehicleType: driver.vehicle?.vehicleType || vehicleType,
        distance: driver.distance,
        phoneNumber: driver.phoneNumber,
      };

      setSelectedVehicle(vehicleData);
      setIsSelectDriverModalOpen(false);
      setIsConfirmBookingModalOpen(true);
    } catch (err) {
      console.error('Failed to select driver', err);
      message.error('Failed to select driver');
    }
  }, [route, vehicleType]);

  const handleBookingSuccess = useCallback(() => {
    setIsConfirmBookingModalOpen(false);
    setSelectedVehicle(null);
    message.success('Booking confirmed! Driver will arrive shortly.');
    if (onConfirm && selectedVehicle) onConfirm(selectedVehicle);
    handleClosePanel();
  }, [onConfirm, selectedVehicle, handleClosePanel]);

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

          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Vehicle type</div>
            <div className="flex flex-col w-full gap-2">
              <VehicleTypeSelector value={vehicleType} onChange={setVehicleType} />
            </div>
            
          </div>
        </div>

        {/* Action Buttons - sticky footer */}
        <div className="sticky bottom-0 z-10 bg-white p-3 flex gap-3 items-center">
          <button
            onClick={handleProceed}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium shadow-sm active:scale-[0.98]"
            aria-label="Proceed to find drivers"
          >
            Proceed
          </button>
          <button
            onClick={handleClosePanel}
            className="w-36 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
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
        vehicleType={vehicleType} // <-- added prop
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
