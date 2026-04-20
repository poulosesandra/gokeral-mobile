"use client";

import { useEffect, useState, useRef } from "react";
import { Card, Empty, Tag, Spin, Button, Modal, message, Space, Rate, Pagination, Alert, Radio, Steps } from "antd";
import { EnvironmentOutlined, ClockCircleOutlined, DollarOutlined, CopyOutlined, ReloadOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import bookingService from "../../../services/bookingService";
import LiveRideTrackerCard from "../../booking/LiveRideTrackerCard";

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
      registrationNumber?: string;
      vehicleType?: string;
    };
    details?: any;
  };
  driverId?: string;
  paymentMethod?: string;
  paymentStatus?: string;
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
  const rawVehicle = raw?.driver?.vehicle || raw?.vehicle?.details || {};

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
      vehicle: {
        ...(raw?.driver?.vehicle || {}),
        vehicleType: rawVehicle?.vehicleType || rawVehicle?.type || '',
        licensePlate: rawVehicle?.licensePlate || rawVehicle?.registrationNumber || '',
      },
    },
  };
};

interface BookingsTabProps {
  loading?: boolean;
}

type CheckoutMethod = "UPI" | "CARD" | "NETBANKING" | "WALLET" | "CASH";

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

const getTripPaymentProgress = (booking: Booking | null) => {
  const status = String(booking?.status || "").toUpperCase();
  const paymentStatus = String(booking?.paymentStatus || "").toUpperCase();
  const paymentCompleted =
    booking?.paymentCompleted === true ||
    paymentStatus === "COMPLETED" ||
    paymentStatus === "PAID" ||
    paymentStatus === "SUCCESS";

  let current = 0;
  if (status === "ACCEPTED") current = 1;
  if (status === "DRIVER_ARRIVED") current = 2;
  if (status === "IN_PROGRESS") current = 3;
  if (status === "COMPLETED") current = paymentCompleted ? 5 : 4;

  return {
    current,
    items: [
      { title: "Booked" },
      { title: "Accepted" },
      { title: "Arrived" },
      { title: "In Ride" },
      { title: "Dropped" },
      { title: "Paid" },
    ],
  };
};

export const BookingsTabUser = (_props: BookingsTabProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalBookings, setTotalBookings] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [recentlyPaidBookingId, setRecentlyPaidBookingId] = useState<string | null>(null);
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);
  const [paymentMethodChoice, setPaymentMethodChoice] = useState<CheckoutMethod>("UPI");
  const [paymentActionBooking, setPaymentActionBooking] = useState<Booking | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const urlParamHandledRef = useRef<string | null>(null);

  useEffect(() => {
    void fetchBookings(1, pageSize);
  }, []);

  useEffect(() => {
    const onBookingUpdated = () => {
      void fetchBookings(currentPage, pageSize);
    };
    window.addEventListener("booking:updated", onBookingUpdated);
    return () => window.removeEventListener("booking:updated", onBookingUpdated);
  }, [currentPage, pageSize]);

  // Track which booking we opened via event to prevent duplicate opens
  const openedViaEventRef = useRef<string | null>(null);

  // --- New: listen for open-booking so "Open" in Notifications works for users ---
  useEffect(() => {
    const onOpenBooking = async (ev: Event) => {
      const bookingId = (ev as CustomEvent)?.detail?.bookingId;
      if (!bookingId) return;
      
      // Prevent duplicate opens for the same booking
      if (openedViaEventRef.current === bookingId && detailsModalOpen) {
        return;
      }
      openedViaEventRef.current = bookingId;

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
  }, [bookings, detailsModalOpen]);

  // --- New: check URL query (fallback) so modal opens after navigation from anywhere (e.g., Home) ---
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookingId = params.get("bookingId");
    const tab = params.get("tab");
    
    // Skip if no bookingId param OR we've already handled this specific bookingId
    if (!bookingId || tab !== "bookings" || urlParamHandledRef.current === bookingId) {
      return;
    }
    
    // Mark this bookingId as handled to prevent re-triggering
    urlParamHandledRef.current = bookingId;
    
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
        // Clear URL params to prevent re-triggering on refresh
        navigate(location.pathname, { replace: true });
      } else {
        message.error("Booking not found");
      }
    })();
    // Only react to location.search changes, not bookings updates
  }, [location.search, navigate]);

  const fetchBookings = async (page: number = currentPage, limit: number = pageSize) => {
    try {
      setLoading(true);

      const response = await bookingService.getUserBookings({ page, limit });
      const allBookings = response.bookings || response || [];
      setTotalBookings(Number(response.total || allBookings.length || 0));
      setCurrentPage(Number(response.page || page));
      setPageSize(Number(response.limit || limit));

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
        const status = error.response?.status ? ` (${error.response.status})` : "";
        message.error((error.response?.data?.message || error?.message || "Failed to load booking history") + status);
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
        feedback: review,
      });
      message.success("Rating submitted successfully");
      setRatingModalOpen(false);
      setRating(0);
      setReview("");
      void fetchBookings(currentPage, pageSize); // Refresh bookings
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
      void fetchBookings(currentPage, pageSize); // Refresh bookings
    } catch (error: any) {
      console.error("Error cancelling booking:", error);
      message.error(error.response?.data?.message || "Failed to cancel booking");
    }
  };

  const syncPaymentState = async (bookingId: string) => {
    try {
      const summary = await bookingService.getPaymentSummary(bookingId);
      const status = String(summary?.paymentStatus || summary?.payment?.status || "").toUpperCase();
      const paid = status === "COMPLETED" || status === "PAID" || status === "CAPTURED" || status === "SUCCESS";

      setSelectedBooking((prev) => {
        if (!prev) return prev;
        const prevId = prev._id || prev.id;
        if (String(prevId) !== String(bookingId)) return prev;
        return {
          ...prev,
          paymentStatus: paid ? "COMPLETED" : (summary?.paymentStatus || prev.paymentStatus),
          paymentCompleted: paid,
          paymentMethod: summary?.payment?.method || prev.paymentMethod,
        };
      });

      if (paid) {
        setRecentlyPaidBookingId(bookingId);
      }

      return paid;
    } catch {
      return false;
    }
  };

  const requestPayment = (booking: Booking) => {
    setPaymentActionBooking(booking);
    setPaymentMethodChoice("UPI");
    setPaymentMethodModalOpen(true);
  };

  const handlePayNow = async (booking: Booking, method: CheckoutMethod) => {
    const bookingId = booking._id || booking.id;
    if (!bookingId) {
      message.error("Missing booking id");
      return;
    }

    try {
      setPaymentLoading(true);
      setPaymentMethodModalOpen(false);

      const alreadyPaid = await syncPaymentState(bookingId);
      if (alreadyPaid || isPaymentDone(booking)) {
        message.success("Payment already completed for this ride.");
        return;
      }

      const order = await bookingService.createPaymentOrder(bookingId, {
        paymentMethod: method,
      });

      if (String(order?.status || "").toUpperCase() === "CAPTURED") {
        setRecentlyPaidBookingId(bookingId);
        setSelectedBooking((prev) => {
          if (!prev) return prev;
          const prevId = prev._id || prev.id;
          if (String(prevId) !== String(bookingId)) return prev;
          return {
            ...prev,
            paymentStatus: "COMPLETED",
            paymentCompleted: true,
          };
        });
        message.success(order?.message || "Payment already completed");
        await fetchBookings(currentPage, pageSize);
        return;
      }

      if (order?.paymentMode === "WALLET") {
        setRecentlyPaidBookingId(bookingId);
        setSelectedBooking((prev) => {
          if (!prev) return prev;
          const prevId = prev._id || prev.id;
          if (String(prevId) !== String(bookingId)) return prev;
          return {
            ...prev,
            paymentStatus: "COMPLETED",
            paymentCompleted: true,
          };
        });
        message.success(order?.message || "Payment updated");
        Modal.success({
          title: "Payment Successful",
          content: "Your payment has been received successfully.",
        });
        await fetchBookings(currentPage, pageSize);
        return;
      }

      if (order?.paymentMode === "CASH") {
        setSelectedBooking((prev) => {
          if (!prev) return prev;
          const prevId = prev._id || prev.id;
          if (String(prevId) !== String(bookingId)) return prev;
          return {
            ...prev,
            paymentStatus: "PENDING",
            paymentCompleted: false,
            paymentMethod: "CASH",
          };
        });
        message.info(order?.message || "Cash selected. Payment will complete after driver confirmation.");
        await fetchBookings(currentPage, pageSize);
        return;
      }

      await bookingService.openRazorpayCheckout({
        keyId: order.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        orderId: order.orderId,
        name: "Kerides",
        description: `Ride payment #${bookingId}`,
        onDismiss: async () => {
          const paidAfterDismiss = await syncPaymentState(bookingId);
          if (!paidAfterDismiss) {
            message.info("Payment window closed. You can retry payment anytime.");
          }
        },
        onFailure: async () => {
          const paidAfterFailure = await syncPaymentState(bookingId);
          if (!paidAfterFailure) {
            message.error("Payment failed. Please retry.");
          }
        },
        onSuccess: async (response) => {
          try {
            await bookingService.verifyPayment(bookingId, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          } catch {
            const paidViaWebhook = await syncPaymentState(bookingId);
            if (!paidViaWebhook) {
              throw new Error("Payment verification failed. Please check status and retry.");
            }
          }
          setRecentlyPaidBookingId(bookingId);
          setSelectedBooking((prev) => {
            if (!prev) return prev;
            const prevId = prev._id || prev.id;
            if (String(prevId) !== String(bookingId)) return prev;
            return {
              ...prev,
              paymentStatus: "COMPLETED",
              paymentCompleted: true,
            };
          });
          message.success("Payment successful. Ride marked as paid.");
          Modal.success({
            title: "Payment Successful",
            content: "Your ride payment is complete. Thank you.",
          });
          await fetchBookings(currentPage, pageSize);
        },
      });
    } catch (error: any) {
      console.error("Payment failed:", error);
      message.error(error?.response?.data?.message || error?.message || "Unable to complete payment");
    } finally {
      setPaymentLoading(false);
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

  const isPaymentDone = (booking?: Booking | null) => {
    if (!booking) return false;
    if (booking.paymentCompleted === true) return true;
    const paymentStatus = String(booking.paymentStatus || "").toUpperCase();
    return paymentStatus === "COMPLETED" || paymentStatus === "PAID" || paymentStatus === "SUCCESS";
  };

  useEffect(() => {
    if (!detailsModalOpen || !selectedBooking) return;

    const bookingId = selectedBooking._id || selectedBooking.id;
    if (!bookingId) return;

    const status = String(selectedBooking.status || "").toUpperCase();
    const shouldSync =
      ["ACCEPTED", "DRIVER_ARRIVED", "IN_PROGRESS"].includes(status) ||
      (status === "COMPLETED" && !isPaymentDone(selectedBooking));

    if (!shouldSync) return;

    const syncTripState = async () => {
      try {
        const response = await bookingService.getBookingById(bookingId);
        const updated = normalizeBooking(response?.booking || response);

        setSelectedBooking((prev) => {
          if (!prev) return prev;
          const prevId = prev._id || prev.id;
          if (String(prevId) !== String(bookingId)) return prev;
          return { ...prev, ...updated };
        });

        setBookings((prev) =>
          prev.map((b) => {
            const id = b._id || b.id;
            return String(id) === String(bookingId) ? { ...b, ...updated } : b;
          }),
        );

        if (String(updated.status || "").toUpperCase() === "COMPLETED") {
          await syncPaymentState(bookingId);
        }
      } catch {
        // Keep UI stable during transient network glitches.
      }
    };

    void syncTripState();
    const timer = window.setInterval(() => {
      void syncTripState();
    }, 4000);

    return () => window.clearInterval(timer);
  }, [
    detailsModalOpen,
    selectedBooking?._id,
    selectedBooking?.id,
    selectedBooking?.status,
    selectedBooking?.paymentStatus,
    selectedBooking?.paymentCompleted,
  ]);

  return (
    <div className="w-full space-y-4">
      {/* Stats Cards - Single Row */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card className="shadow-md rounded-lg">
          <div className="text-center">
            <p className="text-gray-600 text-xs md:text-sm mb-2">Total Bookings</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-600">{totalBookings}</p>
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
            onClick={(e) => { e.stopPropagation(); void fetchBookings(currentPage, pageSize); }}
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
                        <Tag color={isPaymentDone(booking) ? "green" : "orange"}>
                          {isPaymentDone(booking) ? "Payment Successful" : "Payment Pending"}
                        </Tag>
                      )}

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

        <div className="mt-4 flex justify-end">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalBookings}
            showSizeChanger
            pageSizeOptions={["10", "20", "50"]}
            onChange={(page, size) => {
              void fetchBookings(page, size || pageSize);
            }}
          />
        </div>
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
          onCancel={() => { setDetailsModalOpen(false); openedViaEventRef.current = null; }}
          footer={[
            <Button key="close" onClick={() => { setDetailsModalOpen(false); openedViaEventRef.current = null; }}>Close</Button>,
            selectedBooking.status === "PENDING" && (
              <Button key="cancel" danger onClick={() => {
                Modal.confirm({
                  title: "Cancel Booking",
                  content: "Are you sure you want to cancel this booking?",
                  okText: "Yes",
                  cancelText: "No",
                  onOk() { handleCancelBooking(selectedBooking._id!); setDetailsModalOpen(false); openedViaEventRef.current = null; }
                });
              }}>Cancel Booking</Button>
            ),
            selectedBooking.status === "COMPLETED" && !selectedBooking.driverRating && (
              <Button key="rate" type="primary" onClick={() => handleRateBooking(selectedBooking)}>Rate Driver</Button>
            ),
            selectedBooking.status === "COMPLETED" &&
              !isPaymentDone(selectedBooking) && (
                <Button
                  key="pay-now"
                  type="primary"
                  loading={paymentLoading}
                  onClick={() => requestPayment(selectedBooking)}
                >
                  Pay Now
                </Button>
              ),
          ]}
          width={600}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {selectedBooking.status === "COMPLETED" && !isPaymentDone(selectedBooking) && (
              <Alert
                type="warning"
                showIcon
                message="Payment Pending"
                description="Please make payment to settle this ride."
                action={
                  <Button
                    type="primary"
                    size="small"
                    loading={paymentLoading}
                    onClick={() => requestPayment(selectedBooking)}
                  >
                    Make Payment
                  </Button>
                }
              />
            )}

            {selectedBooking.status === "COMPLETED" && isPaymentDone(selectedBooking) && (
              <Alert
                type="success"
                showIcon
                message="Payment Successful"
                description="Your ride payment is complete."
              />
            )}

            {selectedBooking.status === "COMPLETED" &&
              recentlyPaidBookingId &&
              String(selectedBooking._id || selectedBooking.id) === String(recentlyPaidBookingId) && (
                <Alert
                  type="success"
                  showIcon
                  message="Payment Confirmation"
                  description="Payment has been received and recorded successfully."
                />
              )}

            <div>
              <p className="text-gray-600 text-sm mb-2">Trip & Payment Progress</p>
              <Steps
                size="small"
                current={getTripPaymentProgress(selectedBooking).current}
                items={getTripPaymentProgress(selectedBooking).items}
              />
            </div>

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
                    const name = drv.fullName || details.name || details.fullName || "";
                    const phone = drv.phoneNumber || details.phone || details.phoneNumber || "";
                    const vehicleType =
                      drv.vehicle?.vehicleType ||
                      details.vehicles?.[0]?.vehicleType ||
                      selectedBooking.vehicle?.details?.vehicleType ||
                      "";
                    const license =
                      drv.vehicle?.licensePlate ||
                      drv.vehicle?.registrationNumber ||
                      details.vehicles?.[0]?.licensePlate ||
                      details.vehicles?.[0]?.registrationNumber ||
                      selectedBooking.vehicle?.details?.licensePlate ||
                      selectedBooking.vehicle?.details?.registrationNumber ||
                      "";
                    return (
                      <>
                        <p><span className="font-semibold">Name: </span>{name || "Not available"}</p>
                        <p><span className="font-semibold">Phone: </span>{phone || "Not available"}</p>
                        <p><span className="font-semibold">Vehicle: </span>{vehicleType ? mapVehicleType(vehicleType) : "Not available"}</p>
                        <p><span className="font-semibold">License Plate: </span>{license || "Not available"}</p>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            <LiveRideTrackerCard booking={selectedBooking} />

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
                  <p>
                    <span className="font-semibold">Payment Status: </span>
                    {isPaymentDone(selectedBooking) ? "COMPLETED" : (selectedBooking.paymentStatus || "PENDING")}
                  </p>
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

      <Modal
        title="Choose Payment Method"
        open={paymentMethodModalOpen}
        onCancel={() => setPaymentMethodModalOpen(false)}
        onOk={() => {
          if (!paymentActionBooking) return;
          void handlePayNow(paymentActionBooking, paymentMethodChoice);
        }}
        okText="Continue"
        okButtonProps={{ loading: paymentLoading }}
      >
        <div className="space-y-3">
          <p className="text-gray-600">Select how you want to pay for this ride.</p>
          <Radio.Group
            value={paymentMethodChoice}
            onChange={(e) => setPaymentMethodChoice(e.target.value as CheckoutMethod)}
            className="w-full"
          >
            <Space direction="vertical" className="w-full">
              <Radio value="UPI">UPI</Radio>
              <Radio value="CARD">Card</Radio>
              <Radio value="NETBANKING">Net Banking</Radio>
              <Radio value="WALLET">Wallet</Radio>
              <Radio value="CASH">Cash</Radio>
            </Space>
          </Radio.Group>
        </div>
      </Modal>
    </div>
  );
};
