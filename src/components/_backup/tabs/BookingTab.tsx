"use client";

import { Card, Empty, Table, Spin, Tag, Button, Modal, message } from "antd";
import { useEffect, useState } from "react";
import bookingService from "../../services/bookingService";
import type { ColumnsType } from "antd/es/table";

export type BookingStatus = "Completed" | "Upcoming" | "Cancelled" | "PENDING" | "ACCEPTED" | "DRIVER_ARRIVED" | "IN_PROGRESS" | "CANCELLED";

interface Booking {
  _id: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: string;
  estimatedFare: number;
  bookingTime: string;
  rideOtp?: string;
}

interface BookingsTabProps {
  loading?: boolean;
}

export const BookingsTabUser = ({ loading: externalLoading = false }: BookingsTabProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  useEffect(() => {
    fetchUserBookings();
  }, []);

  const fetchUserBookings = async () => {
    try {
      setLoading(true);
      console.log('📚 [BOOKING TAB] Fetching user bookings');
      const data = await bookingService.getUserBookings();
      console.log('📚 [BOOKING TAB] Bookings fetched:', data);
      setBookings(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('❌ [BOOKING TAB] Error fetching bookings:', error);
      message.error('Failed to load booking history');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusMap: Record<string, string> = {
      PENDING: 'blue',
      ACCEPTED: 'cyan',
      DRIVER_ARRIVED: 'orange',
      IN_PROGRESS: 'processing',
      COMPLETED: 'success',
      CANCELLED: 'error',
    };
    return statusMap[status] || 'default';
  };

  const columns: ColumnsType<Booking> = [
    {
      title: 'Pickup Location',
      dataIndex: 'pickupLocation',
      key: 'pickupLocation',
      render: (text) => (
        <div className="truncate max-w-xs" title={text}>
          {text}
        </div>
      ),
    },
    {
      title: 'Dropoff Location',
      dataIndex: 'dropoffLocation',
      key: 'dropoffLocation',
      render: (text) => (
        <div className="truncate max-w-xs" title={text}>
          {text}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Fare',
      dataIndex: 'estimatedFare',
      key: 'estimatedFare',
      render: (fare) => `₹${fare.toFixed(2)}`,
    },
    {
      title: 'Date & Time',
      dataIndex: 'bookingTime',
      key: 'bookingTime',
      render: (time) => new Date(time).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setSelectedBooking(record);
            setIsDetailModalVisible(true);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="w-full">
      <Card className="shadow-md rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">My Bookings</h3>
          <Button
            type="primary"
            size="small"
            loading={loading}
            onClick={fetchUserBookings}
          >
            Refresh
          </Button>
        </div>

        <Spin spinning={loading || externalLoading}>
          {bookings.length > 0 ? (
            <Table
              columns={columns}
              dataSource={bookings}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Total ${total} bookings`,
              }}
              size="small"
            />
          ) : (
            <Empty
              description="No bookings yet"
              className="py-12"
            />
          )}
        </Spin>
      </Card>

      {/* Booking Details Modal */}
      <Modal
        title="Booking Details"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedBooking && (
          <div className="space-y-4">
            <div>
              <label className="font-semibold text-gray-700">Pickup Location:</label>
              <p className="text-gray-600">{selectedBooking.pickupLocation}</p>
            </div>
            <div>
              <label className="font-semibold text-gray-700">Dropoff Location:</label>
              <p className="text-gray-600">{selectedBooking.dropoffLocation}</p>
            </div>
            <div>
              <label className="font-semibold text-gray-700">Status:</label>
              <p>
                <Tag color={getStatusColor(selectedBooking.status)}>
                  {selectedBooking.status}
                </Tag>
              </p>
            </div>
            <div>
              <label className="font-semibold text-gray-700">Estimated Fare:</label>
              <p className="text-gray-600">₹{selectedBooking.estimatedFare.toFixed(2)}</p>
            </div>
            <div>
              <label className="font-semibold text-gray-700">Booking Date & Time:</label>
              <p className="text-gray-600">
                {new Date(selectedBooking.bookingTime).toLocaleString('en-IN')}
              </p>
            </div>
            {selectedBooking.rideOtp && selectedBooking.status !== 'COMPLETED' && selectedBooking.status !== 'CANCELLED' && (
              <div>
                <label className="font-semibold text-gray-700">Ride OTP:</label>
                <p className="text-lg font-bold text-green-600">{selectedBooking.rideOtp}</p>
                <p className="text-sm text-gray-500">Share this OTP with your driver</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
