"use client";

import { Button, Tabs } from "antd";
import {
  HomeOutlined,
  FileTextOutlined,
  CarOutlined,
  SettingOutlined,
  LogoutOutlined,
  CloseOutlined,
} from "@ant-design/icons";

export type DriverTabKey = "home" | "personalInfo" | "bookings" | "vehicles" | "settings";

interface DriverSidebarProps {
  activeTab: DriverTabKey;
  onTabChange: (tab: DriverTabKey) => void;
  isOpen: boolean;
  onClose: () => void;
  windowWidth: number;
  driverData: {
    fullName: string;
    email: string;
    profileImage: string | null;
  };
  handleLogout: () => void;
  onProfileImageUpdate?: (url: string) => void;
}

export const DriverSidebar = ({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  windowWidth,
  driverData,
  handleLogout,
  onProfileImageUpdate,
}: DriverSidebarProps) => {
  const tabItems = [
    { key: "home", label: "Home", icon: <HomeOutlined /> },
    { key: "personalInfo", label: "Personal Info", icon: <FileTextOutlined /> },
    { key: "bookings", label: "Bookings", icon: <FileTextOutlined /> },
    { key: "vehicles", label: "Vehicles", icon: <CarOutlined /> },
    { key: "settings", label: "Settings", icon: <SettingOutlined /> },
  ];

  return (
    <>
      <div
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg border-r border-gray-200
          md:w-64 md:ml-0
          md:sticky md:top-0 md:h-screen md:rounded-none md:border-r
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-0 h-full flex flex-col overflow-y-auto">
          {/* Close button - Only visible on mobile when sidebar is open */}
          {windowWidth <= 768 && isOpen && (
            <div className="p-4 flex justify-end">
              <Button
                type="text"
                icon={<CloseOutlined style={{ fontSize: "20px" }} />}
                className="hover:bg-gray-100 transition-colors"
                onClick={onClose}
                style={{
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            </div>
          )}

          {/* Navigation Tabs - Clean vertical menu */}
          <div className="flex-1 overflow-hidden min-h-0 pt-4">
            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                onTabChange(key as DriverTabKey);
                // Close sidebar on mobile after selecting
                if (windowWidth <= 768) {
                  onClose();
                }
              }}
              tabPlacement={'left' as any}
              className="driver-profile-tabs clean-sidebar-tabs"
              items={tabItems.map((tab) => ({
                key: tab.key,
                label: (
                  <span className="flex items-center gap-4 py-3 px-4 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors">
                    <span style={{ fontSize: "18px", display: "flex", alignItems: "center" }}>
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </span>
                ),
              }))}
            />
          </div>

          {/* Logout Button - Sticky at bottom */}
          <div className="p-4 border-t border-gray-200">
            <Button
              type="primary"
              danger
              className="w-full flex items-center justify-center gap-2 font-medium hover:opacity-90 transition-opacity"
              onClick={handleLogout}
              icon={<LogoutOutlined />}
              size="large"
              style={{ height: "40px" }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && windowWidth <= 768 && (
        <div
          className="fixed inset-0 bg-transparent z-20 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}
    </>
  );
};