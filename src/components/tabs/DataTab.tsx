"use client";

import { Card, Button, message } from "antd";
import { DeleteOutlined, DownloadOutlined } from "@ant-design/icons";

export const DataTab = () => {
  const handleDownloadData = () => {
    message.info("Downloading your data...");
    // TODO: Implement data download
  };

  const handleDeleteAccount = () => {
    message.warning("Account deletion requires confirmation");
    // TODO: Implement account deletion with confirmation modal
  };

  return (
    <div className="w-full">
      <Card className="shadow-md rounded-2xl">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Data Management</h3>

        <div className="space-y-6">
          <div className="p-4 border rounded-lg">
            <h4 className="font-semibold text-lg mb-2">Download Your Data</h4>
            <p className="text-gray-600 mb-4">
              Download a copy of all your personal data stored in our system.
            </p>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadData}
              type="default"
            >
              Download Data
            </Button>
          </div>

          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <h4 className="font-semibold text-lg mb-2 text-red-800">Delete Account</h4>
            <p className="text-gray-600 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
