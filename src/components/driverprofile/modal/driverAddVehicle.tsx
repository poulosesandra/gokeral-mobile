import React, { useState } from "react";
import { Car, FileImage, CheckCircle, AlertCircle, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import vehicleService, { type CreateVehicleDto } from "../../../services/vehicleService";

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
              {[
                {
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
                },
              ].map((item, idx) => (
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
            style={{ backgroundColor: loading || success ? '' : 'oklch(0.59 0.19 149.34)' }}
            onMouseEnter={(e) => !loading && !success && (e.currentTarget.style.backgroundColor = 'oklch(0.54 0.19 149.34)')}
            onMouseLeave={(e) => !loading && !success && (e.currentTarget.style.backgroundColor = 'oklch(0.59 0.19 149.34)')}
          >
            {loading ? 'Adding...' : 'Add Vehicle'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddVehiclePage;