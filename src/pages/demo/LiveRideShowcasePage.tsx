import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Input, Select, Space, Steps, Switch, Tag, Typography, message } from "antd";
import { CarOutlined, ReloadOutlined, ThunderboltOutlined, UserOutlined } from "@ant-design/icons";
import { useSearchParams } from "react-router-dom";
import bookingService from "../../services/bookingService";
import { bookingApi } from "../../services/api";

type CheckoutMethod = "UPI" | "CARD" | "NETBANKING" | "WALLET" | "CASH";

type ShowcaseBooking = {
  _id?: string;
  id?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  status?: string;
  paymentStatus?: string;
  paymentCompleted?: boolean;
  paymentMethod?: string;
  estimatedFare?: number;
  actualFare?: number;
  rideOtp?: string;
  driver?: { fullName?: string; phoneNumber?: string };
  userInfo?: { name?: string; fullName?: string; phone?: string };
  passenger?: { name?: string; fullName?: string; phone?: string };
  bookingTime?: string;
};

const normalizeBooking = (raw: any): ShowcaseBooking => ({
  ...raw,
  _id: raw?._id || raw?.id,
  id: raw?.id || raw?._id,
  pickupLocation: raw?.pickupLocation || raw?.origin?.address || "-",
  dropoffLocation: raw?.dropoffLocation || raw?.destination?.address || "-",
  estimatedFare: raw?.estimatedFare ?? raw?.fare ?? raw?.fareBreakdown?.total ?? 0,
  actualFare: raw?.actualFare ?? raw?.fare ?? 0,
});

const getBookingId = (booking?: ShowcaseBooking | null) => booking?._id || booking?.id || "";

const isPaymentDone = (booking?: ShowcaseBooking | null, paymentSummary?: any): boolean => {
  if (!booking && !paymentSummary) return false;
  if (booking?.paymentCompleted === true) return true;

  const bookingStatus = String(booking?.paymentStatus || "").toUpperCase();
  const summaryStatus = String(paymentSummary?.paymentStatus || paymentSummary?.payment?.status || "").toUpperCase();

  return [bookingStatus, summaryStatus].some((value) => ["COMPLETED", "PAID", "SUCCESS", "CAPTURED"].includes(value));
};

const normalizeStatus = (status?: string): string => {
  const value = String(status || "").toUpperCase();
  return value || "PENDING";
};

const statusColor = (status?: string) => {
  const map: Record<string, string> = {
    PENDING: "blue",
    ACCEPTED: "cyan",
    DRIVER_ARRIVED: "orange",
    IN_PROGRESS: "processing",
    COMPLETED: "green",
    CANCELLED: "red",
  };
  return map[normalizeStatus(status)] || "default";
};

const tripProgress = (booking?: ShowcaseBooking | null, paymentSummary?: any) => {
  const status = normalizeStatus(booking?.status);
  const paid = isPaymentDone(booking, paymentSummary);

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

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const LiveRideShowcasePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialBookingId = searchParams.get("bookingId") || "";

  const [bookingIdInput, setBookingIdInput] = useState(initialBookingId);
  const [trackedBookingId, setTrackedBookingId] = useState(initialBookingId);
  const [booking, setBooking] = useState<ShowcaseBooking | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutMethod>("UPI");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const currentRole = useMemo(() => String(localStorage.getItem("userRole") || "UNKNOWN").toUpperCase(), []);

  const refreshBooking = useCallback(async (bookingId: string) => {
    if (!bookingId) return;

    setLoading(true);
    try {
      const [bookingResult, paymentResult] = await Promise.allSettled([
        bookingService.getBookingById(bookingId),
        bookingService.getPaymentSummary(bookingId),
      ]);

      if (bookingResult.status === "fulfilled") {
        const response = bookingResult.value;
        const rawBooking = response?.booking || response;
        setBooking(normalizeBooking(rawBooking));
      } else {
        setBooking(null);
        throw bookingResult.reason;
      }

      if (paymentResult.status === "fulfilled") {
        setPaymentSummary(paymentResult.value);
      } else {
        setPaymentSummary(null);
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || "Unable to load booking details");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!trackedBookingId) return;
    void refreshBooking(trackedBookingId);
  }, [refreshBooking, trackedBookingId]);

  useEffect(() => {
    if (!autoRefresh || !trackedBookingId) return;

    const timer = window.setInterval(() => {
      void refreshBooking(trackedBookingId);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [autoRefresh, refreshBooking, trackedBookingId]);

  const startTracking = () => {
    const trimmed = bookingIdInput.trim();
    if (!trimmed) {
      message.warning("Enter a booking id to start live tracking");
      return;
    }

    setTrackedBookingId(trimmed);
    setSearchParams({ bookingId: trimmed });
  };

  const executeAction = async (action: "accept" | "arrived" | "complete" | "confirmCash") => {
    const bookingId = getBookingId(booking);
    if (!bookingId) {
      message.error("No active booking selected");
      return;
    }

    setActionLoading(action);
    try {
      if (action === "accept") {
        await bookingApi.post(`/bookings/${bookingId}/accept`);
        message.success("Ride accepted");
      }

      if (action === "arrived") {
        await bookingApi.patch(`/bookings/${bookingId}/status`, { status: "DRIVER_ARRIVED" });
        message.success("Driver arrival marked");
      }

      if (action === "complete") {
        await bookingApi.post(`/bookings/${bookingId}/complete`);
        message.success("Ride completed");
      }

      if (action === "confirmCash") {
        await bookingApi.post(`/payments/bookings/${bookingId}/cash/confirm`);
        message.success("Cash payment confirmed");
      }

      window.dispatchEvent(new Event("booking:updated"));
      await refreshBooking(bookingId);
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const payNow = async () => {
    const bookingId = getBookingId(booking);
    if (!bookingId) {
      message.error("No active booking selected");
      return;
    }

    setActionLoading("pay");
    try {
      const alreadyPaid = isPaymentDone(booking, paymentSummary);
      if (alreadyPaid) {
        message.success("Payment is already completed");
        return;
      }

      const order = await bookingService.createPaymentOrder(bookingId, {
        paymentMethod,
      });

      const orderStatus = String(order?.status || "").toUpperCase();
      if (orderStatus === "CAPTURED" || order?.paymentMode === "WALLET" || order?.paymentMode === "CASH") {
        message.success(order?.message || "Payment updated successfully");
        await refreshBooking(bookingId);
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
          const latest = await bookingService.getPaymentSummary(bookingId);
          const paid = isPaymentDone(booking, latest);
          setPaymentSummary(latest);
          if (!paid) {
            message.info("Checkout closed. You can retry payment.");
          }
        },
        onFailure: () => {
          message.error("Payment failed. Please retry.");
        },
        onSuccess: async (response) => {
          await bookingService.verifyPayment(bookingId, {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
          message.success("Payment successful");
          await refreshBooking(bookingId);
        },
      });
    } catch (error: any) {
      message.error(error?.response?.data?.message || error?.message || "Unable to process payment");
    } finally {
      setActionLoading(null);
    }
  };

  const bookingStatus = normalizeStatus(booking?.status);
  const paymentDone = isPaymentDone(booking, paymentSummary);
  const progress = tripProgress(booking, paymentSummary);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <Card className="shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <Typography.Title level={3} className="!mb-1">
                Live Ride Showcase
              </Typography.Title>
              <Typography.Text type="secondary">
                Track one booking in real-time and drive the full flow from accept to drop to payment.
              </Typography.Text>
            </div>
            <Space>
              <Tag color="geekblue">Signed in as {currentRole}</Tag>
              <a href="/user/profile?tab=bookings" className="text-blue-600 underline">
                User Bookings
              </a>
              <a href="/driver/profile?tab=bookings" className="text-blue-600 underline">
                Driver Bookings
              </a>
            </Space>
          </div>
        </Card>

        <Card className="shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto_auto] md:items-center">
            <Input
              value={bookingIdInput}
              onChange={(e) => setBookingIdInput(e.target.value)}
              placeholder="Enter booking id"
            />
            <Button type="primary" icon={<ThunderboltOutlined />} onClick={startTracking}>
              Start Live Tracking
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => trackedBookingId && void refreshBooking(trackedBookingId)}
              loading={loading}
            >
              Refresh
            </Button>
            <Select
              value={paymentMethod}
              onChange={(value) => setPaymentMethod(value as CheckoutMethod)}
              style={{ minWidth: 140 }}
              options={[
                { value: "UPI", label: "UPI" },
                { value: "CARD", label: "Card" },
                { value: "NETBANKING", label: "Net Banking" },
                { value: "WALLET", label: "Wallet" },
                { value: "CASH", label: "Cash" },
              ]}
            />
            <div className="flex items-center justify-end gap-2">
              <Typography.Text type="secondary">Auto refresh</Typography.Text>
              <Switch checked={autoRefresh} onChange={setAutoRefresh} />
            </div>
          </div>
        </Card>

        {!trackedBookingId && (
          <Alert
            type="info"
            showIcon
            message="Add a booking id to begin the full live flow demo"
            description="You can copy any booking id from user or driver booking tabs."
          />
        )}

        {trackedBookingId && booking && (
          <>
            <Card className="shadow-sm">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Tag color={statusColor(bookingStatus)}>{bookingStatus}</Tag>
                <Tag color={paymentDone ? "green" : "orange"}>{paymentDone ? "PAYMENT_SUCCESS" : "PAYMENT_PENDING"}</Tag>
                <Tag>Booking: {getBookingId(booking)}</Tag>
                {booking.rideOtp ? <Tag color="volcano">OTP: {booking.rideOtp}</Tag> : null}
              </div>
              <Steps size="small" current={progress.current} items={progress.items} />
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="shadow-sm" title={<span><UserOutlined /> Rider View</span>}>
                <Space direction="vertical" size="middle" className="w-full">
                  <div>
                    <Typography.Text type="secondary">Route</Typography.Text>
                    <div className="mt-1 font-medium">{booking.pickupLocation} to {booking.dropoffLocation}</div>
                  </div>
                  <div>
                    <Typography.Text type="secondary">Driver</Typography.Text>
                    <div className="mt-1 font-medium">
                      {booking.driver?.fullName || "Waiting for assignment"}
                      {booking.driver?.phoneNumber ? ` (${booking.driver.phoneNumber})` : ""}
                    </div>
                  </div>
                  <div>
                    <Typography.Text type="secondary">Fare</Typography.Text>
                    <div className="mt-1 font-medium">Rs {booking.actualFare || booking.estimatedFare || 0}</div>
                  </div>

                  {bookingStatus === "COMPLETED" && !paymentDone && (
                    <Alert
                      type="warning"
                      showIcon
                      message="Payment pending"
                      description="Complete payment to close this trip."
                      action={
                        <Button
                          type="primary"
                          loading={actionLoading === "pay"}
                          onClick={() => void payNow()}
                        >
                          Pay Now
                        </Button>
                      }
                    />
                  )}

                  {bookingStatus === "COMPLETED" && paymentDone && (
                    <Alert
                      type="success"
                      showIcon
                      message="Payment successful"
                      description="Trip is fully closed from rider side."
                    />
                  )}
                </Space>
              </Card>

              <Card className="shadow-sm" title={<span><CarOutlined /> Driver View</span>}>
                <Space direction="vertical" size="middle" className="w-full">
                  <div>
                    <Typography.Text type="secondary">Passenger</Typography.Text>
                    <div className="mt-1 font-medium">
                      {booking.userInfo?.name || booking.userInfo?.fullName || booking.passenger?.name || booking.passenger?.fullName || "N/A"}
                    </div>
                  </div>
                  <div>
                    <Typography.Text type="secondary">Booked At</Typography.Text>
                    <div className="mt-1 font-medium">{formatDate(booking.bookingTime)}</div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button
                      type="primary"
                      disabled={bookingStatus !== "PENDING"}
                      loading={actionLoading === "accept"}
                      onClick={() => void executeAction("accept")}
                    >
                      Accept Ride
                    </Button>
                    <Button
                      disabled={bookingStatus !== "ACCEPTED"}
                      loading={actionLoading === "arrived"}
                      onClick={() => void executeAction("arrived")}
                    >
                      Mark Arrived
                    </Button>
                    <Button
                      type="primary"
                      disabled={bookingStatus !== "IN_PROGRESS"}
                      loading={actionLoading === "complete"}
                      onClick={() => void executeAction("complete")}
                    >
                      Complete Ride
                    </Button>
                    <Button
                      disabled={
                        bookingStatus !== "COMPLETED" ||
                        String(booking.paymentMethod || "").toUpperCase() !== "CASH" ||
                        paymentDone
                      }
                      loading={actionLoading === "confirmCash"}
                      onClick={() => void executeAction("confirmCash")}
                    >
                      Confirm Cash
                    </Button>
                  </div>

                  {bookingStatus === "DRIVER_ARRIVED" && (
                    <Alert
                      type="info"
                      showIcon
                      message="OTP step"
                      description="Use the Driver Home tab to verify OTP and start ride to IN_PROGRESS."
                    />
                  )}
                </Space>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LiveRideShowcasePage;
