"use client";

import React from "react";
import { useState, useEffect, useCallback } from "react";
import { UserSidebar } from "./UserSidebar";
import { Button, Spin } from "antd";
import { useNavigate } from "react-router-dom"; // added
import type { JSX } from "react/jsx-runtime";
import "../../styles/UserProfile.css";

/**
 * NOTE: Some components/services referenced by imports were not found by the compiler.
 * Lightweight local stubs are provided below so this file compiles; replace them
 * with real implementations when the modules are available in the project.
 */

/* basic tab key types (matches expected usage in the file) */
type UserTabKey = "home" | "personal" | "bookings" | "security" | "privacy" | "data";
export type TabKey = UserTabKey | "vehicles";

/* Minimal Header and Tab stubs (replace with real components when available) */
const Header: React.FC<{
  navigate: (p: string) => void;
  handleLogout: () => void;
  username: string;
  onMenuToggle: () => void;
  showMenuIcon: boolean;
  profileImage: string | null;
  onBack: () => void;
}> = () => <header />;

const HomeTab: React.FC<{
  userData: UserData;
  loading: boolean;
  handleTabChange: (k: TabKey) => void;
  onProfileImageUpdate: () => Promise<void>;
}> = () => <div />;

const PersonalInfoTab: React.FC<{
  userData: UserData;
  loading: boolean;
  updateUserData: (v: Partial<UserData>) => Promise<void>;
}> = () => <div />;

const BookingsTabUser: React.FC<{ loading: boolean }> = () => <div />;
const SecurityTab: React.FC = () => <div />;
const PrivacyTab: React.FC = () => <div />;
const DataTab: React.FC = () => <div />;

/* Typed payload for profile updates */
type UpdateUserPayload = {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  profileImage?: string | null;
};

/* Minimal authService stub (replace with real implementation when available) */
const authService = {
  fetchUserProfile: async () => ({} as any),
  updateUserProfile: async (_payload: UpdateUserPayload) => ({} as any),
  logout: () => {},
};


export type UserData = {
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  profileImage: string | null;
  location?: string | null;
};

export const UserProfile = () => {
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
      if (typeof window === "undefined") return;

      setLoading(true);

      // Always fetch fresh data from backend
      try {
        const response = await authService.fetchUserProfile();
        const backendData = response.user || response;

        const userData: UserData = {
          fullName: backendData.fullName || backendData.name || "User",
          email: backendData.email || "",
          phoneNumber: backendData.phoneNumber || "",
          address: backendData.address || "",
          profileImage: backendData.profileImage || null,
          location: backendData.address || null,
        };

        setUserData(userData);
        setLoading(false);
        setTimeout(() => setFadeIn(true), 100);
      } catch (backendError: unknown) {
        console.error("Failed to fetch user profile:", backendError);

        const status = (backendError as any)?.response?.status;

        if (status === 401) {
          authService.logout();
          window.location.href = "/user/login";
        } else {
          console.error("Error fetching user data:", backendError);
          window.location.href = "/user/login";
        }

        setLoading(false);
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

  const routerNavigate = useNavigate(); // added
  const navigate = (path: string) => routerNavigate(path);

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
    if (key === "vehicles") {
      setActiveTab("home");
    } else {
      setActiveTab(key as UserTabKey);
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const updateUserData = async (values: Partial<UserData>) => {
    try {
      setLoading(true);
      const payload: UpdateUserPayload = {
        ...(values.fullName !== undefined ? { fullName: values.fullName } : {}),
        ...(values.email !== undefined ? { email: values.email } : {}),
        ...(values.phoneNumber !== undefined ? { phoneNumber: values.phoneNumber } : {}),
      };
      if (values.address !== undefined) payload.address = values.address;
      if (values.profileImage !== undefined) payload.profileImage = values.profileImage;

      const res = await authService.updateUserProfile(payload);

      if (res) {
        const fresh = {
          fullName: res.fullName || res.name || "User",
          email: res.email || "",
          phoneNumber: res.phoneNumber || "",
          address: res.address || "",
          profileImage: res.profileImage || null,
          location: res.address || null,
        };
        setUserData(fresh);
      } else {
        await getUserDetails();
      }

      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error updating user data:", error);
      throw error;
    }
  };

  const refreshUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authService.fetchUserProfile();
      const backendData = response.user || response;

      const userData: UserData = {
        fullName: backendData.fullName || backendData.name || "User",
        email: backendData.email || "",
        phoneNumber: backendData.phoneNumber || "",
        address: backendData.address || "",
        profileImage: backendData.profileImage || null,
        location: backendData.address || null,
      };

      setUserData(userData);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error refreshing user data:", error);
    }
  }, []);

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
    home: <HomeTab userData={userData} loading={loading} handleTabChange={handleTabChange} onProfileImageUpdate={refreshUserProfile} />,
    personal: <PersonalInfoTab userData={userData} loading={loading} updateUserData={updateUserData} />,
    bookings: <BookingsTabUser loading={loading} />,
    vehicles: (
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold">Your Vehicles</h3>
            <p className="text-gray-500">Manage your registered vehicles</p>
          </div>
          <div>
            <button type="button" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700" onClick={() => alert("Open Add Vehicle")}>
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
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-100">
      <Header
        navigate={navigate}
        handleLogout={handleLogout}
        username={userData.fullName}
        onMenuToggle={toggleSidebar}
        showMenuIcon={windowWidth <= 768}
        profileImage={userData.profileImage}
        onBack={() => routerNavigate("/map")}
      />

      <div className="flex relative w-full pl-0 pr-4 pt-6">
        <UserSidebar userData={userData} activeTab={activeTab} handleTabChange={handleTabChange} handleLogout={handleLogout} sidebarOpen={sidebarOpen} windowWidth={windowWidth} toggleSidebar={toggleSidebar} onClose={() => setSidebarOpen(false)} onProfileUpdate={refreshUserProfile} />

        {/* <-- key change: remove w-full and add min-w-0 so flex child can shrink and avoid right-side clipping */}
        <div className="flex-1 min-w-0 p-2 md:pl-4 min-h-screen transition-all duration-300 ease-in-out">
          <div className="w-full mx-auto bg-white rounded-xl shadow-sm p-4 md:p-6">{loading ? <div className="flex justify-center items-center min-h-64"><Spin size="large" /></div> : tabContent[activeTab]}</div>

          <div className="mt-4 text-center text-gray-500 text-sm py-2">
            <p>&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};