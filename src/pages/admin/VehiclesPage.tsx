import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await adminService.listVehicles();
      setVehicles(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const updateVerification = async (vehicle: any, status: string) => {
    await adminService.updateVehicleVerification(vehicle._id, { verificationStatus: status });
    await loadVehicles();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Vehicle Verification</h1>
        <p className="text-gray-600 mt-1">Approve vehicles before drivers can accept rides.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <div key={vehicle._id} className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <p className="font-semibold text-gray-900">{vehicle.make} {vehicle.vehicleModel}</p>
                  <p className="text-xs text-gray-500">{vehicle.registrationNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-600">
                    {vehicle.verificationStatus || "PENDING"}
                  </span>
                  <button
                    onClick={() => updateVerification(vehicle, "APPROVED")}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-600 text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateVerification(vehicle, "REJECTED")}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full bg-rose-500 text-white"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {vehicles.length === 0 && <p className="text-gray-500">No vehicles found.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default VehiclesPage;
