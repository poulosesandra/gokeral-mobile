import React, { useMemo, useState } from "react";
import { Modal } from "antd";
import { Car, FileImage, AlertCircle, Upload } from "lucide-react";
import vehicleService from "../../../../services/vehicleService";

interface AddVehicleModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const AddVehiclePage: React.FC<AddVehicleModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [currentStep, setCurrentStep] = useState<"details" | "fare">("details");
  const [vehicleId, setVehicleId] = useState<string | null>(null);

  // Vehicle details
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [seats, setSeats] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleClass, setVehicleClass] = useState("");

  // Files
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [addressProofFile, setAddressProofFile] = useState<File | null>(null);
  const [policeCertFile, setPoliceCertFile] = useState<File | null>(null);
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fareError, setFareError] = useState("");

  // Fare fields (UI only for now)
  const [baseFare, setBaseFare] = useState("");
  const [perKmRate, setPerKmRate] = useState("");
  const [minimumFare, setMinimumFare] = useState("");
  const [waitingCharge, setWaitingCharge] = useState("");

  const documents = useMemo(
    () => [
      {
        label: "Upload Driving License",
        setter: setLicenseFile,
        file: licenseFile,
      },
      { label: "Upload Insurance", setter: setInsuranceFile, file: insuranceFile },
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
    ],
    [licenseFile, insuranceFile, addressProofFile, policeCertFile]
  );

  const resetForm = () => {
    setCurrentStep("details");
    setVehicleId(null);

    setMake("");
    setModel("");
    setYear("");
    setSeats("");
    setLicensePlate("");
    setVehicleType("");
    setVehicleClass("");

    setLicenseFile(null);
    setInsuranceFile(null);
    setAddressProofFile(null);
    setPoliceCertFile(null);

    setVehicleImage(null);
    setImagePreview(null);

    setBaseFare("");
    setPerKmRate("");
    setMinimumFare("");
    setWaitingCharge("");

    setLoading(false);
    setError("");
    setFareError("");
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const handlePreviousStep = () => {
    setCurrentStep("details");
    setFareError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setVehicleImage(file);

    if (!file) {
      setImagePreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (
        !make ||
        !model ||
        !year ||
        !seats ||
        !licensePlate ||
        !vehicleType ||
        !vehicleClass
      ) {
        setError("Please fill in all required fields");
        return;
      }

      const vehiclePayload = {
        companyName: make,
        model,
        year: parseInt(year, 10),
        seats: parseInt(seats, 10),
        licensePlateNumber: licensePlate,
        vehicleType,
        vehicleClass,
      };

      const createdVehicle = await vehicleService.addVehicle(vehiclePayload as any);
      const createdId = createdVehicle?._id || createdVehicle?.id || null;

      if (!createdId) {
        setError("Vehicle created but ID not returned by API.");
        return;
      }

      setVehicleId(createdId);

      const uploadAndRegisterDoc = async (file: File | null, docType: string) => {
        if (!file) return;
        const uploadRes = await vehicleService.uploadVehicleDocument(createdId, file);
        const fileUrl = uploadRes?.url || uploadRes?.data?.url || null;
        if (fileUrl) await vehicleService.addVehicleDocument(createdId, docType, fileUrl);
      };

      try {
        await uploadAndRegisterDoc(licenseFile, "drivingLicense");
        await uploadAndRegisterDoc(insuranceFile, "insuranceProof");
        await uploadAndRegisterDoc(addressProofFile, "addressProof");
        await uploadAndRegisterDoc(policeCertFile, "policeCertificate");
      } catch (uploadErr) {
        console.warn("Some documents failed to upload:", uploadErr);
      }

      if (vehicleImage) {
        try {
          const imgRes = await vehicleService.uploadVehicleImage(createdId, vehicleImage);
          const imgUrl = imgRes?.url || imgRes?.data?.url || null;
          if (imgUrl) {
            await vehicleService.addVehicleImages(createdId, [imgUrl]);
            await vehicleService.updateVehicle(createdId, { vehicleImage: imgUrl } as any);
          }
        } catch (imgErr) {
          console.warn("Vehicle image upload failed:", imgErr);
        }
      }

      setCurrentStep("fare");
    } catch (err: any) {
      console.error("Vehicle creation error:", err);
      setError(
        err?.response?.data?.message || "Failed to add vehicle. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFareError("");
    setLoading(true);

    try {
      if (!baseFare || !perKmRate || !minimumFare || !waitingCharge) {
        setFareError("Please fill in all fare settings");
        return;
      }

      console.log("Fare Settings Submitted", {
        vehicleId,
        baseFare,
        perKmRate,
        minimumFare,
        waitingCharge,
      });

      onSuccess?.();
      resetForm();
      onClose();
    } catch (err: any) {
      console.error("Fare submission error:", err);
      setFareError(
        err?.response?.data?.message ||
          "Failed to save fare settings. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={currentStep === "details" ? 900 : 800}
      destroyOnHidden
      centered
      title={currentStep === "details" ? "Add Vehicle" : "Fare & Fees Settings"}
      maskClosable={false}
    >
      {currentStep === "details" && (
        <form onSubmit={handleSubmit} className="w-full">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3 flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg mb-3 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Car className="text-green-500" size={20} /> Vehicle Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Make (e.g. Toyota)"
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Model (e.g. Innova)"
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                {Array.from({ length: 30 }, (_, i) => currentYear - i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <input
                type="number"
                placeholder="Seats"
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                min="1"
                max="50"
                required
              />
              <input
                type="text"
                placeholder="License Plate"
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                required
              />
              <select
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full p-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileImage className="text-green-500" size={20} /> Documents
              </h2>

              <div className="flex flex-col gap-2">
                {documents.map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-2 text-white text-sm font-medium px-3 py-2 rounded-md cursor-pointer transition-colors"
                    style={{ backgroundColor: "oklch(0.59 0.19 149.34)" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "oklch(0.54 0.19 149.34)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        "oklch(0.59 0.19 149.34)")
                    }
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

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileImage className="text-green-800" size={20} /> Vehicle Image
              </h2>

              <label
                className="flex items-center gap-2 text-white text-sm font-medium px-3 py-2 rounded-md cursor-pointer transition-colors mb-3"
                style={{ backgroundColor: "oklch(0.59 0.19 149.34)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "oklch(0.54 0.19 149.34)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "oklch(0.59 0.19 149.34)")
                }
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
              disabled={loading}
              className="px-4 py-1.5 text-sm text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              style={{ backgroundColor: "oklch(0.59 0.19 149.34)" }}
            >
              {loading ? "Processing..." : "Next: Fare Settings"}
            </button>
          </div>
        </form>
      )}

      {currentStep === "fare" && (
        <form onSubmit={handleFareSubmit} className="mt-4">
          {fareError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-2">
              <AlertCircle className="text-red-500" size={20} />
              <p className="text-sm text-red-700">{fareError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-sm font-medium text-gray-900 mb-2">
              Tips for setting fares:
            </p>
            <p className="text-sm text-gray-700">
              Base fare is the starting fare for any ride
            </p>
            <p className="text-sm text-gray-700">
              Per kilometer rate should be competitive with other services in your area
            </p>
            <p className="text-sm text-gray-700">
              Minimum fare ensures you earn a minimum amount on short trips
            </p>
            <p className="text-sm text-gray-700">
              Waiting charges apply when the vehicle is stationary during a trip
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handlePreviousStep}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
  type="submit"
  disabled={loading}
  className="px-6 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  style={{ backgroundColor: "oklch(0.59 0.19 149.34)" }}
  onMouseEnter={(e) =>
    (e.currentTarget.style.backgroundColor = "oklch(0.54 0.19 149.34)")
  }
  onMouseLeave={(e) =>
    (e.currentTarget.style.backgroundColor = "oklch(0.59 0.19 149.34)")
  }
>
  {loading ? "Submitting..." : "Submit"}
</button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default AddVehiclePage;