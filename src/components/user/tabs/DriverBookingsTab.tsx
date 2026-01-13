"use client";

import { useEffect, useState } from "react";
import { Card, Empty, Tag, Spin, Button, Modal, message, Space } from "antd";
import { EnvironmentOutlined, ClockCircleOutlined, DollarOutlined } from "@ant-design/icons";
import api from "../../../services/api";
import { authService } from "../../../services/authServices";
interface Booking {
  _id?: string;
  id?: string;
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

export const DriverBookingsTab = (_props: DriverBookingsTabProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

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
        return;
      }

      // Fetch all pending bookings
      console.log("Fetching from /bookings/pending/list");
      const pendingResponse = await api.get("/bookings/pending/list");
      console.log("Pending bookings response:", pendingResponse.data);
      const allBookings = pendingResponse.data || [];

      if (!Array.isArray(allBookings)) {
        console.warn("Response is not an array:", allBookings);
        setBookings([]);
        setLoading(false);
        return;
      }

      console.log("Total bookings fetched:", allBookings.length);
      
      // Show ALL bookings for now (to see what we're getting)
      // We'll filter later once we see the data structure
      setBookings(allBookings);
      console.log("Bookings set to state:", allBookings);
      
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      console.error("Error response:", error.response);
      setBookings([]);
      if (error.response?.status === 401) {
        message.error("Unauthorized - please login again");
      } else {
        message.error(error.response?.data?.message || "Failed to load booking history");
      }
    } finally {
      setLoading(false);
    }
  };
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
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">
          {filterStatus === "all" ? "Booking History" : `${filterStatus} Bookings`}
        </h3>

        <Spin spinning={loading}>
          {filteredBookings.length === 0 ? (
            <Empty description="No bookings found" className="py-12" />
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((booking) => (
                <Card
                  key={booking._id}
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
                      <p className="text-sm mt-2">
                        <span className="text-gray-600">Passenger: </span>
                        <span className="font-semibold">{booking.passenger?.details?.name || "Unknown"}</span>
                      </p>
                    </div>

                    {/* Right Side - Fare & Status */}
                    <div className="flex flex-col items-end gap-2">
                      <Tag color={getStatusColor(booking.status)}>
                        {getStatusLabel(booking.status)}
                      </Tag>
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