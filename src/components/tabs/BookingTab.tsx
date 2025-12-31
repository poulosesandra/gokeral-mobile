"use client";

import { Card, Empty } from "antd";

export type BookingStatus = "Completed" | "Upcoming" | "Cancelled";

interface BookingsTabProps {
  loading: boolean;
}

export const BookingsTabUser = ({ loading }: BookingsTabProps) => {
  return (
    <div className="w-full">
      <Card className="shadow-md rounded-2xl">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">My Bookings</h3>
        
        <Empty
          description="No bookings yet"
          className="py-12"
        />
      </Card>
    </div>
  );
};
