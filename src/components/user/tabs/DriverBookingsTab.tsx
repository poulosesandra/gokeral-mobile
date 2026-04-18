"use client";

import { useEffect, useState, useRef, type FC } from "react";
import { Card, Empty, Tag, Spin, Button, Modal, message, Space, Pagination, Alert, Steps } from "antd";
import { EnvironmentOutlined, ClockCircleOutlined, DollarOutlined, ReloadOutlined } from "@ant-design/icons";
import { bookingApi } from "../../../services/api";
import DriverRideNavigatorCard from "../../booking/DriverRideNavigatorCard";

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
  paymentStatus?: string;
  paymentCompleted?: boolean;
  userRating?: number;
  userReview?: string;
  requestId?: string;
}

interface DriverBookingsTabProps {
  loading?: boolean;
  openBookingId?: string;
  onOpenHandled?: () => void;
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

const isPaymentDone = (booking?: Partial<Booking> | null): boolean => {
  if (!booking) return false;
  if (booking.paymentCompleted === true) return true;
  const status = String(booking.paymentStatus || "").toUpperCase();
  return status === "COMPLETED" || status === "PAID" || status === "SUCCESS";
};

const getDriverTripPaymentProgress = (booking: Partial<Booking> | null) => {
  const status = String(booking?.status || "").toUpperCase();
  const paid = isPaymentDone(booking);

  let current = 0;
  if (status === "ACCEPTED") current = 1;
  if (status === "DRIVER_ARRIVED") current = 2;
  if (status === "IN_PROGRESS") current = 3;
  if (status === "COMPLETED") current = paid ? 5 : 4;

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

// Helper to resolve passenger name/phone across different backend shapes
const getPassengerName = (b?: Partial<Booking> | null): string => {
  if (!b) return "";
  return (
    b.passenger?.details?.name ||
    (b as any).passengerDetails?.name ||
    b.passenger?.name ||
    b.passenger?.fullName ||
    b.user?.fullName ||
    b.userInfo?.name ||
    b.userInfo?.fullName ||
    ""
  );
};

const getPassengerPhone = (b?: Partial<Booking> | null): string => {
  if (!b) return "";
  return (
    b.passenger?.details?.phone ||
    (b as any).passengerDetails?.phone ||
    b.passenger?.phone ||
    b.user?.phone ||
    b.userInfo?.phone ||
    ""
  );
};

const parseNotesPassenger = (notes?: string): { name?: string } => {
  const text = String(notes || "");
  if (!text) return {};
  const match = text.match(/Passenger:\s*([^,(\n]+)/i);
  return { name: match?.[1]?.trim() };
};

const normalizeDriverBooking = (raw: any): Booking => {
  const notePassenger = parseNotesPassenger(raw?.notes);

  return {
    ...raw,
    _id: raw?._id || raw?.id,
    id: raw?.id || raw?._id,
    pickupLocation: raw?.pickupLocation || raw?.origin?.address || "-",
    dropoffLocation: raw?.dropoffLocation || raw?.destination?.address || "-",
    bookingTime: raw?.bookingTime || raw?.createdAt || raw?.scheduledAt || new Date().toISOString(),
    estimatedFare: raw?.estimatedFare ?? raw?.fare ?? raw?.fareBreakdown?.total ?? 0,
    actualFare: raw?.actualFare ?? raw?.fare ?? 0,
    passenger: {
      ...(raw?.passenger || {}),
      name:
        raw?.passenger?.name ||
        raw?.passenger?.fullName ||
        raw?.userInfo?.name ||
        raw?.userInfo?.fullName ||
        notePassenger.name,
      phone: raw?.passenger?.phone || raw?.userInfo?.phone,
    },
  };
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

export const DriverBookingsTab: FC<DriverBookingsTabProps> = ({ openBookingId, onOpenHandled }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalBookings, setTotalBookings] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [driverCoords, setDriverCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const locationWatchIdRef = useRef<number | null>(null);
  const lastRideLocationPushAtRef = useRef(0);
  const handledOpenBookingIdRef = useRef<string | null>(null);

  useEffect(() => {
    void fetchBookings(1, pageSize);
  }, []);

  useEffect(() => {
    const onBookingUpdated = () => {
      void fetchBookings(currentPage, pageSize);
    };
    window.addEventListener('booking:updated', onBookingUpdated);
    return () => window.removeEventListener('booking:updated', onBookingUpdated);
  }, [currentPage, pageSize]);

  useEffect(() => {
    const shouldLiveSync = bookings.some((b) => {
      const status = String(b.status || "").toUpperCase();
      return ["ACCEPTED", "DRIVER_ARRIVED", "IN_PROGRESS"].includes(status) ||
        (status === "COMPLETED" && !isPaymentDone(b));
    });

    if (!shouldLiveSync) return;

    const timer = window.setInterval(() => {
      void fetchBookings(currentPage, pageSize);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [bookings, currentPage, pageSize]);

  const [acceptLoadingMap, setAcceptLoadingMap] = useState<Record<string, boolean>>({});
  const [rejectLoadingMap, setRejectLoadingMap] = useState<Record<string, boolean>>({});
  const [actionLoadingMap, setActionLoadingMap] = useState<Record<string, boolean>>({});

  // Pick the most reliable booking timestamp we can display.
  // Backend provides `bookingTime` (legacy), plus `createdAt` (mongoose timestamps) and `timestamp`.
  const getBookingDateString = (booking: Partial<Booking> | null | undefined): string | undefined => {
    if (!booking) return undefined;
    const anyBooking = booking as any;
    return booking.bookingTime || booking.createdAt || anyBooking.timestamp;
  };

  const fetchBookings = async (page: number = currentPage, limit: number = pageSize) => {
    try {
      setLoading(true);

      // Fetch in parallel and tolerate partial failure so one endpoint does not blank the whole tab.
      const [allRespResult, pendingRespResult] = await Promise.allSettled([
        bookingApi.get("/bookings/driver/my-bookings", {
          params: {
            page,
            limit,
          },
        }),
        bookingApi.get("/ride-requests/pending"),
      ]);

      const allBookings: Booking[] =
        allRespResult.status === "fulfilled"
          ? Array.isArray(allRespResult.value.data?.bookings)
            ? allRespResult.value.data.bookings
            : Array.isArray(allRespResult.value.data)
              ? allRespResult.value.data
              : []
          : [];

      const paginatedTotal =
        allRespResult.status === "fulfilled"
          ? Number(allRespResult.value.data?.total || allBookings.length || 0)
          : 0;

      const pendingRequests: any[] =
        pendingRespResult.status === "fulfilled"
          ? Array.isArray(pendingRespResult.value.data?.requests)
            ? pendingRespResult.value.data.requests
            : Array.isArray(pendingRespResult.value.data)
              ? pendingRespResult.value.data
              : []
          : [];

      if (allRespResult.status === "rejected" && pendingRespResult.status === "rejected") {
        throw allRespResult.reason || pendingRespResult.reason;
      }

      const pendingBookings: Booking[] = (page === 1 ? pendingRequests : [])
        .map((req) => {
          const booking = req?.booking || {};
          return normalizeDriverBooking({
            ...booking,
            _id: booking?._id || req?.bookingId,
            status: booking?.status || "PENDING",
            requestId: req?.requestId,
            estimatedFare: booking?.fare,
          });
        })
        .filter((b) => Boolean(getBookingId(b)));

      const normalizedBookings = [...(allBookings || []).map(normalizeDriverBooking), ...pendingBookings];

      const dedupedById = new Map<string, Booking>();
      for (const b of normalizedBookings) {
        const id = getBookingId(b);
        if (!id) continue;

        const existing = dedupedById.get(id);
        if (!existing) {
          dedupedById.set(id, b);
          continue;
        }

        // Prefer richer non-pending record if duplicate exists.
        if ((existing.status || "").toUpperCase() === "PENDING" && (b.status || "").toUpperCase() !== "PENDING") {
          dedupedById.set(id, b);
        }
      }

      // Sort newest-first
      const sorted = [...dedupedById.values()].sort((a, b) => {
        const aDate = new Date(getBookingDateString(a) || 0).getTime();
        const bDate = new Date(getBookingDateString(b) || 0).getTime();
        return bDate - aDate;
      });

      setBookings(sorted);
      setCurrentPage(page);
      setPageSize(limit);
      setTotalBookings(paginatedTotal + pendingBookings.length);

      if (allRespResult.status === "rejected" || pendingRespResult.status === "rejected") {
        message.warning("Some booking data could not be loaded. Showing available results.");
      }

      return true;
    } catch (error: any) {
      setBookings([]);
      if (error.response?.status === 401) {
        message.error("Unauthorized - please login again");
      } else {
        const status = error.response?.status ? ` (${error.response.status})` : "";
        message.error((error.response?.data?.message || error?.message || "Failed to load booking history") + status);
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
      const res = await bookingApi.post(`/bookings/${id}/accept`);

      message.success(res.data?.Message || res.data?.message || "Ride accepted");

      setBookings((prev) => prev.map((b) => (getBookingId(b) === id ? { ...b, status: "ACCEPTED" } : b)));
      window.dispatchEvent(new Event("booking:updated"));
      void fetchBookings(currentPage, pageSize);
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

    try {
      const res = await bookingApi.post(`/bookings/${id}/reject`);

      message.success(res.data?.message || "Ride rejected");

      setBookings((prev) => prev.filter((b) => getBookingId(b) !== id));
      window.dispatchEvent(new Event("booking:updated"));
      void fetchBookings(currentPage, pageSize);
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

  const setActionLoading = (bookingId: string, loadingState: boolean) => {
    setActionLoadingMap((prev) => ({ ...prev, [bookingId]: loadingState }));
  };

  const syncDriverPaymentState = async (bookingId: string) => {
    try {
      const paymentRes = await bookingApi.get(`/payments/bookings/${bookingId}/summary`);
      const summary = paymentRes.data || {};
      const paymentStatus = String(summary?.paymentStatus || summary?.payment?.status || "").toUpperCase();
      const paid = ["COMPLETED", "PAID", "SUCCESS", "CAPTURED"].includes(paymentStatus);

      setSelectedBooking((prev) => {
        if (!prev) return prev;
        const prevId = getBookingId(prev);
        if (String(prevId) !== String(bookingId)) return prev;
        return {
          ...prev,
          paymentStatus: paid ? "COMPLETED" : (summary?.paymentStatus || prev.paymentStatus),
          paymentCompleted: paid,
          paymentMethod: summary?.payment?.method || prev.paymentMethod,
        };
      });

      setBookings((prev) =>
        prev.map((b) => {
          const id = getBookingId(b);
          if (String(id) !== String(bookingId)) return b;
          return {
            ...b,
            paymentStatus: paid ? "COMPLETED" : (summary?.paymentStatus || b.paymentStatus),
            paymentCompleted: paid,
            paymentMethod: summary?.payment?.method || b.paymentMethod,
          };
        }),
      );
    } catch {
      // Ignore summary refresh failures; booking data still remains visible.
    }
  };

  const handleMarkArrived = async (booking: Booking) => {
    const bookingId = getBookingId(booking);
    if (!bookingId) {
      message.error("Missing booking id");
      return;
    }

    setActionLoading(bookingId, true);
    try {
      await bookingApi.patch(`/bookings/${bookingId}/status`, { status: "DRIVER_ARRIVED" });
      message.success("Driver arrival marked successfully");
      window.dispatchEvent(new Event("booking:updated"));
      await fetchBookings(currentPage, pageSize);
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || "Failed to mark driver arrival");
    } finally {
      setActionLoading(bookingId, false);
    }
  };

  const handleCompleteRide = async (booking: Booking) => {
    const bookingId = getBookingId(booking);
    if (!bookingId) {
      message.error("Missing booking id");
      return;
    }

    setActionLoading(bookingId, true);
    try {
      await bookingApi.post(`/bookings/${bookingId}/complete`);
      message.success("Ride completed successfully");
      window.dispatchEvent(new Event("booking:updated"));
      await fetchBookings(currentPage, pageSize);
      await syncDriverPaymentState(bookingId);
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || "Failed to complete ride");
    } finally {
      setActionLoading(bookingId, false);
    }
  };

  const handleConfirmCashPayment = async (booking: Booking) => {
    const bookingId = getBookingId(booking);
    if (!bookingId) {
      message.error("Missing booking id");
      return;
    }

    setActionLoading(bookingId, true);
    try {
      await bookingApi.post(`/payments/bookings/${bookingId}/cash/confirm`);
      message.success("Cash payment confirmed");
      await syncDriverPaymentState(bookingId);
      window.dispatchEvent(new Event("booking:updated"));
      await fetchBookings(currentPage, pageSize);
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || "Failed to confirm cash payment");
    } finally {
      setActionLoading(bookingId, false);
    }
  };

  const filteredBookings =
    filterStatus === "all"
      ? bookings
      : bookings.filter((b) => (b.status || "").toUpperCase() === filterStatus.toUpperCase());

  const completedBookings = bookings.filter((b) => (b.status || "").toUpperCase() === "COMPLETED").length;
  const cancelledBookings = bookings.filter((b) => (b.status || "").toUpperCase() === "CANCELLED").length;

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsModalOpen(true);
  };

  const pushLocationOnce = async (bookingId: string) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      message.error("Geolocation is not supported by your browser.");
      return;
    }

    setRefreshingLocation(true);
    try {
      const coords = await new Promise<{ lat: number; lng: number; speedKmph?: number; heading?: number; accuracyMeters?: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              speedKmph: pos.coords.speed != null ? Math.max(0, Number(pos.coords.speed) * 3.6) : undefined,
              heading: pos.coords.heading != null ? Number(pos.coords.heading) : undefined,
              accuracyMeters: pos.coords.accuracy != null ? Number(pos.coords.accuracy) : undefined,
            });
          },
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 },
        );
      });

      setDriverCoords({ lat: coords.lat, lng: coords.lng });

      await bookingApi.post(`/bookings/${bookingId}/location`, {
        lat: coords.lat,
        lng: coords.lng,
        speedKmph: coords.speedKmph,
        heading: coords.heading,
        accuracyMeters: coords.accuracyMeters,
      });
    } catch (error: any) {
      message.warning(error?.message || "Unable to refresh live location");
    } finally {
      setRefreshingLocation(false);
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

  // Open booking details when parent supplies `openBookingId`
  useEffect(() => {
    // Skip if no openBookingId or we've already handled this one
    if (!openBookingId || handledOpenBookingIdRef.current === openBookingId) return;
    
    // Mark as handled immediately to prevent re-triggers
    handledOpenBookingIdRef.current = openBookingId;
    
    const open = async () => {
      // Try find in current list
      let found = bookings.find((b) => getBookingId(b) === openBookingId);
      if (!found) {
        try {
          const res = await bookingApi.get(`/bookings/${openBookingId}`);
          found = normalizeDriverBooking(res.data) as Booking;
        } catch (err) {
          message.error("Failed to fetch booking details");
        }
      }
      if (found) {
        setSelectedBooking(found);
        setDetailsModalOpen(true);
      } else {
        message.error("Booking not found");
      }
      onOpenHandled?.();
    };
    open();
    // Note: bookings is not in deps intentionally - we fetch from API if not found locally
  }, [openBookingId, onOpenHandled]);

  useEffect(() => {
    if (!detailsModalOpen || !selectedBooking) return;
    const bookingId = getBookingId(selectedBooking);
    if (!bookingId) return;

    const status = String(selectedBooking.status || "").toUpperCase();
    const shouldSync = ["ACCEPTED", "DRIVER_ARRIVED", "IN_PROGRESS"].includes(status) ||
      (status === "COMPLETED" && !isPaymentDone(selectedBooking));
    if (!shouldSync) return;

    const syncSelected = async () => {
      try {
        const res = await bookingApi.get(`/bookings/${bookingId}`);
        const updated = normalizeDriverBooking(res.data);

        setSelectedBooking((prev) => {
          if (!prev) return prev;
          const prevId = getBookingId(prev);
          if (String(prevId) !== String(bookingId)) return prev;
          return { ...prev, ...updated };
        });

        setBookings((prev) =>
          prev.map((b) => (String(getBookingId(b)) === String(bookingId) ? { ...b, ...updated } : b)),
        );

        if (String(updated.status || "").toUpperCase() === "COMPLETED") {
          await syncDriverPaymentState(bookingId);
        }
      } catch {
        // Ignore transient sync issues.
      }
    };

    void syncSelected();
    const timer = window.setInterval(() => {
      void syncSelected();
    }, 4000);

    return () => window.clearInterval(timer);
  }, [detailsModalOpen, selectedBooking?._id, selectedBooking?.id, selectedBooking?.status, selectedBooking?.paymentStatus, selectedBooking?.paymentCompleted]);

  const activeRideBooking = (() => {
    const selectedStatus = String(selectedBooking?.status || "").toUpperCase();
    if (selectedBooking && ["ACCEPTED", "DRIVER_ARRIVED", "IN_PROGRESS"].includes(selectedStatus)) {
      return selectedBooking;
    }
    return (
      bookings.find((b) => {
        const status = String(b?.status || "").toUpperCase();
        return ["ACCEPTED", "DRIVER_ARRIVED", "IN_PROGRESS"].includes(status);
      }) || null
    );
  })();

  useEffect(() => {
    const bookingId = getBookingId(activeRideBooking);
    const status = String(activeRideBooking?.status || "").toUpperCase();
    const shouldTrack = status === "IN_PROGRESS";

    if (!bookingId || !shouldTrack || typeof navigator === "undefined" || !navigator.geolocation) {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setDriverCoords({ lat, lng });

        const now = Date.now();
        if (now - lastRideLocationPushAtRef.current < 3000) {
          return;
        }
        lastRideLocationPushAtRef.current = now;

        try {
          await bookingApi.post(`/bookings/${bookingId}/location`, {
            lat,
            lng,
            speedKmph: pos.coords.speed != null ? Math.max(0, Number(pos.coords.speed) * 3.6) : undefined,
            heading: pos.coords.heading != null ? Number(pos.coords.heading) : undefined,
            accuracyMeters: pos.coords.accuracy != null ? Number(pos.coords.accuracy) : undefined,
          });
        } catch {
          // Keep navigator alive even if one location write fails.
        }
      },
      () => {
        // Ignore noisy geolocation errors in background watch.
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000,
      },
    );

    locationWatchIdRef.current = watchId;

    return () => {
      if (locationWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
    };
  }, [activeRideBooking?._id, activeRideBooking?.id, activeRideBooking?.rideId, activeRideBooking?.bookingId, activeRideBooking?.status]);

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
          <Button type="default" size="small" icon={<ReloadOutlined />} onClick={(e) => { e.stopPropagation(); void fetchBookings(currentPage, pageSize); }} loading={loading}>Refresh</Button>
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
                    <div className="flex-1 min-w-0">
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <ClockCircleOutlined className="text-green-600" />
                        <div>
                          <p className="text-sm text-gray-500">Booking Date</p>
                          <p className="font-semibold text-gray-800">{formatDate(booking.bookingTime)}</p>
                        </div>
                      </div>

                      <p className="text-sm mt-2 truncate">
                        <span className="text-gray-600">Passenger: </span>
                        <span className="font-semibold">{getPassengerName(booking)}</span>
                      </p>
                      <p className="text-sm mt-1 truncate">
                        <span className="text-gray-600">Phone: </span>
                        <span className="font-semibold">{getPassengerPhone(booking)}</span>
                      </p>
                    </div>
                    {/* Right - Fare & Status */}
                    <div className="flex flex-col md:items-end items-start gap-2 md:w-44 md:flex-shrink-0">
                      <Tag color={getStatusColor(booking.status)}>{getStatusLabel(booking.status)}</Tag>

                      {booking.status === "PENDING" && (
                        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                          <Button type="primary" size="small" className="w-full md:w-auto" onClick={(e) => { e.stopPropagation(); handleAccept(booking); }} loading={!!acceptLoadingMap[String(getBookingId(booking) || "")]}>Accept</Button>
                          <Button danger size="small" className="w-full md:w-auto" onClick={(e) => { e.stopPropagation(); handleRejectConfirm(booking); }} loading={!!rejectLoadingMap[String(getBookingId(booking) || "")]}>Reject</Button>
                        </div>
                      )}

                      {booking.status === "COMPLETED" && (
                        <div className="flex items-center gap-1">
                          <DollarOutlined />
                          <span className="font-bold text-gray-800">₹{booking.actualFare || booking.estimatedFare || 0}</span>
                        </div>
                      )}
                      {booking.status === "COMPLETED" && (
                        <Tag color={isPaymentDone(booking) ? "green" : "orange"}>
                          {isPaymentDone(booking) ? "Payment Successful" : "Payment Pending"}
                        </Tag>
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
          title="Booking Details"
          open={detailsModalOpen}
          onCancel={() => setDetailsModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailsModalOpen(false)}>Close</Button>,
            String(selectedBooking.status || "").toUpperCase() === "ACCEPTED" && (
              <Button
                key="mark-arrived"
                type="primary"
                loading={!!actionLoadingMap[String(getBookingId(selectedBooking) || "")]}
                onClick={() => void handleMarkArrived(selectedBooking)}
              >
                Mark Arrived
              </Button>
            ),
            String(selectedBooking.status || "").toUpperCase() === "IN_PROGRESS" && (
              <Button
                key="complete-ride"
                type="primary"
                loading={!!actionLoadingMap[String(getBookingId(selectedBooking) || "")]}
                onClick={() => void handleCompleteRide(selectedBooking)}
              >
                Complete Ride
              </Button>
            ),
            String(selectedBooking.status || "").toUpperCase() === "DRIVER_ARRIVED" && (
              <Button
                key="start-via-otp"
                onClick={() => message.info("Use Driver Home tab to verify OTP and start the ride.")}
              >
                Start via OTP
              </Button>
            ),
            String(selectedBooking.status || "").toUpperCase() === "COMPLETED" &&
              String(selectedBooking.paymentMethod || "").toUpperCase() === "CASH" &&
              !isPaymentDone(selectedBooking) && (
                <Button
                  key="confirm-cash"
                  type="primary"
                  loading={!!actionLoadingMap[String(getBookingId(selectedBooking) || "")]}
                  onClick={() => void handleConfirmCashPayment(selectedBooking)}
                >
                  Confirm Cash Collected
                </Button>
              ),
          ]}
          width={700}
        >
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {String(selectedBooking.status || "").toUpperCase() === "COMPLETED" &&
              String(selectedBooking.paymentMethod || "").toUpperCase() !== "CASH" &&
              !isPaymentDone(selectedBooking) && (
                <Alert
                  type="warning"
                  showIcon
                  message="Waiting for Customer Payment"
                  description="Customer needs to complete payment. Status will update in real-time."
                />
              )}

            {String(selectedBooking.status || "").toUpperCase() === "COMPLETED" && isPaymentDone(selectedBooking) && (
              <Alert
                type="success"
                showIcon
                message="Payment Successful"
                description="Payment is confirmed and settled for this trip."
              />
            )}

            <div>
              <p className="text-gray-600 text-sm mb-2">Trip & Payment Progress</p>
              <Steps
                size="small"
                current={getDriverTripPaymentProgress(selectedBooking).current}
                items={getDriverTripPaymentProgress(selectedBooking).items}
              />
            </div>

            <div>
              <p className="text-gray-600 text-sm">Status</p>
              <Tag color={getStatusColor(selectedBooking.status)}>{getStatusLabel(selectedBooking.status)}</Tag>
            </div>

            <div>
              <p className="text-gray-600 text-sm">Passenger Name</p>
              <p className="font-semibold">{getPassengerName(selectedBooking) || "Not available"}</p>
              <p className="text-gray-600 text-sm mt-2">Phone</p>
              <p className="font-semibold">{getPassengerPhone(selectedBooking) || "Not available"}</p>
            </div>

            <div>
              <p className="text-gray-600 text-sm">Pickup Location</p>
              <p className="font-semibold">{selectedBooking.pickupLocation}</p>
              <p className="text-gray-600 text-sm mt-2">Dropoff Location</p>
              <p className="font-semibold">{selectedBooking.dropoffLocation}</p>
            </div>

            {["ACCEPTED", "DRIVER_ARRIVED", "IN_PROGRESS"].includes(String(selectedBooking.status || "").toUpperCase()) && (
              <DriverRideNavigatorCard
                booking={selectedBooking}
                driverCoords={driverCoords}
                refreshing={refreshingLocation}
                onRefreshLocation={async () => {
                  const bookingId = getBookingId(selectedBooking);
                  if (!bookingId) {
                    message.error("Missing booking id for live navigation");
                    return;
                  }
                  await pushLocationOnce(bookingId);
                }}
              />
            )}

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
              <p className="font-semibold">₹{selectedBooking?.estimatedFare || 0}</p>
              {selectedBooking?.actualFare && (
                <>
                  <p className="text-gray-600 text-sm mt-2">Actual Fare</p>
                  <p className="font-semibold text-green-600">₹{selectedBooking?.actualFare}</p>
                </>
              )}
            </div>

            <div>
              <p className="text-gray-600 text-sm">Payment Method</p>
              <p className="font-semibold">{selectedBooking.paymentMethod || "Not available"}</p>
              <p className="text-gray-600 text-sm mt-2">Payment Status</p>
              <Tag color={isPaymentDone(selectedBooking) ? "success" : "default"}>
                {isPaymentDone(selectedBooking) ? "Completed" : (selectedBooking.paymentStatus || "Pending")}
              </Tag>
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