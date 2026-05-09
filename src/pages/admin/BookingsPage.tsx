import { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Select, Space, Spin, Tag } from "antd";
import { adminService } from "../../services/adminService";

const statusOptions = [
  { label: "All", value: "" },
  { label: "PENDING", value: "PENDING" },
  { label: "ACCEPTED", value: "ACCEPTED" },
  { label: "DRIVER_ARRIVED", value: "DRIVER_ARRIVED" },
  { label: "IN_PROGRESS", value: "IN_PROGRESS" },
  { label: "COMPLETED", value: "COMPLETED" },
  { label: "CANCELLED", value: "CANCELLED" },
];

const statusColor: Record<string, string> = {
  PENDING: "gold",
  ACCEPTED: "green",
  DRIVER_ARRIVED: "blue",
  IN_PROGRESS: "cyan",
  COMPLETED: "success",
  CANCELLED: "error",
};

const BookingsPage = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    userId: "",
    driverId: "",
    searchText: "",
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [assignDriverId, setAssignDriverId] = useState("");
  const [cancelReason, setCancelReason] = useState("");

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await adminService.listBookings({
        status: filters.status || undefined,
        userId: filters.userId || undefined,
        driverId: filters.driverId || undefined,
        page,
        limit,
      });

      setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
      setTotal(Number(data?.total || 0));
    } catch (error) {
      console.error(error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadDrivers = async () => {
    try {
      const data = await adminService.listDrivers({
        verificationStatus: "APPROVED",
        isVerified: true,
      });
      setAvailableDrivers(Array.isArray(data) ? data : []);
    } catch (error) {
      setAvailableDrivers([]);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [page]);

  const filteredBookings = useMemo(() => {
    const search = filters.searchText.trim().toLowerCase();
    if (!search) return bookings;

    return bookings.filter((booking) => {
      const haystack = [
        booking._id,
        booking.origin?.address,
        booking.destination?.address,
        booking.user?.fullName,
        booking.driver?.fullName,
        booking.driver?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(search);
    });
  }, [bookings, filters.searchText]);

  const openBookingDetails = async (booking: any) => {
    setSelectedBooking(null);
    setDetailsOpen(true);
    setDetailsLoading(true);

    try {
      const detail = await adminService.getBooking(booking._id);
      setSelectedBooking(detail);
      setAssignDriverId(detail?.driver?.accountId || "");
      setCancelReason("");
    } catch (error) {
      console.error(error);
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking?._id) return;
    try {
      await adminService.cancelBooking(
        selectedBooking._id,
        cancelReason.trim() || "Cancelled by admin",
      );
      loadBookings();
      setDetailsOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedBooking?._id || !assignDriverId) return;
    try {
      await adminService.assignBookingDriver(selectedBooking._id, assignDriverId);
      loadBookings();
      setDetailsOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Booking Oversight</h1>
          <p className="text-gray-600 mt-1">
            Review booking metadata, passenger/driver details, and manage cancellations or reassignment.
          </p>
        </div>
        <Button type="primary" onClick={loadBookings}>
          Refresh bookings
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Input
          placeholder="Search booking / user / driver"
          value={filters.searchText}
          onChange={(e) => setFilters((prev) => ({ ...prev, searchText: e.target.value }))}
        />
        <Select
          allowClear
          value={filters.status}
          options={statusOptions}
          placeholder="Filter status"
          onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
          className="w-full"
        />
        <Input
          placeholder="Filter by user ID"
          value={filters.userId}
          onChange={(e) => setFilters((prev) => ({ ...prev, userId: e.target.value }))}
        />
        <Input
          placeholder="Filter by driver ID"
          value={filters.driverId}
          onChange={(e) => setFilters((prev) => ({ ...prev, driverId: e.target.value }))}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="default"
          onClick={() => {
            setFilters({ status: "", userId: "", driverId: "", searchText: "" });
            setPage(1);
            loadBookings();
          }}
        >
          Reset filters
        </Button>
        <Button
          type="primary"
          onClick={() => {
            setPage(1);
            loadBookings();
          }}
        >
          Apply filters
        </Button>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spin />
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between text-sm text-gray-500">
              <div>{total} bookings found</div>
              <div>
                Page {page} · Showing {filteredBookings.length} records
              </div>
            </div>

            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:border-emerald-300"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">{booking._id}</span>
                        <Tag color={statusColor[booking.status] || "default"}>{booking.status}</Tag>
                      </div>
                      <p className="text-base font-semibold text-gray-900">
                        {booking.origin?.address || "Unknown pickup"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.destination?.address || "Unknown dropoff"}
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Passenger</p>
                        <p className="text-sm text-gray-900">{booking.user?.fullName || "Unknown"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Driver</p>
                        <p className="text-sm text-gray-900">{booking.driver?.fullName || "Unassigned"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Fare</p>
                        <p className="text-sm text-gray-900">₹ {booking.fare || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="small" onClick={() => openBookingDetails(booking)}>
                      View details
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      onClick={() => openBookingDetails(booking)}
                    >
                      Manage booking
                    </Button>
                  </div>
                </div>
              ))}

              {filteredBookings.length === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
                  No bookings match your filters.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Modal
        title="Booking details"
        open={detailsOpen}
        onCancel={() => setDetailsOpen(false)}
        footer={null}
        width={760}
        centered
      >
        {detailsLoading || !selectedBooking ? (
          <div className="flex items-center justify-center py-12">
            <Spin />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Booking ID</p>
                <p className="font-semibold text-gray-900">{selectedBooking._id}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                <Tag color={statusColor[selectedBooking.status] || "default"}>
                  {selectedBooking.status}
                </Tag>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Pickup</p>
                <p className="text-sm text-gray-900">{selectedBooking.origin?.address || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Dropoff</p>
                <p className="text-sm text-gray-900">{selectedBooking.destination?.address || "N/A"}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Passenger</p>
                <p className="text-sm text-gray-900">{selectedBooking.user?.fullName || "Unknown"}</p>
                <p className="text-xs text-gray-500">{selectedBooking.user?.email || ""}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Driver</p>
                <p className="text-sm text-gray-900">{selectedBooking.driver?.fullName || "Unassigned"}</p>
                <p className="text-xs text-gray-500">{selectedBooking.driver?.email || ""}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Fare</p>
                <p className="text-sm text-gray-900">₹ {selectedBooking.fare || 0}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Payment</p>
                <p className="text-sm text-gray-900">
                  {selectedBooking.paymentMethod || "N/A"} · {selectedBooking.paymentStatus || "N/A"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Requested at</p>
                <p className="text-sm text-gray-900">
                  {selectedBooking.createdAt ? new Date(selectedBooking.createdAt).toLocaleString() : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Scheduled</p>
                <p className="text-sm text-gray-900">
                  {selectedBooking.scheduledAt ? new Date(selectedBooking.scheduledAt).toLocaleString() : "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Reassign driver</p>
                <Select
                  value={assignDriverId}
                  showSearch
                  optionFilterProp="label"
                  placeholder="Select approved driver"
                  onChange={(value) => setAssignDriverId(value)}
                  className="w-full"
                  options={availableDrivers.map((driver) => ({
                    label: `${driver.fullName || driver.email || driver.accountId}`,
                    value: driver.accountId,
                  }))}
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Cancel reason</p>
                <Input.TextArea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Optional reason for admin cancellation"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                type="primary"
                disabled={!assignDriverId || selectedBooking.status === "CANCELLED" || selectedBooking.status === "COMPLETED"}
                onClick={handleAssignDriver}
              >
                Reassign driver
              </Button>
              <Button
                type="primary"
                danger
                disabled={selectedBooking.status === "CANCELLED" || selectedBooking.status === "COMPLETED"}
                onClick={handleCancelBooking}
              >
                Cancel booking
              </Button>
              <Button onClick={() => setDetailsOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingsPage;
