import HomePage from "../pages/Home";
import UserLogin from "../pages/UserLogin";
import UserRegistration from "../pages/UserRegistration";
import DriverLogin from "../pages/DriverLogin";
import DriverRegistration from "../pages/DriverRegistration";
// import UserDashboard from "../pages/UserDashboard";
import DriverDashboard from "../pages/DriverDashboard";
import { createBrowserRouter } from "react-router-dom";
import AddVehiclePage from "../components/driverprofile/modal/driverAddVehicle"
import { UserProfilePage } from "../pages/UserProfilePage";
import DriverProfilePage from "../pages/DriverProfilePage";
import TermsPrivacyPage from "../pages/about";
import ContactPage from "../pages/contact/contack";
import DriverPersonalInfoModal from "../components/driverprofile/modal/driverAddDetails";
import Maps from "../pages/map/Maps";

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
    path: "/driver/dashboard",
    element: <DriverDashboard />,
  },
  {
    path: "/driver/add-vehicle",
    element: <AddVehiclePage />,
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
