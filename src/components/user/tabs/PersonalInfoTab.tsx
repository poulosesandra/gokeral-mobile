"use client";

import { Card, Skeleton, Button, Form, Input, message } from "antd";
import { EditOutlined, UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import type { UserData } from "../profile/UserProfile";

interface PersonalInfoTabProps {
  userData: UserData;
  loading: boolean;
  updateUserData?: (values: Partial<UserData>) => Promise<void>;
}

export const PersonalInfoTab = ({ userData, loading, updateUserData }: PersonalInfoTabProps) => {
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (editing && userData) {
      form.setFieldsValue({
        fullName: userData.fullName,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
      });
    }
  }, [editing, userData, form]);

  const handleSave = async (values: any) => {
    try {
      if (typeof updateUserData === 'function') {
        // Only send editable fields (backend cannot update name/email/phone)
        await updateUserData({
          address: values.address,
          // fullName, email, phoneNumber are NOT sent (backend ignores them)
        });
      }
      message.success("Address updated successfully");
      setEditing(false);
    } catch (error) {
      message.error("Failed to update information");
      console.error('Full error:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        console.error('Backend error:', (error as any).response?.data);
      }
    }
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
        <Button
          type="primary"
          size="large"
          icon={<EditOutlined />}
          onClick={() => setEditing((s) => !s)}
        >
          {editing ? "Close" : "Edit"}
        </Button>
      </div>

      {/* PROFILE IMAGE */}
      {userData?.profileImage && (
        <div className="flex items-center mb-4">
          <img src={userData.profileImage} alt="Profile" className="w-24 h-24 rounded-full mr-4 shadow-md" />
        </div>
      )}

      {/* DISPLAY MODE: driver-style cards */}
      {!editing && (
        <>
          <Card className="shadow-md rounded-2xl">
            <Skeleton loading={loading} active>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Contact Information</h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3 py-3 border-b">
                  <PhoneOutlined className="text-xl text-green-600" />
                  <div className="flex-1">
                    <span className="text-gray-600 text-sm">Phone Number</span>
                    <p className="font-medium text-gray-800">{userData?.phoneNumber || "Not set"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-3">
                  <MailOutlined className="text-xl text-green-600" />
                  <div className="flex-1">
                    <span className="text-gray-600 text-sm">Email Address</span>
                    <p className="font-medium text-gray-800">{userData?.email || "Not set"}</p>
                  </div>
                </div>
              </div>
            </Skeleton>
          </Card>

          <Card className="shadow-md rounded-2xl">
            <Skeleton loading={loading} active>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="py-3 border-b">
                  <span className="text-gray-600 text-sm">Full Name</span>
                  <p className="font-medium text-gray-800">{userData?.fullName || "Not set"}</p>
                </div>

                <div className="py-3 md:col-span-2">
                  <span className="text-gray-600 text-sm flex items-center gap-2">
                    <HomeOutlined /> Address
                  </span>
                  <p className="font-medium text-gray-800 mt-1">{userData?.address || "Not set"}</p>
                </div>
              </div>
            </Skeleton>
          </Card>
        </>
      )}

      {/* EDIT MODE: form */}
      {editing && (
        <Card className="shadow-md rounded-2xl">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              ℹ️ <strong>Note:</strong> Name, email, and phone number cannot be changed. Contact support if you need to update these details.
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            initialValues={{
              fullName: userData?.fullName,
              email: userData?.email,
              phoneNumber: userData?.phoneNumber,
              address: userData?.address,
            }}
            onFinish={handleSave}
          >
            <Form.Item
              label="Full Name (Read-only)"
              name="fullName"
            >
              <Input 
                prefix={<UserOutlined />} 
                size="large" 
                disabled 
                className="bg-gray-100"
              />
            </Form.Item>

            <Form.Item
              label="Email Address (Read-only)"
              name="email"
            >
              <Input 
                prefix={<MailOutlined />} 
                size="large" 
                disabled 
                className="bg-gray-100"
              />
            </Form.Item>

            <Form.Item
              label="Phone Number (Read-only)"
              name="phoneNumber"
            >
              <Input 
                prefix={<PhoneOutlined />} 
                size="large" 
                disabled 
                className="bg-gray-100"
              />
            </Form.Item>

            <Form.Item label="Address" name="address">
              <Input.TextArea rows={3} placeholder="Enter your address" />
            </Form.Item>

            <div className="flex gap-3">
              <Button type="primary" htmlType="submit" size="large">Save Changes</Button>
              <Button size="large" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </Form>
        </Card>
      )}
    </div>
  );
};
