"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "../../Header";
import { UserSidebar } from "./UserSidebar";
import { HomeTab } from "../tabs/HomeTab";
import { PersonalInfoTab } from "../tabs/PersonalInfoTab";
import { BookingsTabUser } from "../tabs/BookingTab";
import { SecurityTab } from "../tabs/SecurityTab";
import { PrivacyTab } from "../tabs/PrivacyTab";
import { DataTab } from "../tabs/DataTab";
import { Button, Spin } from "antd";
import { useNavigate } from "react-router-dom"; // added
import type { JSX } from "react/jsx-runtime";
import "../../styles/UserProfile.css";
import { authService } from "../../../services/authServices";
import type { UserTabKey } from "../tabs/HomeTab";

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
      } catch (backendError: any) {
        console.error("Failed to fetch user profile:", backendError);

        // 401 = unauthorized, logout and redirect
        if (backendError.response?.status === 401) {
          console.log('🔴 [USER PROFILE] Unauthorized, logging out');
          authService.logout();
          window.location.href = "/user/login";
        } 
        // 404 = profile doesn't exist yet (new user)
        else if (backendError.response?.status === 404) {
          console.log('🟡 [USER PROFILE] No profile found, using account data');
          // Use basic account data from localStorage/authService
          const storedUser = localStorage.getItem('userData');
          const accountData = storedUser ? JSON.parse(storedUser) : {};
          
          const userData: UserData = {
            fullName: accountData.fullName || "User",
            email: accountData.email || "",
            phoneNumber: accountData.phoneNumber || "",
            address: "",
            profileImage: null,
            location: null,
          };
          
          setUserData(userData);
          setLoading(false);
        } 
        // Other errors - show error but don't redirect
        else {
          console.error('❌ [USER PROFILE] Unexpected error:', backendError);
          setLoading(false);
        }
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
      const payload: any = {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber,
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookingId = params.get('bookingId');
    if (params.get('tab') === 'bookings') setActiveTab('bookings');
    if (bookingId) {
      setActiveTab('bookings');
      try { window.dispatchEvent(new CustomEvent('open-booking', { detail: { bookingId } })); } catch {}
    }
  }, [location.search]);

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
    <div className="h-screen bg-gradient-to-b from-green-50 to-gray-100 overflow-hidden">
      <div className="fixed top-0 left-0 right-0 z-40">
        <Header
          navigate={navigate}
          handleLogout={handleLogout}
          username={userData.fullName}
          onMenuToggle={toggleSidebar}
          showMenuIcon={windowWidth <= 768}
          profileImage={userData.profileImage}
          onBack={() => routerNavigate("/map")}
        />
      </div>

      <div className="flex relative w-full pl-0 pr-4 pt-16 h-full">
        <UserSidebar
          userData={userData}
          activeTab={activeTab}
          handleTabChange={handleTabChange}
          handleLogout={handleLogout}
          sidebarOpen={sidebarOpen}
          windowWidth={windowWidth}
          onClose={() => setSidebarOpen(false)}
          onProfileUpdate={refreshUserProfile}
        />

        <div className="flex-1 p-2 md:p-4 md:pl-64 h-full w-full transition-all duration-300 ease-in-out overflow-y-auto">
          <div className="w-full mx-auto bg-white rounded-xl shadow-sm p-4 md:p-6">
            {loading ? <div className="flex justify-center items-center min-h-64"><Spin size="large" /></div> : tabContent[activeTab]}
          </div>

          <div className="mt-4 text-center text-gray-500 text-sm py-2">
            <p>&copy; {new Date().getFullYear()} Your Company. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};