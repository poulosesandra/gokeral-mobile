"use client";

import { Avatar, Button, Tabs, Upload, message } from "antd";
import {
  HomeOutlined,
  UserOutlined,
  CarOutlined,
  LockOutlined,
  EyeOutlined,
  DatabaseOutlined,
  LogoutOutlined,
  CloseOutlined,
  CameraOutlined,
} from "@ant-design/icons";
import type { TabKey, UserData } from "./UserProfile";

interface SidebarProps {
  userData: UserData;
  activeTab: TabKey;
  handleTabChange: (key: TabKey) => void;
  handleLogout: () => void;
  sidebarOpen: boolean;
  windowWidth: number;
  toggleSidebar: () => void;
}

export const UserSidebar = ({
  userData,
  activeTab,
  handleTabChange,
  handleLogout,
  sidebarOpen,
  windowWidth,
  toggleSidebar,
}: SidebarProps) => {
  const tabItems = [
    { key: "home", label: "Home", icon: <HomeOutlined /> },
    { key: "personal", label: "Personal Info", icon: <UserOutlined /> },
    { key: "bookings", label: "Bookings", icon: <CarOutlined /> },
    { key: "security", label: "Security", icon: <LockOutlined /> },
    { key: "privacy", label: "Privacy", icon: <EyeOutlined /> },
    { key: "data", label: "Data", icon: <DatabaseOutlined /> },
  ];

  return (
    <>
      <div
        className={`
          fixed inset-y-0 left-0 z-20 w-64 bg-white shadow-sm rounded-r-xl
          md:w-72 md:ml-4
          md:sticky md:top-0 md:h-[calc(100vh-6rem)] md:mb-6 md:rounded-xl
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >

        <div className="p-4 md:p-6 h-full flex flex-col overflow-hidden">
          {/* Close button for mobile */}
          {windowWidth <= 768 && (
            <Button
              type="text"
              icon={<CloseOutlined />}
              className="absolute top-4 right-4 md:hidden"
              onClick={toggleSidebar}
            />
          )}

          <div className="flex flex-col items-center space-y-2 mb-3 pt-2">
            <div className="relative">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center"
                style={{
                  width: "85px",
                  height: "85px",
                  boxShadow: "0 4px 14px 0 rgba(0, 0, 0, 0.15)",
                }}
              >
                {userData.profileImage ? (
                  <img
                    src={userData.profileImage}
                    alt="User avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <Avatar
                    size={75}
                    icon={<UserOutlined />}
                    className="bg-gradient-to-r from-emerald-500 to-green-500"
                  />
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
                  size="small"
                  className="absolute bottom-0 right-0 shadow-lg"
                  style={{ width: '28px', height: '28px' }}
                />
              </Upload>
            </div>

            <h3 className="font-bold text-base text-center">{userData.fullName}</h3>
            <p className="text-xs text-gray-500">User Account</p>
          </div>

          <div className="border-t border-gray-200 my-2"></div>

          <div className="flex-1 overflow-hidden min-h-0">
            <Tabs
              activeKey={activeTab}
              onChange={(key) => handleTabChange(key as TabKey)}
              tabPlacement={'left' as any}
              className="user-profile-tabs"
              items={tabItems.map((tab) => ({
                key: tab.key,
                label: (
                  <span className="flex items-center gap-2 py-1 text-sm">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </span>
                ),
              }))}
            />
          </div>

          <div className="border-t border-gray-200 my-2"></div>

          <Button
            type="primary"
            danger
            className="w-full flex items-center justify-center gap-2 mt-auto"
            onClick={handleLogout}
            icon={<LogoutOutlined />}
            size="middle"
          >
            Logout
          </Button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && windowWidth <= 768 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
};
