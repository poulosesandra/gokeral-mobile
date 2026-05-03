import React, { useEffect, useState } from 'react';
import { Spin, Empty, Card, Avatar, Rate, Tag, Button, message, Modal, Input } from 'antd';
import { PhoneOutlined, EnvironmentOutlined, CarOutlined, CloseOutlined } from '@ant-design/icons';
import { bookingApi } from '../../../services/api';
import bookingService from '../../../services/bookingService';

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
    driverId?: string;
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
    priorityGroup?: 'STAND' | 'NEAREST';
    matchSource?: string;
    vehicle?: {
        make: string;
        vehicleModel: string;
        year: number;
        licensePlate: string;
        vehicleType: string;
        seatsNo: number;
        type?: string;
        seatingCapacity?: number;
        registrationNumber?: string;
        vehicleImages?: string[];
        fareStructure?: {
            minimumFare: number;
            perKilometerRate: number;
            waitingChargePerMinute: number;
            baseFare?: number;
            cancellationFee?: number;
        };
    };
}

interface RawNearbyDriver {
    _id?: string;
    driverId?: string;
    accountId?: string;
    fullName?: string;
    phoneNumber?: string;
    profileImage?: string;
    distance?: number;
    isOnline?: boolean;
    estimatedArrival?: number;
    rating?: number;
    priorityGroup?: 'STAND' | 'NEAREST' | string;
    matchSource?: string;
    vehicle?: Driver['vehicle'];
    latitude?: number;
    longitude?: number;
}

const normalizeVehicleKey = (value?: string): string => {
    const input = String(value || '').toLowerCase().trim();
    if (!input) return '';
    if (input.includes('suv') || input.includes('seven')) return 'SUV';
    if (input.includes('sedan')) return 'SEDAN';
    if (input.includes('hatch')) return 'HATCHBACK';
    if (input.includes('auto') || input.includes('rickshaw')) return 'AUTO';
    if (input.includes('bike')) return 'BIKE';
    return input.toUpperCase();
};

const normalizeNearbyDrivers = (payload: any): Driver[] => {
    const list = Array.isArray(payload) ? payload : payload?.drivers || [];

    return list.map((item: RawNearbyDriver, index: number): Driver => {
        const id = item._id || item.driverId || item.accountId || `driver-${index}`;
        return {
            _id: id,
            driverId: item.driverId || item.accountId || id,
            fullName: item.fullName || 'Driver',
            phoneNumber: item.phoneNumber || 'N/A',
            profileImage: item.profileImage,
            drivingExperience: {
                averageRating: item.rating,
                totalTripsCompleted: undefined,
            },
            latitude: item.latitude || 0,
            longitude: item.longitude || 0,
            distance: typeof item.distance === 'number' ? item.distance : 0,
            isOnline: item.isOnline ?? true,
            priorityGroup: item.priorityGroup as 'STAND' | 'NEAREST' | undefined,
            matchSource: item.matchSource,
            vehicle: item.vehicle,
        };
    });
};

interface SelectDriverModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectDriver: (driver: Driver) => void;
    pickupLatitude: number;
    pickupLongitude: number;
    maxDrivers?: number;
    route?: google.maps.DirectionsRoute | null;
    vehicleType?: string;
}

const SelectDriverModal: React.FC<SelectDriverModalProps> = ({
    isOpen,
    onClose,
    onSelectDriver,
    pickupLatitude,
    pickupLongitude,
    maxDrivers = 10,
    route,
    vehicleType,
}) => {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [estimatedFareByDriver, setEstimatedFareByDriver] = useState<Record<string, number>>({});

    useEffect(() => {
        if (isOpen) {
            fetchNearbyDrivers();
        }
    }, [isOpen, pickupLatitude, pickupLongitude, vehicleType]);

    const fetchNearbyDrivers = async () => {
        try {
            setLoading(true);

            if (!Number.isFinite(pickupLatitude) || !Number.isFinite(pickupLongitude) || (pickupLatitude === 0 && pickupLongitude === 0)) {
                message.error('Pickup location is missing. Please choose a pickup point first.');
                setDrivers([]);
                return;
            }

            // Try operating-area endpoint first
            let fetched: Driver[] = [];
            try {
                const response = await bookingApi.get('/bookings/nearby-drivers', {
                    params: {
                        pickupLat: pickupLatitude,
                        pickupLng: pickupLongitude,
                        radiusKm: 2,
                        vehicleType,
                    },
                });
                fetched = normalizeNearbyDrivers(response.data).slice(0, maxDrivers);
            } catch (err: any) {
                const status = err?.response?.status;
                const backendMessage = err?.response?.data?.message;
                console.error('Driver search failed', {
                    status,
                    backendMessage,
                    data: err?.response?.data,
                });
                message.error(
                    backendMessage
                        ? `Failed to load nearby drivers (${status ?? 'error'}): ${backendMessage}`
                        : 'Failed to load nearby drivers. Please try again.'
                );
                fetched = [];
            }

            // If vehicleType is provided, filter drivers by normalized vehicle type
            let finalDrivers = fetched;
            if (vehicleType) {
                const want = normalizeVehicleKey(vehicleType);
                finalDrivers = fetched.filter((d) => {
                    const drvType = d.vehicle?.vehicleType || d.vehicle?.type;
                    if (!drvType) return true;
                    return normalizeVehicleKey(drvType) === want;
                });
            }

            setDrivers(finalDrivers.slice(0, maxDrivers));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchFareEstimates = async () => {
            const leg = route?.legs?.[0];
            if (!leg || drivers.length === 0) {
                setEstimatedFareByDriver({});
                return;
            }

            const distanceInMeters = leg.distance?.value || 0;
            const durationInSeconds = leg.duration?.value || 0;

            if (!distanceInMeters || !durationInSeconds) {
                setEstimatedFareByDriver({});
                return;
            }

            const entries = await Promise.all(
                drivers.map(async (driver) => {
                    try {
                        const vehicleId = (driver.vehicle as any)?._id || (driver.vehicle as any)?.id;
                        if (!vehicleId) return [driver._id, null] as const;

                        const response = await bookingService.estimateFare({
                            distance: {
                                text: leg.distance?.text || `${(distanceInMeters / 1000).toFixed(1)} km`,
                                value: distanceInMeters,
                            },
                            duration: {
                                text: leg.duration?.text || `${Math.ceil(durationInSeconds / 60)} mins`,
                                value: durationInSeconds,
                            },
                            vehicleId,
                            vehicleType: driver.vehicle?.vehicleType || driver.vehicle?.type,
                        });

                        const estimatedFare = response?.estimatedFare ?? response?.fareBreakdown?.total;
                        return [driver._id, typeof estimatedFare === 'number' ? estimatedFare : null] as const;
                    } catch {
                        return [driver._id, null] as const;
                    }
                }),
            );

            const nextState: Record<string, number> = {};
            for (const [driverId, fare] of entries) {
                if (typeof fare === 'number') {
                    nextState[driverId] = fare;
                }
            }
            setEstimatedFareByDriver(nextState);
        };

        void fetchFareEstimates();
    }, [drivers, route]);

    // Helper added: return first vehicle image or undefined
    const getVehicleImage = (driver: Driver): string | undefined => {
        const first = driver.vehicle?.vehicleImages?.[0];
        return typeof first === 'string' ? first : undefined;
    };

    const filteredDrivers = drivers.filter((driver) => {
        const q = searchText.toLowerCase();
        const name = driver.fullName?.toLowerCase() || '';
        const make = driver.vehicle?.make?.toLowerCase() || '';
        const model = driver.vehicle?.vehicleModel?.toLowerCase() || '';
        return name.includes(q) || make.includes(q) || model.includes(q);
    });

    const standDrivers = filteredDrivers.filter((driver) => driver.priorityGroup === 'STAND');
    const nearbyDrivers = filteredDrivers.filter((driver) => driver.priorityGroup !== 'STAND');
    const orderedDrivers = [...standDrivers, ...nearbyDrivers];

    const getPriorityLabel = (driver: Driver) => {
        if (driver.priorityGroup === 'STAND') return 'Stand Driver';
        return 'Nearby Driver';
    };

    return (
        <Modal title="Select Driver" open={isOpen} onCancel={onClose} footer={null} width={600} centered closeIcon={<CloseOutlined />}>
            <div className="space-y-4">
                <Input placeholder="Search by driver name or vehicle..." value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear />
                <div className="max-h-[500px] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <Spin tip="Finding drivers near you..." />
                        </div>
                    ) : filteredDrivers.length === 0 ? (
                        <Empty
                            description={searchText ? 'No drivers match your search' : vehicleType ? `No ${vehicleType} drivers available nearby` : 'No drivers available nearby'}
                            style={{ marginTop: '2rem', marginBottom: '2rem' }}
                        />
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600 font-medium">✅ {filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''} available within 2 km</p>
                            {orderedDrivers.map((driver, index) => (
                                <Card key={driver._id || driver.driverId} className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200" onClick={() => { onSelectDriver(driver); onClose(); }}>
                                    <div className="flex justify-between items-start gap-3">
                                        {/* Driver Info */}
                                        <div className="flex gap-3 flex-1">
                                            {/* Vehicle Image (from old VehicleListModal) */}
                                            <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200">
                                                {getVehicleImage(driver) ? (
                                                    <img
                                                        src={getVehicleImage(driver)}
                                                        alt={driver.vehicle?.vehicleModel || 'Vehicle'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-xs text-gray-400">No Img</span>
                                                )}
                                            </div>

                                            <Avatar
                                                size={48}
                                                src={driver.profileImage}
                                                alt={driver.fullName}
                                                style={{ backgroundColor: '#1E90FF' }}
                                            >
                                                {(driver.fullName || 'D').charAt(0)}
                                            </Avatar>

                                            <div className="flex-1">
                                                {/* Driver Name & Number */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-semibold text-gray-800">
                                                            {index + 1}. {driver.fullName}
                                                        </h4>
                                                        <Tag color={driver.priorityGroup === 'STAND' ? 'blue' : 'gold'} className="text-xs font-semibold">
                                                            {getPriorityLabel(driver)}
                                                        </Tag>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {typeof estimatedFareByDriver[driver._id] === 'number' && (
                                                            <Tag color="green" className="text-xs font-bold">
                                                                ₹{Math.round(estimatedFareByDriver[driver._id])}
                                                            </Tag>
                                                        )}
                                                        <Tag color={driver.isOnline ? 'green' : 'red'} className="text-xs">
                                                            {driver.isOnline ? '🟢 Online' : '🔴 Offline'}
                                                        </Tag>
                                                    </div>
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
                                                                {mapVehicleType(driver.vehicle.vehicleType || driver.vehicle.type)} • {driver.vehicle.seatsNo || driver.vehicle.seatingCapacity || '-'} seats
                                                            </div>
                                                            <div className="font-mono text-gray-700 font-semibold">
                                                                Plate: {driver.vehicle.licensePlate || driver.vehicle.registrationNumber || 'N/A'}
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
