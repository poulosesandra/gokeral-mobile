"use client";

import { Card, Form, Input, Button, message } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useState } from "react";
import type { UserData } from "../profile/UserProfile";

interface PersonalInfoTabProps {
  userData: UserData;
  loading: boolean;
  updateUserData?: (values: Partial<UserData>) => Promise<void>;  // ADD THIS
}

export const PersonalInfoTab = ({ userData, loading, updateUserData }: PersonalInfoTabProps) => {  // ADD updateUserData
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);

const handleSave = async (values: any) => {
  try {
    if (typeof updateUserData === 'function') {
      await updateUserData({
        fullName: values.fullName,  // CHANGE THIS
        email: values.email,
        phoneNumber: values.phoneNumber,
        address: values.address,
      });
    }

    message.success("Personal information updated successfully");
    setEditing(false);
  } catch (error) {
    message.error("Failed to update personal information");
    console.error('Full error:', error);
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('Backend error:', (error as any).response?.data);
    }
  }
};

  return (
    <div className="w-full">
      <Card className="shadow-md rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">Personal Information</h3>
          {!editing && (
            <Button type="primary" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            fullName: userData.fullName,
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            address: userData.address,
          }}
          onFinish={handleSave}
        >
          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[{ required: true, message: "Please enter your name" }]}
          >
            <Input
              prefix={<UserOutlined />}
              disabled={!editing}
              size="large"
              placeholder="Enter your full name"
            />
          </Form.Item>

          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              disabled={!editing}
              size="large"
              placeholder="Enter your email"
            />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phoneNumber"
            rules={[{ required: true, message: "Please enter your phone number" }]}
          >
            <Input
              prefix={<PhoneOutlined />}
              disabled={!editing}
              size="large"
              placeholder="Enter your phone number"
            />
          </Form.Item>

          <Form.Item label="Address" name="address">
            <Input.TextArea
              disabled={!editing}
              rows={3}
              placeholder="Enter your address"
            />
          </Form.Item>

          {editing && (
            <div className="flex gap-3">
              <Button type="primary" htmlType="submit" size="large">
                Save Changes
              </Button>
              <Button size="large" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          )}
        </Form>
      </Card>
    </div>
  );
};
