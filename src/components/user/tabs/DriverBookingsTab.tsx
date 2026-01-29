"use client";

import { useEffect, useState, type FC } from "react";
import { Card, Empty, Tag, Spin, Button, Modal, message, Space } from "antd";
import { EnvironmentOutlined, ClockCircleOutlined, DollarOutlined, ReloadOutlined } from "@ant-design/icons";
import api from "../../../services/api";
import { authService } from "../../../services/authServices";

interface Booking {
  _id?: string;
  id?: string;
  // NOTE: Some driver-pending endpoints return these instead of `_id`.
  // We accept all variants and normalize them via `getBookingId()`.
  rideId?: string;
  bookingId?: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: string;
  estimatedFare?: number;
  actualFare?: number;
  bookingTime: string;
  createdAt?: string;
  startTime?: string;
  endTime?: string;
  // existing shape
  passenger?: {
    details?: {
      name?: string;
      phone?: string;
    };
    name?: string;
    phone?: string;
    fullName?: string;
  };
  // fallback backend shape
  passengerDetails?: { name?: string; phone?: string };
  // sometimes the user object is embedded (backend uses `userInfo`)
  user?: { fullName?: string; phone?: string };
  userInfo?: { name?: string; phone?: string; fullName?: string };
  userId?: string;
  driverId?: string;
  paymentMethod?: string;
  paymentCompleted?: boolean;
  userRating?: number;
  userReview?: string;
}

interface DriverBookingsTabProps {
  loading?: boolean;
}

const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    PENDING: "blue",
    ACCEPTED: "cyan",
    DRIVER_ARRIVED: "orange",
    IN_PROGRESS: "processing",
    COMPLETED: "success",
    CANCELLED: "error",
  };
  return statusMap[status] || "default";
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    ACCEPTED: "Accepted",
    DRIVER_ARRIVED: "Driver Arrived",
    IN_PROGRESS: "In Progress",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return labels[status] || status;
};

// Helper to resolve passenger name/phone across different backend shapes
const getPassengerName = (b?: Partial<Booking> | null): string => {
  if (!b) return "N/A";
  return (
    b.passenger?.details?.name ||
    (b as any).passengerDetails?.name ||
    b.passenger?.name ||
    b.passenger?.fullName ||
    b.user?.fullName ||
    b.userInfo?.name ||
    b.userInfo?.fullName ||
    "N/A"
  );
};

const getPassengerPhone = (b?: Partial<Booking> | null): string => {
  if (!b) return "N/A";
  return (
    b.passenger?.details?.phone ||
    (b as any).passengerDetails?.phone ||
    b.passenger?.phone ||
    b.user?.phone ||
    b.userInfo?.phone ||
    "N/A"
  );
};

// Normalize the booking/ride identifier.
// Prefer the Mongo `_id` (stringified) to avoid sending "BK-..." (bookingId) to endpoints that expect ObjectId.
const getBookingId = (booking: Partial<Booking> | null | undefined): string | undefined => {
  if (!booking) return undefined;
  const rawId = (booking as any)._id;
  if (rawId) {
    // If it's an ObjectId object, convert to string; if it's already string, return it.
    try {
      return typeof rawId === "string" ? rawId : rawId.toString?.() || String(rawId);
    } catch {
      return String(rawId);
    }
  }
  // Fallbacks
  return booking.rideId || booking.bookingId || booking.id;
};
export const DriverBookingsTab: FC<DriverBookingsTabProps> = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const [acceptLoadingMap, setAcceptLoadingMap] = useState<Record<string, boolean>>({});
  const [rejectLoadingMap, setRejectLoadingMap] = useState<Record<string, boolean>>({});

  // Pick the most reliable booking timestamp we can display.
  // Backend provides `bookingTime` (legacy), plus `createdAt` (mongoose timestamps) and `timestamp`.
  const getBookingDateString = (booking: Partial<Booking> | null | undefined): string | undefined => {
    if (!booking) return undefined;
    const anyBooking = booking as any;
    return booking.bookingTime || booking.createdAt || anyBooking.timestamp;
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);

      // Get current driver's ID
      const currentUser = authService.getCurrentUser();
      const currentDriverId = currentUser?._id || currentUser?.id;

      if (!currentDriverId) {
        setBookings([]);
        setLoading(false);
        return false;
      }

      // Fetch ALL bookings for this driver.
      const allResp = await api.get("/bookings/driver/all");
      const allBookings: Booking[] = Array.isArray(allResp.data) ? allResp.data : [];

      // Sort newest-first
      const sorted = [...allBookings].sort((a, b) => {
        const aDate = new Date(getBookingDateString(a) || 0).getTime();
        const bDate = new Date(getBookingDateString(b) || 0).getTime();
        return bDate - aDate;
      });

      setBookings(sorted);
      return true;
    } catch (error: any) {
      setBookings([]);
      if (error.response?.status === 401) {
        message.error("Unauthorized - please login again");
      } else {
        message.error(error.response?.data?.message || "Failed to load booking history");
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (booking: Booking) => {
    const id = getBookingId(booking);
    if (!id) {
      message.error("Cannot accept: missing ride id");
      return;
    }
    setAcceptLoadingMap((m) => ({ ...m, [id]: true }));
    try {
      const currentUser = authService.getCurrentUser();
      const token = currentUser?.token;

      const res = await api.post(
        `/api/rides/${id}/accept`,
        { driverId: currentUser?._id || currentUser?.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success(res.data?.message || "Ride accepted");

      setBookings((prev) => prev.map((b) => (getBookingId(b) === id ? { ...b, status: "ACCEPTED" } : b)));
    } catch (err: any) {
      message.error(err.response?.data?.message || err.message || "Failed to accept ride");
    } finally {
      setAcceptLoadingMap((m) => ({ ...m, [id]: false }));
    }
  };

  const handleRejectConfirm = (booking: Booking) => {
    Modal.confirm({
      title: "Reject Ride",
      content: "Are you sure you want to reject this ride?",
      okText: "Reject",
      okType: "danger",
      onOk: () => handleReject(booking),
    });
  };

  const handleReject = async (booking: Booking) => {
    const id = getBookingId(booking);
    if (!id) {
      message.error("Cannot reject: missing ride id");
      return;
    }
    setRejectLoadingMap((m) => ({ ...m, [id]: true }));

    const currentUser = authService.getCurrentUser();
    const token = currentUser?.token;

    try {
      const res = await api.post(
        `/api/rides/${id}/reject`,
        { driverId: currentUser?._id || currentUser?.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      message.success(res.data?.message || "Ride rejected");

      setBookings((prev) => prev.filter((b) => getBookingId(b) !== id));
    } catch (err: any) {
      const status = err?.response?.status;
      if (status >= 500 || !status) {
        setBookings((prev) => prev.filter((b) => getBookingId(b) !== id));
        message.warning("Server error while rejecting ride. Booking removed locally.")
      } else if (status === 401) {
        message.error("Unauthorized. Please login again.");
      } else {
        message.error(err.response?.data?.message || err.message || "Failed to reject ride");
      }
    } finally {
      setRejectLoadingMap((m) => ({ ...m, [id]: false }));
    }
  };

  const filteredBookings = filterStatus === "all" ? bookings : bookings.filter((b) => b.status === filterStatus);
  const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length;
  const cancelledBookings = bookings.filter((b) => b.status === "CANCELLED").length;

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card className="shadow-md rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 text-xs md:text-sm mb-2">Total Bookings</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-600">{bookings.length}</p>
          </div>
        </Card>
        <Card className="shadow-md rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 text-xs md:text-sm mb-2">Completed</p>
            <p className="text-2xl md:text-3xl font-bold text-green-600">{completedBookings}</p>
          </div>
        </Card>
        <Card className="shadow-md rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 text-xs md:text-sm mb-2">Cancelled</p>
            <p className="text-2xl md:text-3xl font-bold text-red-600">{cancelledBookings}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button type={filterStatus === "all" ? "primary" : "default"} onClick={() => setFilterStatus("all")}>All</Button>
        <Button type={filterStatus === "COMPLETED" ? "primary" : "default"} onClick={() => setFilterStatus("COMPLETED")}>Completed</Button>
        <Button type={filterStatus === "CANCELLED" ? "primary" : "default"} onClick={() => setFilterStatus("CANCELLED")}>Cancelled</Button>
        <Button type={filterStatus === "IN_PROGRESS" ? "primary" : "default"} onClick={() => setFilterStatus("IN_PROGRESS")}>In Progress</Button>
      </div>

      {/* Bookings List */}
      <Card className="shadow-md rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">{filterStatus === "all" ? "Booking History" : `${filterStatus} Bookings`}</h3>
          <Button type="default" size="small" icon={<ReloadOutlined />} onClick={(e) => { e.stopPropagation(); void fetchBookings(); }} loading={loading}>Refresh</Button>
        </div>

        <Spin spinning={loading}>
          {filteredBookings.length === 0 ? (
            <Empty description="No bookings found" className="py-12" />
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking) => (
                <Card
                  key={getBookingId(booking) || `${booking.pickupLocation}-${getBookingDateString(booking) || "unknown-date"}`}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-l-4"
                  style={{
                    borderLeftColor: getStatusColor(booking.status) === "success" ? "#52c41a" :
                                     getStatusColor(booking.status) === "error" ? "#ff4d4f" :
                                     getStatusColor(booking.status) === "processing" ? "#faad14" : "#1890ff",
                  }}
                  onClick={() => handleViewDetails(booking)}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left - Locations */}
                    <div className="flex-1">
                      <div className="flex items-start gap-3 mb-2">
                        <EnvironmentOutlined className="text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-500">From</p>
                          <p className="font-semibold text-gray-800 truncate">{booking.pickupLocation}</p>
                          <p className="text-sm text-gray-500 mt-1">To</p>
                          <p className="font-semibold text-gray-800 truncate">{booking.dropoffLocation}</p>
                        </div>
                      </div>
                    </div>

                    {/* Middle - Date & Passenger */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <ClockCircleOutlined className="text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">Booking Date</p>
                          <p className="font-semibold text-gray-800">{formatDate(booking.bookingTime)}</p>
                        </div>
                      </div>

                      <p className="text-sm mt-2">
                        <span className="text-gray-600">Passenger: </span>
                        <span className="font-semibold">{getPassengerName(booking)}</span>
                      </p>
                      <p className="text-sm mt-1">
                        <span className="text-gray-600">Phone: </span>
                        <span className="font-semibold">{getPassengerPhone(booking)}</span>
                      </p>
                    </div>

                    {/* Right - Fare & Status */}
                    <div className="flex flex-col items-end gap-2">
                      <Tag color={getStatusColor(booking.status)}>{getStatusLabel(booking.status)}</Tag>

                      {booking.status === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <Button type="primary" size="small" onClick={(e) => { e.stopPropagation(); handleAccept(booking); }} loading={!!acceptLoadingMap[String(getBookingId(booking) || "")]}>Accept</Button>
                          <Button danger size="small" onClick={(e) => { e.stopPropagation(); handleRejectConfirm(booking); }} loading={!!rejectLoadingMap[String(getBookingId(booking) || "")]}>Reject</Button>
                        </div>
                      )}

                      {booking.status === "COMPLETED" && (
                        <div className="flex items-center gap-1">
                          <DollarOutlined />
                          <span className="font-bold text-gray-800">${booking.actualFare || booking.estimatedFare || 0}</span>
                        </div>
                      )}
                      {booking.status === "CANCELLED" && <span className="text-xs text-gray-500 font-semibold">Cancelled</span>}
                      {booking.userRating && booking.status === "COMPLETED" && <span className="text-sm text-yellow-500">⭐ {booking.userRating}/5</span>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Spin>
      </Card>

      {/* Details Modal */}
      {selectedBooking && (
        <Modal title="Booking Details" open={detailsModalOpen} onCancel={() => setDetailsModalOpen(false)} footer={[<Button key="close" onClick={() => setDetailsModalOpen(false)}>Close</Button>]} width={600}>
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <div>
              <p className="text-gray-600 text-sm">Status</p>
              <Tag color={getStatusColor(selectedBooking.status)}>{getStatusLabel(selectedBooking.status)}</Tag>
            </div>

            <div>
              <p className="text-gray-600 text-sm">Passenger Name</p>
              <p className="font-semibold">{getPassengerName(selectedBooking)}</p>
              <p className="text-gray-600 text-sm mt-2">Phone</p>
              <p className="font-semibold">{getPassengerPhone(selectedBooking)}</p>
            </div>

            <div>
              <p className="text-gray-600 text-sm">Pickup Location</p>
              <p className="font-semibold">{selectedBooking.pickupLocation}</p>
              <p className="text-gray-600 text-sm mt-2">Dropoff Location</p>
              <p className="font-semibold">{selectedBooking.dropoffLocation}</p>
            </div>

            <div>
              <p className="text-gray-600 text-sm">Booking Time</p>
              <p className="font-semibold">{formatDate(selectedBooking.bookingTime)}</p>
              {selectedBooking.startTime && (
                <>
                  <p className="text-gray-600 text-sm mt-2">Start Time</p>
                  <p className="font-semibold">{formatDate(selectedBooking.startTime)}</p>
                </>
              )}
              {selectedBooking.endTime && (
                <>
                  <p className="text-gray-600 text-sm mt-2">End Time</p>
                  <p className="font-semibold">{formatDate(selectedBooking.endTime)}</p>
                </>
              )}
            </div>

            <div>
              <p className="text-gray-600 text-sm">Estimated Fare</p>
              <p className="font-semibold">${selectedBooking.estimatedFare || 0}</p>
              {selectedBooking.actualFare && (
                <>
                  <p className="text-gray-600 text-sm mt-2">Actual Fare</p>
                  <p className="font-semibold text-green-600">${selectedBooking.actualFare}</p>
                </>
              )}
            </div>

            <div>
              <p className="text-gray-600 text-sm">Payment Method</p>
              <p className="font-semibold">{selectedBooking.paymentMethod}</p>
              <p className="text-gray-600 text-sm mt-2">Payment Status</p>
              <Tag color={selectedBooking.paymentCompleted ? "success" : "default"}>{selectedBooking.paymentCompleted ? "Completed" : "Pending"}</Tag>
            </div>

            {selectedBooking.userRating && selectedBooking.status === "COMPLETED" && (
              <div>
                <p className="text-gray-600 text-sm">Passenger Rating</p>
                <p className="font-semibold">⭐ {selectedBooking.userRating}/5</p>
                {selectedBooking.userReview && (
                  <>
                    <p className="text-gray-600 text-sm mt-2">Review</p>
                    <p className="font-semibold text-gray-700">{selectedBooking.userReview}</p>
                  </>
                )}
              </div>
            )}
          </Space>
        </Modal>
      )}
    </div>
  );
};