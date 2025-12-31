import React, { useState } from "react";
import { Car, FileImage, CheckCircle, AlertCircle, Upload, X } from "lucide-react";
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
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showFareModal, setShowFareModal] = useState(false);

  // Fare & Fees state
  const [baseFare, setBaseFare] = useState("");
  const [perKmRate, setPerKmRate] = useState("");
  const [minimumFare, setMinimumFare] = useState("");
  const [waitingCharge, setWaitingCharge] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setVehicleImage(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Prepare vehicle data
      const vehicleData = {
        make,
        model,
        year: parseInt(year),
        seats: parseInt(seats),
        licensePlate,
        vehicleType,
        vehicleClass,
      };

      // Create vehicle - use addVehicle instead of createVehicle
      await vehicleService.addVehicle(vehicleData);

      setSuccess(true);

      // Remove auto-redirect - let user click Next: Fare Settings
      // setTimeout(() => {
      //   navigate('/driver/profile');
      // }, 2000);

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

  const handleFareSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle fare submission here
    console.log('Fare settings:', {
      baseFare,
      perKmRate,
      minimumFare,
      waitingCharge,
    });
    // You can add API call here to save fare settings
    setShowFareModal(false);
    navigate('/driver/profile');
  };

  const handlePrevious = () => {
    setShowFareModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-3">
      <form onSubmit={handleSubmit} className="w-full max-w-4xl bg-white shadow-xl rounded-lg p-5 my-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Add Vehicle</h1>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3 flex items-center gap-2">
            <CheckCircle className="text-green-500" size={20} />
            <p className="text-sm text-green-700">Vehicle added successfully! Redirecting...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3 flex items-center gap-2">
            <AlertCircle className="text-red-500" size={20} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Vehicle Details */}
        <div className="bg-gray-50 p-4 rounded-lg mb-3 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Car className="text-green-500" size={20} /> Vehicle Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Make (e.g. Toyota)"
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Model (e.g. Innova)"
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
            />
            <select
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              min="1"
              max="50"
              required
            />
            <input
              type="text"
              placeholder="License Plate"
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              required
            />
            <select
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Documents and Vehicle Images - Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Documents - Left Column */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileImage className="text-green-500" size={20} /> Documents
            </h2>
            <div className="flex flex-col gap-4.5">
              [{
                label: "Upload Driving License",
                  setter: setLicenseFile,
                  file: licenseFile,
                },
                {
                  label: "Upload Insurance",
                  setter: setInsuranceFile,
                  file: insuranceFile,
                },
                {
                  label: "Upload Address Proof",
                  setter: setAddressProofFile,
                  file: addressProofFile,
                },
                {
                  label: "Upload Police Certificate",
                  setter: setPoliceCertFile,
                  file: policeCertFile,
                },].map((item, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-2 text-white text-sm font-medium px-3 py-2 rounded-md cursor-pointer transition-colors"
                  style={{ backgroundColor: 'oklch(0.59 0.19 149.34)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'oklch(0.54 0.19 149.34)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'oklch(0.59 0.19 149.34)'}
                >
                  <Upload size={16} />
                  <span className="flex-1 truncate">
                    {item.file ? item.file.name : item.label}
                  </span>
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

          {/* Vehicle Images - Right Column */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileImage className="text-green-800" size={20} /> Vehicle Image
            </h2>
            <label
              className="flex items-center gap-2 text-white text-sm font-medium px-3 py-2 rounded-md cursor-pointer transition-colors mb-3"
              style={{ backgroundColor: 'oklch(0.59 0.19 149.34)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'oklch(0.54 0.19 149.34)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'oklch(0.59 0.19 149.34)'}
            >
              <Upload size={16} />
              <span className="flex-1 truncate">
                {vehicleImage ? vehicleImage.name : "Upload Image"}
              </span>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>

            {/* Image Preview */}
            <div className="w-full h-40 bg-gray-200 rounded-md flex items-center justify-center overflow-hidden border border-gray-300">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Vehicle preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-gray-400">
                  <Car size={48} className="mx-auto mb-2" />
                  <p className="text-xs">Image preview</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || success}
            className="px-4 py-1.5 text-sm text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            style={{ backgroundColor: 'oklch(0.59 0.19 149.34)' }}
            onMouseEnter={(e) => !loading && !success && (e.currentTarget.style.backgroundColor = 'oklch(0.54 0.19 149.34)')}
            onMouseLeave={(e) => !loading && !success && (e.currentTarget.style.backgroundColor = 'oklch(0.59 0.19 149.34)')}
          >
            {loading ? 'Adding...' : 'Add Vehicle'}
          </button>
          <button
            type="button"
            disabled={loading || !success}
            className="px-4 py-1.5 text-sm text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            style={{ backgroundColor: 'oklch(0.59 0.19 149.34)' }}
            onMouseEnter={(e) => !loading && success && (e.currentTarget.style.backgroundColor = 'oklch(0.54 0.19 149.34)')}
            onMouseLeave={(e) => !loading && success && (e.currentTarget.style.backgroundColor = 'oklch(0.59 0.19 149.34)')}
            onClick={() => setShowFareModal(true)}
          >
            Next: Fare Settings
          </button>
        </div>
      </form>

      {/* Fare & Fees Modal */}
      {showFareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Add Vehicle</h2>
              <button
                onClick={() => setShowFareModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-6 px-6 pt-4 border-b border-gray-200">
              <button
                className="pb-3 px-2 text-gray-600 font-medium border-b-2 border-transparent hover:border-blue-500 transition-colors"
                disabled
              >
                🚗 Vehicle Details
              </button>
              <button
                className="pb-3 px-2 text-blue-600 font-medium border-b-2 border-blue-600"
              >
                💰 Fare & Fees
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleFareSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Base Fare */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="text-red-500">*</span> Base Fare (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Base fare amount"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={baseFare}
                    onChange={(e) => setBaseFare(e.target.value)}
                    required
                  />
                </div>

                {/* Per Kilometer Rate */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="text-red-500">*</span> Per Kilometer Rate (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Rate per kilometer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={perKmRate}
                    onChange={(e) => setPerKmRate(e.target.value)}
                    required
                  />
                </div>

                {/* Minimum Fare */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="text-red-500">*</span> Minimum Fare (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Minimum fare amount"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={minimumFare}
                    onChange={(e) => setMinimumFare(e.target.value)}
                    required
                  />
                </div>

                {/* Waiting Charge */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <span className="text-red-500">*</span> Waiting Charge (₹/Hours)
                  </label>
                  <input
                    type="number"
                    placeholder="Waiting charge"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={waitingCharge}
                    onChange={(e) => setWaitingCharge(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Tips for setting fares */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-800 font-semibold mb-2">Tips for setting fares:</p>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Base fare is the starting fare for any ride</li>
                  <li>• Per kilometer rate should be competitive with other services in your area</li>
                  <li>• Minimum fare ensures you earn a minimum amount on short trips</li>
                  <li>• Waiting charges apply when the vehicle is stationary during a trip</li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setShowFareModal(false)}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddVehiclePage;