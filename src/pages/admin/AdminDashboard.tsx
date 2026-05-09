import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminService } from "../../services/adminService";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

declare global {
  interface Window {
    google: any;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";
const DEFAULT_MAP_CENTER = { lat: 9.9312, lng: 76.2673 };

const loadGoogleMaps = (apiKey: string): Promise<void> => {
  if (window.google?.maps) {
    return Promise.resolve();
  }

  const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () => reject(new Error("Google Maps failed to load")));
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps failed to load"));
    document.head.appendChild(script);
  });
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    stands: 0,
    driversOnline: 0,
    driversTotal: 0,
    activeBookings: 0,
    totalBookings: 0,
    usersTotal: 0,
    pendingVehicles: 0,
  });
  const [standStatus, setStandStatus] = useState<any[]>([]);
  const [driverLocations, setDriverLocations] = useState<any[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const googleMapsKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.VITE_GOOGLE_MAP_API_KEY) as string | undefined;

  const loadStats = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        adminService.listStands(),
        adminService.listDrivers(),
        adminService.listDrivers({ isOnline: true }),
        adminService.listVehicles({ verificationStatus: "PENDING" }),
        adminService.listBookings({ page: 1, limit: 1 }),
        adminService.listBookings({ status: "IN_PROGRESS", page: 1, limit: 1 }),
        adminService.listAccounts({ role: "USER" }),
      ]);

      const stands = results[0].status === "fulfilled" && Array.isArray(results[0].value)
        ? results[0].value
        : [];
      const drivers = results[1].status === "fulfilled" && Array.isArray(results[1].value)
        ? results[1].value
        : [];
      const driversOnline = results[2].status === "fulfilled" && Array.isArray(results[2].value)
        ? results[2].value
        : [];
      const vehiclesPending = results[3].status === "fulfilled" && Array.isArray(results[3].value)
        ? results[3].value
        : [];
      const bookingsTotal = results[4].status === "fulfilled" ? results[4].value : null;
      const bookingsActive = results[5].status === "fulfilled" ? results[5].value : null;
      const users = results[6].status === "fulfilled" && Array.isArray(results[6].value)
        ? results[6].value
        : [];

      const standHealth = stands.map((stand: any) => {
        const assignedDrivers = drivers.filter(
          (driver: any) => String(driver.assignedStandId || "") === String(stand._id),
        );
        const onlineDrivers = assignedDrivers.filter((driver: any) => driver.isOnline);
        const onlineCount = onlineDrivers.length;
        let status = "Healthy";
        let color = "text-emerald-600";

        if (onlineCount === 0) {
          status = "High Demand";
          color = "text-rose-600";
        } else if (onlineCount <= 2) {
          status = "Low Supply";
          color = "text-amber-600";
        }

        return {
          id: stand._id,
          name: stand.name,
          status,
          color,
          onlineCount,
          totalDrivers: assignedDrivers.length,
        };
      });

      setStats({
        stands: stands.length,
        driversOnline: driversOnline.length,
        driversTotal: drivers.length,
        activeBookings: Number(bookingsActive?.total || 0),
        totalBookings: Number(bookingsTotal?.total || 0),
        usersTotal: users.length,
        pendingVehicles: vehiclesPending.length,
      });
      setStandStatus(standHealth);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const loadDriverLocations = async () => {
    try {
      const data = await adminService.listDriverLocations();
      setDriverLocations(Array.isArray(data) ? data : []);
    } catch {
      setDriverLocations([]);
    }
  };

  useEffect(() => {
    loadDriverLocations();
    const timer = window.setInterval(loadDriverLocations, 15000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!googleMapsKey) {
      setMapError("Missing VITE_GOOGLE_MAPS_API_KEY for admin map.");
      return undefined;
    }

    loadGoogleMaps(googleMapsKey)
      .then(() => {
        if (cancelled || !mapContainerRef.current) return;
        if (!mapRef.current) {
          mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
            center: DEFAULT_MAP_CENTER,
            zoom: 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMapError("Unable to load Google Maps.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [googleMapsKey]);

  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    if (clustererRef.current) {
      clustererRef.current.clearMarkers();
    }

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    const validLocations = driverLocations.filter(
      (driver) => typeof driver.latitude === "number" && typeof driver.longitude === "number",
    );

    if (!validLocations.length) return;

    const bounds = new window.google.maps.LatLngBounds();

    validLocations.forEach((driver) => {
      const position = { lat: driver.latitude, lng: driver.longitude };
      const marker = new window.google.maps.Marker({
        position,
        title: driver.fullName || driver.accountId || "Driver",
      });
      markersRef.current.push(marker);
      bounds.extend(position);
    });

    if (!clustererRef.current) {
      clustererRef.current = new MarkerClusterer({
        map: mapRef.current,
        markers: markersRef.current,
      });
    } else {
      clustererRef.current.addMarkers(markersRef.current);
    }

    if (validLocations.length === 1) {
      mapRef.current.setCenter(bounds.getCenter());
      mapRef.current.setZoom(14);
    } else {
      mapRef.current.fitBounds(bounds);
    }
  }, [driverLocations]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor stand coverage, drivers, and bookings in real time.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/admin/reports")}
            className="px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 font-semibold"
          >
            Export Report
          </button>
          <button
            onClick={() => navigate("/admin/stands")}
            className="px-4 py-2 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
          >
            Create Stand
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active Stands", value: stats.stands },
          { label: "Drivers Online", value: stats.driversOnline },
          { label: "Active Rides", value: stats.activeBookings },
          { label: "Total Users", value: stats.usersTotal },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-3">
              {loading ? "..." : card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-h-[260px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Live Stand Map</h2>
            <span className="text-xs text-gray-500">Live drivers: {driverLocations.length}</span>
          </div>
          <div className="h-72 rounded-xl border border-gray-100 overflow-hidden">
            {mapError ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                {mapError}
              </div>
            ) : (
              <div ref={mapContainerRef} className="h-full w-full" />
            )}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Stand Queue</h2>
          <div className="mt-4 space-y-3">
            {standStatus.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className={`text-xs font-semibold ${item.color}`}>
                    {item.status} · {item.onlineCount}/{item.totalDrivers} drivers online
                  </p>
                </div>
                <button
                  onClick={() => navigate("/admin/stands")}
                  className="px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 bg-white"
                >
                  View
                </button>
              </div>
            ))}
            {standStatus.length === 0 && (
              <p className="text-sm text-gray-500">No stands created yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
