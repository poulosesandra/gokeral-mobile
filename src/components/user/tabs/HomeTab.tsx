"use client";

import { Avatar, Card, Skeleton, Button, Tag, Modal, message, Spin } from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  EditOutlined,
  CarOutlined,
  IdcardOutlined,
  CameraOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import type { UserData } from "../profile/UserProfile";
import { useEffect, useRef, useState } from "react";
import api from "../../../services/api";
import bookingService from "../../../services/bookingService";

// Define base TabKey type
export type UserTabKey = "home" | "personal" | "bookings" | "security" | "privacy" | "data";
export type DriverTabKey = UserTabKey | "vehicles";
export type TabKey = UserTabKey | DriverTabKey;

export type BookingStatus = "Completed" | "Upcoming" | "Cancelled";

interface HomeTabProps {
  userData: UserData;
  loading: boolean;
  handleTabChange: (key: TabKey) => void;
  onProfileImageUpdate?: () => void;
}

export const HomeTab = ({ userData, loading, handleTabChange, onProfileImageUpdate }: HomeTabProps) => {
  const [recentBookings, setRecentBookings] = useState<Array<{ id: string; vehicle: string; startDate: string; endDate: string; status: BookingStatus }>>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  const formatDate = (d?: string | Date | null) => (d ? new Date(d).toISOString().slice(0, 10) : "");

  const mapStatus = (status?: string): BookingStatus => {
    if (!status) return "Upcoming";
    const s = status.toUpperCase();
    if (s === "COMPLETED") return "Completed";
    if (s === "CANCELLED" || s === "REJECTED") return "Cancelled";
    return "Upcoming";
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setBookingsLoading(true);
        const data = await bookingService.getUserBookings();
        const bookingsArray = Array.isArray(data) ? data : data?.bookings || data?.items || [];
        const mapped = bookingsArray
          .slice()
          .sort((a: any, b: any) =>
            new Date(b.createdAt || b.startTime || 0).getTime() - new Date(a.createdAt || a.startTime || 0).getTime()
          )
          .slice(0, 3)
          .map((bk: any) => ({
            id: bk.bookingId || bk._id || bk.id,
            vehicle: `${bk?.vehicle?.details?.make || bk?.vehicle?.details?.vehicleModel || bk?.vehicle?.details?.vehicleModel || "Unknown Vehicle"}`.trim(),
            startDate: formatDate(bk.startTime || bk.userInfo?.scheduledDateTime || bk.createdAt),
            endDate: formatDate(bk.endTime || bk.createdAt),
            status: mapStatus(bk.status),
          }));
        if (mounted) setRecentBookings(mapped);
      } catch (err) {
        console.error("Failed to load bookings", err);
      } finally {
        if (mounted) setBookingsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userData?.email]);

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

  // --- Profile picture controls ---
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [stream]);

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
        onProfileImageUpdate?.();
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
          onProfileImageUpdate?.();
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

  // Camera helper removed from HomeTab (not used here)

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setCameraModalVisible(false);
    setCameraLoading(false);
  };

  const captureAndUpload = async () => {
    if (!videoRef.current) {
      message.error("Camera not ready");
      return;
    }
    
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      message.error("Failed to get canvas context");
      return;
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        message.error("Failed to capture image");
        return;
      }
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" });
      await uploadFileToServer(file);
      closeCamera();
    }, "image/jpeg", 0.95);
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

                {/* overlay camera button */}
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CameraOutlined style={{ fontSize: 14 }} />}
                  size="small"
                  loading={uploading}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 shadow-lg hover:scale-110 transition-transform"
                  style={{ width: 40, height: 40 }}
                  onClick={() => setOptionsVisible(true)}
                  title="Change profile picture"
                />
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
            {bookingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spin />
              </div>
            ) : recentBookings.length === 0 ? (
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

      {/* Hidden file input for upload from device */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFilePicked} />

      {/* Options Modal */}
      <Modal
        title="Change Profile Picture"
        centered
        open={optionsVisible}
        onCancel={() => setOptionsVisible(false)}
        footer={null}
      >
        <div className="flex flex-col gap-3">
          {/* <Button block type="default" onClick={openCamera} icon={<CameraOutlined />}>
            Open Camera
          </Button> */}
          <Button block type="default" onClick={openFilePicker}>
            Choose Image
          </Button>
          <Button block danger type="default" onClick={handleRemovePicture}>
            Remove picture
          </Button>
        </div>
      </Modal>

      {/* Camera Modal */}
      <Modal
        title="Camera"
        centered
        open={cameraModalVisible}
        onCancel={closeCamera}
        footer={
          <div className="flex items-center gap-2">
            <Button onClick={closeCamera}>Cancel</Button>
            <Button type="primary" onClick={captureAndUpload} loading={cameraLoading} disabled={cameraLoading}>
              Capture
            </Button>
          </div>
        }
      >
        {cameraLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spin tip="Starting camera..." />
          </div>
        ) : (
          <div style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "500px", backgroundColor: "#000" }}>
            <video 
              ref={videoRef} 
              style={{ 
                width: "100%", 
                height: "auto", 
                maxHeight: "500px", 
                backgroundColor: "#000",
                borderRadius: "4px"
              }} 
              autoPlay 
              playsInline 
              muted
            />
          </div>
        )}
      </Modal>
    </div>
  );
};