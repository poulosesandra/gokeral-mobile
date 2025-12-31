"use client";

import { Card, Button, Empty, Tag } from "antd";
import { PlusOutlined, CarOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";

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
}

interface VehiclesTabProps {
  onAddVehicle: () => void;
}

export const VehiclesTab = ({ onAddVehicle }: VehiclesTabProps) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  // TODO: Fetch vehicles from API when backend is ready
  useEffect(() => {
    // Placeholder for future API call
    // const fetchVehicles = async () => {
    //   try {
    //     setLoading(true);
    //     const response = await axios.get('/api/driver/vehicles');
    //     setVehicles(response.data);
    //   } catch (error) {
    //     console.error('Failed to fetch vehicles:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // fetchVehicles();
  }, []);

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
      {vehicles.length === 0 ? (
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
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <CarOutlined className="text-2xl text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">{vehicle.vehicleModel}</h3>
                      <p className="text-gray-600">{vehicle.vehicleNumber}</p>
                    </div>
                  </div>
                  {vehicle.status && (
                    <Tag color={getStatusColor(vehicle.status)}>
                      {vehicle.status.toUpperCase()}
                    </Tag>
                  )}
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

              </div>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};
