"use client";

import { useEffect, useState } from "react";
import { Card, Empty, Tag, Spin, Button, Modal, message, Space, Rate } from "antd";
import { EnvironmentOutlined, ClockCircleOutlined, DollarOutlined, CopyOutlined, ReloadOutlined } from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import bookingService from "../../../services/bookingService";

// NOTE: Replacing utility imports with hardcoded mapping as requested
const mapVehicleType = (t?: string) => {
  if (!t) return "Auto";
  const s = String(t).toLowerCase();
  if (s.includes("auto")) return "Auto";
  if (s.includes("suv")) return "Seven Seater";
  if (s.includes("sedan") || s.includes("hatch")) return "Five Seater";
  return t;
};

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
    details?: any;
  };
  driverId?: string;
  paymentMethod?: string;
  paymentCompleted?: boolean;
  driverRating?: number;
  driverReview?: string;
  vehicle?: any;
  rideOtp?: string;
  [key: string]: any;
}

const parseNotesDriverInfo = (notes?: string): { name?: string; phone?: string } => {
  const text = String(notes || '');
  if (!text) return {};

  const nameMatch = text.match(/Driver:\s*([^,|\n]+)/i);
  const phoneMatch = text.match(/Driver\s*Phone:\s*([^,|\n]+)/i);

  return {
    name: nameMatch?.[1]?.trim(),
    phone: phoneMatch?.[1]?.trim(),
  };
};

const normalizeBooking = (raw: any): Booking => {
  const noteDriver = parseNotesDriverInfo(raw?.notes);

  return {
    ...raw,
    _id: raw?._id || raw?.id,
    id: raw?.id || raw?._id,
    pickupLocation: raw?.pickupLocation || raw?.origin?.address || '-',
    dropoffLocation: raw?.dropoffLocation || raw?.destination?.address || '-',
    bookingTime: raw?.bookingTime || raw?.createdAt || raw?.scheduledAt || new Date().toISOString(),
    estimatedFare: raw?.estimatedFare ?? raw?.fare ?? raw?.fareBreakdown?.total ?? 0,
    actualFare: raw?.actualFare ?? raw?.fare ?? 0,
    driver: {
      ...(raw?.driver || {}),
      fullName: raw?.driver?.fullName || noteDriver.name,
      phoneNumber: raw?.driver?.phoneNumber || noteDriver.phone,
    },
  };
};

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

  const location = useLocation();

  useEffect(() => {
    void fetchBookings();
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchBookings();
    }, 12000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const onBookingUpdated = () => {
      void fetchBookings();
    };
    window.addEventListener("booking:updated", onBookingUpdated);
    return () => window.removeEventListener("booking:updated", onBookingUpdated);
  }, []);

  // --- New: listen for open-booking so "Open" in Notifications works for users ---
  useEffect(() => {
    const onOpenBooking = async (ev: Event) => {
      const bookingId = (ev as CustomEvent)?.detail?.bookingId;
      if (!bookingId) return;

      // Try find in current list
      let found = bookings.find(
        (b) => String(b._id) === String(bookingId) || String(b.id) === String(bookingId)
      );

      if (!found) {
        try {
          const res = await bookingService.getBookingById(bookingId);
          found = (res.booking || res) as Booking;
        } catch (err) {
          console.error("Failed to fetch booking for open-booking:", err);
          message.error("Failed to fetch booking details");
          return;
        }
      }

      if (found) {
        setSelectedBooking(found);
        setDetailsModalOpen(true);
      } else {
        message.error("Booking not found");
      }
    };

    window.addEventListener("open-booking", onOpenBooking as EventListener);
    return () => window.removeEventListener("open-booking", onOpenBooking as EventListener);
  }, [bookings]);

  // --- New: check URL query (fallback) so modal opens after navigation from anywhere (e.g., Home) ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookingId = params.get("bookingId");
    const tab = params.get("tab");
    if (tab === "bookings" && bookingId) {
      (async () => {
        // Try find locally first
        let found = bookings.find(
          (b) => String(b._id) === String(bookingId) || String(b.id) === String(bookingId)
        );
        if (!found) {
          try {
            const res = await bookingService.getBookingById(bookingId);
            found = (res.booking || res) as Booking;
          } catch (err) {
            console.error("Failed to fetch booking from URL param:", err);
            message.error("Failed to fetch booking details");
            return;
          }
        }
        if (found) {
          setSelectedBooking(found);
          setDetailsModalOpen(true);
        } else {
          message.error("Booking not found");
        }
      })();
    }
    // Run whenever location.search changes
  }, [location.search, bookings]);

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

      setBookings((allBookings || []).map(normalizeBooking));

      // If some ACCEPTED / IN_PROGRESS bookings are missing embedded driver info,
      // fetch details for those and merge so user sees immediate assignment.
      const needsDriverInfo = allBookings.filter((b: Booking) => {
        const s = (b.status || "").toUpperCase();
        return (s === "ACCEPTED" || s === "IN_PROGRESS") && !(b.driver && (b.driver.fullName || b.driver.phoneNumber)) && (b._id || b.id);
      });

      if (needsDriverInfo.length > 0) {
        await Promise.all(
          needsDriverInfo.map(async (b: Booking) => {
            try {
              const detailed = await bookingService.getBookingById(b._id || b.id || "");
              const updatedBooking = detailed.booking || detailed || {};
              setBookings((prev) =>
                prev.map((p) => {
                  if ((p._id && updatedBooking._id && String(p._id) === String(updatedBooking._id)) || (p.id && updatedBooking.id && String(p.id) === String(updatedBooking.id))) {
                    return normalizeBooking({ ...p, ...updatedBooking });
                  }
                  return p;
                })
              );
            } catch (err) {
              console.warn("Failed to fetch booking details for", b._id || b.id, err);
            }
          })
        );
      }
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
    filterStatus === "all" ? bookings : bookings.filter((b) => (b.status || "").toUpperCase() === filterStatus.toUpperCase());

  const completedBookings = bookings.filter((b) => b.status === "COMPLETED").length;
  const cancelledBookings = bookings.filter((b) => b.status === "CANCELLED").length;  

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
      void fetchBookings(); // Refresh bookings
    } catch (error: any) {
      console.error("Error rating booking:", error);
      message.error(error.response?.data?.message || "Failed to submit rating");
    } finally {
      setRatingLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await bookingService.updateBookingStatus(bookingId, "CANCELLED");
      message.success("Booking cancelled successfully");
      void fetchBookings(); // Refresh bookings
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

        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">
            {filterStatus === "all" ? "Booking History" : `${getStatusLabel(filterStatus)} Bookings`}
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
                  key={booking._id || booking.id}
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2">
                        <EnvironmentOutlined className="text-blue-600 mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-500">From</p>
                          <p className="font-semibold text-gray-800 break-words">
                            {booking.pickupLocation}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">To</p>
                          <p className="font-semibold text-gray-800 break-words">
                            {booking.dropoffLocation}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Middle - Date & Driver */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <ClockCircleOutlined className="text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">Booking Date</p>
                          <p className="font-semibold text-gray-800">{formatDate(booking.bookingTime)}</p>
                        </div>
                      </div>
                      <p className="text-sm mt-2">
                        <span className="text-gray-600">Driver: </span>
                        <span className="font-semibold">
                          {booking.driver?.fullName || (booking.driverId ? "Assigned Driver" : "Unassigned")}
                        </span>
                      </p>
                    </div>

                    {/* Right Side - Fare & Status (fixed min width so it stays visible) */}
                    <div className="flex flex-col items-end gap-2 min-w-[180px] flex-shrink-0">
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
                        <span className="text-sm text-yellow-500">⭐ {booking.driverRating}/5</span>
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
          title={
            <div className="flex justify-between items-center w-full">
              <span>Booking Details</span>
              {selectedBooking.rideOtp && (
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500">OTP</div>
                  <Tag color="volcano" className="font-bold">{String(selectedBooking.rideOtp)}</Tag>
                  <Button
                    type="link"
                    size="small"
                    onClick={() => {
                      try {
                        navigator.clipboard?.writeText(String(selectedBooking.rideOtp));
                        message.success("OTP copied to clipboard");
                      } catch {
                        message.error("Failed to copy OTP");
                      }
                    }}
                    icon={<CopyOutlined />}
                  >
                    Copy
                  </Button>
                </div>
              )}
            </div>
          }
          open={detailsModalOpen}
          onCancel={() => setDetailsModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailsModalOpen(false)}>Close</Button>,
            selectedBooking.status === "PENDING" && (
              <Button key="cancel" danger onClick={() => {
                Modal.confirm({
                  title: "Cancel Booking",
                  content: "Are you sure you want to cancel this booking?",
                  okText: "Yes",
                  cancelText: "No",
                  onOk() { handleCancelBooking(selectedBooking._id!); setDetailsModalOpen(false); }
                });
              }}>Cancel Booking</Button>
            ),
            selectedBooking.status === "COMPLETED" && !selectedBooking.driverRating && (
              <Button key="rate" type="primary" onClick={() => handleRateBooking(selectedBooking)}>Rate Driver</Button>
            ),
          ]}
          width={600}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {/* Status */}
            <div>
              <p className="text-gray-600 text-sm">Status</p>
              <Tag color={getStatusColor(selectedBooking.status)}>{getStatusLabel(selectedBooking.status)}</Tag>
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
            {(selectedBooking.driver || selectedBooking.vehicle) && (
              <div>
                <p className="text-gray-600 text-sm mb-2">Driver Information</p>
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  {(() => {
                    const drv = selectedBooking.driver || {};
                    const details = drv.details || {};
                    const name = drv.fullName || details.name || details.fullName || "N/A";
                    const phone = drv.phoneNumber || details.phone || details.phoneNumber || "N/A";
                    const vehicleType = drv.vehicle?.vehicleType || details.vehicles?.[0]?.vehicleType || selectedBooking.vehicle?.details?.vehicleType || "N/A";
                    const license = drv.vehicle?.licensePlate || details.vehicles?.[0]?.licensePlate || selectedBooking.vehicle?.details?.licensePlate || "N/A";
                    return (
                      <>
                        <p><span className="font-semibold">Name: </span>{name}</p>
                        <p><span className="font-semibold">Phone: </span>{phone}</p>
                        <p><span className="font-semibold">Vehicle: </span>{mapVehicleType(vehicleType)}</p>
                        <p><span className="font-semibold">License Plate: </span>{license}</p>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Booking Time */}
            <div>
              <p className="text-gray-600 text-sm">Booking Time</p>
              <p className="font-semibold text-gray-800">{formatDate(selectedBooking.bookingTime)}</p>
            </div>

            {/* Fare Information */}
            {selectedBooking.status === "COMPLETED" && (
              <div>
                <p className="text-gray-600 text-sm mb-2">Fare Information</p>
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  <p><span className="font-semibold">Estimated: </span>₹{selectedBooking.estimatedFare || 0}</p>
                  <p><span className="font-semibold">Actual: </span>₹{selectedBooking.actualFare || 0}</p>
                  <p><span className="font-semibold">Payment Method: </span>{selectedBooking.paymentMethod || "N/A"}</p>
                </div>
              </div>
            )}

            {/* Rating */}
            {selectedBooking.driverRating && selectedBooking.status === "COMPLETED" && (
              <div>
                <p className="text-gray-600 text-sm mb-2">Your Rating</p>
                <div className="bg-gray-50 p-3 rounded space-y-2">
                  <Rate value={selectedBooking.driverRating} disabled />
                  {selectedBooking.driverReview && <p className="text-gray-600 mt-2">{selectedBooking.driverReview}</p>}
                </div>
              </div>
            )}
          </Space>
        </Modal>
      )}

      <Modal
        title="Rate Driver"
        open={ratingModalOpen}
        onCancel={() => setRatingModalOpen(false)}
        onOk={() => void handleSubmitRating()}
        okText="Submit"
        okButtonProps={{ loading: ratingLoading, disabled: rating <= 0 }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <p className="text-gray-600 text-sm mb-2">Rating</p>
            <Rate value={rating} onChange={setRating} />
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-2">Review</p>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2"
              rows={4}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience"
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};
