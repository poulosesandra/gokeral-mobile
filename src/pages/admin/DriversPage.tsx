import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

const DriversPage = () => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [stands, setStands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const data = await adminService.listDrivers({ search: search.trim() || undefined });
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

  const updateVerification = async (driver: any, status: string, isVerified: boolean) => {
    await adminService.updateDriverVerification(driver.accountId || driver.accountId, {
      verificationStatus: status,
      isVerified,
    });
    await loadDrivers();
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
          <input
            className="border border-gray-200 rounded-full px-4 py-2"
            placeholder="Search driver"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="px-4 py-2 rounded-full bg-emerald-600 text-white font-semibold"
            onClick={loadDrivers}
          >
            Search
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
                </div>
                <div className="flex items-center gap-2">
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
                </div>
              </div>
            ))}
            {drivers.length === 0 && <p className="text-gray-500">No drivers found.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriversPage;
