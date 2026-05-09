import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

const DriversPage = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [stands, setStands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [filters, setFilters] = useState({
    verificationStatus: "",
    isOnline: "",
    isVerified: "",
    assignedStandId: "",
  });

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const data = await adminService.listDrivers({
        search: search.trim() || undefined,
        verificationStatus: filters.verificationStatus || undefined,
        isOnline: filters.isOnline === "" ? undefined : filters.isOnline === "true",
        isVerified: filters.isVerified === "" ? undefined : filters.isVerified === "true",
        assignedStandId: filters.assignedStandId || undefined,
      });
      setDrivers(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  const loadStands = async () => {
    const data = await adminService.listStands({ isActive: true });
    setStands(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    loadDrivers();
    loadStands();
  }, []);

  const applyFilters = () => {
    loadDrivers();
  };

  const resetFilters = () => {
    setSearch("");
    setFilters({ verificationStatus: "", isOnline: "", isVerified: "", assignedStandId: "" });
    loadDrivers();
  };

  const updateVerification = async (driver: any, status: string, isVerified: boolean) => {
    await adminService.updateDriverVerification(driver.accountId || driver.accountId, {
      verificationStatus: status,
      isVerified,
      verificationNotes: verificationNotes || undefined,
    });
    await loadDrivers();
  };

  const openDetails = async (driver: any) => {
    setSelectedDriver(null);
    setDetailsOpen(true);
    setDetailsLoading(true);
    setVerificationNotes("");
    try {
      const detail = await adminService.getDriver(driver.accountId || driver.accountId);
      setSelectedDriver(detail);
      setVerificationNotes(detail?.verificationNotes || "");
    } finally {
      setDetailsLoading(false);
    }
  };

  const bulkApprove = async () => {
    await adminService.bulkApproveDrivers();
    await loadDrivers();
  };

  const documentEntries = (driver: any) => {
    if (!driver) return [];
    return [
      { label: "Driving License", value: driver.drivingLicenseCertificate },
      { label: "Police Clearance", value: driver.policeClearanceCertificate },
      { label: "Medical Fitness", value: driver.medicalFitnessCertificate },
      { label: "Address Proof", value: driver.addressProof },
      { label: "Training Certificate", value: driver.professionalTrainingCertificate },
    ].filter((doc) => doc.value);
  };

  const assignStand = async (driver: any, standId: string) => {
    await adminService.assignDriverStand(driver.accountId || driver.accountId, standId || undefined);
    await loadDrivers();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Driver Verification</h1>
          <p className="text-gray-600 mt-1">Approve or reject driver profiles before they can accept rides.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={bulkApprove}
            className="px-4 py-2 rounded-full border border-emerald-200 text-emerald-700 text-sm font-semibold"
          >
            Approve all existing drivers
          </button>
          <input
            className="border border-gray-200 rounded-full px-4 py-2"
            placeholder="Search driver"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="px-4 py-2 rounded-full bg-emerald-600 text-white font-semibold"
            onClick={applyFilters}
          >
            Search
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            value={filters.verificationStatus}
            onChange={(e) => setFilters((prev) => ({ ...prev, verificationStatus: e.target.value }))}
          >
            <option value="">All Verification</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            value={filters.isOnline}
            onChange={(e) => setFilters((prev) => ({ ...prev, isOnline: e.target.value }))}
          >
            <option value="">All Online</option>
            <option value="true">Online</option>
            <option value="false">Offline</option>
          </select>
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            value={filters.isVerified}
            onChange={(e) => setFilters((prev) => ({ ...prev, isVerified: e.target.value }))}
          >
            <option value="">All Verified</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            value={filters.assignedStandId}
            onChange={(e) => setFilters((prev) => ({ ...prev, assignedStandId: e.target.value }))}
          >
            <option value="">All Stands</option>
            {stands.map((stand) => (
              <option key={stand._id} value={stand._id}>
                {stand.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={applyFilters}
            className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold"
          >
            Apply Filters
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-3">
            {drivers.map((driver) => (
              <div key={driver._id} className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <p className="font-semibold text-gray-900">{driver.fullName || "Unnamed Driver"}</p>
                  <p className="text-xs text-gray-500">{driver.email || ""}</p>
                  <p className="text-xs text-gray-500">
                    {driver.isOnline ? "Online" : "Offline"} · {driver.isVerified ? "Verified" : "Unverified"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDetails(driver)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 bg-white"
                  >
                    View details
                  </button>
                  <select
                    className="border border-gray-200 rounded-full px-3 py-1.5 text-xs"
                    value={driver.assignedStandId || ""}
                    onChange={(e) => assignStand(driver, e.target.value)}
                  >
                    <option value="">No Stand</option>
                    {stands.map((stand) => (
                      <option key={stand._id} value={stand._id}>
                        {stand.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-600">
                    {driver.verificationStatus || "PENDING"}
                  </span>
                  {driver.verificationStatus === "APPROVED" ? (
                    <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                      Approved
                    </span>
                  ) : driver.verificationStatus === "REJECTED" ? (
                    <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-rose-100 text-rose-700">
                      Rejected
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => updateVerification(driver, "APPROVED", true)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-full bg-emerald-600 text-white"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateVerification(driver, "REJECTED", false)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-full bg-rose-500 text-white"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {drivers.length === 0 && <p className="text-gray-500">No drivers found.</p>}
          </div>
        )}
      </div>

      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Driver Verification</h3>
                <p className="text-xs text-gray-500">Review uploaded documents before approval.</p>
              </div>
              <button onClick={() => setDetailsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {detailsLoading || !selectedDriver ? (
              <p className="text-gray-500 mt-6">Loading...</p>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Driver</p>
                    <p className="font-semibold text-gray-900">{selectedDriver.fullName || "Unknown"}</p>
                    <p className="text-xs text-gray-500">{selectedDriver.email || ""}</p>
                    <p className="text-xs text-gray-500">{selectedDriver.phoneNumber || ""}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                    <p className="text-sm text-gray-900">
                      {selectedDriver.verificationStatus || "PENDING"} · {selectedDriver.isVerified ? "Verified" : "Unverified"}
                    </p>
                    <p className="text-xs text-gray-500">
                      License: {selectedDriver.licenseNumber || "N/A"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">Uploaded Documents</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {documentEntries(selectedDriver).map((doc) => (
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
                    {documentEntries(selectedDriver).length === 0 && (
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
                    onClick={() => selectedDriver && updateVerification(selectedDriver, "APPROVED", true)}
                    className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold"
                  >
                    Approve driver
                  </button>
                  <button
                    onClick={() => selectedDriver && updateVerification(selectedDriver, "REJECTED", false)}
                    className="px-4 py-2 rounded-full bg-rose-500 text-white text-sm font-semibold"
                  >
                    Reject driver
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

export default DriversPage;
