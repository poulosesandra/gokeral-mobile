import api, { setAuthToken } from './api';

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
  driverLicenseNumber?: string; // backend key
  profileImage?: string;
  address: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  agreement: boolean;
  role?: 'DRIVER';
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
  // in-memory token for current session
  _token: null as string | null,
  // in-memory current user
  _currentUser: null as any | null,
  // initialization state
  _ready: false,

  // --- PERSISTENCE: Save Token ---
  setToken(token: string | null) {
    this._token = token;
    setAuthToken(token);

    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  // --- PERSISTENCE: Get Token ---
  getToken() {
    return this._token || localStorage.getItem('token');
  },

  // --- PERSISTENCE: Save User/Driver ---
  setCurrentUser(user: any | null) {
    this._currentUser = user;

    if (user) {
      localStorage.setItem('userData', JSON.stringify(user));
      const role = user.role || (user.driverLicenseNumber ? 'DRIVER' : 'USER');
      localStorage.setItem('userRole', role);
    } else {
      localStorage.removeItem('userData');
      localStorage.removeItem('userRole');
    }
  },

  // Get Current User (Memory -> LocalStorage)
  getCurrentUser: () => {
    if (authService._currentUser) return authService._currentUser;
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!authService.getToken();
  },

  // Get user role
  getUserRole: () => {
    const u = authService.getCurrentUser();
    return u?.role || localStorage.getItem('userRole');
  },

  // --- Lifecycle: init / ready / clear ---
  async initAuth() {
    // load token from storage (if any)
    const token = localStorage.getItem('token');
    if (token) {
      this.setToken(token);
      try {
        // attempt to fetch driver profile first
        const driver = await this.fetchDriverProfile().catch(() => null);
        if (driver) {
          this.setCurrentUser(driver);
        } else {
          const user = await this.fetchUserProfile().catch(() => null);
          if (user) this.setCurrentUser(user);
        }
      } catch (err) {
        // ignore - not authenticated or token invalid
      }
    }
    this._ready = true;
  },

  isReady() {
    return this._ready;
  },

  clearAuth() {
    this.setToken(null);
    this.setCurrentUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    this._ready = true;
  },

  // --- Logout Method ---
  logout: () => {
    authService.clearAuth();
    window.location.href = '/login';
  },

  // ==================== USER (PASSENGER) METHODS ====================

  // User Registration
  userRegister: async (data: UserSignupData): Promise<AuthResponse> => {
    try {
      console.log('🔵 [USER REGISTER] Sending request:', data.email);

      const payload = {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
      };

      const response = await api.post<AuthResponse>('/auth/register-user', payload);

      console.log('✅ [USER REGISTER] Response:', response.data);

      if (response.data.token) {
        authService.setToken(response.data.token);
        authService.setCurrentUser(response.data.user || null);
      }
      return response.data;
    } catch (error: any) {
      console.error('❌ [USER REGISTER] Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // User Login
  userLogin: async (data: LoginCredentials): Promise<AuthResponse> => {
    try {
      console.log('🔵 [USER LOGIN] Sending request:', data.email);

      const response = await api.post<AuthResponse>('/auth/login-user', data);

      console.log('✅ [USER LOGIN] Response:', response.data);

      if (response.data.token) {
        authService.setToken(response.data.token);
        authService.setCurrentUser(response.data.user || null);
      }
      return response.data;
    } catch (error: any) {
      console.error('❌ [USER LOGIN] Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==================== DRIVER METHODS ====================

  // Driver Registration
  driverRegister: async (data: DriverSignupData): Promise<AuthResponse> => {
    try {
      // Build a sanitized payload (do NOT send client-only props like agreement/role)
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
        authService.setToken(response.data.token);
        authService.setCurrentUser(response.data.driver || null);
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
        authService.setToken(response.data.token);
        authService.setCurrentUser(response.data.driver || null);
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

  // ==================== PROFILE METHODS ====================

  fetchUserProfile: async () => {
    const res = await api.get('/users/profile');
    return res.data;
  },

  fetchDriverProfile: async () => {
    const res = await api.get('/drivers/profile');
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
    if (res.data) {
      authService.setCurrentUser(res.data, );
    }
    return res.data;
  },

  updateDriverProfile: async (data: Partial<DriverSignupData>) => {
    const payload: any = {
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
    };
    if (data.address !== undefined) payload.address = data.address;
    if (data.driverLicenseNumber !== undefined) payload.driverLicenseNumber = data.driverLicenseNumber;
    if (data.profileImage !== undefined) payload.profileImage = data.profileImage;
    if (data.personalInfo !== undefined) payload.personalInfo = data.personalInfo;
    if (data.drivingExperience !== undefined) payload.drivingExperience = data.drivingExperience;

    const res = await api.patch('/drivers/update', payload);
    if (res.data) {
      authService.setCurrentUser(res.data);
    }
    return res.data;
  },
};

export default authService;