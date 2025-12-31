"use client";

import { Menu, Avatar } from "antd";
import {
  UserOutlined,
  HomeOutlined,
  FileTextOutlined,
  CarOutlined,
  SettingOutlined,
  CloseOutlined,
} from "@ant-design/icons";

export type DriverTabKey = "home" | "personalInfo" | "bookings" | "vehicles" | "settings";

interface DriverSidebarProps {
  activeTab: DriverTabKey;
  onTabChange: (tab: DriverTabKey) => void;
  isOpen: boolean;
  onClose: () => void;
  driverData: {
    name: string;
    email: string;
    profileImage: string | null;
  };
}

export const DriverSidebar = ({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  driverData,
}: DriverSidebarProps) => {
  const menuItems = [
    {
      key: "home",
      icon: <HomeOutlined />,
      label: "Home",
    },
    {
      key: "personalInfo",
      icon: <UserOutlined />,
      label: "Personal Info",
    },
    {
      key: "bookings",
      icon: <FileTextOutlined />,
      label: "Bookings",
    },
    {
      key: "vehicles",
      icon: <CarOutlined />,
      label: "Vehicles",
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "Settings",
    },
  ];

  const handleMenuClick = (key: string) => {
    onTabChange(key as DriverTabKey);
    // On mobile, close sidebar after selecting a tab
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* OVERLAY FOR MOBILE */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={onClose}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed lg:static top-0 left-0 h-full
          bg-white shadow-xl
          transition-transform duration-300 ease-in-out
          z-50
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          w-64 flex flex-col
        `}
      >
        {/* CLOSE BUTTON (Mobile Only) */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <CloseOutlined className="text-xl" />
        </button>

        {/* DRIVER INFO */}
        <div className="p-6 border-b">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg mb-3">
              {driverData.profileImage ? (
                <img
                  src={driverData.profileImage}
                  className="w-16 h-16 rounded-full object-cover"
                  alt="Profile"
                />
              ) : (
                <Avatar size={64} icon={<UserOutlined />} className="bg-transparent" />
              )}
            </div>
            <h3 className="font-semibold text-gray-800 truncate w-full">
              {driverData.name}
            </h3>
            <p className="text-sm text-gray-500 truncate w-full">
              {driverData.email}
            </p>
            <p className="text-xs text-blue-600 mt-1 font-medium">Driver Account</p>
          </div>
        </div>

        {/* NAVIGATION MENU */}
        <nav className="flex-1 overflow-y-auto py-4">
          <Menu
            mode="inline"
            selectedKeys={[activeTab]}
            items={menuItems}
            onClick={({ key }) => handleMenuClick(key)}
            className="border-none"
          />
        </nav>
      </aside>
    </>
  );
};
