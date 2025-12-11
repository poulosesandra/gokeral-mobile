import HomePage from "../pages/Home";
import UserLogin from "../pages/UserLogin";
import UserRegistration from "../pages/UserRegistration";
import DriverLogin from "../pages/DriverLogin";
import DriverRegistration from "../pages/DriverRegistration";
import UserDashboard from "../pages/UserDashboard";
import DriverDashboard from "../pages/DriverDashboard";
import { createBrowserRouter } from "react-router-dom";
import AddVehiclePage from "../components/driverprofile/modal/driverAddVehicle"

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
    path: "/user/dashboard",
    element: <UserDashboard />,
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
  // Legacy routes for backward compatibility
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
]);
