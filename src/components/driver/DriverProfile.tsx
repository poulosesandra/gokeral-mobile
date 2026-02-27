"use client";

import { useEffect, useState } from "react";
import { useDriverRideListener } from "../../hooks/useDriverRideListener";
import { message } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { Header } from "../Header";
import { DriverSidebar, type DriverTabKey } from "./driverprofile/DriverSidebar";
import { DriverHomeTab } from "../user/tabs/DriverHomeTab";
import { DriverPersonalInfoTab } from "../user/tabs/DriverPersonalInfoTab";
import { VehiclesTab } from "../user/tabs/VehiclesTab";
import { DriverBookingsTab } from "../user/tabs/DriverBookingsTab";
import { SecurityTab } from "../user/tabs/SecurityTab";
import { PrivacyTab } from "../user/tabs/PrivacyTab";
import { DataTab } from "../user/tabs/DataTab";
import DriverAddDetails, { type DriverPersonalInfoValues } from "./driverprofile/modal/driverAddDetails";
import AddVehicleModal from "./driverprofile/modal/driverAddVehicle";
import RideRequestModal from "./driverprofile/modal/RideRequestModal";
import { authService } from "../../services/authServices";

export type DriverData = {
  fullName: string;
  email: string;
  phoneNumber: string;
  driverLicenseNumber: string;
  profileImage: string | null;
  personalInfo?: {
    bloodGroup?: string;
    dob?: string;
    languages?: string[];
    licensedSince?: string;
    experienceYears?: number;
  };
};

export const DriverProfile = () => {
  const [activeTab, setActiveTab] = useState<DriverTabKey>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );
  const [loading, setLoading] = useState(true);
  const [personalInfoModalOpen, setPersonalInfoModalOpen] = useState(false);
  const [personalInfoSaving, setPersonalInfoSaving] = useState(false);
  const [addVehicleModalOpen, setAddVehicleModalOpen] = useState(false);
  const [vehiclesRefreshSignal, setVehiclesRefreshSignal] = useState(0);
  const [driverData, setDriverData] = useState<DriverData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    driverLicenseNumber: "",
    profileImage: null,
    personalInfo: {
      bloodGroup: "",
      dob: "",
      languages: [],
      licensedSince: "",
      experienceYears: 0,
    },
  });
  const [vehicleToEdit, setVehicleToEdit] = useState<{ id?: string; make?: string; model?: string; year?: number; licensePlate?: string; color?: string; [key: string]: string | number | undefined } | null>(null);

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

  // New: openBookingId passed from Header navigation (query param)
  const [openBookingId, setOpenBookingId] = useState<string | undefined>(undefined);

  const currentUserForHook = authService.getCurrentUser();
  const driverIdForHook = currentUserForHook?._id || currentUserForHook?.id || "";
  const { newRideRequest, acceptRide: hookAcceptRide, rejectRide: hookRejectRide } = useDriverRideListener(
    driverIdForHook,
    !!driverIdForHook && activeTab === 'bookings'
  );

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
    } catch {
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
    } catch {
      message.error("Failed to reject ride");
    } finally {
      setRejectLoading(false);
    }
  };

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loadDriverData = async () => {
      try {
        setLoading(true);
        const currentUser = authService.getCurrentUser();

        // Not logged in at all
        if (!currentUser) {
          navigate("/driver/login");
          return;
        }

        // CRITICAL: Validate user role is DRIVER (defensive check - only validate if role exists)
        const userRole = currentUser.role?.toUpperCase();
        if (userRole && userRole !== 'DRIVER') {
          console.error('🔴 [DRIVER PROFILE] Access denied: User role is', userRole, 'but DRIVER required');
          message.error("Access denied. This page is only for driver accounts.");
          // Don't clear auth here - just redirect to appropriate login
          navigate(userRole === 'USER' ? '/user/login' : '/driver/login');
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
            profileImage: backendData.profileImage || null,
            personalInfo: {
              bloodGroup: backendData.personalInfo?.bloodGroup || backendData.bloodGroup || "",
              dob: backendData.personalInfo?.dob || backendData.dob || "",
              languages: backendData.personalInfo?.languages || backendData.languages || [],
              licensedSince: backendData.personalInfo?.licensedSince || backendData.licensedSince || "",
              experienceYears: backendData.personalInfo?.experienceYears || backendData.experienceYears || 0,
            },
          });
          setLoading(false);
        } catch (backendError: any) {
          console.error("Failed to fetch driver profile:", backendError);

          // 401 = unauthorized, logout and redirect
          if (backendError.response?.status === 401) {
            console.log('🔴 [DRIVER PROFILE] Unauthorized, logging out');
            authService.logout('/driver/login');
            message.error("Session expired. Please login again.");
            return;
          } 
          // 403/404 = profile doesn't exist yet (new driver)
          else if (backendError.response?.status === 403 || backendError.response?.status === 404) {
            console.log('🟡 [DRIVER PROFILE] No profile found, using account data');
            // Use basic account data from currentUser
            const storedUser = localStorage.getItem('userData');
            const accountData = storedUser ? JSON.parse(storedUser) : currentUser;
            
            setDriverData({
              fullName: accountData.fullName || "",
              email: accountData.email || "",
              phoneNumber: accountData.phoneNumber || "",
              driverLicenseNumber: "",
              profileImage: null,
              personalInfo: {
                bloodGroup: "",
                dob: "",
                languages: [],
                licensedSince: "",
                experienceYears: 0,
              },
            });
            setLoading(false);
          } 
          // Other errors - show error but don't redirect
          else {
            console.error('❌ [DRIVER PROFILE] Unexpected error:', backendError);
            message.error("Failed to load profile. Please try again.");
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Error in loadDriverData:", error);
        setLoading(false);
      }
    };

    loadDriverData();
  }, [navigate]);

  // Watch location query params for ?tab=bookings and ?bookingId=...
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    const bookingIdParam = params.get("bookingId");
    if (tabParam === "bookings") {
      setActiveTab("bookings");
    }
    if (bookingIdParam) {
      setActiveTab("bookings");
      setOpenBookingId(bookingIdParam);
    }
  }, [location.search]);

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
    authService.logout('/driver/login');
    message.success("Logged out successfully");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const toggleSidebar = () => setSidebarOpen((s) => !s);

  const handleAddVehicle = () => {
    setVehicleToEdit(null);
    setAddVehicleModalOpen(true);
  };

  const handleEditVehicle = (v: { id?: string; make?: string; model?: string; year?: number; licensePlate?: string; color?: string; [key: string]: string | number | undefined }) => {
    setVehicleToEdit(v);
    setAddVehicleModalOpen(true);
  };

  const handleEditPersonalInfo = () => setPersonalInfoModalOpen(true);
  const handleNavigateToPersonalInfo = () => setActiveTab("personalInfo");

  const handleSavePersonalInfo = async (values: DriverPersonalInfoValues) => {
    setPersonalInfoSaving(true);

    const payload = {
      bloodGroup: values.bloodGroup ?? driverData.personalInfo?.bloodGroup,
      dob: values.dateOfBirth ?? driverData.personalInfo?.dob,
      languages: values.languages ?? driverData.personalInfo?.languages ?? [],
      licensedSince: values.licensedSince,
      experienceYears: values.experienceYears,
    };

    try {
      // Check if this is first-time profile creation (no license number exists)
      const hasNoProfile = !driverData.driverLicenseNumber && values.driverLicenseNumber;
      
      if (hasNoProfile) {
        // First time: Create driver profile with license number
        console.log('🔵 Creating driver profile for first time');
        const profilePayload = {
          licenseNumber: values.driverLicenseNumber,
          bloodGroup: values.bloodGroup,
          dob: values.dateOfBirth,
          languages: values.languages || [],
          licensedSince: values.licensedSince,
          experienceYears: values.experienceYears,
        };
        
        const res = await authService.createDriverProfile(profilePayload);
        const updated = res?.driverProfile || res || {};

        setDriverData((prev) => ({
          ...prev,
          driverLicenseNumber: values.driverLicenseNumber,
          personalInfo: {
            bloodGroup: updated.bloodGroup ?? values.bloodGroup ?? "",
            dob: updated.dob ?? values.dateOfBirth ?? "",
            languages: updated.languages ?? values.languages ?? [],
            licensedSince: updated.licensedSince ?? values.licensedSince,
            experienceYears: updated.experienceYears ?? values.experienceYears,
          },
        }));

        message.success("Driver profile created successfully!");
      } else {
        // Update existing profile
        const res = await authService.updateDriverProfile(payload);
        const updated = res?.driverProfile || res || {};

        setDriverData((prev) => ({
          ...prev,
          personalInfo: {
            bloodGroup: updated.bloodGroup ?? payload.bloodGroup ?? prev.personalInfo?.bloodGroup ?? "",
            dob: updated.dob ?? payload.dob ?? prev.personalInfo?.dob ?? "",
            languages: updated.languages ?? payload.languages ?? prev.personalInfo?.languages ?? [],
            licensedSince: updated.licensedSince ?? payload.licensedSince ?? prev.personalInfo?.licensedSince,
            experienceYears: updated.experienceYears ?? payload.experienceYears ?? prev.personalInfo?.experienceYears,
          },
        }));

        message.success("Personal information updated");
      }
      
      setPersonalInfoModalOpen(false);
    } catch (err) {
      console.error("Failed to update personal info:", err);
      message.error("Failed to update personal information");
    } finally {
      setPersonalInfoSaving(false);
    }
  };

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
        // Pass openBookingId so the bookings tab can auto-open the details modal
        return <DriverBookingsTab loading={loading} openBookingId={openBookingId} onOpenHandled={() => setOpenBookingId(undefined)} />;
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

  // Listen for open-booking events (dispatched by Header) to ensure the Bookings tab opens
  useEffect(() => {
    const onOpenBooking = (ev: Event) => {
      const bookingId = (ev as CustomEvent)?.detail?.bookingId;
      if (bookingId) {
        setActiveTab("bookings");
        setOpenBookingId(bookingId);
        try {
          navigate(`/driver/profile?tab=bookings&bookingId=${encodeURIComponent(bookingId)}`);
        } catch (e) {
          console.error("Navigation error:", e);
        }
      } else {
        setActiveTab("bookings");
        try {
          navigate('/driver/profile?tab=bookings');
        } catch (e) {
          console.error("Navigation error:", e);
        }
      }
    };
    window.addEventListener("open-booking", onOpenBooking as EventListener);
    return () => window.removeEventListener("open-booking", onOpenBooking as EventListener);
  }, [navigate]);

  return (
    <div className="h-screen bg-gradient-to-b from-green-50 to-gray-100 overflow-hidden">
      <div className="fixed top-0 left-0 right-0 z-40">
        <Header
          navigate={handleNavigate}
          handleLogout={handleLogout}
          username={driverData.fullName}
          onMenuToggle={toggleSidebar}
          showMenuIcon={windowWidth <= 768}
          onProfileClick={() => setActiveTab("personalInfo")}
        />
      </div>

      <div className="flex relative w-full pt-16 h-full">
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
            setDriverData((prev) => ({ ...prev, profileImage: url }));
            message.success("Profile image updated");
          }}
          handleLogout={handleLogout}
        />

        <div className="flex-1 p-2 md:p-4 md:pl-64 h-full w-full transition-all duration-300 ease-in-out overflow-y-auto">
          <div className="w-full mx-auto bg-white rounded-xl shadow-sm p-4 md:p-6">
            {renderTabContent()}
          </div>

          <div className="mt-4 text-center text-gray-500 text-sm py-2">
            <p>&copy; {new Date().getFullYear()} Gokeral. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Ride Request modal (unchanged) */}
      <RideRequestModal
        open={rideModalOpen}
        pickupLocation={pendingRide?.pickupLocation || ""}
        phoneNumber={pendingRide?.phoneNumber}
        fare={pendingRide?.estimatedFare || 0}
        onAccept={handleAcceptRide}
        onReject={handleRejectRide}
        accepting={acceptLoading}
        rejecting={rejectLoading}
      />

      {/* Modals */}
      <DriverAddDetails
        open={personalInfoModalOpen}
        loading={personalInfoSaving}
        onCancel={() => setPersonalInfoModalOpen(false)}
        onSave={handleSavePersonalInfo}
        initialValues={{
          fullName: driverData.fullName,
          email: driverData.email,
          phoneNumber: driverData.phoneNumber,
          driverLicenseNumber: driverData.driverLicenseNumber,
          dateOfBirth: driverData.personalInfo?.dob || "",
          bloodGroup: driverData.personalInfo?.bloodGroup || "",
          languages: driverData.personalInfo?.languages || [],
          licensedSince: driverData.personalInfo?.licensedSince || "",
          experienceYears: driverData.personalInfo?.experienceYears,
        }}
      />
      <AddVehicleModal
        open={addVehicleModalOpen}
        vehicleData={vehicleToEdit}
        onClose={() => { setAddVehicleModalOpen(false); setVehicleToEdit(null); }}
        onSuccess={() => { setVehiclesRefreshSignal((s) => s + 1); setAddVehicleModalOpen(false); setVehicleToEdit(null); }}
      />
    </div>
  );
};