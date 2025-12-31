"use client";

import { Avatar, Button, Tabs } from "antd";
import {
  HomeOutlined,
  UserOutlined,
  CarOutlined,
  LockOutlined,
  EyeOutlined,
  DatabaseOutlined,
  LogoutOutlined,
  CloseOutlined,
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
    fixed inset-y-0 left-0 z-20 w-64 bg-white shadow-xl 
    md:w-72
    md:static md:shadow-none
    transform transition-transform duration-300 ease-in-out
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
  `}
>

        <div className="p-4 h-full flex flex-col">
          {/* Close button for mobile */}
          {windowWidth <= 768 && (
            <Button
              type="text"
              icon={<CloseOutlined />}
              className="absolute top-4 right-4 md:hidden"
              onClick={toggleSidebar}
            />
          )}

          <div className="flex flex-col items-center space-y-2 mb-6 pt-16 md:pt-8">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center"
              style={{
                width: "90px",
                height: "90px",
                boxShadow: "0 4px 14px 0 rgba(0, 0, 0, 0.1)",
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
                  size={80}
                  icon={<UserOutlined />}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500"
                />
              )}
            </div>

            <h3 className="font-semibold text-lg">{userData.name}</h3>
            <p className="text-sm text-gray-500">User Account</p>
          </div>

          <div className="border-t my-4"></div>

          <Tabs
            activeKey={activeTab}
            onChange={(key) => handleTabChange(key as TabKey)}
            tabPosition="left"
            className="user-profile-tabs flex"
            items={tabItems.map((tab) => ({
              key: tab.key,
              label: (
                <span className="flex items-center">
                  {tab.icon}
                  <span className="ml-2">{tab.label}</span>
                </span>
              ),
            }))}
          />

          <div className="border-t my-4"></div>

          <Button
            type="primary"
            danger
            className="w-full flex items-center justify-center"
            onClick={handleLogout}
            icon={<LogoutOutlined />}
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
