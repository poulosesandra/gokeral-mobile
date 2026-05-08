import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.listAccounts({ role: "USER" });
      setUsers(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

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
