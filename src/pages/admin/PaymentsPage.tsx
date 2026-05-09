import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

const statusOptions = ["CREATED", "PENDING", "CAPTURED", "FAILED", "REFUNDED"];
const methodOptions = ["UPI", "CARD", "NETBANKING", "WALLET", "CASH"];
const gatewayOptions = ["RAZORPAY", "CASH", "INTERNAL_WALLET"];

const PaymentsPage = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    status: "",
    method: "",
    gateway: "",
    bookingId: "",
    userId: "",
    driverId: "",
    from: "",
    to: "",
  });

  const loadPayments = async () => {
    setLoading(true);
    try {
      const data = await adminService.listPayments({
        status: filters.status || undefined,
        method: filters.method || undefined,
        gateway: filters.gateway || undefined,
        bookingId: filters.bookingId || undefined,
        userId: filters.userId || undefined,
        driverId: filters.driverId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        page,
        limit,
      });
      setPayments(Array.isArray(data?.payments) ? data.payments : []);
      setTotal(Number(data?.total || 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [page]);

  const applyFilters = () => {
    setPage(1);
    loadPayments();
  };

  const resetFilters = () => {
    setFilters({
      status: "",
      method: "",
      gateway: "",
      bookingId: "",
      userId: "",
      driverId: "",
      from: "",
      to: "",
    });
    setPage(1);
    loadPayments();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Track payment status, methods, and settlement progress.</p>
        </div>
        <button
          onClick={loadPayments}
          className="px-4 py-2 rounded-full bg-emerald-600 text-white font-semibold"
        >
          Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Total Payments</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{total}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Captured</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {payments.filter((p) => String(p.status || "").toUpperCase() === "CAPTURED").length}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-gray-500">Pending</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {payments.filter((p) => String(p.status || "").toUpperCase() === "PENDING").length}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            value={filters.method}
            onChange={(e) => setFilters((prev) => ({ ...prev, method: e.target.value }))}
          >
            <option value="">All Methods</option>
            {methodOptions.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          <select
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            value={filters.gateway}
            onChange={(e) => setFilters((prev) => ({ ...prev, gateway: e.target.value }))}
          >
            <option value="">All Gateways</option>
            {gatewayOptions.map((gateway) => (
              <option key={gateway} value={gateway}>
                {gateway}
              </option>
            ))}
          </select>
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="Booking ID"
            value={filters.bookingId}
            onChange={(e) => setFilters((prev) => ({ ...prev, bookingId: e.target.value }))}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="User ID"
            value={filters.userId}
            onChange={(e) => setFilters((prev) => ({ ...prev, userId: e.target.value }))}
          />
          <input
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="Driver ID"
            value={filters.driverId}
            onChange={(e) => setFilters((prev) => ({ ...prev, driverId: e.target.value }))}
          />
          <input
            type="date"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            value={filters.from}
            onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
          />
          <input
            type="date"
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            value={filters.to}
            onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={applyFilters}
            className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold"
          >
            Apply Filters
          </button>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between text-sm text-gray-500 mb-4">
              <span>{total} payments found</span>
              <span>Page {page}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-gray-500 border-b">
                  <tr>
                    <th className="text-left py-2 pr-4">Payment</th>
                    <th className="text-left py-2 pr-4">Booking</th>
                    <th className="text-left py-2 pr-4">Amount</th>
                    <th className="text-left py-2 pr-4">Method</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2 pr-4">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id} className="border-b last:border-b-0">
                      <td className="py-3 pr-4 text-gray-900">{payment._id}</td>
                      <td className="py-3 pr-4 text-gray-600">{payment.bookingId}</td>
                      <td className="py-3 pr-4 text-gray-900">₹ {payment.amount}</td>
                      <td className="py-3 pr-4 text-gray-600">
                        {payment.method || "-"} · {payment.gateway || "-"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            String(payment.status || "").toUpperCase() === "CAPTURED"
                              ? "bg-emerald-100 text-emerald-700"
                              : String(payment.status || "").toUpperCase() === "PENDING"
                                ? "bg-amber-100 text-amber-700"
                                : String(payment.status || "").toUpperCase() === "FAILED"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {payment.createdAt ? new Date(payment.createdAt).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        No payments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-full border border-gray-200 text-sm"
                disabled={page === 1}
              >
                Previous
              </button>
              <button
                onClick={() => setPage((prev) => prev + 1)}
                className="px-3 py-1.5 rounded-full border border-gray-200 text-sm"
                disabled={page * limit >= total}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage;
