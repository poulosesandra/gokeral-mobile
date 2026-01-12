import React, { useState, useEffect } from 'react';
import { Spin, Empty, Card, Avatar, Rate, Tag, Divider, Button, message } from 'antd';
import { PhoneOutlined, EnvironmentOutlined, CarOutlined } from '@ant-design/icons';
import { api } from '../../services/api';

// Hardcoded mapping for vehicle types
const mapVehicleType = (t?: string) => {
  if (!t) return 'Auto';
  const s = String(t).toLowerCase();
  if (s.includes('auto')) return 'Auto';
  if (s.includes('suv')) return 'Seven Seater';
  if (s.includes('sedan') || s.includes('hatch')) return 'Five Seater';
  return t;
};

interface Driver {
    _id: string;
    fullName: string;
    email: string;
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
    operatingArea?: string;
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

interface NearbyDriversProps {
    latitude: number;
    longitude: number;
    radius?: number; // in kilometers
    onSelectDriver?: (driver: Driver) => void;
}

const NearbyDrivers: React.FC<NearbyDriversProps> = ({ latitude, longitude, radius = 2, onSelectDriver }) => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNearbyDrivers();
    }, [latitude, longitude, radius]);

    const fetchNearbyDrivers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/bookings/nearby-drivers', {
                params: {
                    latitude,
                    longitude,
                    radius,
                },
            });
            setDrivers(response.data);
        } catch (error) {
            console.error('Failed to fetch nearby drivers:', error);
            message.error('Failed to load nearby drivers');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Spin />
            </div>
        );
    }

    if (!drivers || drivers.length === 0) {
        return (
            <Empty
                description="No drivers available nearby"
                style={{ marginTop: '2rem' }}
            />
        );
    }

    return (
        <div className="flex flex-col gap-3 mt-4 pt-4">
            <h3 className="font-semibold text-gray-700">Available Drivers Nearby</h3>
            <div className="text-xs text-gray-500 mb-2">
                {drivers.length} driver{drivers.length !== 1 ? 's' : ''} within {radius} km
            </div>
            {drivers.map((driver) => (
                <Card
                    key={driver._id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => onSelectDriver?.(driver)}
                >
                    <div className="flex justify-between items-start gap-3">
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
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-gray-800">{driver.fullName}</h4>
                                    <Tag color={driver.isOnline ? 'green' : 'red'}>
                                        {driver.isOnline ? 'Online' : 'Offline'}
                                    </Tag>
                                </div>
                                {driver.drivingExperience?.averageRating && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <Rate
                                            disabled
                                            value={driver.drivingExperience.averageRating}
                                            style={{ fontSize: '12px' }}
                                        />
                                        <span className="text-xs text-gray-600">
                                            ({driver.drivingExperience.totalTripsCompleted || 0} trips)
                                        </span>
                                    </div>
                                )}

                                {/* Vehicle Information */}
                                {driver.vehicle && (
                                    <div className="mb-2 p-2 bg-blue-50 rounded">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CarOutlined style={{ fontSize: '14px', color: '#1E90FF' }} />
                                            <span className="text-sm font-medium text-gray-700">
                                                {driver.vehicle.make} {driver.vehicle.vehicleModel}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-600 ml-6">
                                            <div>{mapVehicleType(driver.vehicle.vehicleType)} • {driver.vehicle.seatsNo} seats</div>
                                            <div className="text-gray-500">{driver.vehicle.licensePlate}</div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col gap-1 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <PhoneOutlined style={{ fontSize: '12px' }} />
                                        <span>{driver.phoneNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <EnvironmentOutlined style={{ fontSize: '12px' }} />
                                        <span>{driver.distance.toFixed(2)} km away</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Divider style={{ margin: '10px 0' }} />
                    <div className="flex justify-end">
                        <Button
                            type="primary"
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectDriver?.(driver);
                            }}
                        >
                            Select Driver
                        </Button>
                    </div>
                </Card>
            ))}
        </div>
    );
};

export default NearbyDrivers;
