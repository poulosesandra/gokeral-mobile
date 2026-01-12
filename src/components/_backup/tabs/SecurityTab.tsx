"use client";

import { Card, Form, Input, Button, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useState } from "react";

export const SecurityTab = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (values: any) => {
    try {
      setLoading(true);
      // TODO: Implement API call to change password
      console.log("Changing password:", values);
      message.success("Password changed successfully");
      form.resetFields();
    } catch (error) {
      message.error("Failed to change password");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Card className="shadow-md rounded-2xl">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Security Settings</h3>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleChangePassword}
          className="max-w-md"
        >
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[{ required: true, message: "Please enter your current password" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              size="large"
              placeholder="Enter current password"
            />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: "Please enter your new password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              size="large"
              placeholder="Enter new password"
            />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Please confirm your new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              size="large"
              placeholder="Confirm new password"
            />
          </Form.Item>

          <Button type="primary" htmlType="submit" size="large" loading={loading}>
            Change Password
          </Button>
        </Form>
      </Card>
    </div>
  );
};
