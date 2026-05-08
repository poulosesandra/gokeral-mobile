import HomePage from "../pages/Home";
import UserLogin from "../pages/user/UserLogin";
import UserRegistration from "../pages/user/UserRegistration";
import DriverLogin from "../pages/driver/DriverLogin";
import DriverRegistration from "../pages/driver/DriverRegistration";
// import UserDashboard from "../pages/UserDashboard";
import { createBrowserRouter } from "react-router-dom";
import AddVehiclePage from "../components/driver/driverprofile/modal/driverAddVehicle"
import { UserProfilePage } from "../pages/user/UserProfilePage";
import DriverProfilePage from "../pages/driver/DriverProfilePage";
import TermsPrivacyPage from "../pages/about";
import ContactPage from "../pages/contact/contact";
import DriverPersonalInfoModal from "../components/driver/driverprofile/modal/driverAddDetails";
import Maps from "../pages/map/Maps";
import LiveRideShowcasePage from "../pages/demo/LiveRideShowcasePage";
import AdminGuard from "../components/admin/AdminGuard";
import AdminLayout from "../pages/admin/AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminLogin from "../pages/admin/AdminLogin";
import StandsPage from "../pages/admin/StandsPage";
import DriversPage from "../pages/admin/DriversPage";
import VehiclesPage from "../pages/admin/VehiclesPage";
import BookingsPage from "../pages/admin/BookingsPage";
import UsersPage from "../pages/admin/UsersPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/user/login",
    element: <UserLogin />,
  },
  {
    path: "/user/register",
    element: <UserRegistration />,
  },
  
  {
    path: "/driver/login",
    element: <DriverLogin />,
  },
  {
    path: "/driver/register",
    element: <DriverRegistration />,
  },
  {
    path: "/admin/login",
    element: <AdminLogin />,
  },
  {
    path: "/driver/add-vehicle",
    element: <AddVehiclePage open={true} onClose={() => {}} onSuccess={() => {}} />,
  },
  {
    path: "/user/profile",
    element: <UserProfilePage />,
  },
  {
    path: "/driver/profile",
    element: <DriverProfilePage />,
  },
  
  {
    path: "/about",
    element: <TermsPrivacyPage />,
  },
  {
    path: "/contact",
    element: <ContactPage />,
  },
  {
    path: "/driver/personal-info",
    element: <DriverPersonalInfoModal open={true} onCancel={() => {}} onSave={() => {}} />,
  },
  {
    path: "/map",
    element: <Maps />,   
  },
  {
    path: "/live-demo",
    element: <LiveRideShowcasePage />,
  },
  {
    path: "/admin",
    element: (
      <AdminGuard>
        <AdminLayout />
      </AdminGuard>
    ),
    children: [
      { path: "", element: <AdminDashboard /> },
      { path: "stands", element: <StandsPage /> },
      { path: "drivers", element: <DriversPage /> },
      { path: "vehicles", element: <VehiclesPage /> },
      { path: "bookings", element: <BookingsPage /> },
      { path: "users", element: <UsersPage /> },
    ],
  },
  // Legacy routes for backward compatibility
  {
    path: "/userProfile",
    element: <UserProfilePage />,
  },
  {
    path: "/driverProfile",
    element: <DriverProfilePage />,
  },
  {
    path: "/login",
    element: <UserLogin />,
  },
  {
    path: "/register",
    element: <UserRegistration />,
  },
  {
    path: "/driverLogin",
    element: <DriverLogin />,
  },
  {
    path: "/driverRegistration",
    element: <DriverRegistration />,
  },
  {
    path: "/userProfile",
    element: <UserProfilePage />,
  },
  {
    path: "/driverProfile",
    element: <DriverProfilePage />,
  },
]);
