"use client";

import { useState, useEffect } from "react";
import { Card, Table, Button, Tag, Typography, Spin, message, Modal } from "antd";
import { CloseCircleOutlined, EyeOutlined } from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { Avatar, Image } from "antd";
// import RouteViewer from "../maps/RouteViewer";
const { Title, Paragraph } = Typography;

interface Driver {
  details: { name: string; phone: string };
}

interface Vehicle {
  details: { vehicleImages: string[] };
}

interface Booking {
  bookingId: string;
  _id: string;
  driver: Driver;
  vehicle: Vehicle;
  origin: { address: string };
  destination: { address: string };
  distance: { text: string };
  duration: { text: string };
  price: { total: number };
  passenger: { details: { name: string; phone: string } };
  status: "pending" | "accepted" | "in-progress" | "completed" | "cancelled";
  timestamp: string;
}

interface BookingsTabProps {
  loading: boolean;
}
export type BookingStatus = "Completed" | "Upcoming" | "Cancelled";
export const BookingsTabUser = ({ loading: parentLoading }: BookingsTabProps) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/bookings/bookingDetailsForUsers`,
        {
          headers: {
            "Content-Type": "application/json",
            "x-auth-token": token,
          },
          params: {
            id: localStorage.getItem("driverEmail"),
          },
        }
      );

      // Assuming the API returns a single booking or an array of bookings
      const bookingData = Array.isArray(response.data.booking)
        ? response.data.booking
        : [response.data.booking].filter(Boolean);
      setBookings(bookingData);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      message.error("Failed to fetch bookings. Please try again.");
      console.error("Error fetching bookings:", error);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      // await axios.patch(
      //   `${import.meta.env.VITE_API_URL}/bookings/${bookingId}`,
      //   { status },
      //   {
      //     headers: {
      //       "Content-Type": "application/json",
      //       "x-auth-token": token,
      //     },
      //   }
      // );

      const url = `${import.meta.env.VITE_API_URL}/bookings/${bookingId}/status`;
    console.log("Full URL:", url);
    
    await axios.put( 
      url, 
      { status },
      {
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
      }
    );
      message.success(`Booking ${status} successfully!`);
      fetchBookings(); // Refresh bookings after update
    } catch (error) {
      message.error(`Failed to update booking status. Please try again.`);
      console.error("Error updating booking status:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Booking ID",
      dataIndex: "bookingId",
      key: "bookingId",
    },
    {
      title: "Origin",
      dataIndex: ["origin", "address"],
      key: "origin",
      render: (address: string) => address || "Not set",
    },
    {
      title: "Destination",
      dataIndex: ["destination", "address"],
      key: "destination",
      render: (address: string) => address || "Not set",
    },
    {
      title: "Driver",
      key: "name",
      render: (record: Booking) => record.driver?.details?.name || "Not set",
    },
    {
      title: "Phone",
      key: "phone",
      render: (record: Booking) =>
        record.driver?.details?.phone || "Not set",
    },
    {
      title: "Distance",
      dataIndex: ["distance", "text"],
      key: "distance",
      render: (text: string) => text || "Not set",
    },
    {
      title: "Duration",
      dataIndex: ["duration", "text"],
      key: "duration",
      render: (text: string) => text || "Not set",
    },
    {
      title: "Total Price",
      dataIndex: ["price", "total"],
      key: "price",
      render: (total: number) => `₹${total.toFixed(2)}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: "orange",
          accepted: "blue",
          "in-progress": "cyan",
          completed: "green",
          cancelled: "red",
        };
        return <Tag color={colorMap[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Date",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp: string) =>
        dayjs(timestamp).format("DD-MM-YYYY HH:mm"),
    },
     {
    title: "Driver Image",
    key: "driverImage",
    render: (record: Booking) => (
      record?.vehicle?.details?.vehicleImages ? (
        <Avatar
          src={<Image src={record.vehicle.details.vehicleImages[0]} alt="Driver" />}
          size={48}
        />
      ) : (
        <Avatar size={48}>{record.driver?.details?.name?.[0] || "U"}</Avatar>
      )
    ),
  },
    {
      title: "Actions",
      key: "actions",
      render: (record: Booking) => (
        <div className="flex gap-2">
          <Button
            type="default"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedBooking(record);
              setRouteModalOpen(true);
            }}
            size="small"
          >
            View Route
          </Button>
          {["pending", "accepted"].includes(record.status) && (
            <Button
              type="primary"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => updateBookingStatus(record._id, "cancelled")}
              size="small"
            >
              Cancel
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading || parentLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <Title level={4} className="!mb-2 text-xl sm:text-2xl">
          Your Bookings
        </Title>
        <Paragraph className="text-gray-500 text-sm sm:text-base mb-6">
          View and manage your active bookings
        </Paragraph>

        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <Paragraph className="text-gray-500">
              No active bookings found.
            </Paragraph>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={bookings}
            rowKey="bookingId"
            pagination={false}
            className="overflow-x-auto"
          />
        )}
      </Card>

      {/* Route Viewer Modal */}
      <Modal
        title="Route Details"
        open={routeModalOpen}
        onCancel={() => {
          setRouteModalOpen(false);
          setSelectedBooking(null);
        }}
        footer={null}
        width={800}
        className="route-modal"
      >
        {/* {selectedBooking && (
          // <RouteViewer
          //   origin={{
          //     address: selectedBooking.origin.address
          //   }}
          //   destination={{
          //     address: selectedBooking.destination.address
          //   }}
          //   height="500px"
          // />
        )} */}
      </Modal>
    </>
  );
};