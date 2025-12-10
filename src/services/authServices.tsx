import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface UserRegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface DriverRegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  drivinglicenseNo: string;
  agreement: boolean;
}

export interface AuthResponse {
  message: string;
  user?: any;
  driver?: any;
  access_token: string;
}

export const authService = {
  // User authentication
  userLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/users/login', credentials);
    if (response.data.access_token) {
      localStorage.setItem('accessToken', response.data.access_token);
      localStorage.setItem('userType', 'user');
      if (response.data.user) {
        localStorage.setItem('userData', JSON.stringify(response.data.user));
      }
    }
    return response.data;
  },

  userRegister: async (data: UserRegisterData) => {
    const response = await api.post('/users/signup', data);
    return response.data;
  },

  // Driver authentication
  driverLogin: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/drivers/login', credentials);
    if (response.data.access_token) {
      localStorage.setItem('accessToken', response.data.access_token);
      localStorage.setItem('userType', 'driver');
      if (response.data.user || response.data.driver) {
        localStorage.setItem('userData', JSON.stringify(response.data.user || response.data.driver));
      }
    }
    return response.data;
  },

  driverRegister: async (data: DriverRegisterData) => {
    // Convert phone to number if it's a string
    const payload = {
      ...data,
      phone: typeof data.phone === 'string' ? parseInt(data.phone) : data.phone,
    };
    const response = await api.post('/drivers/signup', payload);
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userType');
    localStorage.removeItem('userData');
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/drivers/details');
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('accessToken');
  },

  // Get user type
  getUserType: (): string | null => {
    return localStorage.getItem('userType');
  },

  // Get stored user data
  getStoredUserData: (): any | null => {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },
};

export default authService;