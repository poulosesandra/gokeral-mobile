import React, { useEffect, useState } from 'react';
import { message } from 'antd';

interface BookingPanelProps {
  visible: boolean;
  route?: google.maps.DirectionsRoute | null;
  onClose?: () => void;
  onConfirm?: (vehicle: string, passengers: number) => void;
}

const vehicleTypes = ['Auto', 'Sedan', 'SUV'];

const BookingPanel: React.FC<BookingPanelProps> = ({ visible, route, onClose, onConfirm }) => {
  const [vehicle, setVehicle] = useState<string>(vehicleTypes[0]);
  const [passengers, setPassengers] = useState<number>(1);

  useEffect(() => {
    if (!visible) return;
    // when opened, reset local options or preserve as desired
    setVehicle(vehicleTypes[0]);
    setPassengers(1);
  }, [visible]);

  const leg = route?.legs?.[0];

  const confirm = () => {
    if (onConfirm) onConfirm(vehicle, passengers);
    message.success('Trip options saved');
  };

  return (
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
        <div className="flex gap-3">
          {vehicleTypes.map((t) => (
            <label key={t} className={`flex items-center gap-2 p-2 rounded-lg border ${vehicle === t ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
              <input
                type="radio"
                name="vehicle"
                value={t}
                checked={vehicle === t}
                onChange={() => setVehicle(t)}
                className="form-radio"
              />
              <span className="text-sm">{t}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2">Passengers</div>
        <select
          value={passengers}
          onChange={(e) => setPassengers(Number(e.target.value))}
          className="border border-gray-300 rounded-lg p-2 w-24"
        >
          {[1,2,3,4,5,6].map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <div className="mt-auto flex gap-3">
        <button
          onClick={confirm}
          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
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
  );
};

export default BookingPanel;
