"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { Header } from "../Header"
import { UserSidebar } from "./UserSidebar";
import { HomeTab } from "../user/tabs/HomeTab";
import { PersonalInfoTab } from "../user/tabs/PersonalInfoTab";
import {  BookingsTabUser } from "../user/tabs/BookingTab";
import { SecurityTab } from "../user/tabs/SecurityTab";
import { PrivacyTab } from "../user/tabs/PrivacyTab";
import { DataTab } from "../user/tabs/DataTab";
import { Button, Spin } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import type { JSX } from "react/jsx-runtime";
import "../styles/UserProfile.css";
import { authService } from "../../services/authServices";
import type { UserTabKey } from "../user/tabs/HomeTab";

export type TabKey = UserTabKey | "vehicles";

export type UserData = {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  profileImage: string | null;
  location?: string | null;
};

export const UserProfile = () => {
  const [activeTab, setActiveTab] = useState<UserTabKey>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [, setFadeIn] = useState(false);

  const getUserDetails = useCallback(async () => {
    try {
      if (typeof window === "undefined") return;

      setLoading(true);
      
      // Get user data from localStorage (saved during login)
      const storedUserData = authService.getCurrentUser();
      
      if (storedUserData) {
        const userData: UserData = {
          fullName: storedUserData.fullName || storedUserData.name || 'User',
          email: storedUserData.email || '',
          phoneNumber: storedUserData.phoneNumber || '',
          address: storedUserData.address || '',
          profileImage: storedUserData.profileImage || null,
          location: storedUserData.address || null,
        };
        
        setUserData(userData);
        setLoading(false);
        setTimeout(() => setFadeIn(true), 100);
      } else {
        // If no user data, redirect to login
        console.error('No user data found');
        window.location.href = '/user/login';
      }
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

  const routerNavigate = useNavigate();
  const navigate = (path: string) => {
    routerNavigate(path);
  };

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/user/login";
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
    // TabKey includes site-wide tabs for drivers; coerce to UserTabKey for this component
    setActiveTab(key as UserTabKey);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const updateUserData = async (values: Partial<UserData>) => {
    try {
      setLoading(true);

      // Use central authService method (which calls backend /users/update)
      const payload: any = {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber,
      };
      if (values.address !== undefined) payload.address = values.address;
      if (values.profileImage !== undefined) payload.profileImage = values.profileImage;

      const res = await authService.updateUserProfile(payload);

      // refresh local user data from returned response (authService already sets current user)
      if (res) {
        const fresh = {
          fullName: res.fullName || res.name || 'User',
          email: res.email || '',
          phoneNumber: res.phoneNumber || '',
          address: res.address || '',
          profileImage: res.profileImage || null,
          location: res.address || null,
        };
        setUserData(fresh);
      } else {
        // fallback: re-fetch from local storage
        await getUserDetails();
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error updating user data:", error);
      throw error;
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
    vehicles: (
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold">Your Vehicles</h3>
            <p className="text-gray-500">Manage your registered vehicles</p>
          </div>
          <div>
            <button
              type="button"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              onClick={() => alert('Open Add Vehicle')}
            >
              + Add Vehicle
            </button>
          </div>
        </div>

        <div className="mt-12 text-center text-gray-500">No vehicles registered.</div>
      </div>
    ),
    security: <SecurityTab />,
    privacy: <PrivacyTab />,
    data: <DataTab />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100">
      <Header
        navigate={navigate}
        handleLogout={handleLogout}
        username={userData.fullName}
        onMenuToggle={toggleSidebar}
        showMenuIcon={windowWidth <= 768}
        profileImage={userData.profileImage}
        onBack={() => routerNavigate("/map")}
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