import api from './api';

// Export interfaces
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserSignupData {
  username: string;
  email: string;
  password: string;
  phone?: string;
}

export interface DriverSignupData {
  username: string;
  email: string;
  password: string;
  phone: string;
  licenseNumber?: string;
}

export interface AuthResponse {
  access_token: string;
  user?: any;
  driver?: any;
}

// Auth Service
export const authService = {
  // User Authentication
  userSignup: async (userData: UserSignupData): Promise<AuthResponse> => {
    const response = await api.post('/auth/user/signup', userData);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('userType', 'user');
    }
    return response.data;
  },

  // Alias for userSignup
  userRegister: async (userData: UserSignupData): Promise<AuthResponse> => {
    return authService.userSignup(userData);
  },

  userLogin: async (loginData: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/user/login', loginData);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('userType', 'user');
    }
    return response.data;
  },

  // Driver Authentication
  driverSignup: async (driverData: DriverSignupData): Promise<AuthResponse> => {
    const response = await api.post('/auth/driver/signup', driverData);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('userType', 'driver');
    }
    return response.data;
  },

  // Alias for driverSignup
  driverRegister: async (driverData: DriverSignupData): Promise<AuthResponse> => {
    return authService.driverSignup(driverData);
  },

  driverLogin: async (loginData: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/driver/login', loginData);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('userType', 'driver');
    }
    return response.data;
  },

  // Utility functions
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  getUserType: (): string | null => {
    return localStorage.getItem('userType');
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },
};

// Default export
export default authService;