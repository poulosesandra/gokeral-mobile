"use client";

import React, { useState } from "react";
import { Modal, Button, Descriptions, Typography, Space } from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

export type RideRequestProps = {
  open: boolean;
  pickupLocation: string;
  phoneNumber?: string;
  fare: number; // fare in rupees (or smallest unit used by the app)
  distance: string; // e.g. "4.3 km"
  onAccept: () => Promise<void> | void;
  onReject: () => Promise<void> | void;
  onCancel?: () => void;
  acceptLoading?: boolean;
  rejectLoading?: boolean;
};

export const RideRequestModal: React.FC<RideRequestProps> = ({
  open,
  pickupLocation,
  phoneNumber,
  fare,
  distance,
  onAccept,
  onReject,
  onCancel,
  acceptLoading = false,
  rejectLoading = false,
}) => {
  const [localAcceptLoading, setLocalAcceptLoading] = useState(false);
  const [localRejectLoading, setLocalRejectLoading] = useState(false);

  const handleAccept = async () => {
    try {
      setLocalAcceptLoading(true);
      await onAccept();
    } finally {
      setLocalAcceptLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setLocalRejectLoading(true);
      await onReject();
    } finally {
      setLocalRejectLoading(false);
    }
  };

  const fareFormatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(fare);

  return (
    <Modal
      open={open}
      title={<Title level={4} className="mb-0">New Ride Request</Title>}
      onCancel={onCancel}
      footer={null}
      centered
      className="ride-request-modal"
    >
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Pickup Location">
          <Text>{pickupLocation}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Customer Phone">
          {phoneNumber ? (
            <a href={`tel:${phoneNumber}`}>
              <Text>{phoneNumber}</Text>
            </a>
          ) : (
            <Text type="secondary">N/A</Text>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Estimated Fare">
          <Text strong>{fareFormatted}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Distance">
          <Text>{distance}</Text>
        </Descriptions.Item>
      </Descriptions>

      <div className="mt-6 text-right">
        <Space>
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={handleReject}
            loading={rejectLoading || localRejectLoading}
          >
            Reject
          </Button>

          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleAccept}
            loading={acceptLoading || localAcceptLoading}
          >
            Accept
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default RideRequestModal;
