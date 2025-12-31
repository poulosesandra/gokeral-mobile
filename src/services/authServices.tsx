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
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', 'USER');
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        console.log('✅ [USER REGISTER] Token and user data saved to localStorage');
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
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', 'USER');
        localStorage.setItem('userData', JSON.stringify(response.data.user));
        console.log('✅ [USER LOGIN] Token and user data saved to localStorage');
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
  
  // Driver Registration
  driverRegister: async (data: DriverSignupData): Promise<AuthResponse> => {
    try {
      console.log('🔵 [DRIVER REGISTER] Sending request:', {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
        address: data.address,
        location: data.location,
        agreement: data.agreement,
        role: data.role,
        driverLicenseNumber: data.driverLicenseNumber,
      });

      const response = await api.post<AuthResponse>('/auth/register-driver', {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
        address: data.address,
        location: data.location,
        agreement: data.agreement,
        role: data.role || 'DRIVER',
        // Map frontend driverLicenseNumber -> backend driverLicenseNumber
        driverLicenseNumber: data.driverLicenseNumber,
      });

      console.log('✅ [DRIVER REGISTER] Response:', response.data);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', 'DRIVER');
        localStorage.setItem('userData', JSON.stringify(response.data.driver));
        console.log('✅ [DRIVER REGISTER] Token and driver data saved to localStorage');
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
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', 'DRIVER');
        localStorage.setItem('userData', JSON.stringify(response.data.driver));
        console.log('✅ [DRIVER LOGIN] Token and driver data saved to localStorage');
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
    localStorage.setItem('userData', JSON.stringify(res.data));
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
    localStorage.setItem('userData', JSON.stringify(res.data));
    return res.data;
  },
};

export default authService;