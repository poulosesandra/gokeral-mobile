"use client";

import { Avatar, Card, Skeleton, Button, Tag } from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  EditOutlined,
  CarOutlined,
} from "@ant-design/icons";

export type DriverData = {
  name: string;
  email: string;
  phoneNumber: string;
  driverLicenseNumber: string;
  address?: string;
  profileImage: string | null;
  personalInfo?: {
    bloodGroup?: string;
    dob?: string;
    languages?: string[];
    certificates?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
};

export type BookingStatus = "Completed" | "Upcoming" | "Cancelled";

interface DriverHomeTabProps {
  driverData: DriverData;
  loading: boolean;
  onEditPersonalInfo: () => void;
}

export const DriverHomeTab = ({ driverData, loading, onEditPersonalInfo }: DriverHomeTabProps) => {
  return (
    <div className="w-full space-y-6">

      {/* DRIVER PROFILE HEADER */}
      <Card className="shadow-md rounded-2xl">
        <Skeleton loading={loading} active avatar>
          <div className="flex items-center gap-6">
            {/* PROFILE PIC */}
            <div
              className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg flex items-center justify-center flex-shrink-0"
              style={{ width: "120px", height: "120px" }}
            >
              {driverData.profileImage ? (
                <img
                  src={driverData.profileImage}
                  className="w-full h-full rounded-full object-cover"
                  alt="Profile"
                />
              ) : (
                <Avatar size={100} icon={<UserOutlined />} className="bg-transparent" />
              )}
            </div>

            {/* DRIVER INFO */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-800">{driverData.name}</h2>
              <p className="text-sm text-gray-500">Driver Account</p>
              
              <div className="flex items-center gap-2 text-gray-600">
                <MailOutlined className="text-lg" />
                <span>{driverData.email}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <PhoneOutlined className="text-lg" />
                <span>{driverData.phoneNumber}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-600">
                <IdcardOutlined className="text-lg" />
                <span>{driverData.driverLicenseNumber}</span>
              </div>
            </div>
          </div>
        </Skeleton>
      </Card>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PERSONAL INFORMATION */}
        <Card className="shadow-md rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">Personal Information</h3>
            <Button 
              type="primary"
              icon={<EditOutlined />}
              onClick={onEditPersonalInfo}
            >
              Edit Personal Info
            </Button>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Date of Birth:</span>
              <span className="font-medium">{driverData.personalInfo?.dob || "Not set"}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Blood Group:</span>
              <span className="font-medium">{driverData.personalInfo?.bloodGroup || "Not set"}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Address:</span>
              <span className="font-medium">{driverData.address || "Not set"}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Emergency Contact:</span>
              <span className="font-medium">
                {driverData.personalInfo?.emergencyContact?.name || "Not set"}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Operating Area:</span>
              <span className="font-medium">Not set</span>
            </div>
          </div>
        </Card>

        {/* LANGUAGES & CERTIFICATIONS */}
        <Card className="shadow-md rounded-2xl">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Languages & Certifications</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Languages:</h4>
              {driverData.personalInfo?.languages && driverData.personalInfo.languages.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {driverData.personalInfo.languages.map((lang, index) => (
                    <Tag key={index} color="blue">{lang}</Tag>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Not set</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Certifications:</h4>
              {driverData.personalInfo?.certificates && driverData.personalInfo.certificates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {driverData.personalInfo.certificates.map((cert, index) => (
                    <Tag key={index} color="green">{cert}</Tag>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Not set</p>
              )}
            </div>
          </div>
        </Card>

      </div>

    </div>
  );
};
