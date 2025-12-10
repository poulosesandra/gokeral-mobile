import React, { useState } from "react";
import { Car, FileImage } from "lucide-react";

const AddVehiclePage: React.FC = () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add your form submission logic here
    console.log({ make, model, year, seats, licensePlate, vehicleType, vehicleClass });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-5xl bg-white shadow-xl rounded-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Add Vehicle</h1>

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
            <FileImage className="text-purple-500" size={24} /> Vehicle Images
          </h2>
          <label className="w-full bg-purple-500 text-white font-semibold p-4 rounded-lg text-center cursor-pointer hover:bg-purple-600 block">
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
          <button type="button" className="px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-100">
            Cancel
          </button>
          <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Next: Fare Settings
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddVehiclePage;