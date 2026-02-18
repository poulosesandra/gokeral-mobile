import api, { setAuthToken, userApi, driverApi } from './api';

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
  success?: boolean;
  message?: string;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    fullName?: string;
    phoneNumber?: string;
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
        role: 'USER',
      };

      const response = await api.post<AuthResponse>('/auth/register', payload);

      console.log('✅ [USER REGISTER] Response:', response.data);

      if (response.data.accessToken) {
        authService.setToken(response.data.accessToken);
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

      const response = await api.post<AuthResponse>('/auth/login', data);

      console.log('✅ [USER LOGIN] Response:', response.data);

      if (response.data.accessToken) {
        authService.setToken(response.data.accessToken);
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
        role: 'DRIVER',
      };

      if (data.address !== undefined) payload.address = data.address;
      if (data.location !== undefined) payload.location = data.location;
      if (data.driverLicenseNumber) payload.licenseNumber = data.driverLicenseNumber;
      if (data.personalInfo) payload.personalInfo = data.personalInfo;
      if (data.drivingExperience) payload.drivingExperience = data.drivingExperience;

      console.log('🔵 [DRIVER REGISTER] Sending request (sanitized):', payload);

      const response = await api.post<AuthResponse>('/auth/register', payload);

      console.log('✅ [DRIVER REGISTER] Response:', response.data);

      if (response.data.accessToken) {
        authService.setToken(response.data.accessToken);
        authService.setCurrentUser(response.data.user || null);
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

      const response = await api.post<AuthResponse>('/auth/login', data);

      console.log('✅ [DRIVER LOGIN] Response:', response.data);

      if (response.data.accessToken) {
        authService.setToken(response.data.accessToken);
        authService.setCurrentUser(response.data.user || null);
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
    const res = await userApi.get('/profiles/me');
    return res.data;
  },

  fetchDriverProfile: async () => {
    const res = await driverApi.get('/driver-profiles/me');
    return res.data;
  },

  updateUserProfile: async (data: Partial<UserSignupData>) => {
    const payload = {
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      address: data.address,
    };
    const res = await userApi.put('/profiles/me', payload);
    if (res.data) {
      authService.setCurrentUser(res.data);
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
    if (data.driverLicenseNumber !== undefined) payload.licenseNumber = data.driverLicenseNumber;
    if (data.profileImage !== undefined) payload.profileImage = data.profileImage;
    if (data.personalInfo !== undefined) payload.personalInfo = data.personalInfo;
    if (data.drivingExperience !== undefined) payload.drivingExperience = data.drivingExperience;

    const res = await driverApi.put('/driver-profiles/me', payload);
    if (res.data) {
      authService.setCurrentUser(res.data);
    }
    return res.data;
  },

  // ==================== LOCATION METHODS ====================

  // Update Driver Location (Real-time tracking)
  requestAndUpdateDriverLocation: async () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;

            console.log('📍 [DRIVER LOCATION] Getting location:', { latitude, longitude });

            // Send location to backend - POST /drivers/location/update
            const response = await api.post('/drivers/location/update', {
              latitude,
              longitude,
              isOnline: true,
            });

            console.log('✅ [DRIVER LOCATION] Updated:', response.data);
            resolve(response.data);
          } catch (error: any) {
            console.error('❌ [DRIVER LOCATION] Update failed:', error.response?.data || error.message);
            reject(error);
          }
        },
        (error) => {
          console.error('❌ [GEOLOCATION] Error:', error);
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  },

  // Search for Nearby Available Drivers (For Customer Booking)
  getNearbyDrivers: async (latitude: number, longitude: number, radiusKm: number = 5) => {
    try {
      console.log('🔍 [SEARCH DRIVERS] Nearby drivers:', { latitude, longitude, radiusKm });

      // GET /bookings/nearby-drivers?latitude=X&longitude=Y&radius=Z
      const response = await api.get('/bookings/nearby-drivers', {
        params: {
          latitude,
          longitude,
          radius: radiusKm,
        },
      });

      console.log('✅ [SEARCH DRIVERS] Found drivers:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [SEARCH DRIVERS] Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update Driver Location Periodically (Background tracking) — REMOVED
  // To avoid implicit polling the background interval-based tracker was removed.
  // If needed, use explicit calls to `requestAndUpdateDriverLocation()` or re-enable with an explicit utility.
  startLocationTracking: (_intervalMs: number = 30000) => {
    console.warn('startLocationTracking is disabled to avoid implicit polling. Use explicit update calls instead.');
    return null;
  },

  // Stop Location Tracking — now a no-op (keeps backward compatibility)
  stopLocationTracking: (_intervalId: any) => {
    // no-op
  },
};

// ==================== REGISTER / LOGIN METHODS ====================

interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role?: 'user' | 'driver'; // ADD THIS
  driverLicenseNumber?: string;
}

export const register = async (userData: RegisterPayload) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const login = async (credentials: { email: string; password: string }) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export default authService;