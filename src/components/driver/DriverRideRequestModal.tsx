import React, { useEffect, useState } from 'react';
import { Card, Button, Modal, Row, Col, Spin, message } from 'antd';
import { MapPin, CheckCircle, X } from 'lucide-react';
import { useDriverRideListener } from '../../hooks/useDriverRideListener';

interface DriverRideRequestProps {
    driverId: string;
    currentLocation: { lat: number; lng: number };
    onRideAccepted?: (rideId: string) => void;
    onRideRejected?: (rideId: string) => void;
}

/**
 * Component to display ride request popup for drivers
 * Uses Socket.IO to listen for new_ride_request event
 */
const DriverRideRequestModal: React.FC<DriverRideRequestProps> = ({
    driverId,
    currentLocation,
    onRideAccepted,
    onRideRejected,
}) => {
    const {
        newRideRequest,
        acceptSuccess,
        error,
        acceptRide,
        rejectRide,
        updateLocation,
    } = useDriverRideListener(driverId, true);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [updateInterval, setUpdateInterval] = useState<number | null>(
        null
    );

    // Show modal when new ride request arrives
    useEffect(() => {
        if (newRideRequest) {
            setIsModalVisible(true);
            message.info('📍 New ride request!', 2);
        }
    }, [newRideRequest]);

    // Hide modal when ride is accepted
    useEffect(() => {
        if (acceptSuccess) {
            setIsModalVisible(false);
            setIsAccepting(false);
            onRideAccepted?.(newRideRequest?.rideId || '');

            // Send one immediate location update (periodic updates removed)
            updateLocation(
                newRideRequest?.rideId || '',
                currentLocation.lat,
                currentLocation.lng
            );
        }

        return () => {
            // no interval to clear (polling removed)
        };
    }, [acceptSuccess, newRideRequest, updateLocation, currentLocation, onRideAccepted]);

    const handleAccept = async () => {
        if (!newRideRequest) return;

        setIsAccepting(true);
        acceptRide(newRideRequest.rideId);
        // Socket will handle the response via acceptSuccess state
    };

    const handleReject = () => {
        if (!newRideRequest) return;

        rejectRide(newRideRequest.rideId);
        setIsModalVisible(false);
        onRideRejected?.(newRideRequest.rideId);
    };

    if (!newRideRequest) {
        return null;
    }

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <MapPin className="text-green-600" />
                    <span>New Ride Request</span>
                </div>
            }
            open={isModalVisible}
            onCancel={handleReject}
            footer={null}
            width={420}
            centered
            closable={!isAccepting}
            maskClosable={false}
        >
            {isAccepting && !acceptSuccess ? (
                <div className="flex flex-col items-center justify-center py-12">
                    <Spin size="large" tip="Accepting ride..." />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Ride Details */}
                    <div className="space-y-4">
                        {/* Pickup Location */}
                        <div className="bg-green-50 p-4 rounded-lg">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                    <MapPin className="text-green-600 mt-1" size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 font-semibold uppercase">
                                        Pickup Location
                                    </p>
                                    <p className="text-gray-800 font-semibold">
                                        {newRideRequest.pickupLocation}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {newRideRequest.pickupLatitude.toFixed(4)},
                                        {newRideRequest.pickupLongitude.toFixed(4)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Drop Location */}
                        <div className="bg-red-50 p-4 rounded-lg">
                            <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                    <MapPin className="text-red-600 mt-1" size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 font-semibold uppercase">
                                        Drop Location
                                    </p>
                                    <p className="text-gray-800 font-semibold">
                                        {newRideRequest.dropLocation}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {newRideRequest.dropoffLatitude.toFixed(4)},
                                        {newRideRequest.dropoffLongitude.toFixed(4)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Estimated Fare & Distance */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <Card className="bg-blue-50 border-blue-200 text-center p-3">
                                <p className="text-xs text-gray-500 mb-1">Estimated Distance</p>
                                <p className="text-xl font-bold text-blue-600">
                                    {(newRideRequest.estimatedDistance || 5).toFixed(1)} km
                                </p>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card className="bg-yellow-50 border-yellow-200 text-center p-3">
                                <p className="text-xs text-gray-500 mb-1">Estimated Fare</p>
                                <p className="text-xl font-bold text-yellow-600">
                                    ₹{(newRideRequest.estimatedFare || 150).toFixed(0)}
                                </p>
                            </Card>
                        </Col>
                    </Row>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <Button
                            type="default"
                            size="large"
                            block
                            danger
                            onClick={handleReject}
                            disabled={isAccepting}
                            icon={<X />}
                        >
                            Reject
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            block
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleAccept}
                            loading={isAccepting}
                            icon={<CheckCircle />}
                        >
                            Accept Ride
                        </Button>
                    </div>

                    {/* Info Text */}
                    <p className="text-xs text-gray-500 text-center">
                        You have 30 seconds to respond before this request goes to another
                        driver
                    </p>
                </div>
            )}
        </Modal>
    );
};

export default DriverRideRequestModal;
