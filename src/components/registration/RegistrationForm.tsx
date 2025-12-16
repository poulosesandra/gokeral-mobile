import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, User, Phone, FileText, CheckCircle, AlertCircle, MapPin, Calendar, Briefcase } from "lucide-react";
import authService from "../../services/authServices";

interface RegistrationFormProps {
  userType: "user" | "driver";
  loginLink: string;
  title: string;
  subtitle: string;
  includeDriverFields?: boolean;
  includeUserFields?: boolean;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  drivinglicenseNo?: string;
  agreement: boolean;
  address?: string;
  latitude?: string;
  longitude?: string;
  privacyAgreement?: boolean;
  driverAddress?: string;
  profileImage?: File | null;
  driverExperience?: string;
  bloodGroup?: string;
  certificateOfDriving?: File | null;
  dateOfBirth?: string;
  emergencyContact?: string;
  languages?: string;
}

const RegistrationForm = ({
  userType,
  loginLink,
  title,
  subtitle,
  includeDriverFields = false,
}: RegistrationFormProps) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    drivinglicenseNo: includeDriverFields ? "" : undefined,
    agreement: false,
    address: userType === "user" ? "" : undefined,
    latitude: userType === "user" ? "" : undefined,
    longitude: userType === "user" ? "" : undefined,
    privacyAgreement: false,
    driverAddress: includeDriverFields ? "" : undefined,
    profileImage: includeDriverFields ? null : undefined,
    driverExperience: includeDriverFields ? "" : undefined,
    bloodGroup: includeDriverFields ? "" : undefined,
    certificateOfDriving: includeDriverFields ? null : undefined,
    dateOfBirth: includeDriverFields ? "" : undefined,
    emergencyContact: includeDriverFields ? "" : undefined,
    languages: includeDriverFields ? "" : undefined,
  });
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string | null>(null);
  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const certInputRef = useRef<HTMLInputElement | null>(null);
  const [errors, setErrors] = useState<Record<string, string | boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string | boolean> = {};
    let isValid = true;

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      isValid = false;
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    // Phone validation
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/[\s-]/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number";
      isValid = false;
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    // Driver license validation (if applicable)
    if (includeDriverFields && !formData.drivinglicenseNo?.trim()) {
      newErrors.drivinglicenseNo = "Driving license number is required for drivers";
      isValid = false;
    }

    // Driver specific validations
    if (includeDriverFields) {
      if (!formData.driverAddress?.trim()) {
        newErrors.driverAddress = "Address is required for drivers";
        isValid = false;
      }

      if (!formData.driverExperience?.trim()) {
        newErrors.driverExperience = "Driving experience is required";
        isValid = false;
      } else if (isNaN(Number(formData.driverExperience)) || Number(formData.driverExperience) < 0) {
        newErrors.driverExperience = "Please enter a valid number of years";
        isValid = false;
      }

      if (!formData.bloodGroup?.trim()) {
        newErrors.bloodGroup = "Blood group is required";
        isValid = false;
      }

      if (!formData.certificateOfDriving) {
        newErrors.certificateOfDriving = "Driving certificate is required";
        isValid = false;
      }

      if (!formData.dateOfBirth?.trim()) {
        newErrors.dateOfBirth = "Date of birth is required";
        isValid = false;
      } else if (new Date(formData.dateOfBirth) >= new Date()) {
        newErrors.dateOfBirth = "Please enter a valid date of birth";
        isValid = false;
      }

      if (!formData.emergencyContact) {
        newErrors.emergencyContact = "Emergency contact is required";
        isValid = false;
      } else if (!/^[0-9]{10}$/.test(formData.emergencyContact.replace(/[\s-]/g, ""))) {
        newErrors.emergencyContact = "Please enter a valid 10-digit phone number";
        isValid = false;
      }

      if (!formData.languages?.trim()) {
        newErrors.languages = "Please list at least one language";
        isValid = false;
      }
    }

    // User-specific validations
    if (userType === "user") {
      // Address validation
      if (!formData.address?.trim()) {
        newErrors.address = "Address is required";
        isValid = false;
      }

      // Location coordinates validation
      if (!formData.latitude?.trim()) {
        newErrors.latitude = "Latitude is required";
        isValid = false;
      } else if (isNaN(parseFloat(formData.latitude)) || parseFloat(formData.latitude) < -90 || parseFloat(formData.latitude) > 90) {
        newErrors.latitude = "Latitude must be between -90 and 90";
        isValid = false;
      }

      if (!formData.longitude?.trim()) {
        newErrors.longitude = "Longitude is required";
        isValid = false;
      } else if (isNaN(parseFloat(formData.longitude)) || parseFloat(formData.longitude) < -180 || parseFloat(formData.longitude) > 180) {
        newErrors.longitude = "Longitude must be between -180 and 180";
        isValid = false;
      }

      // Privacy agreement validation
      if (!formData.privacyAgreement) {
        newErrors.privacyAgreement = true;
        isValid = false;
      }
    }

    // Agreement validation
    if (!formData.agreement) {
      newErrors.agreement = true;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Prepare registration data based on user type
      if (userType === "driver") {
        const fd = new FormData();
        fd.append("username", formData.name);
        fd.append("email", formData.email);
        fd.append("phone", formData.phone);
        fd.append("password", formData.password);
        fd.append("drivinglicenseNo", formData.drivinglicenseNo || "");
        fd.append("agreement", String(formData.agreement));
        if (formData.driverAddress) fd.append("address", formData.driverAddress);
        if (formData.driverExperience) fd.append("experience", formData.driverExperience);
        if (formData.bloodGroup) fd.append("bloodGroup", formData.bloodGroup);
        if (formData.dateOfBirth) fd.append("dateOfBirth", formData.dateOfBirth);
        if (formData.emergencyContact) fd.append("emergencyContact", formData.emergencyContact);
        if (formData.languages) fd.append("languages", formData.languages);
        if (formData.profileImage) fd.append("profileImage", formData.profileImage as File);
        if (formData.certificateOfDriving) fd.append("certificateOfDriving", formData.certificateOfDriving as File);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await authService.driverRegister(fd as any);
      } else {
        const userData = {
          username: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address || "",
          location: {
            lat: parseFloat(formData.latitude || "0"),
            long: parseFloat(formData.longitude || "0"),
          },
          privacyAgreement: formData.privacyAgreement || false,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await authService.userRegister(userData as any);
      }

      setSuccess(true);

      // Redirect after successful registration
      setTimeout(() => {
        navigate(loginLink);
      }, 2000);
    } catch (err: unknown) {
      console.error("Registration error:", err);
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      setError(
        error.response?.data?.message ||
        error.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value
    });
    // Clear error when user starts typing
    setErrors({ ...errors, [name]: "" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (!files || files.length === 0) return;
    const file = files[0];
    setFormData(prev => ({ ...prev, [name]: file }));
    setErrors({ ...errors, [name]: "" });

    if (name === "profileImage") {
      const url = URL.createObjectURL(file);
      setProfilePreview(url);
    }

    if (name === "certificateOfDriving") {
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setCertificatePreview(url);
      } else {
        setCertificatePreview(null);
      }
    }
  };

  const removeProfileImage = () => {
    if (profilePreview) {
      URL.revokeObjectURL(profilePreview);
      setProfilePreview(null);
    }
    setFormData(prev => ({ ...prev, profileImage: null }));
  };

  const removeCertificate = () => {
    if (certificatePreview) {
      URL.revokeObjectURL(certificatePreview);
      setCertificatePreview(null);
    }
    setFormData(prev => ({ ...prev, certificateOfDriving: null }));
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        });
        setError(null);
      },
      (err) => {
        setError("Unable to get your location. Please allow location access.");
        console.error("Geolocation error:", err);
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      {/* Back to Home */}
      <button
        onClick={() => navigate("/")}
        className="fixed top-6 left-6 flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors group z-10"
      >
        <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Home</span>
      </button>

      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <CheckCircle className="text-green-500" size={24} />
              <div>
                <p className="text-green-700 font-medium">Registration successful!</p>
                <p className="text-green-600 text-sm">Redirecting to login...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertCircle className="text-red-500" size={24} />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`block w-full pl-12 pr-4 py-3 border ${errors.name ? "border-red-300" : "border-gray-300"
                    } rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`block w-full pl-12 pr-4 py-3 border ${errors.email ? "border-red-300" : "border-gray-300"
                    } rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none`}
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone Input */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`block w-full pl-12 pr-4 py-3 border ${errors.phone ? "border-red-300" : "border-gray-300"
                    } rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none`}
                  placeholder="9876543210"
                />
              </div>
              {errors.phone && (
                <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Driver License (conditional) */}
            {includeDriverFields && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="drivinglicenseNo" className="block text-sm font-semibold text-gray-700 mb-2">
                    Driving License Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="drivinglicenseNo"
                      name="drivinglicenseNo"
                      type="text"
                      value={formData.drivinglicenseNo || ""}
                      onChange={handleInputChange}
                      className={`block w-full pl-12 pr-4 py-3 border ${errors.drivinglicenseNo ? "border-red-300" : "border-gray-300"
                        } rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none`}
                      placeholder="KL-1234567890123"
                    />
                  </div>
                  {errors.drivinglicenseNo && (
                    <p className="mt-2 text-sm text-red-600">{errors.drivinglicenseNo}</p>
                  )}
                </div>

                {/* Driver Address */}
                <div>
                  <label htmlFor="driverAddress" className="block text-sm font-semibold text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="driverAddress"
                      name="driverAddress"
                      type="text"
                      value={formData.driverAddress || ""}
                      onChange={handleInputChange}
                      className={`block w-full pl-12 pr-4 py-3 border ${errors.driverAddress ? "border-red-300" : "border-gray-300"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none`}
                      placeholder="Driver address"
                    />
                  </div>
                  {typeof errors.driverAddress === 'string' && (
                    <p className="mt-2 text-sm text-red-600">{errors.driverAddress}</p>
                  )}
                </div>

                {/* Profile Image */}
                <div>
                  <label htmlFor="profileImage" className="block text-sm font-semibold text-gray-700 mb-2">
                    Profile Image
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center relative">
                      {profilePreview ? (
                        <img src={profilePreview} alt="preview" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <input ref={profileInputRef} className="hidden" id="profileImage" name="profileImage" type="file" accept="image/*" onChange={handleFileChange} />

                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => profileInputRef.current?.click()} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50">{profilePreview ? 'Change' : 'Choose File'}</button>
                        {profilePreview ? (
                          <>
                            <span className="text-sm text-gray-700">{(formData.profileImage as File)?.name}</span>
                            <button type="button" onClick={removeProfileImage} className="text-red-600 text-sm hover:underline">Remove</button>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500">No file chosen</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label htmlFor="driverExperience" className="block text-sm font-semibold text-gray-700 mb-2">
                    Driving Experience (years)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Briefcase className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="driverExperience"
                      name="driverExperience"
                      type="number"
                      min="0"
                      value={formData.driverExperience || ""}
                      onChange={handleInputChange}
                      className={`block w-full pl-12 pr-4 py-3 border ${errors.driverExperience ? "border-red-300" : "border-gray-300"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none`}
                      placeholder="3"
                    />
                  </div>
                  {typeof errors.driverExperience === 'string' && (
                    <p className="mt-2 text-sm text-red-600">{errors.driverExperience}</p>
                  )}
                </div>

                {/* Personal Information */}
                <div className="pt-2 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Personal Information</h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700 mb-2">Blood Group</label>
                      <input id="bloodGroup" name="bloodGroup" type="text" value={formData.bloodGroup || ""} onChange={handleInputChange} className={`block w-full pr-4 py-3 border ${errors.bloodGroup ? "border-red-300" : "border-gray-300"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none`} placeholder="A+, O-, etc." />
                      {typeof errors.bloodGroup === 'string' && (<p className="mt-2 text-sm text-red-600">{errors.bloodGroup}</p>)}
                    </div>

                    <div>
                      <label htmlFor="certificateOfDriving" className="block text-sm font-medium text-gray-700 mb-2">Driving Certificate</label>
                      <input ref={certInputRef} className="hidden" id="certificateOfDriving" name="certificateOfDriving" type="file" accept="application/pdf,image/*" onChange={handleFileChange} />
                      {typeof errors.certificateOfDriving === 'string' && (<p className="mt-2 text-sm text-red-600">{errors.certificateOfDriving}</p>)}

                      {certificatePreview ? (
                        <div className="mt-3 w-full max-w-xs border rounded overflow-hidden relative">
                          <img src={certificatePreview} alt="certificate preview" className="w-full h-48 object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-sm text-white bg-black/30 px-3 py-1 rounded transform -rotate-12 opacity-90">{(formData.name || "GOKERAL").toUpperCase()} - LICENSE COPY</span>
                          </div>
                          <div className="p-2 flex items-center justify-between">
                            <div className="text-sm text-gray-700">{(formData.certificateOfDriving as File)?.name}</div>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => certInputRef.current?.click()} className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50">Change</button>
                              <button type="button" onClick={removeCertificate} className="text-red-600 text-sm hover:underline">Remove</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-3">
                          <button type="button" onClick={() => certInputRef.current?.click()} className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50">Choose File</button>
                          {formData.certificateOfDriving ? (
                            <span className="text-sm text-gray-700">{(formData.certificateOfDriving as File).name}</span>
                          ) : (
                            <span className="text-sm text-gray-500">No file chosen</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth || ""} onChange={handleInputChange} className={`block w-full pl-12 pr-4 py-3 border ${(errors as Record<string, unknown>).dateOfBirth ? "border-red-300" : "border-gray-300"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none`} />
                      </div>
                      {typeof errors.dateOfBirth === 'string' && (<p className="mt-2 text-sm text-red-600">{errors.dateOfBirth}</p>)}
                    </div>

                    <div>
                      <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                      <input id="emergencyContact" name="emergencyContact" type="tel" value={formData.emergencyContact || ""} onChange={handleInputChange} className={`block w-full pr-4 py-3 border ${errors.emergencyContact ? "border-red-300" : "border-gray-300"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none`} placeholder="9876543210" />
                      {typeof errors.emergencyContact === 'string' && (<p className="mt-2 text-sm text-red-600">{errors.emergencyContact}</p>)}
                    </div>

                    <div>
                      <label htmlFor="languages" className="block text-sm font-medium text-gray-700 mb-2">Languages</label>
                      <input id="languages" name="languages" type="text" value={formData.languages || ""} onChange={handleInputChange} className={`block w-full pr-4 py-3 border ${errors.languages ? "border-red-300" : "border-gray-300"} rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none`} placeholder="English, Hindi" />
                      {typeof errors.languages === 'string' && (<p className="mt-2 text-sm text-red-600">{errors.languages}</p>)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Address (User only) */}
            {userType === "user" && (
              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                    className={`block w-full pl-12 pr-4 py-3 border ${errors.address ? "border-red-300" : "border-gray-300"
                      } rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none`}
                    placeholder="123 Main St, City, State"
                  />
                </div>
                {typeof errors.address === 'string' && (
                  <p className="mt-2 text-sm text-red-600">{errors.address}</p>
                )}
              </div>
            )}

            {/* Location (User only) */}
            {userType === "user" && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-blue-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <MapPin className="h-5 w-5" />
                  Use my current location
                </button>
                {formData.latitude && formData.longitude && (
                  <p className="mt-3 text-sm text-green-600 text-center font-medium">
                    ✓ Location set ({parseFloat(formData.latitude).toFixed(4)}, {parseFloat(formData.longitude).toFixed(4)})
                  </p>
                )}
                {typeof errors.latitude === 'string' && (
                  <p className="mt-2 text-sm text-red-600">{errors.latitude}</p>
                )}
              </div>
            )}

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`block w-full pl-12 pr-12 py-3 border ${errors.password ? "border-red-300" : "border-gray-300"
                    } rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password}</p>
              )}

              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2 mt-4">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`block w-full pl-12 pr-12 py-3 border ${errors.confirmPassword ? "border-red-300" : "border-gray-300"
                    } rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Agreement Checkbox */}
            <div className="flex items-start">
              <input
                id="agreement"
                name="agreement"
                type="checkbox"
                checked={formData.agreement}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
              />
              <label htmlFor="agreement" className="ml-3 text-sm text-gray-700">
                I agree to the{" "}
                <a href="/terms" className="text-green-600 hover:text-green-700 font-medium">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-green-600 hover:text-green-700 font-medium">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.agreement && (
              <p className="text-sm text-red-600">You must agree to the terms to continue</p>
            )}

            {/* Privacy Policy Agreement */}
            <div className="flex items-start">
              <input
                id="privacyAgreement"
                name="privacyAgreement"
                type="checkbox"
                checked={formData.privacyAgreement || false}
                onChange={handleInputChange}
                className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 mt-1"
              />
              <label htmlFor="privacyAgreement" className="ml-3 text-sm text-gray-700">
                I have read and agree to the{" "}
                <a href="/privacy" className="text-green-600 hover:text-green-700 font-medium">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.privacyAgreement && (
              <p className="text-sm text-red-600">You must agree to the Privacy Policy to continue</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Already have an account?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <div className="mt-6">
            <a
              href={loginLink}
              className="w-full flex justify-center py-3 px-4 border-2 border-green-600 rounded-xl text-green-600 font-semibold hover:bg-green-50 transition-all"
            >
              Sign In to {userType === "driver" ? "Driver" : "User"} Account
            </a>
          </div>

          {/* Switch User Type */}
          <div className="mt-4">
            <a
              href={userType === "user" ? "/driver/register" : "/user/register"}
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-all"
            >
              {userType === "user" ? "Register as Driver" : "Register as User"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
