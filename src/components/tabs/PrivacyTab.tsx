"use client";

import { Card, Switch, List } from "antd";
import { useState } from "react";

export const PrivacyTab = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    locationSharing: true,
    dataSharing: false,
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const privacyItems = [
    {
      key: "emailNotifications",
      title: "Email Notifications",
      description: "Receive booking updates via email",
    },
    {
      key: "smsNotifications",
      title: "SMS Notifications",
      description: "Receive booking updates via SMS",
    },
    {
      key: "locationSharing",
      title: "Location Sharing",
      description: "Share your location with drivers",
    },
    {
      key: "dataSharing",
      title: "Data Sharing",
      description: "Share usage data for service improvement",
    },
  ];

  return (
    <div className="w-full">
      <Card className="shadow-md rounded-2xl">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">Privacy Preferences</h3>

        <List
          dataSource={privacyItems}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Switch
                  checked={settings[item.key as keyof typeof settings]}
                  onChange={() => handleToggle(item.key as keyof typeof settings)}
                />,
              ]}
            >
              <List.Item.Meta
                title={item.title}
                description={item.description}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};
