"use client";

import { Card, Form, Input, Button, message } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { useState } from "react";
import type { UserData } from "../profile/UserProfile";

interface PersonalInfoTabProps {
  userData: UserData;
  loading: boolean;
}

export const PersonalInfoTab = ({ userData, loading }: PersonalInfoTabProps) => {
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);

  const handleSave = async (values: any) => {
    try {
      // TODO: Implement API call to update user data
      console.log("Saving personal info:", values);
      message.success("Personal information updated successfully");
      setEditing(false);
    } catch (error) {
      message.error("Failed to update personal information");
      console.error(error);
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
            name: userData.name,
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            address: userData.address,
          }}
          onFinish={handleSave}
        >
          <Form.Item
            label="Full Name"
            name="name"
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
              prefix={<EnvironmentOutlined />}
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
