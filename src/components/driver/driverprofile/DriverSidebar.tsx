"use client";

import { Avatar, Button, Tabs, message, Modal, Spin } from "antd";
import {
  UserOutlined,
  HomeOutlined,
  FileTextOutlined,
  CarOutlined,
  SettingOutlined,
  CloseOutlined,
  LogoutOutlined,
  CameraOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useRef, useState, useEffect } from "react";
import { authService } from '../../../services/authServices';

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

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
    phoneNumber?: string;
  };
  handleLogout: () => void;
  onProfileImageUpdate?: (url: string | null) => void;
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
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [, setUploading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  const tabItems = [
    { key: "home", label: "Home", icon: <HomeOutlined /> },
    { key: "personalInfo", label: "Personal Info", icon: <FileTextOutlined /> },
    { key: "bookings", label: "Bookings", icon: <FileTextOutlined /> },
    { key: "vehicles", label: "Vehicles", icon: <CarOutlined /> },
    { key: "settings", label: "Settings", icon: <SettingOutlined /> },
  ];

  const uploadDriverFile = async (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return;
    }

    setUploading(true);
    try {
      let url = '';
      try {
        url = await authService.uploadDriverFilePresigned(file, 'profileImage');
      } catch (presignError) {
        console.warn('Presigned profile upload failed, falling back to base64 update', presignError);
        url = await fileToDataUrl(file);
      }

      if (url) {
        const updated = await authService.updateDriverProfile({ profileImage: url } as any);
        const resolvedUrl = updated?.profileImage || url;

        message.success('Profile picture updated');
        onProfileImageUpdate?.(resolvedUrl);
      } else {
        message.warning('Uploaded but could not find file URL');
      }
    } catch (err: any) {
      console.error('Profile upload failed', err);
      message.error(err?.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    Modal.confirm({
      title: "Remove profile picture?",
      icon: <ExclamationCircleOutlined />,
      content: "This will remove your current profile picture and set it to the default avatar.",
      okText: "Remove",
      okType: "danger",
      onOk: async () => {
        try {
          await authService.updateDriverProfile({ profileImage: '' } as any);
          onProfileImageUpdate?.(null);
          message.success('Profile picture removed');
        } catch (err: any) {
          console.error('Failed to remove profile picture', err);
          message.error('Failed to remove profile picture');
        }
      },
    });
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadDriverFile(file);
      e.target.value = "";
      setOptionsVisible(false);
    }
  };

const openCamera = async () => {
  console.log("Requesting camera permission...");
  message.info("Requesting camera permission...");
  setOptionsVisible(false);
  setCameraModalVisible(true);
  setCameraLoading(true);
  try {
    const s = await navigator.mediaDevices.getUserMedia({ video: true });
    setStream(s);
    if (videoRef.current) {
      videoRef.current.srcObject = s;
      await videoRef.current.play().catch(() => {});
    }
    message.success("Camera access granted");
  } catch (err: any) {
    console.error("Camera access failed", err);
    // Better explanations for common errors
    if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
      message.error("Camera access blocked. Please allow camera permission in your browser.");
    } else if (err?.name === "NotFoundError") {
      message.error("No camera found on this device.");
    } else {
      message.error("Failed to access camera. See console for details.");
    }
    setCameraModalVisible(false);
  } finally {
    setCameraLoading(false);
  }
};

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraModalVisible(false);
  };

  const captureAndUpload = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) {
        message.error("Failed to capture image");
        return;
      }
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
      await uploadDriverFile(file);
      closeCamera();
    }, "image/jpeg", 0.92);
  };

  return (
    <>
      <div
        className={`
          fixed top-16 bottom-0 left-0 z-30 w-64 bg-white shadow-lg border-r border-gray-200
          md:w-64 md:ml-0
          h-[calc(100vh-4rem)]
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-0 h-full flex flex-col overflow-y-auto">
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
{/* 
              <Button
                type="primary"
                shape="circle"
                icon={<CameraOutlined style={{ fontSize: "14px" }} />}
                size="small"
                className="absolute bottom-0 right-0 shadow-lg hover:scale-110 transition-transform"
                style={{ width: "32px", height: "32px" }}
                onClick={() => setOptionsVisible(true)}
              /> */}
            </div>

            <div className="text-center w-full">
              <h3 className="font-bold text-base text-gray-800 truncate">{driverData.fullName}</h3>
              <p className="text-xs text-gray-500 mt-1">Driver Account</p>
            </div>
          </div>

          <div className="flex-1 overflow-hidden min-h-0 pt-4">
            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                onTabChange(key as DriverTabKey);
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

      {isOpen && windowWidth <= 768 && (
        <div
          className="fixed inset-0 bg-transparent z-20 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFilePicked} />

      <Modal
        title="Change Profile Picture"
        centered
        visible={optionsVisible}
        onCancel={() => setOptionsVisible(false)}
        footer={null}
      >
        <div className="flex flex-col gap-3">
          <Button block type="default" onClick={openCamera} icon={<CameraOutlined />}>
            Open Camera
          </Button>
          <Button block type="default" onClick={openFilePicker}>
            Upload from device
          </Button>
          <Button block danger type="default" onClick={handleRemovePicture}>
            Remove profile picture
          </Button>
        </div>
      </Modal>

      <Modal
        title="Camera"
        centered
        visible={cameraModalVisible}
        onCancel={closeCamera}
        footer={(
          <div className="flex items-center gap-2">
            <Button onClick={closeCamera}>Cancel</Button>
            <Button type="primary" onClick={captureAndUpload} loading={cameraLoading}>Capture</Button>
          </div>
        )}
      >
        {cameraLoading ? (
          <div className="flex items-center justify-center py-10"><Spin /></div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <video ref={videoRef} style={{ width: "100%", maxHeight: 360 }} autoPlay playsInline muted />
          </div>
        )}
      </Modal>
    </>
  );
};