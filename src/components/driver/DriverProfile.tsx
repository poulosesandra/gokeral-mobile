"use client";

import { useEffect, useState } from "react";
import { Spin, message, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { MenuOutlined } from "@ant-design/icons";
import { UserHeader } from "../user/UserHeader";
import { DriverSidebar, type DriverTabKey } from "./driverprofile/DriverSidebar";
import { DriverHomeTab, type DriverData } from "../user/tabs/DriverHomeTab";
import { DriverPersonalInfoTab } from "../user/tabs/DriverPersonalInfoTab";
import { VehiclesTab } from "../user/tabs/VehiclesTab";

import { DriverBookingsTab } from "../user/tabs/DriverBookingsTab";
import { SecurityTab } from "../user/tabs/SecurityTab";
import { PrivacyTab } from "../user/tabs/PrivacyTab";
import { DataTab } from "../user/tabs/DataTab";
import DriverAddDetails from "./driverprofile/modal/driverAddDetails";
import AddVehicleModal from "./driverprofile/modal/driverAddVehicle";
import RideRequestModal from "./driverprofile/modal/RideRequestModal";
import { authService } from "../../services/authServices";

export const DriverProfile = () => {
  const [activeTab, setActiveTab] = useState<DriverTabKey>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const [loading, setLoading] = useState(true);
  const [personalInfoModalOpen, setPersonalInfoModalOpen] = useState(false);
  const [addVehicleModalOpen, setAddVehicleModalOpen] = useState(false);
  const [vehiclesRefreshSignal, setVehiclesRefreshSignal] = useState(0);
  const [driverData, setDriverData] = useState<DriverData>({
    fullName: "",
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
  const [vehicleToEdit, setVehicleToEdit] = useState<any | null>(null);

  // Ride request popup state (auto-open when a pending ride arrives)
  const [rideModalOpen, setRideModalOpen] = useState(false);
  const [pendingRide, setPendingRide] = useState<{
    bookingId: string;
    pickupLocation: string;
    phoneNumber?: string;
    estimatedFare: number;
    distance?: string;
  } | null>(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  // Poll backend for pending rides
  useEffect(() => {
    let mounted = true;
    let intervalId: number | undefined;

    const pollPending = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return;

        const res = await fetch("/api/rides/pending", {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        });

        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;

        if (Array.isArray(data) && data.length > 0) {
          const ride = data[0];
          setPendingRide({
            bookingId: ride.bookingId || ride._id || ride.id,
            pickupLocation: ride.pickupLocation || ride.pickupAddress || "",
            phoneNumber: ride.customerPhone || ride.phoneNumber || ride.customer?.phone,
            estimatedFare: ride.estimatedFare || ride.fare || 0,
            distance:
              ride.distanceText || (ride.distanceKm ? `${ride.distanceKm} km` : ride.distance) || "N/A",
          });
          setRideModalOpen(true);
        }
      } catch (err) {
        // silent fail; continue polling
      }
    };

    pollPending();
    intervalId = window.setInterval(pollPending, 8000);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const handleAcceptRide = async () => {
    if (!pendingRide) return;
    setAcceptLoading(true);
    try {
      const currentUser = authService.getCurrentUser();
      await fetch(`/api/rides/${pendingRide.bookingId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser?.token}`,
        },
      });
      message.success("Ride accepted");
      setRideModalOpen(false);
      setPendingRide(null);
    } catch (err) {
      message.error("Failed to accept ride");
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleRejectRide = async () => {
    if (!pendingRide) return;
    setRejectLoading(true);
    try {
      const currentUser = authService.getCurrentUser();
      await fetch(`/api/rides/${pendingRide.bookingId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser?.token}`,
        },
      });
      message.info("Ride rejected");
      setRideModalOpen(false);
      setPendingRide(null);
    } catch (err) {
      message.error("Failed to reject ride");
    } finally {
      setRejectLoading(false);
    }
  };

  const navigate = useNavigate();

  // LOAD DRIVER DATA - Backend first approach
  useEffect(() => {
    const loadDriverData = async () => {
      try {
        setLoading(true);
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
          navigate("/driver/login");
          return;
        }

        // Always fetch fresh data from backend
        try {
          const response = await authService.fetchDriverProfile();
          const backendData = response.driver || response;

          setDriverData({
            fullName: backendData.fullName || "",
            email: backendData.email || "",
            phoneNumber: backendData.phoneNumber || "",
            driverLicenseNumber: backendData.driverLicenseNumber || "",
            address: backendData.address || "",
            profileImage: backendData.profileImage || null,
            personalInfo: {
              bloodGroup: backendData.personalInfo?.bloodGroup || "",
              dob: backendData.personalInfo?.dob || "",
              languages: backendData.personalInfo?.languages || [],
              certificates: backendData.personalInfo?.certificates || [],
              emergencyContact: backendData.personalInfo?.emergencyContact || {
                name: "",
                phone: "",
                relationship: "",
              },
            },
          });
          setLoading(false);
        } catch (backendError: any) {
          console.error("Failed to fetch driver profile:", backendError);

          if (backendError.response?.status === 401) {
            authService.logout();
            message.error("Session expired. Please login again.");
            navigate("/driver/login");
          } else {
            message.error("Failed to load profile. Please try again.");
            navigate("/driver/login");
          }
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in loadDriverData:", error);
        setLoading(false);
      }
    };

    loadDriverData();
  }, [navigate]);

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setSidebarOpen(window.innerWidth > 768);
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

  const handleNavigateToPersonalInfo = () => {
    setActiveTab("personalInfo");
  };

  const handleAddVehicle = () => {
    setVehicleToEdit(null);
    setAddVehicleModalOpen(true);
  };

  const handleEditVehicle = (vehicle: any) => {
    setVehicleToEdit(vehicle);
    setAddVehicleModalOpen(true);
  };

  const handleVehicleAdded = () => {
    // bump signal to refresh vehicle list in VehiclesTab
    setVehiclesRefreshSignal((s) => s + 1);
  };

  const handleSavePersonalInfo = async (updatedData: {
    dateOfBirth?: string;
    bloodGroup?: string;
    address?: string;
    languages?: string[];
    certificates?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relation: string;
    };
  }) => {
    try {
      setLoading(true);

      const emergencyContact = updatedData.emergencyContact
        ? {
            name: updatedData.emergencyContact.name || "",
            phone: updatedData.emergencyContact.phone || "",
            relationship: updatedData.emergencyContact.relation || "",
          }
        : {
            name: "",
            phone: "",
            relationship: "",
          };

      // Call backend API to update driver profile
      await authService.updateDriverProfile({
        fullName: driverData.fullName,
        email: driverData.email,
        phoneNumber: driverData.phoneNumber,
        driverLicenseNumber: driverData.driverLicenseNumber,
        address: updatedData.address || driverData.address,
        personalInfo: {
          bloodGroup: updatedData.bloodGroup || driverData.personalInfo?.bloodGroup,
          dob: updatedData.dateOfBirth || driverData.personalInfo?.dob,
          languages: updatedData.languages || driverData.personalInfo?.languages || [],
          certificates:
            updatedData.certificates || driverData.personalInfo?.certificates || [],
          emergencyContact,
        },
      });

      // Fetch fresh data from backend
      const response = await authService.fetchDriverProfile();
      const freshData = response.driver || response;

      // Update component state with fresh backend data
      setDriverData({
        fullName: freshData.fullName || "",
        email: freshData.email || "",
        phoneNumber: freshData.phoneNumber || "",
        driverLicenseNumber: freshData.driverLicenseNumber || "",
        address: freshData.address || "",
        profileImage: freshData.profileImage || null,
        personalInfo: {
          bloodGroup: freshData.personalInfo?.bloodGroup || "",
          dob: freshData.personalInfo?.dob || "",
          languages: freshData.personalInfo?.languages || [],
          certificates: freshData.personalInfo?.certificates || [],
          emergencyContact: freshData.personalInfo?.emergencyContact || {
            name: "",
            phone: "",
            relationship: "",
          },
        },
      });

      setPersonalInfoModalOpen(false);
      setLoading(false);
      message.success("Personal information updated successfully");
    } catch (error) {
      setLoading(false);
      console.error("Error saving driver personal info:", error);
      message.error("Failed to update personal information");
    }
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
            onEditPersonalInfo={handleNavigateToPersonalInfo}
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
        return (
          <VehiclesTab
            onAddVehicle={handleAddVehicle}
            onEditVehicle={handleEditVehicle}
            refreshSignal={vehiclesRefreshSignal}
          />
        );
      case "bookings":
        return <DriverBookingsTab loading={loading} />;
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
            onEditPersonalInfo={handleNavigateToPersonalInfo}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-100">
      <UserHeader
        navigate={handleNavigate}
        handleLogout={handleLogout}
        username={driverData.fullName}
      />

      <div className="flex relative w-full pl-0 pr-4 pt-6">
        {/* Mobile menu button */}
        {windowWidth <= 768 && (
          <Button
            type="default"
            icon={<MenuOutlined />}
            className={`fixed top-20 left-4 z-30 bg-white shadow-md
              hover:bg-green-50 transition-all duration-300 ${
                sidebarOpen ? "rotate-90" : ""
              }`}
            onClick={toggleSidebar}
            size="middle"
          />
        )}

        {/* Sidebar */}
        <DriverSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          windowWidth={windowWidth}
          driverData={{
            fullName: driverData.fullName,
            email: driverData.email,
            profileImage: driverData.profileImage,
          }}
          onProfileImageUpdate={async (url: string) => {
            try {
              setLoading(true);

              // Call backend API to update profile image
              await authService.updateDriverProfile({
                fullName: driverData.fullName,
                email: driverData.email,
                phoneNumber: driverData.phoneNumber,
                driverLicenseNumber: driverData.driverLicenseNumber,
                address: driverData.address,
                profileImage: url,
              });

              // Fetch fresh data from backend
              const response = await authService.fetchDriverProfile();
              const freshData = response.driver || response;

              // Update component state with fresh backend data
              setDriverData((prev) => ({
                ...prev,
                profileImage: freshData.profileImage || url,
              }));

              setLoading(false);
              message.success("Profile image updated successfully");
            } catch (error) {
              setLoading(false);
              console.error("Error updating profile image:", error);
              message.error("Failed to update profile image");
            }
          }}
          handleLogout={handleLogout}
        />

        {/* Main Content */}
        <div className="flex-1 p-2 md:p-4 min-h-screen w-full transition-all duration-300 ease-in-out">
          <div className="w-full mx-auto bg-white rounded-xl shadow-sm p-4 md:p-6">

            {renderTabContent()}
          </div>

          {/* Footer */}
          <div className="mt-4 text-center text-gray-500 text-sm py-2">
            <p>&copy; {new Date().getFullYear()} Gokeral. All rights reserved.</p>
          </div>
        </div>
      </div>

      <RideRequestModal
        open={rideModalOpen}
        pickupLocation={pendingRide?.pickupLocation || ""}
        phoneNumber={pendingRide?.phoneNumber}
        fare={pendingRide?.estimatedFare || 0}
        distance={pendingRide?.distance || "N/A"}
        onAccept={handleAcceptRide}
        onReject={handleRejectRide}
        onCancel={() => { setRideModalOpen(false); setPendingRide(null); }}
        acceptLoading={acceptLoading}
        rejectLoading={rejectLoading}
      />

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
          certificates: driverData.personalInfo?.certificates || [],
          emergencyContact: driverData.personalInfo?.emergencyContact
            ? {
                name: driverData.personalInfo.emergencyContact.name || "",
                phone: driverData.personalInfo.emergencyContact.phone || "",
                relation: driverData.personalInfo.emergencyContact.relationship || "",
              }
            : undefined,
        }}
      />

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        open={addVehicleModalOpen}
        onClose={() => {
          setAddVehicleModalOpen(false);
          setVehicleToEdit(null);
        }}
        onSuccess={handleVehicleAdded}
        vehicleData={vehicleToEdit}
      />
    </div>
  );
};

export default DriverProfile;