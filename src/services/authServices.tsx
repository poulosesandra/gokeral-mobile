import api from './api';

// ==================== INTERFACES ====================
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserSignupData {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  address?: string; // optional: used in profile updates
  agreement: boolean;
}

export interface DriverSignupData {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  driverLicenseNumber?: string;          // backend key
  profileImage?: string;           // new
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
  agreement: boolean;
  role?: 'DRIVER';                 // optional to allow default
  personalInfo?: {
    bloodGroup?: string;
    dob?: string;
    languages?: string[];
    certificates?: string[];
    emergencyContact?: { name?: string; phone?: string; relationship?: string };
  };
  drivingExperience?: {
    yearsOfExperience?: number;
    licensedSince?: string;
    totalTripsCompleted?: number;
    averageRating?: number;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    address?: string;
    role: string;
  };
  driver?: {
    id: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    driverLicenseNumber?: string;
    role: string;
  };
}

// ==================== AUTH SERVICE ====================
export const authService = {
  // User Registration
  userRegister: async (data: UserSignupData): Promise<AuthResponse> => {
    try {
      console.log('🔵 [USER REGISTER] Sending request:', {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
      });
      
      const response = await api.post<AuthResponse>('/auth/register-user', {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
      });
      
      console.log('✅ [USER REGISTER] Response:', response.data);
      
      if (response.data.token) {
        // NOTE: token and user data are deliberately NOT saved to localStorage for security.
        // Prefer httpOnly cookies set by the backend or in-memory storage managed by the app.
        console.log('✅ [USER REGISTER] Received token from server (not persisted client-side)');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [USER REGISTER] Error:', {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },

  // User Login
  userLogin: async (data: LoginCredentials): Promise<AuthResponse> => {
    try {
      console.log('🔵 [USER LOGIN] Sending request:', data.email);
      
      const response = await api.post<AuthResponse>('/auth/login', data);
      
      console.log('✅ [USER LOGIN] Response:', response.data);
      
      if (response.data.token) {
        // NOTE: token and user data are deliberately NOT saved to localStorage for security.
        console.log('✅ [USER LOGIN] Received token from server (not persisted client-side)');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [USER LOGIN] Error:', {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  // Logout
  logout: () => {
    console.log('🔵 [LOGOUT] Clearing localStorage');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userData');
    console.log('✅ [LOGOUT] localStorage cleared');
  },

  // Get Current User
  getCurrentUser: () => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Get user role
  getUserRole: () => {
    return localStorage.getItem('userRole');
  },

  // ==================== DRIVER METHODS ====================
  
  // Driver Registration (frontend: do NOT send `agreement` or `role` to backend)
  driverRegister: async (data: DriverSignupData): Promise<AuthResponse> => {
    try {
      // Build a sanitized payload that excludes UI-only fields (agreement, role)
      const payload: any = {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
      };

      if (data.address !== undefined) payload.address = data.address;
      if (data.location !== undefined) payload.location = data.location;
      if (data.driverLicenseNumber) payload.driverLicenseNumber = data.driverLicenseNumber;
      if (data.personalInfo) payload.personalInfo = data.personalInfo;
      if (data.drivingExperience) payload.drivingExperience = data.drivingExperience;

      console.log('🔵 [DRIVER REGISTER] Sending request (sanitized):', payload);

      const response = await api.post<AuthResponse>('/auth/register-driver', payload);

      console.log('✅ [DRIVER REGISTER] Response:', response.data);

      if (response.data.token) {
        // NOTE: token and driver data are deliberately NOT saved to localStorage for security.
        // Prefer httpOnly cookies set by the backend or in-memory storage managed by the app.
        console.log('✅ [DRIVER REGISTER] Received token from server (not persisted client-side)');
      }

      return response.data;
    } catch (error: any) {
      console.error('❌ [DRIVER REGISTER] Error:', {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw error;
    }
  },

  // Driver Login
  driverLogin: async (data: LoginCredentials): Promise<AuthResponse> => {
    try {
      console.log('🔵 [DRIVER LOGIN] Sending request:', data.email);
      
      const response = await api.post<AuthResponse>('/auth/login-driver', data);
      
      console.log('✅ [DRIVER LOGIN] Response:', response.data);
      
      if (response.data.token) {
        // NOTE: token and driver data are deliberately NOT saved to localStorage for security.
        console.log('✅ [DRIVER LOGIN] Received token from server (not persisted client-side)');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [DRIVER LOGIN] Error:', {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  fetchUserProfile: async () => {
    const res = await api.get('/users/profile'); // confirm endpoint
    return res.data;
  },

  fetchDriverProfile: async () => {
    const res = await api.get('/drivers/profile'); // confirm endpoint
    return res.data;
  },

  updateUserProfile: async (data: Partial<UserSignupData>) => {
    const payload = {
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      address: data.address,
    };
    const res = await api.patch('/users/update', payload);
    // Do not persist updated profile to localStorage; prefer server-side storage (httpOnly cookie/session)
    return res.data;
  },

  updateDriverProfile: async (data: Partial<DriverSignupData>) => {
    const payload = {
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      address: data.address,
      driverLicenseNumber: data.driverLicenseNumber,
      profileImage: data.profileImage,
      personalInfo: data.personalInfo || {},
      drivingExperience: data.drivingExperience || {},
      role: data.role || 'DRIVER',
    };
    const res = await api.patch('/drivers/update', payload);
    // Do not persist updated profile to localStorage; prefer server-side storage (httpOnly cookie/session)
    return res.data;
  },
};

export default authService;