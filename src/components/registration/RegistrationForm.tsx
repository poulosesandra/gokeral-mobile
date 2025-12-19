import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Mail, Lock, Eye, EyeOff, ArrowLeft, User, Phone, FileText, CheckCircle, AlertCircle } from "lucide-react";
import authService from "../../services/authServices";

interface RegistrationFormProps {
  userType: "user" | "driver";
  loginLink: string;
  title: string;
  subtitle: string;
  includeDriverFields?: boolean;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  drivinglicenseNo?: string;
  agreement: boolean;
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
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
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

    // Agreement validation
    if (!formData.agreement) {
      (newErrors as Record<string, unknown>).agreement = true;
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
      if (userType === "driver") {
        const { name, email, phone, password, drivinglicenseNo, agreement } = formData;
        const driverData = {
          name,
          email,
          phone,
          password,
          drivinglicenseNo: drivinglicenseNo || '',
          agreement,
        };
        await authService.driverRegister(driverData);
        setSuccess(true);
        setTimeout(() => navigate(loginLink), 2000);
      } else {
        const { name, email, password, phone, agreement } = formData;
        const userData = {
          name,
          email,
          password,
          phone,
          agreement,
        };
        await authService.userRegister(userData);
        setSuccess(true);
        setTimeout(() => navigate(loginLink), 2000);
      }
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
          <div className="flex justify-center mb-4">
            <div className="bg-green-600 p-4 rounded-2xl shadow-lg">
              <Car className="h-10 w-10 text-white" />
            </div>
          </div>
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
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
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
