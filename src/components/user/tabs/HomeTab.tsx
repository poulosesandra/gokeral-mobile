"use client";

import { Avatar, Card, Skeleton, Button, Tag, Upload, message } from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  EditOutlined,
  CarOutlined,
  IdcardOutlined,
  CameraOutlined,
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT SIDE - Profile Card */}
        <Card className="shadow-lg rounded-2xl lg:col-span-1 bg-gradient-to-br from-gray-800 to-gray-900 text-white border-0">
          <Skeleton loading={loading} active avatar>
            <div className="flex flex-col items-center text-center space-y-4">
              {/* PROFILE PIC */}
              <div className="relative">
                <div
                  className="rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-xl flex items-center justify-center flex-shrink-0 border-4 border-gray-700"
                  style={{ width: "150px", height: "150px" }}
                >
                  {userData.profileImage ? (
                    <img
                      src={userData.profileImage}
                      className="w-full h-full rounded-full object-cover"
                      alt="Profile"
                    />
                  ) : (
                    <Avatar size={130} icon={<UserOutlined />} className="bg-gradient-to-br from-green-500 to-emerald-600" />
                  )}
                </div>
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    const isImage = file.type.startsWith('image/');
                    if (!isImage) {
                      message.error('You can only upload image files!');
                      return false;
                    }
                    const isLt2M = file.size / 1024 / 1024 < 2;
                    if (!isLt2M) {
                      message.error('Image must be smaller than 2MB!');
                      return false;
                    }
                    // TODO: Implement actual upload to backend
                    message.success('Profile picture upload functionality coming soon!');
                    return false;
                  }}
                >
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<CameraOutlined />}
                    className="absolute bottom-2 right-2 shadow-lg"
                    style={{ width: '40px', height: '40px' }}
                  />
                </Upload>
              </div>

              {/* USER INFO */}
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">{userData.fullName}</h2>
                <p className="text-gray-400 text-sm">Premium User</p>
              </div>

              
            </div>
          </Skeleton>
        </Card>

        {/* RIGHT SIDE - Bio & Other Details */}
        <Card className="shadow-lg rounded-2xl lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Bio & other details</h3>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleTabChange('personal')}
              className="bg-green-600 hover:bg-green-700 border-0 flex items-center gap-2"
              size="large"
            >
              Edit Details
            </Button>
          </div>

          <Skeleton loading={loading} active>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Registered Email */}
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Registered Email</p>
                <div className="flex items-center gap-3">
                  <MailOutlined className="text-xl text-green-600" />
                  <span className="text-gray-800 font-medium">{userData.email}</span>
                </div>
              </div>

              {/* Telephone */}
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Telephone</p>
                <div className="flex items-center gap-3">
                  <PhoneOutlined className="text-xl text-green-600" />
                  <span className="text-gray-800 font-medium">{userData.phoneNumber || 'Not provided'}</span>
                </div>
              </div>

              {/* Location/Address */}
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Location</p>
                <div className="flex items-center gap-3">
                  <EnvironmentOutlined className="text-xl text-green-600" />
                  <span className="text-gray-800 font-medium">{userData.address || userData.location || 'Not provided'}</span>
                </div>
              </div>

              {/* Account Status */}
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Account Status</p>
                <div className="flex items-center gap-3">
                  <IdcardOutlined className="text-xl text-green-600" />
                  <Tag color="success" className="text-sm font-medium">Active</Tag>
                </div>
              </div>

            </div>
          </Skeleton>
        </Card>
      </div>

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
