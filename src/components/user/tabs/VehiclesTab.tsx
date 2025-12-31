"use client";

import { Card, Button, Empty, Tag, message, Spin, Popconfirm } from "antd";
import { PlusOutlined, CarOutlined, DeleteOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import vehicleService from "../../../services/vehicleService";

export interface Vehicle {
  _id: string;
  vehicleType: string;
  vehicleNumber: string;
  vehicleModel: string;
  vehicleColor: string;
  seatingCapacity: number;
  vehicleYear: number;
  insuranceExpiry?: string;
  registrationExpiry?: string;
  status?: string;
  images?: string[];
  raw?: any;
}

interface VehiclesTabProps {
  onAddVehicle: () => void;
  refreshSignal?: number;
}

export const VehiclesTab = ({ onAddVehicle, refreshSignal }: VehiclesTabProps) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const data = await vehicleService.getVehicles();
        console.log('🔵 [VEHICLES] fetched', data);
        // Map backend fields to UI model (with robust fallbacks)
        const mapped = data.map((v: any) => {
          const company = v.companyName || v.make || '';
          const model = v.model || v.vehicleModel || '';
          const title = company ? `${company}${model ? ' ' + model : ''}` : (v.vehicleModel || model || '');
          const license = v.licensePlate || v.licensePlateNumber || v.vehicleNumber || '';
          const seats = Number(v.seats ?? v.seatsNo ?? v.seatsNo ?? 0) || 0;
          const year = Number(v.year || 0) || 0;
          const images = v.vehicleImages || (v.vehicleImage ? [v.vehicleImage] : []);
          const docs = v.documents || {};

          return {
            _id: v._id,
            vehicleType: v.vehicleType || v.vehicleClass || '',
            vehicleNumber: license,
            vehicleModel: title,
            vehicleColor: v.color || v.vehicleColor || '',
            seatingCapacity: seats,
            vehicleYear: year,
            insuranceExpiry: docs?.Vehicle_Insurance_Proof || docs?.insuranceExpiry || undefined,
            registrationExpiry: docs?.Registration || undefined,
            status: v.status || undefined,
            images,
            raw: v,
          };
        });
        console.log('🔵 [VEHICLES] mapped', mapped);
        setVehicles(mapped);
      } catch (error: any) {
        console.error('Failed to fetch vehicles:', error);
        message.error(error?.response?.data?.message || 'Failed to load your vehicles');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [refreshSignal]);

  const getStatusColor = (status?: string) => {
    if (!status) return "default";
    switch (status.toLowerCase()) {
      case "active":
        return "green";
      case "inactive":
        return "red";
      case "pending":
        return "orange";
      default:
        return "default";
    }
  };

  const handleDelete = async (vehicleId: string) => {
    try {
      setDeletingId(vehicleId);
      await vehicleService.deleteVehicle(vehicleId);
      setVehicles((prev) => prev.filter((v) => v._id !== vehicleId));
      message.success('Vehicle deleted');
    } catch (err: any) {
      console.error('Failed to delete vehicle:', err);
      message.error(err?.response?.data?.message || 'Failed to delete vehicle');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* HEADER WITH ADD BUTTON */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">My Vehicles</h2>
        <Button 
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={onAddVehicle}
        >
          Add Vehicle
        </Button>
      </div>

      {/* VEHICLES LIST */}
      {loading ? (
        <Card className="shadow-md rounded-2xl">
          <div className="flex items-center justify-center py-16">
            <Spin size="large" />
          </div>
        </Card>
      ) : vehicles.length === 0 ? (
        <Card className="shadow-md rounded-2xl">
          <Empty
            image={<CarOutlined style={{ fontSize: 80, color: '#d9d9d9' }} />}
            description={
              <div className="space-y-2">
                <p className="text-gray-600 text-lg">No vehicles registered</p>
                <p className="text-gray-400 text-sm">Add your first vehicle to start accepting rides</p>
              </div>
            }
          >
            <Button 
              type="primary" 
              size="large"
              icon={<PlusOutlined />}
              onClick={onAddVehicle}
            >
              Add Your First Vehicle
            </Button>
          </Empty>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vehicles.map((vehicle) => (
            <Card 
              key={vehicle._id}
              className="shadow-md rounded-2xl hover:shadow-lg transition-shadow"
            >
              <div className="space-y-4">
                
                {/* VEHICLE HEADER */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-20 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                      {vehicle.images && vehicle.images.length > 0 ? (
                        <img src={vehicle.images[0]} alt="vehicle" className="w-full h-full object-cover" />
                      ) : (
                        <CarOutlined className="text-2xl text-green-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">{vehicle.vehicleModel || vehicle.vehicleNumber || 'Unnamed Vehicle'}</h3>
                      <p className="text-gray-600">{vehicle.vehicleNumber || (vehicle.raw && (vehicle.raw.licensePlate || vehicle.raw.licensePlateNumber))}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {vehicle.status && (
                      <Tag color={getStatusColor(vehicle.status)}>
                        {vehicle.status.toUpperCase()}
                      </Tag>
                    )}

                    <button
                      type="button"
                      className="text-sm text-gray-500 hover:text-gray-700 mr-2"
                      onClick={() => setExpanded((s) => ({ ...s, [vehicle._id]: !s[vehicle._id] }))}
                    >
                      {expanded[vehicle._id] ? 'Hide details' : 'Details'}
                    </button>

                    <Popconfirm
                      title="Delete vehicle?"
                      onConfirm={() => handleDelete(vehicle._id)}
                      okText="Delete"
                      cancelText="Cancel"
                    >
                      <button
                        type="button"
                        className={`text-red-500 hover:text-red-700 ${deletingId === vehicle._id ? 'opacity-50 pointer-events-none' : ''}`}
                        aria-label="Delete vehicle"
                      >
                        <DeleteOutlined />
                      </button>
                    </Popconfirm>
                  </div>
                </div>

                {/* VEHICLE DETAILS */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div>
                    <span className="text-gray-600 text-sm">Type</span>
                    <p className="font-medium text-gray-800">{vehicle.vehicleType}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Color</span>
                    <p className="font-medium text-gray-800">{vehicle.vehicleColor}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Year</span>
                    <p className="font-medium text-gray-800">{vehicle.vehicleYear}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">Seats</span>
                    <p className="font-medium text-gray-800">{vehicle.seatingCapacity}</p>
                  </div>
                </div>

                {/* DOCUMENT EXPIRY */}
                {(vehicle.insuranceExpiry || vehicle.registrationExpiry) && (
                  <div className="pt-3 border-t space-y-2">
                    {vehicle.insuranceExpiry && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Insurance Expiry:</span>
                        <span className="font-medium">{vehicle.insuranceExpiry}</span>
                      </div>
                    )}
                    {vehicle.registrationExpiry && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Registration Expiry:</span>
                        <span className="font-medium">{vehicle.registrationExpiry}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* RAW / DEBUG DETAILS */}
                {expanded[vehicle._id] && (
                  <pre className="bg-gray-50 p-3 rounded mt-3 overflow-auto text-xs">{JSON.stringify(vehicle.raw, null, 2)}</pre>
                )}

              </div>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};
