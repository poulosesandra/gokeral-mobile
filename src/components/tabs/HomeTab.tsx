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
import type { TabKey, UserData } from "../profile/UserProfile";
import type { BookingStatus } from "./BookingTab";

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
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-10">

      {/* LEFT SIDE (1/3) */}
      <Card className="shadow-xl p-10 rounded-2xl md:col-span-1">
        <Skeleton loading={loading} active avatar>
          <div className="flex flex-col items-center gap-6">

            {/* PROFILE PIC */}
            <div
              className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-2xl flex items-center justify-center"
              style={{ width: "180px", height: "180px" }}
            >
              {userData.profileImage ? (
                <img
                  src={userData.profileImage}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Avatar size={150} icon={<UserOutlined />} />
              )}
            </div>

            {/* USER INFO */}
            <div className="space-y-4 text-center">
              <h3 className="text-3xl font-bold">{userData.name}</h3>

              <div className="flex items-center justify-center gap-3 text-lg">
                <MailOutlined /> <span>{userData.email}</span>
              </div>

              <div className="flex items-center justify-center gap-3 text-lg">
                <PhoneOutlined /> <span>{userData.phoneNumber}</span>
              </div>

              <div className="flex items-center justify-center gap-3 text-lg">
                <EnvironmentOutlined /> <span>{userData.location}</span>
              </div>
            </div>

          </div>
        </Skeleton>
      </Card>

      {/* RIGHT SIDE (2/3) */}
      <Card className="shadow-xl p-0 rounded-2xl md:col-span-2">
        <div className="grid grid-cols-2 divide-x">

          {/* RECENT OVERVIEW */}
          <div className="p-10 overflow-hidden">
            <h3 className="text-3xl font-semibold mb-6">Recent Overview</h3>

            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-start gap-6 border-b pb-5 mb-5"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
      <CarOutlined className="text-white text-xl" />
              </div>

                <div>
                  <p className="font-semibold text-xl">{booking.vehicle}</p>
                  <p className="text-sm text-gray-500">
                    {booking.startDate} → {booking.endDate}
                  </p>
                </div>

                {/* Status TAG — stays inside column */}
                <div className="ml-auto">{getStatusTag(booking.status)}</div>
              </div>
            ))}
          </div>

          {/* ACCOUNT OVERVIEW */}
          <div className="p-10 overflow-hidden">
            <h3 className="text-3xl font-semibold mb-6">Account Overview</h3>

            {accountSections.map((section) => (
              <div
                key={section.title}
                className="flex items-center justify-between border-b pb-5 mb-5"
              >
                <div>
                  <p className="font-semibold text-xl">{section.title}</p>
                  <p className="text-sm text-gray-500">{section.desc}</p>
                </div>

                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleTabChange(section.tab)}
                  className="text-base"
                >
                  Edit
                </Button>
              </div>
            ))}
          </div>

        </div>
      </Card>

    </div>
  );
};
