"use client";

import { Card, Skeleton, Button, Tag, Modal, message, Spin } from "antd";
import {
  EditOutlined,
  UserOutlined,
  MailOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  PhoneOutlined,
  CameraOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useEffect, useState, useRef } from "react";
import type { DriverData } from "./DriverHomeTab";
import api from "../../../services/api";

interface DriverPersonalInfoTabProps {
  driverData: DriverData;
  loading: boolean;
  onEditPersonalInfo: () => void;
  onProfileImageUpdate?: (url: string | null) => void;
}

const formatDob = (dob?: string) => {
  if (!dob) return "Not set";
  const raw = String(dob).trim();
  if (!raw) return "Not set";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

export const DriverPersonalInfoTab = ({ driverData, loading, onEditPersonalInfo, onProfileImageUpdate }: DriverPersonalInfoTabProps) => {
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [readableLocation, setReadableLocation] = useState<string | null>(null);
  // profile image controls
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const uploadDriverFile = async (file: File) => {
    const isImage = file.type.startsWith("image/");
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
      const resp = await api.post("/drivers/upload-document", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = resp?.data?.url || resp?.data?.driver?.documents?.slice(-1)[0]?.url;
      if (url) {
        const currentUserRaw = localStorage.getItem("userData");
        const parsed = currentUserRaw ? JSON.parse(currentUserRaw) : {};
        await api.patch("/drivers/update", {
          fullName: parsed.fullName,
          email: parsed.email,
          phoneNumber: parsed.phoneNumber,
          profileImage: url,
        });

        // notify parent to refresh profile (and update localStorage there)
        onProfileImageUpdate?.(url);
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
          await api.patch("/drivers/update", {
            fullName: parsed.fullName,
            email: parsed.email,
            phoneNumber: parsed.phoneNumber,
            profileImage: null,
          });
          onProfileImageUpdate?.(null);
          message.success("Profile picture removed");
        } catch (err: any) {
          console.error("Failed to remove profile picture", err);
          message.error("Failed to remove profile picture");
        }
      },
    });
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const onFilePicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadDriverFile(file);
      e.target.value = "";
      setOptionsVisible(false);
    }
  };

  const openCamera = async () => {
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

  useEffect(() => {
    let cancelled = false;
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!cancelled) setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("Geolocation not available:", err);
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchAddress = async (lat: number, lng: number) => {
      const googleKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      setReadableLocation(null);
      if (googleKey) {
        try {
          const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleKey}`;
          const res = await fetch(url);
          const data = await res.json();
          const address = data?.results?.[0]?.formatted_address;
          if (!cancelled) setReadableLocation(address || null);
          if (!cancelled && !address) {
            // fallback next
          } else return;
        } catch (err) {
          console.warn("Google reverse geocode failed:", err);
        }
      }
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
        const res = await fetch(nomUrl, { headers: { Accept: "application/json" } });
        const data = await res.json();
        const display = data?.display_name;
        if (!cancelled) setReadableLocation(display || null);
      } catch (err) {
        console.warn("Nominatim reverse geocode failed:", err);
        if (!cancelled) setReadableLocation(null);
      }
    };

    if (currentLocation) {
      fetchAddress(currentLocation.lat, currentLocation.lng);
    }

    return () => {
      cancelled = true;
    };
  }, [currentLocation]);

  const locationText = (() => {
    if (readableLocation) return readableLocation;
    if (readableLocation === null && currentLocation) return "Resolving address...";
    return driverData.address || "Not provided";
  })();

  return (
    <div className="w-full space-y-8">
      {/* Top area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg rounded-2xl lg:col-span-1 bg-white border-0">
          <Skeleton loading={loading} active avatar>
            <div className="flex flex-col items-center text-center space-y-4 py-6">
              <div className="relative">
                <div
                  className="rounded-full bg-gradient-to-r from-green-500 to-emerald-600 shadow-xl flex items-center justify-center flex-shrink-0 border-4 border-white"
                  style={{ width: "150px", height: "150px" }}
                >
                  {driverData.profileImage ? (
                    <img src={driverData.profileImage} className="w-full h-full rounded-full object-cover" alt="Driver" />
                  ) : (
                    <UserOutlined style={{ fontSize: 72 }} />
                  )}
                </div>

                {/* overlay camera button on personal-info DP */}
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CameraOutlined style={{ fontSize: 14 }} />}
                  size="small"
                  className="absolute bottom-0 right-0 shadow-lg hover:scale-110 transition-transform"
                  style={{ width: 36, height: 36 }}
                  onClick={() => setOptionsVisible(true)}
                  loading={uploading}
                  title="Change profile picture"
                />
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-black">{driverData.fullName || "Driver"}</h2>
                <p className="text-sm text-gray-600">Driver Account</p>
              </div>
            </div>
          </Skeleton>
        </Card>

        <Card className="shadow-lg rounded-2xl lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Bio & other details</h3>
            <Button type="primary" icon={<EditOutlined />} onClick={onEditPersonalInfo} className="bg-green-600 hover:bg-green-700 border-0" size="large">Edit Details</Button>
          </div>

          <Skeleton loading={loading} active>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Registered Email</p>
                <div className="flex items-center gap-3">
                  <MailOutlined className="text-xl text-green-600" />
                  <span className="text-gray-800 font-medium">{driverData.email || "Not provided"}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Telephone</p>
                <div className="flex items-center gap-3">
                  <PhoneOutlined className="text-xl text-green-600" />
                  <span className="text-gray-800 font-medium">{driverData.phoneNumber || "Not provided"}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Driving License</p>
                <div className="flex items-center gap-3">
                  <span className="text-gray-800 font-medium">{driverData.driverLicenseNumber || "Not provided"}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Location</p>
                <div className="flex items-center gap-3">
                  <EnvironmentOutlined className="text-xl text-green-600" />
                  <span className="text-gray-800 font-medium">{locationText}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Account Status</p>
                <div className="flex items-center gap-3">
                  <Tag color="success" className="text-sm font-medium">Active</Tag>
                </div>
              </div>
            </div>
          </Skeleton>
        </Card>
      </div>

      {/* Personal information */}
      <Card className="shadow-md rounded-2xl">
        <Skeleton loading={loading} active>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="py-3 border-b">
              <span className="text-gray-600 text-sm">Date of Birth</span>
              <p className="font-medium text-gray-800">{formatDob(driverData.personalInfo?.dob)}</p>
            </div>

            <div className="py-3 border-b">
              <span className="text-gray-600 text-sm">Blood Group</span>
              <p className="font-medium text-gray-800">{driverData.personalInfo?.bloodGroup || "Not set"}</p>
            </div>

            <div className="py-3 border-b md:col-span-2">
              <span className="text-gray-600 text-sm flex items-center gap-2"><HomeOutlined /> Address</span>
              <p className="font-medium text-gray-800 mt-1">{driverData.address || "Not set"}</p>
            </div>

            <div className="py-3 border-b md:col-span-2">
              <span className="text-gray-600 text-sm flex items-center gap-2"><UserOutlined /> Emergency Contact</span>
              {driverData.personalInfo?.emergencyContact ? (
                <div className="mt-1">
                  <p className="font-medium text-gray-800">{driverData.personalInfo.emergencyContact.name} ({driverData.personalInfo.emergencyContact.relationship})</p>
                  <p className="text-gray-600">{driverData.personalInfo.emergencyContact.phone}</p>
                </div>
              ) : (
                <p className="font-medium text-gray-800 mt-1">Not set</p>
              )}
            </div>

            <div className="py-3 md:col-span-2">
              <span className="text-gray-600 text-sm">Operating Area</span>
              <p className="font-medium text-gray-800">Not set</p>
            </div>
          </div>
        </Skeleton>
      </Card>

      {/* Languages & Certifications */}
      <Card className="shadow-md rounded-2xl mt-12">
        <Skeleton loading={loading} active>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Languages & Certifications</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Languages</h4>
              {driverData.personalInfo?.languages && driverData.personalInfo.languages.length > 0 ? (
                driverData.personalInfo.languages.map((lang, index) => (
                  <Tag key={index} color="blue" className="px-3 py-1 text-sm mr-2">{lang}</Tag>
                ))
              ) : (
                <p className="text-gray-500">No languages added</p>
              )}
            </div>

            <div className="pt-3 border-t">
              <h4 className="font-semibold text-gray-700 mb-3">Certifications</h4>
              {driverData.personalInfo?.certificates && driverData.personalInfo.certificates.length > 0 ? (
                driverData.personalInfo.certificates.map((cert, index) => (
                  <Tag key={index} color="green" className="px-3 py-1 text-sm mr-2">{cert}</Tag>
                ))
              ) : (
                <p className="text-gray-500">No certifications added</p>
              )}
            </div>
          </div>
        </Skeleton>
      </Card>

      {/* Hidden file input for upload */}
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
    </div>
  );
};