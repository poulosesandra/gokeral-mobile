"use client";

import { Card, Button, Empty, Tag, message, Spin, Popconfirm } from "antd";
import { PlusOutlined, CarOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
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
  onEditVehicle: (vehicle: any) => void;
  refreshSignal?: number;
}

const formatDocLabel = (key: string) => {
  switch (key) {
    case "Driving_Licence":
      return "Driving Licence";
    case "Vehicle_Insurance_Proof":
      return "Vehicle Insurance Proof";
    case "Proof_Of_Address":
      return "Proof Of Address";
    case "Police_Clearance_Certificate":
      return "Police Clearance Certificate";
    default:
      return key.replaceAll("_", " ");
  }
};

const isImageUrl = (url: string) => {
  const base = (url || "").split("?")[0].toLowerCase();
  return [".png", ".jpg", ".jpeg", ".webp", ".gif"].some((ext) => base.endsWith(ext));
};

const getStatusColor = (status?: string) => {
  if (!status) return "default";
  switch (status.toLowerCase()) {
    case "approved":
    case "active":
      return "green";
    case "rejected":
    case "inactive":
      return "red";
    case "pending":
      return "orange";
    default:
      return "default";
  }
};

export const VehiclesTab = ({ onAddVehicle, onEditVehicle, refreshSignal }: VehiclesTabProps) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const data = await vehicleService.getVehicles();

        const mapped = (data || []).map((v: any) => {
          const company = v.make || v.companyName || "";
          const model = v.vehicleModel || v.model || "";
          const title = company ? `${company}${model ? " " + model : ""}` : v.vehicleModel || model || "";
          const license = v.licensePlate || v.licensePlateNumber || v.vehicleNumber || "";
          const seats = Number(v.seatsNo ?? v.seats ?? 0) || 0;
          const year = Number(v.year || 0) || 0;
          const images = v.vehicleImages || (v.vehicleImage ? [v.vehicleImage] : []);

          return {
            _id: v._id,
            vehicleType: v.vehicleType || v.vehicleClass || "",
            vehicleNumber: license,
            vehicleModel: title,
            vehicleColor: v.color || v.vehicleColor || "",
            seatingCapacity: seats,
            vehicleYear: year,

            // IMPORTANT: do NOT map insurance document URL here
            insuranceExpiry: v.insuranceExpiry || v.insuranceExpiryDate || v.insurance_expiry || undefined,
            registrationExpiry: v.registrationExpiry || v.registrationExpiryDate || v.registration_expiry || undefined,

            status: v.status || undefined,
            images,
            raw: v,
          } as Vehicle;
        });

        setVehicles(mapped);
      } catch (err: any) {
        console.error("Failed to fetch vehicles:", err);
        message.error(err?.response?.data?.message || "Failed to fetch vehicles");
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [refreshSignal]);

  const handleDelete = async (vehicleId: string) => {
    try {
      setDeletingId(vehicleId);
      await vehicleService.deleteVehicle(vehicleId);
      setVehicles((prev) => prev.filter((v) => v._id !== vehicleId));
      message.success("Vehicle deleted");
    } catch (err: any) {
      console.error("Failed to delete vehicle:", err);
      message.error(err?.response?.data?.message || "Failed to delete vehicle");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">My Vehicles</h2>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={onAddVehicle}>
          Add Vehicle
        </Button>
      </div>

      {loading ? (
        <Card className="shadow-md rounded-2xl">
          <div className="flex items-center justify-center py-16">
            <Spin size="large" />
          </div>
        </Card>
      ) : vehicles.length === 0 ? (
        <Card className="shadow-md rounded-2xl">
          <Empty
            image={<CarOutlined style={{ fontSize: 80, color: "#d9d9d9" }} />}
            description={
              <div className="space-y-2">
                <p className="text-gray-600 text-lg">No vehicles registered</p>
                <p className="text-gray-400 text-sm">Add your first vehicle to start accepting rides</p>
              </div>
            }
          >
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={onAddVehicle}>
              Add Your First Vehicle
            </Button>
          </Empty>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vehicles.map((vehicle) => (
            <Card key={vehicle._id} className="shadow-md rounded-2xl hover:shadow-lg transition-shadow">
              <div className="space-y-4">
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
                      <h3 className="font-semibold text-lg text-gray-800">
                        {vehicle.vehicleModel || vehicle.vehicleNumber || "Unnamed Vehicle"}
                      </h3>
                      <p className="text-gray-600">
                        {vehicle.vehicleNumber ||
                          (vehicle.raw && (vehicle.raw.licensePlate || vehicle.raw.licensePlateNumber))}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {vehicle.status && <Tag color={getStatusColor(vehicle.status)}>{vehicle.status.toUpperCase()}</Tag>}

                    <Button type="default" size="small" icon={<EditOutlined />} onClick={() => onEditVehicle(vehicle.raw || vehicle)}>
                      Edit
                    </Button>

                    <button
                      type="button"
                      className="text-sm text-gray-500 hover:text-gray-700 mr-2"
                      onClick={() => setExpanded((s) => ({ ...s, [vehicle._id]: !s[vehicle._id] }))}
                    >
                      {expanded[vehicle._id] ? "Hide details" : "Details"}
                    </button>

                    <Popconfirm title="Delete vehicle?" onConfirm={() => handleDelete(vehicle._id)} okText="Delete" cancelText="Cancel">
                      <button
                        type="button"
                        className={`text-red-500 hover:text-red-700 ${deletingId === vehicle._id ? "opacity-50 pointer-events-none" : ""}`}
                        aria-label="Delete vehicle"
                      >
                        <DeleteOutlined />
                      </button>
                    </Popconfirm>
                  </div>
                </div>

                {/* Vehicle details grid (COLOR REMOVED) */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div>
                    <span className="text-gray-600 text-sm">Type</span>
                    <p className="font-medium text-gray-800">{vehicle.vehicleType}</p>
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

                {expanded[vehicle._id] && (
                  <div className="pt-3 border-t space-y-2 text-sm text-gray-700">
                    {(() => {
                      const raw = vehicle.raw || {};
                      const docs: Record<string, string> = raw.documents || {};
                      const docKeys = Object.keys(docs);
                      const vehicleImages: string[] = Array.isArray(raw.vehicleImages) ? raw.vehicleImages : vehicle.images || [];

                      return (
                        <>
                          <div className="flex justify-between">
                            <span>Make</span>
                            <span className="font-medium">{raw.make || raw.companyName || "-"}</span>
                          </div>

                          <div className="flex justify-between">
                            <span>Model</span>
                            <span className="font-medium">{raw.vehicleModel || raw.model || "-"}</span>
                          </div>

                          <div className="flex justify-between">
                            <span>License Plate</span>
                            <span className="font-medium">
                              {raw.licensePlate || raw.licensePlateNumber || raw.vehicleNumber || "-"}
                            </span>
                          </div>

                          <div className="flex justify-between">
                            <span>Vehicle Class</span>
                            <span className="font-medium">{raw.vehicleClass || raw.vehicleType || "-"}</span>
                          </div>

                          <div className="flex justify-between">
                            <span>Status</span>
                            <span className="font-medium">{raw.status || vehicle.status || "-"}</span>
                          </div>

                          {vehicleImages.length > 0 && (
                            <div className="pt-2">
                              <div className="text-sm font-medium text-gray-800">Vehicle Images</div>
                              <div className="grid grid-cols-2 gap-3 mt-2">
                                {vehicleImages.map((url, idx) => (
                                  <a key={`${url}-${idx}`} href={url} target="_blank" rel="noreferrer" className="block">
                                    <img
                                      src={url}
                                      alt={`Vehicle ${idx + 1}`}
                                      loading="lazy"
                                      className="w-full h-24 object-cover rounded-md border border-gray-200 bg-gray-50"
                                    />
                                    <div className="text-xs text-gray-600 underline mt-1">Open</div>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="pt-2">
                            <div className="text-sm font-medium text-gray-800">Documents</div>

                            {docKeys.length > 0 ? (
                              <div className="grid grid-cols-2 gap-3 mt-2">
                                {docKeys.map((key) => {
                                  const url = docs[key];
                                  if (!url) return null;

                                  const label = formatDocLabel(key);
                                  const showImage = isImageUrl(url);

                                  return (
                                    <a key={key} href={url} target="_blank" rel="noreferrer" className="block">
                                      <div className="text-xs font-medium text-gray-800 mb-1">{label}</div>
                                      {showImage ? (
                                        <img
                                          src={url}
                                          alt={label}
                                          loading="lazy"
                                          className="w-full h-24 object-cover rounded-md border border-gray-200 bg-gray-50"
                                        />
                                      ) : (
                                        <div className="text-xs text-gray-600 underline break-all">Open</div>
                                      )}
                                    </a>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-gray-500 mt-1">No documents uploaded</p>
                            )}
                          </div>
                        </>
                      );
                    })()}
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

export default VehiclesTab;