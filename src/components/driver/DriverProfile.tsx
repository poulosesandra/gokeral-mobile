"use client";

import { useEffect, useState } from "react";
import { useDriverRideListener } from "../../hooks/useDriverRideListener";
import { Spin, message } from "antd";
import { useNavigate } from "react-router-dom";
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
  const [vehicleToEdit, setVehicleToEdit] = useState<{ id?: string; make?: string; model?: string; year?: number; licensePlate?: string; color?: string;[key: string]: any } | null>(null);

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

  const currentUserForHook = authService.getCurrentUser();
  const driverIdForHook = currentUserForHook?._id || currentUserForHook?.id || "";
  const { newRideRequest, acceptRide: hookAcceptRide, rejectRide: hookRejectRide } = useDriverRideListener(driverIdForHook, !!driverIdForHook);

  useEffect(() => {
    if (newRideRequest) {
      setPendingRide({
        bookingId: newRideRequest.bookingId || newRideRequest.rideId,
        pickupLocation: newRideRequest.pickupLocation || "",
        phoneNumber: undefined,
        estimatedFare: newRideRequest.estimatedFare || 0,
        distance:
          typeof newRideRequest.estimatedDistance === "number"
            ? `${newRideRequest.estimatedDistance} km`
            : newRideRequest.estimatedDistance || "N/A",
      });
      setRideModalOpen(true);
    }
  }, [newRideRequest]);

  const handleAcceptRide = async () => {
    if (!pendingRide) return;
    setAcceptLoading(true);
    try {
      if (hookAcceptRide) {
        await hookAcceptRide(pendingRide.bookingId);
      } else {
        const currentUser = authService.getCurrentUser();
        await fetch(`/api/rides/${pendingRide.bookingId}/accept`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentUser?.token}`,
          },
        });
      }

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
      if (hookRejectRide) {
        await hookRejectRide(pendingRide.bookingId);
      } else {
        const currentUser = authService.getCurrentUser();
        await fetch(`/api/rides/${pendingRide.bookingId}/reject`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentUser?.token}`,
          },
        });
      }

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

  useEffect(() => {
    const loadDriverData = async () => {
      try {
        setLoading(true);
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
          navigate("/driver/login");
          return;
        }

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
    setVehiclesRefreshSignal((s) => s + 1);
  };

  const handleSavePersonalInfo = async (data: {
    fullName?: string;
    email?: string;
    phoneNumber?: string;
    driverLicenseNumber?: string;
    dateOfBirth?: string;
    bloodGroup?: string;
    address?: string;
    languages?: string[];
    certificates?: string[];
    emergencyContact?: { name?: string; phone?: string; relation?: string };
  }) => {
    try {
      setLoading(true);
      const payload: any = {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        driverLicenseNumber: data.driverLicenseNumber,
        address: data.address,
        personalInfo: {
          dob: data.dateOfBirth,
          bloodGroup: data.bloodGroup,
          languages: data.languages || [],
          certificates: data.certificates || [],
          emergencyContact: data.emergencyContact ? {
            name: data.emergencyContact.name,
            phone: data.emergencyContact.phone,
            relationship: data.emergencyContact.relation,
          } : undefined,
        },
      };

      const updatedDriver = await authService.updateDriverProfile(payload);
      // updatedDriver is set in authService; sync local state from it
      if (updatedDriver) {
        setDriverData({
          fullName: updatedDriver.fullName || "",
          email: updatedDriver.email || "",
          phoneNumber: updatedDriver.phoneNumber || "",
          driverLicenseNumber: updatedDriver.driverLicenseNumber || "",
          address: updatedDriver.address || "",
          profileImage: updatedDriver.profileImage || null,
          personalInfo: {
            bloodGroup: updatedDriver.personalInfo?.bloodGroup || "",
            dob: updatedDriver.personalInfo?.dob || "",
            languages: updatedDriver.personalInfo?.languages || [],
            certificates: updatedDriver.personalInfo?.certificates || [],
            emergencyContact: updatedDriver.personalInfo?.emergencyContact || {
              name: "",
              phone: "",
              relationship: "",
            },
          },
        });
      }

      setPersonalInfoModalOpen(false);
      message.success("Details updated successfully");
    } catch (err) {
      console.error("Failed to update: ", err);
      message.error("Failed to update details");
    } finally {
      setLoading(false);
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
            onProfileImageUpdate={(url: string | null) => {
              // Update parent state IMMEDIATELY - this triggers re-render of sidebar
              setDriverData((prev) => ({
                ...prev,
                profileImage: url,
              }));
              message.success("Profile image updated");
            }}
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
        onMenuToggle={toggleSidebar}
        showMenuIcon={windowWidth <= 768}
        onProfileClick={() => setActiveTab("personalInfo")}
      />

      <div className="flex relative w-full">
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
          onProfileImageUpdate={(url: string | null) => {
            // Update parent state IMMEDIATELY - this triggers re-render of sidebar
            setDriverData((prev) => ({
              ...prev,
              profileImage: url,
            }));
            message.success("Profile image updated");
          }}
          handleLogout={handleLogout}
        />
        {/* Main Content */}
        <div className="flex-1 p-2 md:p-4 w-full transition-all duration-300 ease-in-out">
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

      <DriverAddDetails
        open={personalInfoModalOpen}
        onCancel={() => setPersonalInfoModalOpen(false)}
        onSave={handleSavePersonalInfo}
        initialValues={{
          fullName: driverData.fullName,
          email: driverData.email,
          phoneNumber: driverData.phoneNumber,
          driverLicenseNumber: driverData.driverLicenseNumber,
          dateOfBirth: driverData.personalInfo?.dob || "",
          bloodGroup: driverData.personalInfo?.bloodGroup || "",
          address: driverData.address || "",
          languages: driverData.personalInfo?.languages || [],
          certificates: driverData.personalInfo?.certificates || [],
          emergencyContact: driverData.personalInfo?.emergencyContact ? {
            name: driverData.personalInfo.emergencyContact.name || "",
            phone: driverData.personalInfo.emergencyContact.phone || "",
            relation: driverData.personalInfo.emergencyContact.relationship || "",
          } : undefined,
        }}
      />

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