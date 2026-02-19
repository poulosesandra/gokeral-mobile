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
        // Check user role first, then fetch appropriate profile
        const userData = localStorage.getItem('userData');
        const userRole = userData ? JSON.parse(userData).role : null;
        
        if (userRole === 'DRIVER') {
          console.log('🔵 [INIT AUTH] Fetching driver profile');
          const driver = await this.fetchDriverProfile().catch((err) => {
            console.warn('⚠️ [INIT AUTH] Driver profile fetch failed:', err.response?.status);
            return null;
          });
          if (driver) this.setCurrentUser(driver);
        } else if (userRole === 'USER') {
          console.log('🔵 [INIT AUTH] Fetching user profile');
          const user = await this.fetchUserProfile().catch((err) => {
            console.warn('⚠️ [INIT AUTH] User profile fetch failed:', err.response?.status);
            return null;
          });
          if (user) this.setCurrentUser(user);
        } else {
          console.warn('⚠️ [INIT AUTH] Unknown role, skipping profile fetch');
        }
      } catch (err) {
        console.error('❌ [INIT AUTH] Error:', err);
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
        // Save user data and fallback to request data when backend omits phoneNumber
        const userData = {
          ...response.data.user,
          fullName: response.data.user.fullName || data.fullName || '',
          phoneNumber: response.data.user.phoneNumber || data.phoneNumber || '',
        };
        authService.setCurrentUser(userData);
        console.log('💾 [USER REGISTER] Saved user data:', userData);
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
        // Merge with any existing stored account data so phoneNumber isn't lost when backend omits it
        const existing = authService.getCurrentUser() || {};
        const userData = {
          ...existing,
          ...response.data.user,
          fullName: response.data.user.fullName || existing.fullName || '',
          phoneNumber: response.data.user.phoneNumber || existing.phoneNumber || '',
        };
        authService.setCurrentUser(userData);
        console.log('💾 [USER LOGIN] Saved user data:', userData);

        // Enrich account data from profile service if available
        try {
          const merged = await authService.fetchUserProfile().catch(() => null);
          if (merged) {
            authService.setCurrentUser(merged);
            console.log('🔁 [USER LOGIN] Merged profile data into userData');
          }
        } catch (e) {
          /* ignore */
        }
      }
      return response.data;
    } catch (error: any) {
      console.error('❌ [USER LOGIN] Error:', error.response?.data || error.message);
      throw error;
    }
  },

  // ==================== DRIVER METHODS ====================

  // Driver Registration (Account creation only - profile completion happens later)
  driverRegister: async (data: DriverSignupData): Promise<AuthResponse> => {
    try {
      // STEP 1: Create driver account (basic info only)
      const accountPayload = {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password: data.password,
        role: 'DRIVER',
      };

      console.log('🔵 [DRIVER REGISTER] Creating driver account:', accountPayload);

      const response = await api.post<AuthResponse>('/auth/register', accountPayload);

      console.log('✅ [DRIVER REGISTER] Account created successfully');
      console.log('ℹ️  [DRIVER REGISTER] Driver will complete profile (license number) later');

      if (response.data.accessToken) {
        authService.setToken(response.data.accessToken);
        // Save user data and fallback to request data when backend omits phoneNumber
        const userData = {
          ...response.data.user,
          fullName: response.data.user.fullName || data.fullName || '',
          phoneNumber: response.data.user.phoneNumber || data.phoneNumber || '',
        };
        authService.setCurrentUser(userData);
        console.log('💾 [DRIVER REGISTER] Saved user data:', userData);
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
        // Merge with any existing stored account data so phoneNumber isn't lost when backend omits it
        const existing = authService.getCurrentUser() || {};
        const userData = {
          ...existing,
          ...response.data.user,
          fullName: response.data.user.fullName || existing.fullName || '',
          phoneNumber: response.data.user.phoneNumber || existing.phoneNumber || '',
        };
        authService.setCurrentUser(userData);
        console.log('💾 [DRIVER LOGIN] Saved user data:', userData);

        // Enrich account data from driver-profile service if available
        try {
          const merged = await authService.fetchDriverProfile().catch(() => null);
          if (merged) {
            authService.setCurrentUser(merged);
            console.log('🔁 [DRIVER LOGIN] Merged driver profile data into userData');
          }
        } catch (e) {
          /* ignore */
        }
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
    // Get account data from localStorage (from login)
    const currentUser = authService.getCurrentUser();
    
    try {
      // Fetch profile data from backend
      const profileRes = await userApi.get('/profiles/me');
      const profileData = profileRes.data;
      
      // Merge account data with profile data
      return {
        ...currentUser,           // fullName, email, phoneNumber, role from login
        ...profileData,           // address, image, preferences from profile
        id: currentUser?.id || currentUser?._id,
        profileImage: profileData.image || null,
      };
    } catch (error: any) {
      // If profile doesn't exist (404), return just account data
      if (error.response?.status === 404) {
        return currentUser;
      }
      throw error;
    }
  },

  fetchDriverProfile: async () => {
    // Get account data from localStorage (from login)
    const currentUser = authService.getCurrentUser();
    
    try {
      // Fetch driver profile data from backend
      const profileRes = await driverApi.get('/driver-profiles/me');
      const profileData = profileRes.data;
      
      // Merge account data with profile data
      return {
        ...currentUser,                           // fullName, email, phoneNumber, role from login
        licenseNumber: profileData.licenseNumber, // From driver profile
        driverLicenseNumber: profileData.licenseNumber, // Alias for frontend compatibility
        bloodGroup: profileData.bloodGroup,
        dob: profileData.dob,
        languages: profileData.languages || [],
        licensedSince: profileData.licensedSince,
        experienceYears: profileData.experienceYears,
        isOnline: profileData.isOnline || false,
        // Map nested structure for frontend compatibility
        personalInfo: {
          bloodGroup: profileData.bloodGroup,
          dob: profileData.dob,
          languages: profileData.languages || [],
          certificates: [], // Not supported yet
          emergencyContact: { name: "", phone: "", relationship: "" }, // Not supported yet
        },
      };
    } catch (error: any) {
      // If profile doesn't exist (404), return just account data
      if (error.response?.status === 404) {
        return currentUser;
      }
      throw error;
    }
  },

  updateUserProfile: async (data: Partial<UserSignupData>) => {
    const payload: any = {};
    
    // Only include fields that backend accepts
    if (data.address !== undefined) payload.address = data.address;
    if ((data as any).profileImage !== undefined) payload.image = (data as any).profileImage; // Rename to 'image'
    
    // Add preferences and addressDetails if available
    if ((data as any).preferences !== undefined) {
      const p = (data as any).preferences;
      if (Array.isArray(p)) payload.preferences = p;
      else if (typeof p === 'string') payload.preferences = [p];
      else {
        // ignore unexpected shapes (avoid backend validation 400) — log for visibility
        console.warn('[UPDATE USER PROFILE] Ignoring preferences with unexpected shape:', p);
      }
    }
    if ((data as any).addressDetails !== undefined) payload.addressDetails = (data as any).addressDetails;
    
    console.log('🔵 [UPDATE USER PROFILE] Sending:', payload);
    
    try {
      const res = await userApi.put('/profiles/me', payload);
      
      // Merge updated profile with current user data
      const currentUser = authService.getCurrentUser();
      const updatedData = {
        ...currentUser,
        ...res.data,
        profileImage: res.data.image || null,
      };
      
      authService.setCurrentUser(updatedData);
      return updatedData;
    } catch (error: any) {
      // If profile doesn't exist (404), create it first
      if (error.response?.status === 404) {
        console.log('⚠️ [UPDATE USER PROFILE] Profile not found, creating new profile');
        return await authService.createUserProfile(data);
      }
      throw error;
    }
  },

  /**
   * Create user profile (first time)
   */
  createUserProfile: async (data: Partial<UserSignupData>) => {
    const payload: any = {};
    
    // Only include fields that backend accepts
    if (data.address !== undefined) payload.address = data.address;
    if ((data as any).profileImage !== undefined) payload.image = (data as any).profileImage;
    if ((data as any).preferences !== undefined) {
      const p = (data as any).preferences;
      if (Array.isArray(p)) payload.preferences = p;
      else if (typeof p === 'string') payload.preferences = [p];
      else console.warn('[CREATE USER PROFILE] Ignoring preferences with unexpected shape:', p);
    }
    if ((data as any).addressDetails !== undefined) payload.addressDetails = (data as any).addressDetails;
    
    console.log('🔵 [CREATE USER PROFILE] Creating profile:', payload);
    
    const res = await userApi.post('/profiles', payload);
    
    console.log('✅ [CREATE USER PROFILE] Profile created:', res.data);
    
    // Merge new profile with current user data
    const currentUser = authService.getCurrentUser();
    const updatedData = {
      ...currentUser,
      ...res.data,
      profileImage: res.data.image || null,
    };
    
    authService.setCurrentUser(updatedData);
    return updatedData;
  },

  /**
   * Create driver profile (first time - must include license number)
   */
  createDriverProfile: async (data: {
    licenseNumber: string;
    bloodGroup?: string;
    dob?: string;
    languages?: string[];
    licensedSince?: string;
    experienceYears?: number;
  }) => {
    console.log('🔵 [CREATE DRIVER PROFILE] Creating profile with license:', data.licenseNumber);
    
    const res = await driverApi.post('/driver-profiles', data);
    
    console.log('✅ [CREATE DRIVER PROFILE] Profile created:', res.data);
    
    // Merge new profile data with current user data
    const currentUser = authService.getCurrentUser();
    const updatedData = {
      ...currentUser,
      licenseNumber: data.licenseNumber,
      driverLicenseNumber: data.licenseNumber,
      personalInfo: {
        bloodGroup: res.data.bloodGroup || data.bloodGroup,
        dob: res.data.dob || data.dob,
        languages: res.data.languages || data.languages || [],
        certificates: [],
        emergencyContact: { name: "", phone: "", relationship: "" },
      },
    };
    
    authService.setCurrentUser(updatedData);
    return updatedData;
  },

  updateDriverProfile: async (data: Partial<DriverSignupData>) => {
    const payload: any = {};
    
    // Map personalInfo fields to root level (backend structure)
    if (data.personalInfo?.bloodGroup) payload.bloodGroup = data.personalInfo.bloodGroup;
    if (data.personalInfo?.dob) payload.dob = data.personalInfo.dob;
    if (data.personalInfo?.languages) payload.languages = data.personalInfo.languages;
    
    // Map drivingExperience fields
    if ((data as any).drivingExperience?.licensedSince) {
      payload.licensedSince = (data as any).drivingExperience.licensedSince;
    }
    if ((data as any).drivingExperience?.yearsOfExperience) {
      payload.experienceYears = (data as any).drivingExperience.yearsOfExperience;
    }
    
    console.log('🔵 [UPDATE DRIVER PROFILE] Sending:', payload);
    
    const res = await driverApi.put('/driver-profiles/me', payload);
    
    // Merge updated profile with current user data
    const currentUser = authService.getCurrentUser();
    const updatedData = {
      ...currentUser,
      ...res.data,
      driverLicenseNumber: res.data.licenseNumber,
      personalInfo: {
        bloodGroup: res.data.bloodGroup,
        dob: res.data.dob,
        languages: res.data.languages || [],
        certificates: [],
        emergencyContact: { name: "", phone: "", relationship: "" },
      },
    };
    
    authService.setCurrentUser(updatedData);
    return updatedData;
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