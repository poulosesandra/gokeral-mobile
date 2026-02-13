"use client";

import { Card, Skeleton, Button, Tag, Modal, message } from "antd";
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
  const [localDriverData, setLocalDriverData] = useState<DriverData>(driverData);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLocalDriverData(driverData);
  }, [driverData]);

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

        // Update local state immediately for instant display
        const updatedUser = { ...parsed, profileImage: url };
        localStorage.setItem("userData", JSON.stringify(updatedUser));
        setLocalDriverData({ ...localDriverData, profileImage: url });
        
        // Notify parent to refresh
        onProfileImageUpdate?.(url);
        
        message.success("Profile picture uploaded and saved");
        setOptionsVisible(false);
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
          
          // Update local state immediately for instant display
          const updatedUser = { ...parsed, profileImage: null };
          localStorage.setItem("userData", JSON.stringify(updatedUser));
          setLocalDriverData({ ...localDriverData, profileImage: null });
          
          // Notify parent to refresh
          onProfileImageUpdate?.(null);
          setOptionsVisible(false);
          
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
    }
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
    return localDriverData.address || "Not provided";
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
                  {localDriverData.profileImage ? (
                    <img src={localDriverData.profileImage} className="w-full h-full rounded-full object-cover" alt="Driver" />
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
                <h2 className="text-2xl font-bold text-black">{localDriverData.fullName || "Driver"}</h2>
                <p className="text-sm text-gray-600">Driver Account</p>
              </div>
            </div>
          </Skeleton>
        </Card>

        <Card className="shadow-lg rounded-2xl lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Bio & other details</h3>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={onEditPersonalInfo}
              className="bg-green-600 hover:bg-green-700 border-0 cursor-pointer"
              size="large"
            >
              Edit Details
            </Button>
          </div>

          <Skeleton loading={loading} active>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Registered Email</p>
                <div className="flex items-center gap-3">
                  <MailOutlined className="text-xl text-green-600" />
                  <span className="text-gray-800 font-medium">{localDriverData.email || "Not provided"}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Telephone</p>
                <div className="flex items-center gap-3">
                  <PhoneOutlined className="text-xl text-green-600" />
                  <span className="text-gray-800 font-medium">{localDriverData.phoneNumber || "Not provided"}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase mb-2">Driving License</p>
                <div className="flex items-center gap-3">
                  <span className="text-gray-800 font-medium">{localDriverData.driverLicenseNumber || "Not provided"}</span>
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
              <p className="font-medium text-gray-800">{formatDob(localDriverData.personalInfo?.dob)}</p>
            </div>

            <div className="py-3 border-b">
              <span className="text-gray-600 text-sm">Blood Group</span>
              <p className="font-medium text-gray-800">{localDriverData.personalInfo?.bloodGroup || "Not set"}</p>
            </div>

            <div className="py-3 border-b md:col-span-2">
              <span className="text-gray-600 text-sm flex items-center gap-2"><HomeOutlined /> Address</span>
              <p className="font-medium text-gray-800 mt-1">{localDriverData.address || "Not set"}</p>
            </div>

            <div className="py-3 border-b md:col-span-2">
              <span className="text-gray-600 text-sm flex items-center gap-2"><UserOutlined /> Emergency Contact</span>
              {localDriverData.personalInfo?.emergencyContact ? (
                <div className="mt-1">
                  <p className="font-medium text-gray-800">{localDriverData.personalInfo.emergencyContact.name} ({localDriverData.personalInfo.emergencyContact.relationship})</p>
                  <p className="text-gray-600">{localDriverData.personalInfo.emergencyContact.phone}</p>
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
              {localDriverData.personalInfo?.languages && localDriverData.personalInfo.languages.length > 0 ? (
                localDriverData.personalInfo.languages.map((lang, index) => (
                  <Tag key={index} color="blue" className="px-3 py-1 text-sm mr-2">{lang}</Tag>
                ))
              ) : (
                <p className="text-gray-500">No languages added</p>
              )}
            </div>

            <div className="pt-3 border-t">
              <h4 className="font-semibold text-gray-700 mb-3">Certifications</h4>
              {localDriverData.personalInfo?.certificates && localDriverData.personalInfo.certificates.length > 0 ? (
                localDriverData.personalInfo.certificates.map((cert, index) => (
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
        open={optionsVisible}
        onCancel={() => setOptionsVisible(false)}
        footer={null}
      >
        <div className="flex flex-col gap-3">
          <Button block type="primary" onClick={openFilePicker} className="bg-blue-600 hover:bg-blue-700 border-0">
            Choose Image
          </Button>
          <Button block danger type="primary" onClick={handleRemovePicture}>
            Remove picture
          </Button>
        </div>
      </Modal>
    </div>
  );
};