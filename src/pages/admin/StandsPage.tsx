import { useEffect, useState } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { adminService } from "../../services/adminService";
import type { StandPayload } from "../../services/adminService";

const StandsPage = () => {
  const [stands, setStands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [selectedStand, setSelectedStand] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsForm, setDetailsForm] = useState<StandPayload | null>(null);
  const [form, setForm] = useState<StandPayload>({
    name: "",
    latitude: 0,
    longitude: 0,
    radiusKm: 2,
    isActive: true,
  });
  const googleMapsKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.VITE_GOOGLE_MAP_API_KEY) as string | undefined;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: googleMapsKey || "",
  });

  const loadStands = async () => {
    setLoading(true);
    try {
      const data = await adminService.listStands({
        isActive: activeOnly ? true : undefined,
        search: search.trim() || undefined,
      });
      setStands(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStands();
  }, []);

  const applyFilters = () => {
    loadStands();
  };

  const resetFilters = () => {
    setSearch("");
    setActiveOnly(false);
    loadStands();
  };

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

  const openDetails = (stand: any) => {
    setSelectedStand(stand);
    setDetailsForm({
      name: stand.name || "",
      latitude: Number(stand.latitude || 0),
      longitude: Number(stand.longitude || 0),
      radiusKm: Number(stand.radiusKm || 2),
      isActive: Boolean(stand.isActive),
    });
    setDetailsOpen(true);
  };

  const saveDetails = async () => {
    if (!selectedStand || !detailsForm) return;
    await adminService.updateStand(selectedStand._id, detailsForm);
    setDetailsOpen(false);
    await loadStands();
  };

  const deleteStand = async () => {
    if (!selectedStand) return;
    await adminService.deleteStand(selectedStand._id);
    setDetailsOpen(false);
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

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="border border-gray-200 rounded-xl px-4 py-2"
            placeholder="Search stand"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="text-sm text-gray-600 flex items-center gap-2">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            Active only
          </label>
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
        <h2 className="text-lg font-semibold text-gray-900">Create Stand</h2>
        <p className="text-sm text-gray-500 mt-1">
          Stands define pickup coverage zones. Drivers assigned to a stand get priority for nearby ride requests,
          improving dispatch speed and reducing rider wait time.
        </p>
        <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
          <p className="font-semibold text-gray-800">What to fill</p>
          <p>1) Stand name: location name riders recognize.</p>
          <p>2) Latitude/Longitude: stand center point (use the map picker).</p>
          <p>3) Radius: coverage circle in km for priority dispatch.</p>
        </div>
        <div className="grid gap-4 mt-4 md:grid-cols-2">
          <input
            className="border border-gray-200 rounded-xl px-4 py-2"
            placeholder="Stand name (e.g., Rajapur Auto Stand)"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            className="border border-gray-200 rounded-xl px-4 py-2"
            placeholder="Latitude (example: 9.9312)"
            type="number"
            value={form.latitude}
            onChange={(e) => setForm((prev) => ({ ...prev, latitude: Number(e.target.value) }))}
          />
          <input
            className="border border-gray-200 rounded-xl px-4 py-2"
            placeholder="Longitude (example: 76.2673)"
            type="number"
            value={form.longitude}
            onChange={(e) => setForm((prev) => ({ ...prev, longitude: Number(e.target.value) }))}
          />
          <input
            className="border border-gray-200 rounded-xl px-4 py-2"
            placeholder="Radius in km (service coverage)"
            type="number"
            value={form.radiusKm}
            onChange={(e) => setForm((prev) => ({ ...prev, radiusKm: Number(e.target.value) }))}
          />
        </div>
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Pick location on map</p>
          <div className="mt-2 h-64 rounded-2xl overflow-hidden border border-gray-100">
            {isLoaded && googleMapsKey ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={{ lat: form.latitude || 9.9312, lng: form.longitude || 76.2673 }}
                zoom={13}
                onClick={(event) => {
                  if (!event.latLng) return;
                  setForm((prev) => ({
                    ...prev,
                    latitude: Number(event.latLng?.lat?.() || 0),
                    longitude: Number(event.latLng?.lng?.() || 0),
                  }));
                }}
                options={{
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: false,
                }}
              >
                <Marker position={{ lat: form.latitude || 9.9312, lng: form.longitude || 76.2673 }} />
              </GoogleMap>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                Add `VITE_GOOGLE_MAPS_API_KEY` to enable map picker.
              </div>
            )}
          </div>
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
                    onClick={() => openDetails(stand)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 bg-white"
                  >
                    View
                  </button>
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

      {detailsOpen && detailsForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Stand Details</h3>
                <p className="text-xs text-gray-500">Update stand data or remove the stand.</p>
              </div>
              <button onClick={() => setDetailsOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="mt-4 grid gap-3">
              <input
                className="border border-gray-200 rounded-xl px-4 py-2"
                value={detailsForm.name}
                onChange={(e) => setDetailsForm((prev) => prev ? { ...prev, name: e.target.value } : prev)}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="border border-gray-200 rounded-xl px-4 py-2"
                  type="number"
                  value={detailsForm.latitude}
                  onChange={(e) => setDetailsForm((prev) => prev ? { ...prev, latitude: Number(e.target.value) } : prev)}
                />
                <input
                  className="border border-gray-200 rounded-xl px-4 py-2"
                  type="number"
                  value={detailsForm.longitude}
                  onChange={(e) => setDetailsForm((prev) => prev ? { ...prev, longitude: Number(e.target.value) } : prev)}
                />
              </div>
              <input
                className="border border-gray-200 rounded-xl px-4 py-2"
                type="number"
                value={detailsForm.radiusKm}
                onChange={(e) => setDetailsForm((prev) => prev ? { ...prev, radiusKm: Number(e.target.value) } : prev)}
              />
              <label className="text-sm text-gray-600 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={Boolean(detailsForm.isActive)}
                  onChange={(e) => setDetailsForm((prev) => prev ? { ...prev, isActive: e.target.checked } : prev)}
                />
                Active
              </label>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={saveDetails}
                className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold"
              >
                Save changes
              </button>
              <button
                onClick={deleteStand}
                className="px-4 py-2 rounded-full border border-rose-200 text-rose-600 text-sm font-semibold"
              >
                Delete stand
              </button>
              <button
                onClick={() => setDetailsOpen(false)}
                className="px-4 py-2 rounded-full border border-gray-200 text-sm font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandsPage;
