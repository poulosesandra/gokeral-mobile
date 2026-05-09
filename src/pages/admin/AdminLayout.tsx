import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/admin" },
  { label: "Stands", to: "/admin/stands" },
  { label: "Drivers", to: "/admin/drivers" },
  { label: "Vehicles", to: "/admin/vehicles" },
  { label: "Bookings", to: "/admin/bookings" },
  { label: "Users", to: "/admin/users" },
  { label: "Payments", to: "/admin/payments" },
  { label: "Reports", to: "/admin/reports" },
];

const AdminLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center">
              K
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">Kerides Admin</p>
              <p className="text-xs text-gray-500">Operations Console</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-3 text-sm text-gray-600">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin"}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-full transition ${
                    isActive ? "bg-emerald-100 text-emerald-700" : "hover:bg-gray-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
