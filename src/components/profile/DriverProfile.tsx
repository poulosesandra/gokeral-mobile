"use client";

import { useState, useEffect, useCallback } from "react";
import { UserHeader } from "../UserHeader"
import { UserSidebar } from "./UserSidebar";
import { HomeTab } from "../tabs/HomeTab";
import { PersonalInfoTab } from "../tabs/PersonalInfoTab";
import {  BookingsTabUser } from "../tabs/BookingTab";
import { SecurityTab } from "../tabs/SecurityTab";
import { PrivacyTab } from "../tabs/PrivacyTab";
import { DataTab } from "../tabs/DataTab";
import { Button, Spin } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import type { JSX } from "react/jsx-runtime";
import "../styles/UserProfile.css";
import axios from "axios";

export type TabKey =
  | "home"
  | "personal"
  | "bookings"
  | "security"
  | "privacy"
  | "data"
  | "vehicles";

export type UserData = {
  name: string;
  email: string;
  phoneNumber: string;
  address: string;
  profileImage: string | null;
  location?: string | null;
};

export const DriverProfile = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [, setFadeIn] = useState(false);

  const getUserDetails = useCallback(async () => {
    try {
      if (typeof window === "undefined") return; // client-only

      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const stored = localStorage.getItem("userData");
      const userEmail = stored ? JSON.parse(stored).email : localStorage.getItem("userEmail");

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/userDetails`, {
        headers: {
          "Content-Type": "application/json",
          "x-auth-token": token,
        },
        params: {
          id: userEmail,
        },
      });

      setUserData(response.data.userData);
      setLoading(false);
      // Trigger fade-in animation after data loads
      setTimeout(() => setFadeIn(true), 100);
    } catch (error) {
      setLoading(false);
      console.error("Error fetching user data:", error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    (async () => {
      await getUserDetails();
    })();
  }, [getUserDetails]);

  const navigate = (path: string) => {
    console.log(`Navigating to: ${path}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("userType");
    localStorage.removeItem("accessToken");
    window.location.href = "/login";
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setWindowWidth(window.innerWidth);
        setSidebarOpen(window.innerWidth > 768);
      };

      window.addEventListener("resize", handleResize);
      handleResize();

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  const handleTabChange = (key: TabKey) => {
    setFadeIn(false);
    setTimeout(() => {
      setActiveTab(key);
      if (windowWidth <= 768) setSidebarOpen(false);
      setTimeout(() => setFadeIn(true), 100);
    }, 200);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const updateUserData = async (values: Partial<UserData>) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const stored = localStorage.getItem("userData");
      const userEmail = stored ? JSON.parse(stored).email : localStorage.getItem("userEmail");

      await axios.put(
        `${import.meta.env.VITE_API_URL}/userDetails`,
        { ...values },
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "x-auth-token": token,
          },
          params: {
            id: userEmail,
          },
        }
      );

      getUserDetails();
      setUserData((prev) => prev ? { ...prev, ...values } : null);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error updating user data:", error);
    }
  };

  if (loading && !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Unable to load profile</h2>
          <p className="text-gray-600 mb-4">We couldn't retrieve your profile information. Please try again later.</p>
          <Button type="primary" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  const tabContent: Record<TabKey, JSX.Element> = {
    home: (
      <HomeTab
        userData={userData}
        loading={loading}
        handleTabChange={handleTabChange}
      />
    ),
    personal: (
      <PersonalInfoTab
        userData={userData}
        loading={loading}
        updateUserData={updateUserData}
      />
    ),
    bookings: <BookingsTabUser loading={loading} />,
    security: <SecurityTab loading={loading} />,
    privacy: <PrivacyTab loading={loading} />,
    data: <DataTab loading={loading} />,
    vehicles: <div>Vehicles</div>,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100">
      <UserHeader
        navigate={navigate}
        handleLogout={handleLogout}
        username={userData.name}
      />

      <div className="flex relative w-full pl-0 pr-10">

        {/* Mobile menu button with animation */}
        <Button
          type="default"
          icon={<MenuOutlined />}
          className={`md:hidden fixed top-20 left-4 z-30 bg-white shadow-md
            hover:bg-blue-50 transition-all duration-300 ${sidebarOpen ? 'rotate-90' : ''}`}
          onClick={toggleSidebar}
          size="middle"
        />

        {/* Sidebar with animation */}
        <UserSidebar
          userData={userData}
          activeTab={activeTab}
          handleTabChange={handleTabChange}
          handleLogout={handleLogout}
          sidebarOpen={sidebarOpen}
          windowWidth={windowWidth}
          toggleSidebar={toggleSidebar}
        />

        {/* Main Content with transition effects */}
        <div className="flex-1 p-4 md:p-6 pt-0 md:pt-0 min-h-screen w-full transition-all duration-300 ease-in-out">

          <div className="w-full mx-auto bg-white rounded-xl shadow-sm p-10">

            {loading ? (
              <div className="flex justify-center items-center min-h-64">
                <Spin size="large" />
              </div>
            ) : (
              tabContent[activeTab]
            )}
          </div>
          
          {/* Footer */}
          <div className="mt-8 text-center text-gray-500 text-sm py-4">
            <p>&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverProfile;
