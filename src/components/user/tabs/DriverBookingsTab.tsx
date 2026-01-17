"use client";

import { useEffect, useState } from "react";
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
  passenger?: {
    details?: {
      name: string;
      phone: string;
    };
  };
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

// Normalize the booking/ride identifier.
// This prevents calling endpoints like `/api/rides/undefined/accept`.
const getBookingId = (booking: Partial<Booking> | null | undefined): string | undefined => {
  if (!booking) return undefined;
  return booking.rideId || booking.bookingId || booking._id || booking.id;
};

export const DriverBookingsTab = (_props: DriverBookingsTabProps) => {
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

  const fetchBookings = async () => {
    try {
      setLoading(true);

      // Get current driver's ID
      const currentUser = authService.getCurrentUser();
      const currentDriverId = currentUser?._id || currentUser?.id;

      console.log("Current Driver ID:", currentDriverId);
      console.log("Current User:", currentUser);

      if (!currentDriverId) {
        console.warn("No driver ID found");
        setBookings([]);
        setLoading(false);
        return false;
      }

      // Fetch pending bookings assigned to this driver only
      console.log("Fetching from /bookings/pending-for-driver");

      const assignedResp = await api.get("/bookings/pending-for-driver");
      console.log("Assigned (pending-for-driver) response:", assignedResp.data);
      // This endpoint returns an array, but items may not match our exact `Booking` shape.
      const assigned: Booking[] = Array.isArray(assignedResp.data) ? assignedResp.data : [];

      // Merge assigned pending bookings with existing non-pending bookings so
      // accepted/completed/cancelled bookings are not removed when backend
      // endpoint returns only pending rides.
      setBookings((prev) => {
        const existingMap: Record<string, Booking> = {};
        prev.forEach((b) => {
          const key = getBookingId(b);
          if (b.status && b.status !== 'PENDING') {
            // Keep only non-pending from previous state
            if (key) existingMap[String(key)] = b;
          }
        });

        // Overwrite or add assigned pending bookings from server (appear at top)
        assigned.forEach((b: Booking) => {
          const key = getBookingId(b);
          if (key) existingMap[String(key)] = b;
        });

        const merged = Object.values(existingMap);
        // Keep order: assigned first, then existing non-pending
        const pendingOrdered = [...assigned];
        const nonPending = merged.filter(
          (m) => !(pendingOrdered.some((p: Booking) => getBookingId(p) && getBookingId(p) === getBookingId(m)))
        );

        const result = [...pendingOrdered, ...nonPending];
        console.log('Merged bookings:', result);
        return result;
      });
      console.log("Bookings set to state (assigned pending):", assigned.length);
      return true;

    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      console.error("Error response:", error.response);
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
    // Use normalized id (rideId/bookingId/_id/id). If missing, we must not call the backend.
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

      // Update local booking state
      setBookings((prev) => prev.map((b) => (getBookingId(b) === id ? { ...b, status: "ACCEPTED" } : b)));
    } catch (err: any) {
      console.error("Error accepting ride:", err);
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
    // Use normalized id (rideId/bookingId/_id/id). If missing, we must not call the backend.
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

      // Remove this booking from the list for this driver
      setBookings((prev) => prev.filter((b) => getBookingId(b) !== id));
    } catch (err: any) {
      console.error("Error rejecting ride:", err);

      // If server returned 500 or other server error, queue the rejection and remove locally
      const status = err?.response?.status;
      if (status >= 500 || !status) {
        // Remove locally so driver doesn't see it again
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
  // Queue storage key for rejections





 

  const filteredBookings = 
    filterStatus === "all"
      ? bookings
      : bookings.filter((b) => b.status === filterStatus);

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
      {/* Stats Cards - Single Row */}
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

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button
          type={filterStatus === "all" ? "primary" : "default"}
          onClick={() => setFilterStatus("all")}
        >
          All
        </Button>
        <Button
          type={filterStatus === "COMPLETED" ? "primary" : "default"}
          onClick={() => setFilterStatus("COMPLETED")}
        >
          Completed
        </Button>
        <Button
          type={filterStatus === "CANCELLED" ? "primary" : "default"}
          onClick={() => setFilterStatus("CANCELLED")}
        >
          Cancelled
        </Button>
        <Button
          type={filterStatus === "IN_PROGRESS" ? "primary" : "default"}
          onClick={() => setFilterStatus("IN_PROGRESS")}
        >
          In Progress
        </Button>
      </div>

      {/* Bookings List */}
      <Card className="shadow-md rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">
            {filterStatus === "all" ? "Booking History" : `${filterStatus} Bookings`}
          </h3>
          <Button
            type="default"
            size="small"
            icon={<ReloadOutlined />}
            onClick={(e) => { e.stopPropagation(); void fetchBookings(); }}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        <Spin spinning={loading}>
          {filteredBookings.length === 0 ? (
            <Empty description="No bookings found" className="py-12" />
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking) => (
                <Card
                  // Prefer stable backend ids; fall back to a deterministic string if missing.
                  key={getBookingId(booking) || `${booking.pickupLocation}-${booking.bookingTime}`}
                  className="hover:shadow-lg transition-shadow cursor-pointer border-l-4"
                  style={{
                    borderLeftColor: getStatusColor(booking.status) === "success" ? "#52c41a" : 
                                    getStatusColor(booking.status) === "error" ? "#ff4d4f" :
                                    getStatusColor(booking.status) === "processing" ? "#faad14" : "#1890ff",
                  }}
                  onClick={() => handleViewDetails(booking)}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left Side - Location & Time */}
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
                    </div>

                    {/* Right Side - Fare & Status */}
                    <div className="flex flex-col items-end gap-2">
                      <Tag color={getStatusColor(booking.status)}>
                        {getStatusLabel(booking.status)}
                      </Tag>

                      {booking.status === "PENDING" && (
                        <div className="flex items-center gap-2">
                          <Button
                            type="primary"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAccept(booking);
                            }}
                            // Loading keyed by normalized id to avoid `undefined` map access.
                            loading={!!acceptLoadingMap[String(getBookingId(booking) || "")]}
                          >
                            Accept
                          </Button>

                          <Button
                            danger
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectConfirm(booking);
                            }}
                            // Loading keyed by normalized id to avoid `undefined` map access.
                            loading={!!rejectLoadingMap[String(getBookingId(booking) || "")]}
                          >
                            Reject
                          </Button>
                        </div>
                      )}

                      {booking.status === "COMPLETED" && (
                        <div className="flex items-center gap-1">
                          <DollarOutlined />
                          <span className="font-bold text-gray-800">
                            ${booking.actualFare || booking.estimatedFare || 0}
                          </span>
                        </div>
                      )}
                      {booking.status === "CANCELLED" && (
                        <span className="text-xs text-gray-500 font-semibold">Cancelled</span>
                      )}
                      {booking.userRating && booking.status === "COMPLETED" && (
                        <span className="text-sm text-yellow-500">⭐ {booking.userRating}/5</span>
                      )}
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
        <Modal
          title="Booking Details"
          open={detailsModalOpen}
          onCancel={() => setDetailsModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailsModalOpen(false)}>
              Close
            </Button>,
          ]}
          width={600}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {/* Status */}
            <div>
              <p className="text-gray-600 text-sm">Status</p>
              <Tag color={getStatusColor(selectedBooking.status)}>
                {getStatusLabel(selectedBooking.status)}
              </Tag>
            </div>

            {/* Passenger Info */}
            <div>
              <p className="text-gray-600 text-sm">Passenger Name</p>
              <p className="font-semibold">{selectedBooking.passenger?.details?.name || "N/A"}</p>
              <p className="text-gray-600 text-sm mt-2">Phone</p>
              <p className="font-semibold">{selectedBooking.passenger?.details?.phone || "N/A"}</p>
            </div>

            {/* Locations */}
            <div>
              <p className="text-gray-600 text-sm">Pickup Location</p>
              <p className="font-semibold">{selectedBooking.pickupLocation}</p>
              <p className="text-gray-600 text-sm mt-2">Dropoff Location</p>
              <p className="font-semibold">{selectedBooking.dropoffLocation}</p>
            </div>

            {/* Times */}
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

            {/* Fare */}
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

            {/* Payment */}
            <div>
              <p className="text-gray-600 text-sm">Payment Method</p>
              <p className="font-semibold">{selectedBooking.paymentMethod}</p>
              <p className="text-gray-600 text-sm mt-2">Payment Status</p>
              <Tag color={selectedBooking.paymentCompleted ? "success" : "default"}>
                {selectedBooking.paymentCompleted ? "Completed" : "Pending"}
              </Tag>
            </div>

            {/* Rating & Review */}
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