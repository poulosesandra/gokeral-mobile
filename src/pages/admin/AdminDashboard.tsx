const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor stand coverage, drivers, and bookings in real time.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-full border border-gray-200 bg-white text-gray-700 font-semibold">
            Export Report
          </button>
          <button className="px-4 py-2 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-700">
            Create Stand
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active Stands", value: "28" },
          { label: "Drivers Online", value: "412" },
          { label: "Average ETA", value: "6m 12s" },
          { label: "Stand Coverage", value: "92%" },
        ].map((card) => (
          <div key={card.label} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-3">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm min-h-[260px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Live Stand Map</h2>
            <span className="text-xs text-gray-500">Real-time coverage</span>
          </div>
          <div className="h-48 rounded-xl bg-gradient-to-br from-emerald-100 via-amber-50 to-white border border-dashed border-emerald-200"></div>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Alert Queue</h2>
          <div className="mt-4 space-y-3">
            {[
              { name: "Kochi Stand", status: "Low Supply", color: "text-amber-600" },
              { name: "Trivandrum Stand", status: "Healthy", color: "text-emerald-600" },
              { name: "Alappuzha Stand", status: "High Demand", color: "text-rose-600" },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className={`text-xs font-semibold ${item.color}`}>{item.status}</p>
                </div>
                <button className="px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 bg-white">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
