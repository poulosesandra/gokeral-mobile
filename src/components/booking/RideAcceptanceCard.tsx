import React, { useEffect, useState } from 'react';
import { Card, Button, Spin, message, Tag, Row, Col, Avatar } from 'antd';
import { EnvironmentOutlined, PhoneOutlined, StarOutlined } from 'lucide-react';
import { useCustomerRideListener } from '../../hooks/useCustomerRideListener';

interface RideAcceptanceCardProps {
    userId: string;
    rideId: string;
    currentLocation: { lat: number; lng: number };
    onClose: () => void;
}

/**
 * Component to display real-time ride acceptance and driver info
 * Uses Socket.IO to listen for ride_accepted event
 */
const RideAcceptanceCard: React.FC<RideAcceptanceCardProps> = ({
    userId,
    rideId,
    currentLocation,
    onClose,
}) => {
    const {
        rideAccepted,
        driverLocation,
        rideStarted,
        driverArrived,
        error,
        updateLocation,
        cancelRide,
    } = useCustomerRideListener(userId, true);

    const [updateInterval, setUpdateInterval] = useState<NodeJS.Timeout | null>(
        null
    );

    // Start sending location updates
    useEffect(() => {
        if (!rideAccepted || !rideId) return;

        const interval = setInterval(() => {
            // In real app, get actual location from geolocation API
            updateLocation(rideId, currentLocation.lat, currentLocation.lng);
        }, 5000); // Every 5 seconds

        setUpdateInterval(interval);

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [rideAccepted, rideId, currentLocation, updateLocation]);

    if (!rideAccepted) {
        return (
            <Card className="w-full max-w-md mx-auto p-6 shadow-lg rounded-2xl">
                <div className="flex flex-col items-center justify-center py-8">
                    <Spin size="large" tip="Waiting for driver response..." />
                </div>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto p-6 shadow-lg rounded-2xl">
            {/* Header - Status */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Ride Accepted!</h2>
                <Tag
                    color={rideStarted ? 'green' : driverArrived ? 'orange' : 'blue'}
                    className="text-sm font-semibold"
                >
                    {rideStarted ? 'IN PROGRESS' : driverArrived ? 'ARRIVED' : 'ACCEPTED'}
                </Tag>
            </div>

            {/* Driver Info */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl mb-6">
                <Row gutter={[16, 16]} align="middle">
                    <Col span={6}>
                        <Avatar
                            size={64}
                            src={rideAccepted.driverPhoto}
                            icon={<PhoneOutlined />}
                            className="bg-green-500"
                        />
                    </Col>
                    <Col span={18}>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-gray-800">
                                {rideAccepted.driverName}
                            </h3>
                            <div className="flex items-center gap-2">
                                <StarOutlined size={16} className="text-yellow-500" />
                                <span className="text-sm font-semibold text-gray-700">
                                    {rideAccepted.driverRating?.toFixed(1) || '4.5'} Rating
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">Professional Driver</p>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* Vehicle Info */}
            <div className="bg-gray-50 p-4 rounded-xl mb-6">
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Vehicle Number</span>
                        <span className="font-bold text-gray-800">
                            {rideAccepted.vehicleNumber || 'N/A'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">Vehicle Type</span>
                        <span className="font-bold text-gray-800">Sedan</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600">License</span>
                        <span className="font-mono text-sm text-gray-800">
                            {rideAccepted.driverId?.slice(0, 8)}...
                        </span>
                    </div>
                </div>
            </div>

            {/* Driver Location */}
            {driverLocation && (
                <div className="bg-blue-50 p-4 rounded-xl mb-6">
                    <div className="flex items-center gap-2 mb-2">
                        <EnvironmentOutlined size={16} className="text-blue-600" />
                        <span className="text-sm font-semibold text-blue-800">
                            Driver Location
                        </span>
                    </div>
                    <p className="text-xs text-gray-600">
                        Latitude: {driverLocation.latitude.toFixed(4)}
                        <br />
                        Longitude: {driverLocation.longitude.toFixed(4)}
                    </p>
                </div>
            )}

            {/* Status Message */}
            {driverArrived && (
                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6 text-center">
                    <p className="text-orange-800 font-semibold">
                        🚗 Driver has arrived at pickup location
                    </p>
                </div>
            )}

            {rideStarted && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-xl mb-6 text-center">
                    <p className="text-green-800 font-semibold">
                        ✓ Ride in progress
                    </p>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6">
                    <p className="text-red-800 text-sm">{error}</p>
                </div>
            )}

            {/* Contact Driver Button */}
            {rideAccepted.driverId && (
                <Button
                    type="primary"
                    size="large"
                    block
                    className="mb-3 bg-green-600 hover:bg-green-700 h-10 font-semibold"
                    onClick={() => {
                        message.info('Calling driver...');
                        // Implement actual calling logic
                    }}
                >
                    <PhoneOutlined />
                    Call Driver
                </Button>
            )}

            {/* Cancel Button */}
            <Button
                danger
                size="large"
                block
                variant="outlined"
                onClick={() => {
                    cancelRide(rideId, 'Customer cancelled');
                    onClose();
                }}
            >
                Cancel Ride
            </Button>
        </Card>
    );
};

export default RideAcceptanceCard;
