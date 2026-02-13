"use client";

import { useEffect, useState, useRef } from "react";
import { Avatar, Button, Tabs, message, Modal, Spin } from "antd";
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
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import api from "../../../services/api";
import type { TabKey, UserData } from "./UserProfile";

interface SidebarProps {
  userData: UserData;
  activeTab: TabKey;
  handleTabChange: (key: TabKey) => void;
  handleLogout: () => void;
  sidebarOpen: boolean;
  windowWidth: number;
  onClose: () => void;
  onProfileUpdate?: (user: UserData) => void;
}

export const UserSidebar = ({
  userData,
  activeTab,
  handleTabChange,
  handleLogout,
  sidebarOpen,
  windowWidth,
  onClose,
  onProfileUpdate,
}: SidebarProps) => {
  const [localUser, setLocalUser] = useState<UserData>(userData);
  const [, setUploading] = useState(false);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLocalUser(userData);
  }, [userData]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

  const tabItems = [
    { key: "home", label: "Home", icon: <HomeOutlined /> },
    { key: "personal", label: "Personal Info", icon: <UserOutlined /> },
    { key: "bookings", label: "Bookings", icon: <CarOutlined /> },
    { key: "security", label: "Security", icon: <LockOutlined /> },
    { key: "privacy", label: "Privacy", icon: <EyeOutlined /> },
    { key: "data", label: "Data", icon: <DatabaseOutlined /> },
  ];

  const uploadFileToServer = async (file: File) => {
    const isImage = file.type?.startsWith("image/");
    if (!isImage) {
      message.error("You can only upload image files!");
      return;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must be smaller than 2MB!");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const resp = await api.post("/users/upload-document", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = resp?.data?.url || resp?.data?.user?.documents?.slice(-1)[0]?.url;
      if (url) {
        // Save to backend user update
        const currentUserRaw = localStorage.getItem("userData");
        const parsed = currentUserRaw ? JSON.parse(currentUserRaw) : {};
        await api.patch("/users/update", {
          fullName: parsed.fullName,
          email: parsed.email,
          phoneNumber: parsed.phoneNumber,
          profileImage: url,
        });

        const updatedUser = { ...parsed, profileImage: url };
        localStorage.setItem("userData", JSON.stringify(updatedUser));
        setLocalUser(updatedUser);
        onProfileUpdate?.(updatedUser);
        message.success("Profile picture uploaded and saved");
      } else {
        message.warning("Uploaded but could not find file URL");
      }
    } catch (err: any) {
      console.error("Profile upload failed", err);
      message.error(err?.response?.data?.message || "Upload failed");
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
          const currentUserRaw = localStorage.getItem("userData");
          const parsed = currentUserRaw ? JSON.parse(currentUserRaw) : {};
          await api.patch("/users/update", {
            fullName: parsed.fullName,
            email: parsed.email,
            phoneNumber: parsed.phoneNumber,
            profileImage: null,
          });
          const updatedUser = { ...parsed, profileImage: null };
          localStorage.setItem("userData", JSON.stringify(updatedUser));
          setLocalUser(updatedUser);
          onProfileUpdate?.(updatedUser);
          message.success("Profile picture removed");
        } catch (err: any) {
          console.error("Failed to remove profile picture", err);
          message.error("Failed to remove profile picture");
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
      await uploadFileToServer(file);
      e.target.value = "";
      setOptionsVisible(false);
    }
  };

  const openCamera = async () => {
    setOptionsVisible(false);
    setCameraModalVisible(true);
    setCameraLoading(true);
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported");
      }

      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      // Ensure video ref exists before assigning
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Play immediately
        videoRef.current.play().then(() => {
          setCameraLoading(false);
        }).catch((err) => {
          console.error("Play error:", err);
          setCameraLoading(false);
        });
      } else {
        setCameraLoading(false);
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraLoading(false);
      setCameraModalVisible(false);

      if (err?.name === "NotAllowedError") {
        message.error("Camera permission denied. Please allow camera access in your browser settings.");
      } else if (err?.name === "NotFoundError") {
        message.error("No camera found on this device.");
      } else if (err?.name === "NotReadableError") {
        message.error("Camera is already in use by another application.");
      } else if (err?.message === "Camera API not supported") {
        message.error("Your browser does not support camera access. Please use HTTPS and a modern browser.");
      } else {
        message.error(`Camera error: ${err?.message || "Unknown error"}`);
      }
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
      await uploadFileToServer(file);
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
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-0 h-full flex flex-col overflow-y-auto">
          {windowWidth <= 768 && sidebarOpen && (
            <div className="absolute top-4 right-4 z-50">
              <Button
                type="text"
                icon={<CloseOutlined style={{ fontSize: "20px" }} />}
                className="hover:bg-gray-100 transition-colors"
                onClick={() => { if (onClose) onClose(); }}
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
                className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center border-4 border-white"
                style={{
                  width: "85px",
                  height: "85px",
                  boxShadow: "0 4px 14px 0 rgba(0, 0, 0, 0.15)",
                }}
              >
                {localUser?.profileImage ? (
                  <img
                    src={localUser.profileImage}
                    alt="User avatar"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <Avatar
                    size={75}
                    icon={<UserOutlined />}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500"
                  />
                )}
              </div>


            </div>

            <div className="text-center w-full">
              <h3 className="font-bold text-base text-gray-800 truncate">{localUser?.fullName}</h3>
              <p className="text-xs text-gray-500 mt-1">User Account</p>
            </div>
          </div>

          <div className="flex-1 overflow-hidden min-h-0 pt-4">
            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                handleTabChange(key as TabKey);
                if (windowWidth <= 768) {
                  onClose();
                }
              }}
              tabPlacement={"left" as any}
              className="user-profile-tabs clean-sidebar-tabs"
              items={tabItems.map((tab) => ({
                key: tab.key,
                label: (
                  <span className="flex items-center gap-4 py-3 px-4 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
                    <span style={{ fontSize: "18px", display: "flex", alignItems: "center" }}>{tab.icon}</span>
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

      {sidebarOpen && windowWidth <= 768 && (
        <div
          className="fixed inset-0 bg-transparent z-20 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Hidden file input for upload from device */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFilePicked} />

      {/* Options Modal */}
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

      {/* Camera Modal */}
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