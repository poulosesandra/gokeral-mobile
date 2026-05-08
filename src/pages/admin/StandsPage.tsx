import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";
import type { StandPayload } from "../../services/adminService";

const StandsPage = () => {
  const [stands, setStands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<StandPayload>({
    name: "",
    latitude: 0,
    longitude: 0,
    radiusKm: 2,
    isActive: true,
  });

  const loadStands = async () => {
    setLoading(true);
    try {
      const data = await adminService.listStands();
      setStands(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStands();
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await adminService.createStand(form);
    setForm({ name: "", latitude: 0, longitude: 0, radiusKm: 2, isActive: true });
    await loadStands();
  };

  const toggleStatus = async (stand: any) => {
    await adminService.updateStandStatus(stand._id, !stand.isActive);
    await loadStands();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Stand Management</h1>
          <p className="text-gray-600 mt-1">Create and activate stands for priority dispatch.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Create Stand</h2>
        <div className="grid gap-4 mt-4 md:grid-cols-2">
          <input
            className="border border-gray-200 rounded-xl px-4 py-2"
            placeholder="Stand name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            className="border border-gray-200 rounded-xl px-4 py-2"
            placeholder="Latitude"
            type="number"
            value={form.latitude}
            onChange={(e) => setForm((prev) => ({ ...prev, latitude: Number(e.target.value) }))}
          />
          <input
            className="border border-gray-200 rounded-xl px-4 py-2"
            placeholder="Longitude"
            type="number"
            value={form.longitude}
            onChange={(e) => setForm((prev) => ({ ...prev, longitude: Number(e.target.value) }))}
          />
          <input
            className="border border-gray-200 rounded-xl px-4 py-2"
            placeholder="Radius (km)"
            type="number"
            value={form.radiusKm}
            onChange={(e) => setForm((prev) => ({ ...prev, radiusKm: Number(e.target.value) }))}
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleCreate}
            className="px-5 py-2 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
          >
            Create Stand
          </button>
          <label className="text-sm text-gray-600 flex items-center gap-2">
            <input
              type="checkbox"
              checked={Boolean(form.isActive)}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Active
          </label>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Stands</h2>
        {loading ? (
          <p className="text-gray-500 mt-4">Loading...</p>
        ) : (
          <div className="mt-4 space-y-3">
            {stands.map((stand) => (
              <div key={stand._id} className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <p className="font-semibold text-gray-900">{stand.name}</p>
                  <p className="text-xs text-gray-500">Radius {stand.radiusKm} km</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${stand.isActive ? "text-emerald-600" : "text-amber-600"}`}>
                    {stand.isActive ? "Active" : "Paused"}
                  </span>
                  <button
                    onClick={() => toggleStatus(stand)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 bg-white"
                  >
                    {stand.isActive ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>
            ))}
            {stands.length === 0 && <p className="text-gray-500">No stands created yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default StandsPage;
