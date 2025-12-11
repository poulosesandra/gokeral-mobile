import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authServices';

interface DriverData {
  username: string;
  email: string;
  phone?: string;
  licenseNumber?: string;
}

export default function DriverDashboard() {
  const [driver, setDriver] = useState<DriverData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    if (!authService.isAuthenticated() || authService.getUserType() !== 'driver') {
      navigate('/driver/login');
      return;
    }

    // Fetch driver data (you'll need to implement this endpoint in your backend)
    const fetchDriverData = async () => {
      try {
        // For now, using mock data from localStorage or token
        // You should implement a /driver/me endpoint in your backend
        const mockDriver: DriverData = {
          username: 'Driver', // Extract from JWT token or fetch from API
          email: 'driver@example.com',
          licenseNumber: 'DL123456789',
        };
        setDriver(mockDriver);
      } catch (error) {
        console.error('Failed to fetch driver data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDriverData();
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/driver/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Gokeral Driver</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="ml-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome, {driver?.username}!
            </h2>
            <div className="mt-6 border-t border-gray-200 pt-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Username</dt>
                  <dd className="mt-1 text-sm text-gray-900">{driver?.username}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{driver?.email}</dd>
                </div>
                {driver?.phone && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{driver.phone}</dd>
                  </div>
                )}
                {driver?.licenseNumber && (
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">License Number</dt>
                    <dd className="mt-1 text-sm text-gray-900">{driver.licenseNumber}</dd>
                  </div>
                )}
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Account Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">Driver</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <button className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                View Rides
              </button>
              <button className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                Add Vehicle
              </button>
              <button className="px-4 py-3 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition">
                Earnings
              </button>
              <button className="px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition">
                Profile Settings
              </button>
              <button className="px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
                My Vehicles
              </button>
              <button className="px-4 py-3 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition">
                Documents
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
