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
    { key: "personalInfo", label: "Personal Info", icon: <UserOutlined /> },
    { key: "bookings", label: "Bookings", icon: <FileTextOutlined /> },
    { key: "vehicles", label: "Vehicles", icon: <CarOutlined /> },
    { key: "settings", label: "Settings", icon: <SettingOutlined /> },
  ];

  return (
    <>
      <div
        className={`
          fixed inset-y-0 left-0 z-20 w-64 bg-white shadow-sm rounded-r-xl
          md:w-72 md:ml-4
          md:sticky md:top-0 md:h-[calc(100vh-6rem)] md:mb-6 md:rounded-xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >

        <div className="p-4 md:p-6 h-full flex flex-col overflow-hidden">
          {/* Close button for mobile */}
          {windowWidth <= 768 && (
            <Button
              type="text"
              icon={<CloseOutlined />}
              className="absolute top-4 right-4 md:hidden"
              onClick={onClose}
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

                  // Upload to backend /drivers/upload-document (requires auth)
                  try {
                    const form = new FormData();
                    form.append('file', file);
                    const resp = await api.post('/drivers/upload-document', form, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                    });

                    const url = resp?.data?.url || resp?.data?.driver?.documents?.slice(-1)[0]?.url;

                    if (url) {
                      // Save the URL to backend via update endpoint
                      try {
                        const currentUser = localStorage.getItem('userData');
                        if (currentUser) {
                          const parsed = JSON.parse(currentUser);

                          // Call update endpoint to save profileImage
                          await api.patch('/drivers/update', {
                            fullName: parsed.fullName,
                            email: parsed.email,
                            phoneNumber: parsed.phoneNumber,
                            profileImage: url,
                          });

                          message.success('Profile picture uploaded and saved');

                          // Call callback to update parent component
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

                  // Prevent default upload list
                  return Upload.LIST_IGNORE;
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

            <h3 className="font-bold text-base text-center">{driverData.fullName}</h3>
            <p className="text-xs text-gray-500">Driver Account</p>
          </div>

          <div className="border-t border-gray-200 my-2"></div>

          <div className="flex-1 overflow-hidden min-h-0">
            <Tabs
              activeKey={activeTab}
              onChange={(key) => onTabChange(key as DriverTabKey)}
              tabPlacement={'left' as any}
              className="driver-profile-tabs"
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
      {isOpen && windowWidth <= 768 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={onClose}
        />
      )}
    </>
  );
};
