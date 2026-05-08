import { Navigate } from "react-router-dom";
import { type ReactNode } from "react";
import { authService } from "../../services/authServices";

const AdminGuard = ({ children }: { children: ReactNode }) => {
  const role = String(authService.getUserRole() || "").toUpperCase();

  if (!authService.isAuthenticated()) {
    return <Navigate to="/user/login" replace />;
  }

  if (role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Access Required</h1>
          <p className="text-gray-600 mt-3">Your account does not have admin permissions.</p>
          <a
            href="/"
            className="inline-flex items-center justify-center mt-6 px-5 py-2.5 rounded-full bg-green-600 text-white font-semibold hover:bg-green-700 transition"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminGuard;
