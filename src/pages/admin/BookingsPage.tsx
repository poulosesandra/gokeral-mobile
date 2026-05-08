import { useEffect, useState } from "react";
import { adminService } from "../../services/adminService";

const BookingsPage = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await adminService.listBookings({ limit: 20, page: 1 });
      setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const cancelBooking = async (booking: any) => {
    await adminService.cancelBooking(booking._id, "Cancelled by admin");
    await loadBookings();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Booking Oversight</h1>
        <p className="text-gray-600 mt-1">Review and cancel problematic bookings.</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking: any) => (
              <div key={booking._id} className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <p className="font-semibold text-gray-900">{booking.origin?.address || "Unknown pickup"}</p>
                  <p className="text-xs text-gray-500">Status: {booking.status}</p>
                </div>
                <button
                  onClick={() => cancelBooking(booking)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-full bg-rose-500 text-white"
                >
                  Cancel
                </button>
              </div>
            ))}
            {bookings.length === 0 && <p className="text-gray-500">No bookings found.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
