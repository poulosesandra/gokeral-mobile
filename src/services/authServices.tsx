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

export interface DriverRegisterData extends UserRegisterData {
  drivinglicenseNo?: string;
  agreement?: boolean;
}

export const authService = {
  // User authentication
  userLogin: async (credentials: LoginCredentials) => {
    const response = await api.post('/users/login', credentials);
    if (response.data.access_token) {
      localStorage.setItem('accessToken', response.data.access_token);
      localStorage.setItem('userType', 'user');
    }
    return response.data;
  },

  userRegister: async (data: UserRegisterData) => {
    const response = await api.post('/users/signup', data);
    return response.data;
  },

  // Driver authentication
  driverLogin: async (credentials: LoginCredentials) => {
    const response = await api.post('/drivers/login', credentials);
    if (response.data.access_token) {
      localStorage.setItem('accessToken', response.data.access_token);
      localStorage.setItem('userType', 'driver');
    }
    return response.data;
  },

  driverRegister: async (data: DriverRegisterData) => {
    const response = await api.post('/drivers/signup', data);
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userType');
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
};

export default authService;