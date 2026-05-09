import { useState } from "react";
import { adminService } from "../../services/adminService";

const ReportsPage = () => {
  const [userSearch, setUserSearch] = useState("");
  const [userActive, setUserActive] = useState("");
  const [driverFilters, setDriverFilters] = useState({
    verificationStatus: "",
    isOnline: "",
    isVerified: "",
  });
  const [bookingFilters, setBookingFilters] = useState({
    status: "",
    userId: "",
    driverId: "",
    from: "",
    to: "",
  });
  const [paymentFilters, setPaymentFilters] = useState({
    status: "",
    method: "",
    gateway: "",
    from: "",
    to: "",
  });
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const downloadBlob = (data: Blob | string, filename: string) => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportUsers = async () => {
    setLoadingKey("users");
    try {
      const blob = await adminService.exportAccounts({
        role: "USER",
        isActive: userActive === "" ? undefined : userActive === "true",
        search: userSearch.trim() || undefined,
      });
      downloadBlob(blob, "users.csv");
    } finally {
      setLoadingKey(null);
    }
  };

  const exportDrivers = async () => {
    setLoadingKey("drivers");
    try {
      const blob = await adminService.exportDrivers({
        verificationStatus: driverFilters.verificationStatus || undefined,
        isOnline: driverFilters.isOnline === "" ? undefined : driverFilters.isOnline === "true",
        isVerified: driverFilters.isVerified === "" ? undefined : driverFilters.isVerified === "true",
      });
      downloadBlob(blob, "drivers.csv");
    } finally {
      setLoadingKey(null);
    }
  };

  const exportBookings = async () => {
    setLoadingKey("bookings");
    try {
      const blob = await adminService.exportBookings({
        status: bookingFilters.status || undefined,
        userId: bookingFilters.userId || undefined,
        driverId: bookingFilters.driverId || undefined,
        from: bookingFilters.from || undefined,
        to: bookingFilters.to || undefined,
      });
      downloadBlob(blob, "bookings.csv");
    } finally {
      setLoadingKey(null);
    }
  };

  const exportPayments = async () => {
    setLoadingKey("payments");
    try {
      const blob = await adminService.exportPayments({
        status: paymentFilters.status || undefined,
        method: paymentFilters.method || undefined,
        gateway: paymentFilters.gateway || undefined,
        from: paymentFilters.from || undefined,
        to: paymentFilters.to || undefined,
      });
      downloadBlob(blob, "payments.csv");
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reports & Exports</h1>
        <p className="text-gray-600 mt-1">Generate CSV exports for QA and operational reviews.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Users Export</h2>
            <p className="text-sm text-gray-500">Export user accounts with optional filters.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              placeholder="Search name/email"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={userActive}
              onChange={(e) => setUserActive(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Suspended</option>
            </select>
          </div>
          <button
            onClick={exportUsers}
            className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold"
            disabled={loadingKey === "users"}
          >
            {loadingKey === "users" ? "Exporting..." : "Export Users CSV"}
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Drivers Export</h2>
            <p className="text-sm text-gray-500">Export driver profiles with verification filters.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={driverFilters.verificationStatus}
              onChange={(e) => setDriverFilters((prev) => ({ ...prev, verificationStatus: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={driverFilters.isOnline}
              onChange={(e) => setDriverFilters((prev) => ({ ...prev, isOnline: e.target.value }))}
            >
              <option value="">All Online</option>
              <option value="true">Online</option>
              <option value="false">Offline</option>
            </select>
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={driverFilters.isVerified}
              onChange={(e) => setDriverFilters((prev) => ({ ...prev, isVerified: e.target.value }))}
            >
              <option value="">All Verified</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>
          </div>
          <button
            onClick={exportDrivers}
            className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold"
            disabled={loadingKey === "drivers"}
          >
            {loadingKey === "drivers" ? "Exporting..." : "Export Drivers CSV"}
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Bookings Export</h2>
            <p className="text-sm text-gray-500">Export bookings with optional status and date filters.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={bookingFilters.status}
              onChange={(e) => setBookingFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="DRIVER_ARRIVED">Driver Arrived</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <input
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              placeholder="User ID"
              value={bookingFilters.userId}
              onChange={(e) => setBookingFilters((prev) => ({ ...prev, userId: e.target.value }))}
            />
            <input
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              placeholder="Driver ID"
              value={bookingFilters.driverId}
              onChange={(e) => setBookingFilters((prev) => ({ ...prev, driverId: e.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="date"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={bookingFilters.from}
                onChange={(e) => setBookingFilters((prev) => ({ ...prev, from: e.target.value }))}
              />
              <input
                type="date"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={bookingFilters.to}
                onChange={(e) => setBookingFilters((prev) => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </div>
          <button
            onClick={exportBookings}
            className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold"
            disabled={loadingKey === "bookings"}
          >
            {loadingKey === "bookings" ? "Exporting..." : "Export Bookings CSV"}
          </button>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Payments Export</h2>
            <p className="text-sm text-gray-500">Export payment transactions for finance review.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={paymentFilters.status}
              onChange={(e) => setPaymentFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All Status</option>
              <option value="CREATED">Created</option>
              <option value="PENDING">Pending</option>
              <option value="CAPTURED">Captured</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={paymentFilters.method}
              onChange={(e) => setPaymentFilters((prev) => ({ ...prev, method: e.target.value }))}
            >
              <option value="">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="NETBANKING">Netbanking</option>
              <option value="WALLET">Wallet</option>
              <option value="CASH">Cash</option>
            </select>
            <select
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={paymentFilters.gateway}
              onChange={(e) => setPaymentFilters((prev) => ({ ...prev, gateway: e.target.value }))}
            >
              <option value="">All Gateways</option>
              <option value="RAZORPAY">Razorpay</option>
              <option value="INTERNAL_WALLET">Internal Wallet</option>
              <option value="CASH">Cash</option>
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="date"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={paymentFilters.from}
                onChange={(e) => setPaymentFilters((prev) => ({ ...prev, from: e.target.value }))}
              />
              <input
                type="date"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                value={paymentFilters.to}
                onChange={(e) => setPaymentFilters((prev) => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </div>
          <button
            onClick={exportPayments}
            className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold"
            disabled={loadingKey === "payments"}
          >
            {loadingKey === "payments" ? "Exporting..." : "Export Payments CSV"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
