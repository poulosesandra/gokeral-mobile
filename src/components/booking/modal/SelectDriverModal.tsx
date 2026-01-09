import React, { useEffect, useState } from 'react';
import { Spin, Empty, Card, Avatar, Rate, Tag, Button, message, Modal, Input } from 'antd';
import { PhoneOutlined, EnvironmentOutlined, CarOutlined, CloseOutlined } from '@ant-design/icons';
import api from '../../../services/api';

interface Driver {
    _id: string;
    fullName: string;
    phoneNumber: string;
    profileImage?: string;
    drivingExperience?: {
        averageRating?: number;
        totalTripsCompleted?: number;
    };
    latitude: number;
    longitude: number;
    distance: number;
    isOnline: boolean;
    vehicle?: {
        make: string;
        vehicleModel: string;
        year: number;
        licensePlate: string;
        vehicleType: string;
        seatsNo: number;
        vehicleImages?: string[];
    };
}

interface SelectDriverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectDriver: (driver: Driver) => void;
    pickupLatitude: number;
    pickupLongitude: number;
    maxDrivers?: number;
}

const SelectDriverModal: React.FC<SelectDriverModalProps> = ({
    isOpen,
    onClose,
    onSelectDriver,
    pickupLatitude,
    pickupLongitude,
    maxDrivers = 10,
}) => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchNearbyDrivers();
        }
    }, [isOpen, pickupLatitude, pickupLongitude]);

    const fetchNearbyDrivers = async () => {
        try {
            setLoading(true);

            // ✅ Try to get nearby drivers with operating area filter first
            try {
                const response = await api.get('/bookings/nearby-drivers', {
                    params: {
                        latitude: pickupLatitude,
                        longitude: pickupLongitude,
                        radius: 2, // 2 KM radius
                    },
                });

                const limitedDrivers = (response.data || []).slice(0, maxDrivers);

                // If we got results, use them
                if (limitedDrivers.length > 0) {
                    setDrivers(limitedDrivers);
                    console.log(`✅ Found ${limitedDrivers.length} nearby drivers`);
                    return;
                }

                // If no results, fall through to flexible endpoint
                console.warn('⚠️ No drivers found with operating area filter, trying flexible search...');
            } catch (error: any) {
                // If error occurred (like 403), try flexible endpoint
                console.warn('⚠️ Operating area filter failed, trying flexible search...', error.message);
            }

            // ✅ Fallback: Get nearby drivers without operating area restriction
            try {
                const flexibleResponse = await api.get('/bookings/nearby-drivers-flexible', {
                    params: {
                        latitude: pickupLatitude,
                        longitude: pickupLongitude,
                        radius: 2,
                    },
                });

                const limitedDrivers = (flexibleResponse.data || []).slice(0, maxDrivers);
                setDrivers(limitedDrivers);
                if (limitedDrivers.length > 0) {
                    console.log(`✅ Found ${limitedDrivers.length} nearby drivers (flexible search)`);
                } else {
                    message.warning('No drivers available in your area. Please check back later.');
                }
            } catch (flexibleError) {
                console.error('❌ Both driver search endpoints failed:', flexibleError);
                message.error('Failed to load nearby drivers. Please try again.');
                setDrivers([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredDrivers = drivers.filter(driver =>
        driver.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
        driver.vehicle?.make.toLowerCase().includes(searchText.toLowerCase()) ||
        driver.vehicle?.vehicleModel.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <Modal
            title="Select Driver"
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={600}
            centered
            closeIcon={<CloseOutlined />}
        >
            <div className="space-y-4">
                {/* Search Input */}
                <div>
                    <Input
                        placeholder="Search by driver name or vehicle..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="p-2"
                        allowClear
                    />
                </div>

                {/* Drivers List */}
                <div className="max-h-[500px] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Spin tip="Finding drivers near you..." />
                        </div>
                    ) : filteredDrivers.length === 0 ? (
                        <Empty
                            description={searchText ? 'No drivers match your search' : 'No drivers available nearby'}
                            style={{ marginTop: '2rem', marginBottom: '2rem' }}
                        />
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 font-medium">
                                ✅ {filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''} available within 2 km
                            </p>

                            {filteredDrivers.map((driver, index) => (
                                <Card
                                    key={driver._id}
                                    className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
                                    onClick={() => {
                                        onSelectDriver(driver);
                                        onClose();
                                    }}
                                >
                                    <div className="flex justify-between items-start gap-3">
                                        {/* Driver Info */}
                                        <div className="flex gap-3 flex-1">
                                            <Avatar
                                                size={48}
                                                src={driver.profileImage}
                                                alt={driver.fullName}
                                                style={{ backgroundColor: '#1E90FF' }}
                                            >
                                                {driver.fullName.charAt(0)}
                                            </Avatar>

                                            <div className="flex-1">
                                                {/* Driver Name & Number */}
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-semibold text-gray-800">
                                                        {index + 1}. {driver.fullName}
                                                    </h4>
                                                    <Tag color={driver.isOnline ? 'green' : 'red'} className="text-xs">
                                                        {driver.isOnline ? '🟢 Online' : '🔴 Offline'}
                                                    </Tag>
                                                </div>

                                                {/* Rating */}
                                                {driver.drivingExperience?.averageRating && (
                                                    <div className="flex items-center gap-2 mb-2 mt-1">
                                                        <Rate
                                                            disabled
                                                            value={driver.drivingExperience.averageRating}
                                                            style={{ fontSize: '12px' }}
                                                        />
                                                        <span className="text-xs text-gray-600">
                                                            {driver.drivingExperience.averageRating.toFixed(1)} •{' '}
                                                            {driver.drivingExperience.totalTripsCompleted || 0} trips
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Vehicle Information */}
                                                {driver.vehicle && (
                                                    <div className="mb-2 p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                                                        <div className="flex items-center gap-2">
                                                            <CarOutlined style={{ fontSize: '14px', color: '#1E90FF' }} />
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {driver.vehicle.make} {driver.vehicle.vehicleModel} ({driver.vehicle.year})
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-gray-600 ml-6 mt-1">
                                                            <div>
                                                                {driver.vehicle.vehicleType} • {driver.vehicle.seatsNo} seats
                                                            </div>
                                                            <div className="font-mono text-gray-700 font-semibold">
                                                                Plate: {driver.vehicle.licensePlate}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Distance & Phone */}
                                                <div className="flex flex-col gap-1 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <EnvironmentOutlined style={{ fontSize: '12px', color: '#ff4d4f' }} />
                                                        <span className="font-semibold text-green-600">
                                                            {driver.distance.toFixed(1)} km away
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <PhoneOutlined style={{ fontSize: '12px' }} />
                                                        <span>{driver.phoneNumber}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Select Button */}
                                        <Button
                                            type="primary"
                                            size="large"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectDriver(driver);
                                                onClose();
                                            }}
                                            className="mt-1"
                                        >
                                            Select
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default SelectDriverModal;
