"use client";

import { Avatar, Button, Tabs, Upload, message } from "antd";
import api from '../../../services/api';
import {
  UserOutlined,
  HomeOutlined,
  FileTextOutlined,
  CarOutlined,
  SettingOutlined,
  CloseOutlined,
  LogoutOutlined,
  CameraOutlined,
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
            <div className="absolute top-4 right-4 z-50">
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

          {/* User Profile Section */}
          <div className="flex flex-col items-center space-y-3 p-4 border-b border-gray-200">
            <div className="relative">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center border-4 border-white"
                style={{
                  width: "85px",
                  height: "85px",
                  boxShadow: "0 4px 14px 0 rgba(0, 0, 0, 0.15)",
                }}
              >
                {driverData.profileImage ? (
                  <img
                    src={driverData.profileImage}
                    alt="Driver avatar"
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
                beforeUpload={async (file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    message.error('You can only upload image files!');
                    return Upload.LIST_IGNORE;
                  }
                  const isLt2M = file.size / 1024 / 1024 < 2;
                  if (!isLt2M) {
                    message.error('Image must be smaller than 2MB!');
                    return Upload.LIST_IGNORE;
                  }

                  try {
                    const form = new FormData();
                    form.append('file', file);
                    const resp = await api.post('/drivers/upload-document', form, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    });

                    const url = resp?.data?.url || resp?.data?.driver?.documents?.slice(-1)[0]?.url;

                    if (url) {
                      try {
                        const currentUser = localStorage.getItem('userData');
                        if (currentUser) {
                          const parsed = JSON.parse(currentUser);

                          await api.patch('/drivers/update', {
                            fullName: parsed.fullName,
                            email: parsed.email,
                            phoneNumber: parsed.phoneNumber,
                            profileImage: url,
                          });

                          message.success('Profile picture uploaded and saved');

                          if (typeof onProfileImageUpdate === 'function') {
                            onProfileImageUpdate(url);
                          }
                        }
                      } catch (updateError: any) {
                        console.error('Failed to save profile image to backend', updateError);
                        message.error('Uploaded but failed to save. Please try again.');
                      }
                    } else {
                      message.warning('Uploaded but could not find file URL');
                    }
                  } catch (err: any) {
                    console.error('Profile upload failed', err);
                    message.error(err?.response?.data?.message || 'Upload failed');
                  }

                  return Upload.LIST_IGNORE;
                }}
              >
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CameraOutlined style={{ fontSize: "14px" }} />}
                  size="small"
                  className="absolute bottom-0 right-0 shadow-lg hover:scale-110 transition-transform"
                  style={{ width: "32px", height: "32px" }}
                />
              </Upload>
            </div>

            <div className="text-center w-full">
              <h3 className="font-bold text-base text-gray-800 truncate">{driverData.fullName}</h3>
              <p className="text-xs text-gray-500 mt-1">Driver Account</p>
            </div>
          </div>

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

      {/* Overlay for mobile - transparent */}
      {isOpen && windowWidth <= 768 && (
        <div
          className="fixed inset-0 bg-transparent z-20 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}
    </>
  );
};