import React, { useState } from 'react';
import { message } from 'antd';
import bookingService from '../../../services/bookingService';
import type { VehicleData } from './types';

interface Booking {
    selectedVehicle: VehicleData;
    tripDetails: {
        pickup: string;
        destination: string;
        distance: string;
        duration: string;
        passengers: number;
        pickupLocation?: { lat: number; lng: number };
        dropLocation?: { lat: number; lng: number };
        routeSummary?: string;
        polyline?: string;
    };
    paymentMethod: 'CASH' | 'UPI' | 'CARD';
    [key: string]: unknown;
}

const mapVehicleType = (t?: string) => {
    if (!t) return 'Auto';
    const s = String(t).toLowerCase();
    if (s.includes('auto')) return 'Auto';
    if (s.includes('suv')) return 'Seven Seater';
    if (s.includes('sedan') || s.includes('hatch')) return 'Five Seater';
    return t;
};

interface ConfirmBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (booking: Booking) => void;
    selectedVehicle: VehicleData | null;
    tripDetails: {
        pickup: string;
        destination: string;
        distance: string;
        duration: string;
        passengers: number;
        pickupLocation?: { lat: number; lng: number };
        dropLocation?: { lat: number; lng: number };
        routeSummary?: string;
        polyline?: string;
    };
}

const ConfirmBookingModal: React.FC<ConfirmBookingModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    selectedVehicle,
    tripDetails,
}) => {
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userNotes, setUserNotes] = useState('');

    if (!isOpen || !selectedVehicle) return null;

    // Parse price from string like "₹450" to number
    const parsePrice = (priceStr: string | undefined): number => {
        if (!priceStr) return 250;
        const match = priceStr.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 250;
    };

    const estimatedFare = parsePrice(selectedVehicle.price);

    const handleConfirmBooking = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Get current user info from localStorage
            const userData = localStorage.getItem('userData');
            const user = userData ? JSON.parse(userData) : {};

            // Parse distance value (e.g., "10.3 km" -> 10.3)
            const distanceValue = parseFloat(tripDetails.distance.replace(/[^\d.]/g, '')) || 0;
            const durationValue = parseInt(tripDetails.duration.replace(/[^\d]/g, '')) || 0;

            // Create booking via backend API
            const bookingData = {
                origin: {
                    location: {
                        lat: tripDetails.pickupLocation?.lat || 0,
                        lng: tripDetails.pickupLocation?.lng || 0,
                    },
                    address: tripDetails.pickup,
                },
                destination: {
                    location: {
                        lat: tripDetails.dropLocation?.lat || 0,
                        lng: tripDetails.dropLocation?.lng || 0,
                    },
                    address: tripDetails.destination,
                },
                distance: {
                    text: tripDetails.distance,
                    value: distanceValue * 1000, // Convert km to meters
                },
                duration: {
                    text: tripDetails.duration,
                    value: durationValue * 60, // Convert minutes to seconds
                },
                route: {
                    summary: tripDetails.routeSummary || 'Direct Route',
                    polyline: tripDetails.polyline || '',
                    waypoints: [],
                    bounds: {
                        northeast: { lat: tripDetails.pickupLocation?.lat || 0, lng: tripDetails.pickupLocation?.lng || 0 },
                        southwest: { lat: tripDetails.dropLocation?.lat || 0, lng: tripDetails.dropLocation?.lng || 0 },
                    },
                },
                price: {
                    baseFare: 0,
                    minimumFare: 50,
                    bookingFee: 10,
                    total: estimatedFare,
                },
                vehiclePreference: mapVehicleType(selectedVehicle.vehicleType),
                userInfo: {
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                    name: user.fullName || user.name || 'Guest',
                    scheduledDateTime: new Date().toISOString(),
                    phone: user.phoneNumber || user.phone || '',
                },
                paymentMethod: paymentMethod,
                // New fields for driver selection
                selectedDriverId: selectedVehicle.id,
                selectedVehicleId: selectedVehicle.vehicleId,
                passengers: tripDetails.passengers,
                userNotes: userNotes,
            };

            console.log('🔵 [CONFIRM BOOKING] Creating booking:', bookingData);

            const response = await bookingService.createBooking(bookingData);

            console.log('✅ [CONFIRM BOOKING] Booking created:', response);

            message.success('Booking confirmed! Driver will arrive shortly.');

            onSuccess({
                ...response,
                selectedVehicle,
                tripDetails,
                paymentMethod,
            });

            onClose();
        } catch (err) {
            console.error('❌ [CONFIRM BOOKING] Error:', err);
            const errorMessage = (err as Error & { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create booking. Please try again.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Confirm Your Ride</h2>
                        <button
                            onClick={onClose}
                            className="hover:bg-white/20 rounded-full p-1 transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Driver Info */}
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                            🚗
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{selectedVehicle.driverName}</h3>
                            <p className="text-sm text-gray-500">
                                {selectedVehicle.make} {selectedVehicle.vehicleModel}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-yellow-500">★</span>
                                <span className="text-sm font-medium">{selectedVehicle.rating?.toFixed(1) || '4.5'}</span>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-gray-500">{selectedVehicle.licensePlate}</span>
                            </div>
                        </div>
                        {selectedVehicle.phoneNumber && (
                            <a
                                href={`tel:${selectedVehicle.phoneNumber}`}
                                className="p-2 bg-green-500 rounded-full text-white hover:bg-green-600 transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </a>
                        )}
                    </div>

                    {/* Trip Details */}
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
                            <div>
                                <p className="text-xs text-gray-500">Pickup</p>
                                <p className="text-sm font-medium text-gray-800">{tripDetails.pickup}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5"></div>
                            <div>
                                <p className="text-xs text-gray-500">Drop-off</p>
                                <p className="text-sm font-medium text-gray-800">{tripDetails.destination}</p>
                            </div>
                        </div>
                    </div>

                    {/* Trip Stats */}
                    <div className="flex justify-between py-3 border-y border-gray-100">
                        <div className="text-center">
                            <p className="text-xs text-gray-500">Duration</p>
                            <p className="font-semibold text-gray-800">{tripDetails.duration}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-500">Distance</p>
                            <p className="font-semibold text-gray-800">{tripDetails.distance}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-500">Passengers</p>
                            <p className="font-semibold text-gray-800">{tripDetails.passengers}</p>
                        </div>
                        {selectedVehicle.distance !== undefined && (
                            <div className="text-center">
                                <p className="text-xs text-gray-500">Driver ETA</p>
                                <p className="font-semibold text-blue-600">{selectedVehicle.distance.toFixed(1)} km</p>
                            </div>
                        )}
                    </div>

                    {/* Payment Method
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Payment Method</p>
                        <div className="flex gap-2">
                            {(['CASH', 'UPI', 'CARD'] as const).map((method) => (
                                <button
                                    key={method}
                                    onClick={() => setPaymentMethod(method)}
                                    className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${paymentMethod === method
                                        ? 'border-green-500 bg-green-50 text-green-700'
                                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    <span className="text-lg">
                                        {method === 'CASH' ? '💵' : method === 'UPI' ? '📱' : '💳'}
                                    </span>
                                    <span className="font-medium text-sm">{method}</span>
                                </button>
                            ))}
                        </div>
                    </div> */}

                    {/* Notes */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Notes for Driver (Optional)</p>
                        <textarea
                            value={userNotes}
                            onChange={(e) => setUserNotes(e.target.value)}
                            placeholder="Any special instructions..."
                            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            rows={2}
                        />
                    </div>

                    {/* Price */}
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                        <span className="text-gray-700 font-medium">Total Fare</span>
                        <span className="text-2xl font-bold text-green-600">₹{estimatedFare}</span>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Confirm Button */}
                    <button
                        onClick={handleConfirmBooking}
                        disabled={isLoading}
                        className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${isLoading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl active:scale-[0.98]'
                            }`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Creating Booking...
                            </span>
                        ) : (
                            `Confirm Booking • ₹${estimatedFare}`
                        )}
                    </button>

                    <p className="text-xs text-center text-gray-400">
                        By confirming, you agree to our terms of service
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ConfirmBookingModal;
