import React, { useState } from 'react';
import { MapPin, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { authService } from '../../services/authServices';

interface LocationPermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [status, setStatus] = useState<'idle' | 'requesting' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');

    if (!isOpen) return null;

    const handleAllowLocation = async () => {
        setStatus('requesting');
        setErrorMessage('');

        try {
            if (!navigator.geolocation) {
                throw new Error('Geolocation is not supported by your browser.');
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        await authService.updateDriverLocation(latitude, longitude);
                        setStatus('success');

                        setTimeout(() => {
                            onSuccess();
                            onClose();
                        }, 1500);
                    } catch (error: any) {
                        setStatus('error');
                        setErrorMessage(error.message || 'Failed to sync location with server. Please try again.');
                    }
                },
                (error) => {
                    setStatus('error');
                    if (error.code === 1) {
                        setErrorMessage('Location permission denied. Please enable location access in your browser settings.');
                    } else if (error.code === 2) {
                        setErrorMessage('Unable to determine your location. Please check your GPS settings.');
                    } else if (error.code === 3) {
                        setErrorMessage('Location request timed out. Please try again.');
                    } else {
                        setErrorMessage(error.message || 'Failed to get location. Please try again.');
                    }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message || 'Failed to get location. Please try again.');
        }
    };

    const handleSkip = () => {
        // Mark that user skipped location (they won't appear in nearby searches)
        localStorage.setItem('driverLocationSkipped', 'true');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white relative">
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 hover:bg-white/20 rounded-full p-1 transition"
                        disabled={status === 'requesting'}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 rounded-full p-3">
                            <MapPin className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Share Your Location</h2>
                            <p className="text-green-100 text-sm mt-1">Help riders find you nearby</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {status === 'idle' && (
                        <>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                To receive ride requests from nearby passengers, we need access to your current location.
                                Your location helps us:
                            </p>

                            <ul className="space-y-2 text-sm text-gray-600">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Show you to riders looking for nearby drivers</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Calculate accurate pickup distances</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>Provide better navigation to pickup points</span>
                                </li>
                            </ul>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-amber-800">
                                    Without location access, you won't appear in nearby driver searches and may miss ride requests.
                                </p>
                            </div>
                        </>
                    )}

                    {status === 'requesting' && (
                        <div className="py-8 text-center">
                            <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
                            <p className="text-gray-700 font-medium">Getting your location...</p>
                            <p className="text-gray-500 text-sm mt-1">Please allow location access when prompted</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="py-8 text-center">
                            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <p className="text-gray-700 font-medium">Location Updated!</p>
                            <p className="text-gray-500 text-sm mt-1">You're now visible to nearby riders</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="py-4">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                                <div>
                                    <p className="text-red-800 font-medium">Location Access Failed</p>
                                    <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 pt-0 space-y-3">
                    {(status === 'idle' || status === 'error') && (
                        <>
                            <button
                                onClick={handleAllowLocation}
                                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                <MapPin className="w-5 h-5" />
                                {status === 'error' ? 'Try Again' : 'Allow Location Access'}
                            </button>

                            <button
                                onClick={handleSkip}
                                className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 transition"
                            >
                                Skip for now
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocationPermissionModal;
