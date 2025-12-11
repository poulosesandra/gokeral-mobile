import React, { useState } from "react";
import { Car, FileImage, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import vehicleService from "../../../services/vehicleService";

const AddVehiclePage: React.FC = () => {
  const navigate = useNavigate();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [seats, setSeats] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleClass, setVehicleClass] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
  const [policeCertFile, setPoliceCertFile] = useState<File | null>(null);
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Prepare vehicle data
      const vehicleData: CreateVehicleDto = {
        make,
        model,
        year: parseInt(year),
        seats: parseInt(seats),
        licensePlate,
        vehicleType,
        vehicleClass,
      };

      // Create vehicle
      const newVehicle = await vehicleService.createVehicle(vehicleData);
      
      setSuccess(true);
      
      // Redirect after success
      setTimeout(() => {
        navigate('/driver/profile'); // Adjust route as needed
      }, 2000);
      
    } catch (err: any) {
      console.error('Vehicle creation error:', err);
      setError(
        err.response?.data?.message || 
        'Failed to add vehicle. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-5xl bg-white shadow-xl rounded-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Add Vehicle</h1>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="text-green-500" size={24} />
            <p className="text-green-700">Vehicle added successfully! Redirecting...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={24} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Vehicle Details */}
        <div className="bg-gray-50 p-6 rounded-xl mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Car className="text-green-500" size={24} /> Vehicle Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Make (e.g. Toyota)"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Model (e.g. Civic)"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
            />
            <select
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            >
              <option value="">Select Year</option>
              {Array.from({ length: 30 }, (_, i) => 2025 - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Seats"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              min="1"
              max="50"
              required
            />
            <input
              type="text"
              placeholder="License Plate"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              required
            />
            <select
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              required
            >
              <option value="">Vehicle Type</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Hatchback">Hatchback</option>
            </select>
            <select
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={vehicleClass}
              onChange={(e) => setVehicleClass(e.target.value)}
              required
            >
              <option value="">Vehicle Class</option>
              <option value="Economy">Economy</option>
              <option value="Luxury">Luxury</option>
            </select>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-gray-50 p-6 rounded-xl mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FileImage className="text-blue-500" size={24} /> Documents
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                label: "License File",
                setter: setLicenseFile,
                file: licenseFile,
              },
              {
                label: "Insurance File",
                setter: setInsuranceFile,
                file: insuranceFile,
              },
              {
                label: "Address Proof",
                setter: setAddressProofFile,
                file: addressProofFile,
              },
              {
                label: "Police Certificate",
                setter: setPoliceCertFile,
                file: policeCertFile,
              },
            ].map((item, idx) => (
            <label
              key={idx}
              className="w-full bg-blue-500 text-white font-semibold p-4 rounded-lg text-center cursor-pointer hover:bg-blue-600"
            >
              {item.file ? item.file.name : item.label}
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => item.setter(e.target.files?.[0] || null)}
              />
            </label>
          ))}
          </div>
        </div>

        {/* Vehicle Images */}
        <div className="bg-gray-50 p-6 rounded-xl mb-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <FileImage className="text-blue-500" size={24} /> Vehicle Images
          </h2>
          <label className="w-full bg-blue-500 text-white font-semibold p-4 rounded-lg text-center cursor-pointer hover:bg-blue-600 block">
            {vehicleImage ? vehicleImage.name : "Upload Vehicle Image"}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => setVehicleImage(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button 
            type="button" 
            onClick={handleCancel}
            disabled={loading}
            className="px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading || success}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddVehiclePage;