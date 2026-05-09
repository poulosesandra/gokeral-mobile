import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

const VehiclesPage = () => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [filters, setFilters] = useState({
    verificationStatus: "",
    isActive: "",
  });

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const data = await adminService.listVehicles({
        verificationStatus: filters.verificationStatus || undefined,
        isActive: filters.isActive === "" ? undefined : filters.isActive === "true",
      });
      setVehicles(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const applyFilters = () => {
    loadVehicles();
  };

  const resetFilters = () => {
    setFilters({ verificationStatus: "", isActive: "" });
    loadVehicles();
  };

  const updateVerification = async (vehicle: any, status: string) => {
    await adminService.updateVehicleVerification(vehicle._id, {
      verificationStatus: status,
      verificationNotes: verificationNotes || undefined,
    });
    await loadVehicles();
  };

  const openDetails = async (vehicle: any) => {
    setSelectedVehicle(null);
    setDetailsOpen(true);
    setDetailsLoading(true);
    setVerificationNotes("");
    try {
      const detail = await adminService.getVehicle(vehicle._id);
      setSelectedVehicle(detail);
      setVerificationNotes(detail?.verificationNotes || "");
    } finally {
      setDetailsLoading(false);
    }
  };

  const bulkApprove = async () => {
    await adminService.bulkApproveVehicles();
    await loadVehicles();
  };

  const documentEntries = (vehicle: any) => {
    const docs = vehicle?.documents || {};
    return [
      { label: "Insurance", value: docs.insurance },
      { label: "RC", value: docs.rc },
      { label: "Permit", value: docs.permit },
      { label: "Fitness", value: docs.fitness },
    ].filter((doc) => doc.value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Vehicle Verification</h1>
        <p className="text-gray-600 mt-1">Approve vehicles before drivers can accept rides.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={bulkApprove}
          className="px-4 py-2 rounded-full border border-emerald-200 text-emerald-700 text-sm font-semibold"
        >
          Approve all existing vehicles
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <select
            className="border border-gray-200 rounded-xl px-3 py-2"
            value={filters.verificationStatus}
            onChange={(e) => setFilters((prev) => ({ ...prev, verificationStatus: e.target.value }))}
          >
            <option value="">All Verification</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            className="border border-gray-200 rounded-xl px-3 py-2"
            value={filters.isActive}
            onChange={(e) => setFilters((prev) => ({ ...prev, isActive: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <div className="flex gap-3">
            <button
              onClick={applyFilters}
              className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold"
            >
              Apply
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold"
            >
              Reset
            </button>
          </div>
        </div>
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
                  <button
                    onClick={() => openDetails(vehicle)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 bg-white"
                  >
                    View details
                  </button>
                  {vehicle.verificationStatus === "APPROVED" ? (
                    <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                      Approved
                    </span>
                  ) : vehicle.verificationStatus === "REJECTED" ? (
                    <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-700">
                      Rejected
                    </span>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            ))}
            {vehicles.length === 0 && <p className="text-gray-500">No vehicles found.</p>}
          </div>
        )}
      </div>

      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Vehicle Verification</h3>
                <p className="text-xs text-gray-500">Review vehicle documents and registration details.</p>
              </div>
              <button onClick={() => setDetailsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {detailsLoading || !selectedVehicle ? (
              <p className="text-gray-500 mt-6">Loading...</p>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Vehicle</p>
                    <p className="font-semibold text-gray-900">
                      {selectedVehicle.make} {selectedVehicle.vehicleModel}
                    </p>
                    <p className="text-xs text-gray-500">{selectedVehicle.registrationNumber}</p>
                    <p className="text-xs text-gray-500">Type: {selectedVehicle.type}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                    <p className="text-sm text-gray-900">
                      {selectedVehicle.verificationStatus || "PENDING"}
                    </p>
                    <p className="text-xs text-gray-500">Driver ID: {selectedVehicle.driverId}</p>
                  </div>
                </div>

                {Array.isArray(selectedVehicle.vehicleImages) && selectedVehicle.vehicleImages.length > 0 ? (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Vehicle Images</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      {selectedVehicle.vehicleImages.map((url: string) => (
                        <a key={url} href={url} target="_blank" rel="noreferrer">
                          <img
                            src={url}
                            alt="Vehicle"
                            className="h-32 w-full rounded-xl object-cover"
                            onError={(event) => {
                              (event.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Vehicle Images</p>
                    <p className="text-sm text-gray-500 mt-2">No vehicle images uploaded.</p>
                  </div>
                )}

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Documents</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {documentEntries(selectedVehicle).map((doc) => (
                      <a
                        key={doc.label}
                        href={doc.value}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-emerald-700 hover:border-emerald-400"
                      >
                        {doc.label}
                      </a>
                    ))}
                    {documentEntries(selectedVehicle).length === 0 && (
                      <p className="text-sm text-gray-500">No documents uploaded.</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Verification Notes</p>
                  <textarea
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                    rows={3}
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Add notes about verification outcome"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => selectedVehicle && updateVerification(selectedVehicle, "APPROVED")}
                    className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold"
                  >
                    Approve vehicle
                  </button>
                  <button
                    onClick={() => selectedVehicle && updateVerification(selectedVehicle, "REJECTED")}
                    className="px-4 py-2 rounded-full bg-rose-500 text-white text-sm font-semibold"
                  >
                    Reject vehicle
                  </button>
                  <button
                    onClick={() => setDetailsOpen(false)}
                    className="px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiclesPage;
