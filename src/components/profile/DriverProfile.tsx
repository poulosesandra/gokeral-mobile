"use client";

import { useEffect, useState } from "react";
import { Spin, message, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { MenuOutlined } from "@ant-design/icons";
import { UserHeader } from "../UserHeader";
import { DriverSidebar, type DriverTabKey } from "../driverprofile/DriverSidebar";
import { DriverHomeTab, type DriverData } from "../tabs/DriverHomeTab";
import { DriverPersonalInfoTab } from "../tabs/DriverPersonalInfoTab";
import { VehiclesTab } from "../tabs/VehiclesTab";
import { BookingsTabUser } from "../tabs/BookingTab";
import { SecurityTab } from "../tabs/SecurityTab";
import { PrivacyTab } from "../tabs/PrivacyTab";
import { DataTab } from "../tabs/DataTab";
import DriverAddDetails from "../driverprofile/modal/driverAddDetails";
import { authService } from "../../services/authServices";

export const DriverProfile = () => {
  const [activeTab, setActiveTab] = useState<DriverTabKey>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [personalInfoModalOpen, setPersonalInfoModalOpen] = useState(false);
  const [driverData, setDriverData] = useState<DriverData>({
    name: "",
    email: "",
    phoneNumber: "",
    driverLicenseNumber: "",
    address: "",
    profileImage: null,
    personalInfo: {
      bloodGroup: "",
      dob: "",
      languages: [],
      certificates: [],
      emergencyContact: {
        name: "",
        phone: "",
        relationship: "",
      },
    },
  });

  const navigate = useNavigate();

  // LOAD DRIVER DATA FROM LOCALSTORAGE
  useEffect(() => {
    try {
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        navigate("/driver/login");
        return;
      }

      // Map the driver data from localStorage
      setDriverData({
        name: currentUser.fullName || "",
        email: currentUser.email || "",
        phoneNumber: currentUser.phoneNumber || "",
        driverLicenseNumber: currentUser.driverLicenseNumber || "",
        address: currentUser.address || "",
        profileImage: currentUser.profileImage || null,
        personalInfo: {
          bloodGroup: currentUser.personalInfo?.bloodGroup || "",
          dob: currentUser.personalInfo?.dob || "",
          languages: currentUser.personalInfo?.languages || [],
          certificates: currentUser.personalInfo?.certificates || [],
          emergencyContact: currentUser.personalInfo?.emergencyContact || {
            name: "",
            phone: "",
            relationship: "",
          },
        },
      });
    } catch (error) {
      console.error("Failed to load driver data:", error);
      message.error("Failed to load driver data");
      navigate("/driver/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    message.success("Logged out successfully");
    navigate("/driver/login");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleEditPersonalInfo = () => {
    setPersonalInfoModalOpen(true);
  };

  const handleAddVehicle = () => {
    // Navigate to add vehicle page
    navigate("/driver/add-vehicle");
  };

  const handleSavePersonalInfo = (updatedData: {
    dateOfBirth?: string;
    bloodGroup?: string;
    address?: string;
    languages?: string[];
    certifications?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relation: string;
    };
  }) => {
    // Update driver data with new personal info
    const emergencyContact = updatedData.emergencyContact ? {
      name: updatedData.emergencyContact.name || "",
      phone: updatedData.emergencyContact.phone || "",
      relationship: updatedData.emergencyContact.relation || "",
    } : {
      name: "",
      phone: "",
      relationship: "",
    };

    setDriverData((prev) => ({
      ...prev,
      address: updatedData.address || prev.address,
      personalInfo: {
        bloodGroup: updatedData.bloodGroup || prev.personalInfo?.bloodGroup || "",
        dob: updatedData.dateOfBirth || prev.personalInfo?.dob || "",
        languages: updatedData.languages || prev.personalInfo?.languages || [],
        certificates: updatedData.certifications || prev.personalInfo?.certificates || [],
        emergencyContact,
      },
    }));

    // Update localStorage
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        address: updatedData.address || currentUser.address,
        personalInfo: {
          bloodGroup: updatedData.bloodGroup || currentUser.personalInfo?.bloodGroup,
          dob: updatedData.dateOfBirth || currentUser.personalInfo?.dob,
          languages: updatedData.languages || currentUser.personalInfo?.languages,
          certificates: updatedData.certifications || currentUser.personalInfo?.certificates,
          emergencyContact,
        },
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }

    setPersonalInfoModalOpen(false);
    message.success("Personal information updated successfully");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <DriverHomeTab
            driverData={driverData}
            loading={loading}
            onEditPersonalInfo={handleEditPersonalInfo}
          />
        );
      case "personalInfo":
        return (
          <DriverPersonalInfoTab
            driverData={driverData}
            loading={loading}
            onEditPersonalInfo={handleEditPersonalInfo}
          />
        );
      case "vehicles":
        return <VehiclesTab onAddVehicle={handleAddVehicle} />;
      case "bookings":
        return <BookingsTabUser loading={loading} />;
      case "settings":
        return (
          <div className="space-y-6">
            <SecurityTab />
            <PrivacyTab />
            <DataTab />
          </div>
        );
      default:
        return (
          <DriverHomeTab
            driverData={driverData}
            loading={loading}
            onEditPersonalInfo={handleEditPersonalInfo}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-100">
      <UserHeader
        navigate={handleNavigate}
        handleLogout={handleLogout}
        username={driverData.name}
      />

      <div className="flex relative w-full">

        {/* Mobile menu button */}
        <Button
          type="default"
          icon={<MenuOutlined />}
          className="lg:hidden fixed top-20 left-4 z-30 bg-white shadow-md hover:bg-blue-50 transition-all duration-300"
          onClick={toggleSidebar}
          size="middle"
        />

        {/* Sidebar */}
        <DriverSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          driverData={{
            name: driverData.name,
            email: driverData.email,
            profileImage: driverData.profileImage,
          }}
        />

        {/* Main Content */}
        <div className="flex-1 p-4 md:p-6 lg:p-10 min-h-screen w-full transition-all duration-300 ease-in-out">
          <div className="w-full max-w-7xl mx-auto bg-white rounded-xl shadow-sm p-6 md:p-8 lg:p-10">
            {renderTabContent()}
          </div>
          
          {/* Footer */}
          <div className="mt-8 text-center text-gray-500 text-sm py-4">
            <p>&copy; {new Date().getFullYear()} Gokeral. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Personal Info Modal */}
      <DriverAddDetails
        open={personalInfoModalOpen}
        onCancel={() => setPersonalInfoModalOpen(false)}
        onSave={handleSavePersonalInfo}
        initialValues={{
          dateOfBirth: driverData.personalInfo?.dob || "",
          bloodGroup: driverData.personalInfo?.bloodGroup || "",
          address: driverData.address || "",
          languages: driverData.personalInfo?.languages || [],
          certifications: driverData.personalInfo?.certificates || [],
          emergencyContact: driverData.personalInfo?.emergencyContact ? {
            name: driverData.personalInfo.emergencyContact.name || "",
            phone: driverData.personalInfo.emergencyContact.phone || "",
            relation: driverData.personalInfo.emergencyContact.relationship || "",
          } : undefined,
        }}
      />
    </div>
  );
};

export default DriverProfile;
