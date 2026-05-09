import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.listAccounts({
        role: "USER",
        search: search.trim() || undefined,
        isActive: activeFilter === "" ? undefined : activeFilter === "true",
      });
      setUsers(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const applyFilters = () => {
    loadUsers();
  };

  const resetFilters = () => {
    setSearch("");
    setActiveFilter("");
    loadUsers();
  };

  const toggleActive = async (user: any) => {
    await adminService.updateAccountStatus(user._id, !user.isActive);
    await loadUsers();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Activate or suspend user accounts.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <input
            className="border border-gray-200 rounded-xl px-4 py-2"
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="border border-gray-200 rounded-xl px-3 py-2"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Suspended</option>
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
            {users.map((user) => (
              <div key={user._id} className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <p className="font-semibold text-gray-900">{user.fullName || "Unnamed User"}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold ${user.isActive ? "text-emerald-600" : "text-rose-600"}`}>
                    {user.isActive ? "Active" : "Suspended"}
                  </span>
                  <button
                    onClick={() => toggleActive(user)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-full border border-gray-200 bg-white"
                  >
                    {user.isActive ? "Suspend" : "Activate"}
                  </button>
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="text-gray-500">No users found.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
