"use client";

import { useEffect, useState } from "react";
import { Card, Empty, Tag, Spin, Button, Modal, message, Space, Rate, Input } from "antd";
import { EnvironmentOutlined, ClockCircleOutlined, DollarOutlined } from "@ant-design/icons";
import bookingService from "../../../services/bookingService";

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
  driver?: {
    fullName?: string;
    phoneNumber?: string;
    vehicle?: {
      licensePlate?: string;
      vehicleType?: string;
    };
  };
  driverId?: string;
  paymentMethod?: string;
  paymentCompleted?: boolean;
  driverRating?: number;
  driverReview?: string;
}

interface BookingsTabProps {
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

export const BookingsTabUser = (_props: BookingsTabProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const response = await bookingService.getUserBookings();
      const allBookings = response.bookings || response || [];

      if (!Array.isArray(allBookings)) {
        console.warn("Response is not an array:", allBookings);
        setBookings([]);
        setLoading(false);
        return;
      }

      setBookings(allBookings);
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
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
  const totalBookings = bookings.length;

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsModalOpen(true);
  };

  const handleRateBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setRating(booking.driverRating || 0);
    setReview(booking.driverReview || "");
    setRatingModalOpen(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedBooking || !selectedBooking._id) return;

    try {
      setRatingLoading(true);
      await bookingService.rateBooking(selectedBooking._id, {
        rating,
        review,
      });
      message.success("Rating submitted successfully");
      setRatingModalOpen(false);
      setRating(0);
      setReview("");
      fetchBookings(); // Refresh bookings
    } catch (error: any) {
      console.error("Error rating booking:", error);
      message.error(error.response?.data?.message || "Failed to submit rating");
    } finally {
      setRatingLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await bookingService.cancelBooking(bookingId);
      message.success("Booking cancelled successfully");
      fetchBookings(); // Refresh bookings
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      message.error(error.response?.data?.message || "Failed to cancel booking");
    }
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-md rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Total Bookings</p>
            <p className="text-3xl font-bold text-blue-600">{totalBookings}</p>
          </div>
        </Card>
        <Card className="shadow-md rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Completed</p>
            <p className="text-3xl font-bold text-green-600">{completedBookings}</p>
          </div>
        </Card>
        <Card className="shadow-md rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 mb-2">Cancelled</p>
            <p className="text-3xl font-bold text-red-600">{cancelledBookings}</p>
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
          type={filterStatus === "PENDING" ? "primary" : "default"}
          onClick={() => setFilterStatus("PENDING")}
        >
          Pending
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
                    borderLeftColor:
                      getStatusColor(booking.status) === "success"
                        ? "#52c41a"
                        : getStatusColor(booking.status) === "error"
                          ? "#ff4d4f"
                          : getStatusColor(booking.status) === "processing"
                            ? "#faad14"
                            : "#1890ff",
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
                          <p className="font-semibold text-gray-800 truncate">
                            {booking.pickupLocation}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">To</p>
                          <p className="font-semibold text-gray-800 truncate">
                            {booking.dropoffLocation}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Middle - Date & Driver */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <ClockCircleOutlined className="text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">Booking Date</p>
                          <p className="font-semibold text-gray-800">
                            {formatDate(booking.bookingTime)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm mt-2">
                        <span className="text-gray-600">Driver: </span>
                        <span className="font-semibold">
                          {booking.driver?.fullName || "Unassigned"}
                        </span>
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
                            ₹{booking.actualFare || booking.estimatedFare || 0}
                          </span>
                        </div>
                      )}
                      {booking.driverRating && booking.status === "COMPLETED" && (
                        <span className="text-sm text-yellow-500">
                          ⭐ {booking.driverRating}/5
                        </span>
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
            selectedBooking.status === "PENDING" && (
              <Button
                key="cancel"
                danger
                onClick={() => {
                  Modal.confirm({
                    title: "Cancel Booking",
                    content: "Are you sure you want to cancel this booking?",
                    okText: "Yes",
                    cancelText: "No",
                    onOk() {
                      handleCancelBooking(selectedBooking._id!);
                      setDetailsModalOpen(false);
                    },
                  });
                }}
              >
                Cancel Booking
              </Button>
            ),
            selectedBooking.status === "COMPLETED" &&
              !selectedBooking.driverRating && (
                <Button
                  key="rate"
                  type="primary"
                  onClick={() => handleRateBooking(selectedBooking)}
                >
                  Rate Driver
                </Button>
              ),
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

            {/* Route Information */}
            <div>
              <p className="text-gray-600 text-sm mb-2">Route</p>
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-semibold text-gray-800">From</p>
                <p className="text-gray-600">{selectedBooking.pickupLocation}</p>
                <p className="font-semibold text-gray-800 mt-2">To</p>
                <p className="text-gray-600">{selectedBooking.dropoffLocation}</p>
              </div>
            </div>

            {/* Driver Info */}
            {selectedBooking.driver && (
              <div>
                <p className="text-gray-600 text-sm mb-2">Driver Information</p>
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  <p>
                    <span className="font-semibold">Name: </span>
                    {selectedBooking.driver.fullName || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Phone: </span>
                    {selectedBooking.driver.phoneNumber || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">Vehicle: </span>
                    {selectedBooking.driver.vehicle?.vehicleType || "N/A"}
                  </p>
                  <p>
                    <span className="font-semibold">License Plate: </span>
                    {selectedBooking.driver.vehicle?.licensePlate || "N/A"}
                  </p>
                </div>
              </div>
            )}

            {/* Booking Time */}
            <div>
              <p className="text-gray-600 text-sm">Booking Time</p>
              <p className="font-semibold text-gray-800">
                {formatDate(selectedBooking.bookingTime)}
              </p>
            </div>

            {/* Fare Information */}
            {selectedBooking.status === "COMPLETED" && (
              <div>
                <p className="text-gray-600 text-sm mb-2">Fare Information</p>
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  <p>
                    <span className="font-semibold">Estimated: </span>₹
                    {selectedBooking.estimatedFare || 0}
                  </p>
                  <p>
                    <span className="font-semibold">Actual: </span>₹
                    {selectedBooking.actualFare || 0}
                  </p>
                  <p>
                    <span className="font-semibold">Payment Method: </span>
                    {selectedBooking.paymentMethod || "N/A"}
                  </p>
                </div>
              </div>
            )}

            {/* Rating */}
            {selectedBooking.driverRating && selectedBooking.status === "COMPLETED" && (
              <div>
                <p className="text-gray-600 text-sm mb-2">Your Rating</p>
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  <Rate value={selectedBooking.driverRating} readOnly />
                  {selectedBooking.driverReview && (
                    <p className="text-gray-600 mt-2">{selectedBooking.driverReview}</p>
                  )}
                </div>
              </div>
            )}
          </Space>
        </Modal>
      )}

      {/* Rating Modal */}
      {selectedBooking && (
        <Modal
          title="Rate Your Driver"
          open={ratingModalOpen}
          onCancel={() => setRatingModalOpen(false)}
          footer={[
            <Button key="cancel" onClick={() => setRatingModalOpen(false)}>
              Cancel
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={ratingLoading}
              onClick={handleSubmitRating}
              disabled={rating === 0}
            >
              Submit Rating
            </Button>,
          ]}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <p>How would you rate your driver?</p>
            <div className="flex justify-center">
              <Rate value={rating} onChange={setRating} style={{ fontSize: 32 }} />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Additional comments (optional)</p>
              <Input.TextArea
                placeholder="Share your feedback..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={4}
              />
            </div>
          </Space>
        </Modal>
      )}
    </div>
  );
};
