"use client";

import { Card, Skeleton, Button, Tag } from "antd";
import { EditOutlined, PhoneOutlined, IdcardOutlined, UserOutlined, HomeOutlined } from "@ant-design/icons";
import type { DriverData } from "./DriverHomeTab";

interface DriverPersonalInfoTabProps {
  driverData: DriverData;
  loading: boolean;
  onEditPersonalInfo: () => void;
}

export const DriverPersonalInfoTab = ({ driverData, loading, onEditPersonalInfo }: DriverPersonalInfoTabProps) => {
  return (
    <div className="w-full space-y-6">
      
      {/* HEADER WITH EDIT BUTTON */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Driver Personal Information</h2>
        <Button 
          type="primary"
          size="large"
          icon={<EditOutlined />}
          onClick={onEditPersonalInfo}
        >
          Edit Personal Info
        </Button>
      </div>

      {/* CONTACT INFORMATION */}
      <Card className="shadow-md rounded-2xl">
        <Skeleton loading={loading} active>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h3>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 py-3 border-b">
              <PhoneOutlined className="text-xl text-blue-600" />
              <div className="flex-1">
                <span className="text-gray-600 text-sm">Phone Number</span>
                <p className="font-medium text-gray-800">{driverData.phoneNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 py-3 border-b">
              <IdcardOutlined className="text-xl text-blue-600" />
              <div className="flex-1">
                <span className="text-gray-600 text-sm">Driver License Number</span>
                <p className="font-medium text-gray-800">{driverData.driverLicenseNumber}</p>
              </div>
            </div>
          </div>
        </Skeleton>
      </Card>

      {/* PERSONAL INFORMATION */}
      <Card className="shadow-md rounded-2xl">
        <Skeleton loading={loading} active>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="py-3 border-b">
              <span className="text-gray-600 text-sm">Date of Birth</span>
              <p className="font-medium text-gray-800">{driverData.personalInfo?.dob || "Not set"}</p>
            </div>

            <div className="py-3 border-b">
              <span className="text-gray-600 text-sm">Blood Group</span>
              <p className="font-medium text-gray-800">{driverData.personalInfo?.bloodGroup || "Not set"}</p>
            </div>

            <div className="py-3 border-b md:col-span-2">
              <span className="text-gray-600 text-sm flex items-center gap-2">
                <HomeOutlined />
                Address
              </span>
              <p className="font-medium text-gray-800 mt-1">{driverData.address || "Not set"}</p>
            </div>

            <div className="py-3 border-b md:col-span-2">
              <span className="text-gray-600 text-sm flex items-center gap-2">
                <UserOutlined />
                Emergency Contact
              </span>
              {driverData.personalInfo?.emergencyContact ? (
                <div className="mt-1">
                  <p className="font-medium text-gray-800">
                    {driverData.personalInfo.emergencyContact.name} 
                    ({driverData.personalInfo.emergencyContact.relationship})
                  </p>
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

      {/* LANGUAGES & CERTIFICATIONS */}
      <Card className="shadow-md rounded-2xl">
        <Skeleton loading={loading} active>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Languages & Certifications</h3>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Languages</h4>
              {driverData.personalInfo?.languages && driverData.personalInfo.languages.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {driverData.personalInfo.languages.map((lang, index) => (
                    <Tag key={index} color="blue" className="px-3 py-1 text-sm">
                      {lang}
                    </Tag>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No languages added</p>
              )}
            </div>

            <div className="pt-3 border-t">
              <h4 className="font-semibold text-gray-700 mb-3">Certifications</h4>
              {driverData.personalInfo?.certificates && driverData.personalInfo.certificates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {driverData.personalInfo.certificates.map((cert, index) => (
                    <Tag key={index} color="green" className="px-3 py-1 text-sm">
                      {cert}
                    </Tag>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No certifications added</p>
              )}
            </div>
          </div>
        </Skeleton>
      </Card>

    </div>
  );
};
