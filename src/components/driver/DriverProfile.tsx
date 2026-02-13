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
  address?: string;
  profileImage: string | null;
  personalInfo?: {
    bloodGroup?: string;
    dob?: string;
    languages?: string[];
    certificates?: string[];
    emergencyContact?: {
      name?: string;
      phone?: string;
      relationship?: string;
    };
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
        } catch (backendError: unknown) {
          const error = backendError as { response?: { status: number } };
          console.error("Failed to fetch driver profile:", error);

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
    authService.logout();
    message.success("Logged out successfully");
    navigate("/driver/login");
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

    const emergencyContact = values.emergencyContact
      ? {
          name: values.emergencyContact.name || "",
          phone: values.emergencyContact.phone || "",
          relationship: values.emergencyContact.relation || "",
        }
      : driverData.personalInfo?.emergencyContact || {
          name: "",
          phone: "",
          relationship: "",
        };

    const payload = {
      fullName: values.fullName ?? driverData.fullName,
      email: values.email ?? driverData.email,
      phoneNumber: values.phoneNumber ?? driverData.phoneNumber,
      driverLicenseNumber: values.driverLicenseNumber ?? driverData.driverLicenseNumber,
      address: values.address ?? driverData.address,
      personalInfo: {
        bloodGroup: values.bloodGroup ?? driverData.personalInfo?.bloodGroup ?? "",
        dob: values.dateOfBirth ?? driverData.personalInfo?.dob ?? "",
        languages: values.languages ?? driverData.personalInfo?.languages ?? [],
        certificates: values.certificates ?? driverData.personalInfo?.certificates ?? [],
        emergencyContact,
      },
    };

    try {
      const res = await authService.updateDriverProfile(payload);
      const updated = res?.driver || res || payload;

      setDriverData((prev) => ({
        ...prev,
        fullName: updated.fullName ?? payload.fullName ?? prev.fullName,
        email: updated.email ?? payload.email ?? prev.email,
        phoneNumber: updated.phoneNumber ?? payload.phoneNumber ?? prev.phoneNumber,
        driverLicenseNumber: updated.driverLicenseNumber ?? payload.driverLicenseNumber ?? prev.driverLicenseNumber,
        address: updated.address ?? payload.address ?? prev.address,
        profileImage: updated.profileImage ?? prev.profileImage,
        personalInfo: {
          bloodGroup: updated.personalInfo?.bloodGroup ?? payload.personalInfo?.bloodGroup ?? prev.personalInfo?.bloodGroup ?? "",
          dob: updated.personalInfo?.dob ?? payload.personalInfo?.dob ?? prev.personalInfo?.dob ?? "",
          languages: updated.personalInfo?.languages ?? payload.personalInfo?.languages ?? prev.personalInfo?.languages ?? [],
          certificates: updated.personalInfo?.certificates ?? payload.personalInfo?.certificates ?? prev.personalInfo?.certificates ?? [],
          emergencyContact: updated.personalInfo?.emergencyContact ?? payload.personalInfo?.emergencyContact ?? prev.personalInfo?.emergencyContact ?? {
            name: "",
            phone: "",
            relationship: "",
          },
        },
      }));

      message.success("Personal information updated");
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
      <AddVehicleModal
        open={addVehicleModalOpen}
        vehicleData={vehicleToEdit}
        onClose={() => { setAddVehicleModalOpen(false); setVehicleToEdit(null); }}
        onSuccess={() => { setVehiclesRefreshSignal((s) => s + 1); setAddVehicleModalOpen(false); setVehicleToEdit(null); }}
      />
    </div>
  );
};