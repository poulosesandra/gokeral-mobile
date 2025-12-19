"use client";

import { Avatar, Card, Skeleton, Button, Tag } from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  EditOutlined,
  CarOutlined,
} from "@ant-design/icons";
import type { UserData } from "../profile/UserProfile";

// Define base TabKey type
export type UserTabKey = "home" | "personal" | "bookings" | "security" | "privacy" | "data";
export type DriverTabKey = UserTabKey | "vehicles";
export type TabKey = UserTabKey | DriverTabKey;

export type BookingStatus = "Completed" | "Upcoming" | "Cancelled";

interface HomeTabProps {
  userData: UserData;
  loading: boolean;
  handleTabChange: (key: TabKey) => void;
}

export const HomeTab = ({ userData, loading, handleTabChange }: HomeTabProps) => {
  const recentBookings: Array<{
    id: string;
    vehicle: string;
    startDate: string;
    endDate: string;
    status: BookingStatus;
  }> = [
    {
      id: "BK-001",
      vehicle: "Toyota Camry",
      startDate: "2023-04-10",
      endDate: "2023-04-15",
      status: "Completed",
    },
    {
      id: "BK-002",
      vehicle: "Honda Civic",
      startDate: "2023-05-20",
      endDate: "2023-05-25",
      status: "Upcoming",
    },
  ];

  const accountSections = [
    { title: "Personal Information", desc: "Name, email, phone", tab: "personal" as TabKey },
    { title: "Security Settings", desc: "Password settings", tab: "security" as TabKey },
    { title: "Privacy Preferences", desc: "Notification settings", tab: "privacy" as TabKey },
  ];

  const getStatusTag = (status: BookingStatus) => {
    const colors: Record<BookingStatus, string> = {
      Completed: "success",
      Upcoming: "processing",
      Cancelled: "error",
    };
    return <Tag color={colors[status]}>{status}</Tag>;
  };

  return (
    <div className="w-full space-y-6">

      {/* USER PROFILE HEADER */}
      <Card className="shadow-md rounded-2xl">
        <Skeleton loading={loading} active avatar>
          <div className="flex items-center gap-6">
            {/* PROFILE PIC */}
            <div
              className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center flex-shrink-0"
              style={{ width: "120px", height: "120px" }}
            >
              {userData.profileImage ? (
                <img
                  src={userData.profileImage}
                  className="w-full h-full rounded-full object-cover"
                  alt="Profile"
                />
              ) : (
                <Avatar size={100} icon={<UserOutlined />} className="bg-transparent" />
              )}
            </div>

            {/* USER INFO */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-800">{userData.name}</h2>
              
              <div className="flex items-center gap-2 text-gray-600">
                <MailOutlined className="text-lg" />
                <span>{userData.email}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <PhoneOutlined className="text-lg" />
                <span>{userData.phoneNumber}</span>
              </div>

              {userData.location && (
                <div className="flex items-center gap-2 text-gray-600">
                  <EnvironmentOutlined className="text-lg" />
                  <span>{userData.location}</span>
                </div>
              )}
            </div>
          </div>
        </Skeleton>
      </Card>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RECENT BOOKINGS */}
        <Card className="shadow-md rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Recent Bookings</h3>
            <Button 
              type="link" 
              onClick={() => handleTabChange('bookings')}
              className="text-blue-600 hover:text-blue-700"
            >
              View All
            </Button>
          </div>

          <div className="space-y-4">
            {recentBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No bookings yet</p>
            ) : (
              recentBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <CarOutlined className="text-white text-xl" />
                  </div>

                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{booking.vehicle}</p>
                    <p className="text-sm text-gray-500">
                      {booking.startDate} to {booking.endDate}
                    </p>
                  </div>

                  {getStatusTag(booking.status)}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* ACCOUNT OVERVIEW */}
        <Card className="shadow-md rounded-2xl">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Account Overview</h3>

          <div className="space-y-4">
            {accountSections.map((section) => (
              <div
                key={section.title}
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div>
                  <p className="font-semibold text-gray-800">{section.title}</p>
                  <p className="text-sm text-gray-500">{section.desc}</p>
                </div>

                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleTabChange(section.tab)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </Card>

      </div>

    </div>
  );
};
