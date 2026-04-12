import api, { setAuthToken, userApi, driverApi, bookingApi } from './api';

export const getLoginPathForRole = (role?: string | null): string => {
  return String(role || '').toUpperCase() === 'DRIVER' ? '/driver/login' : '/user/login';
};

// Extracted for test mocking
export const performRedirect = (path: string) => {
  window.location.assign(path);
};

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
    if (!userData) return null;
    
    const user = JSON.parse(userData);
    // Ensure role is available (fallback to separate userRole storage)
    if (!user.role) {
      const storedRole = localStorage.getItem('userRole');
      if (storedRole) {
        user.role = storedRole;
      }
    }
    return user;
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
  logout: (redirectTo?: string, redirectFn = performRedirect) => {
    const currentRole = authService.getUserRole();
    const targetPath = redirectTo || getLoginPathForRole(currentRole);
    authService.clearAuth();
    redirectFn(targetPath);
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
        profileImage: profileData.profileImage || currentUser?.profileImage || null,
        bloodGroup: profileData.bloodGroup,
        dateOfBirth: profileData.dateOfBirth || profileData.dob,
        dob: profileData.dateOfBirth || profileData.dob,
        languages: profileData.languages || [],
        licensedSince: profileData.licensedSince,
        experienceYears: profileData.experienceYears,
        isOnline: profileData.isOnline || false,
        // Map nested structure for frontend compatibility
        personalInfo: {
          bloodGroup: profileData.bloodGroup,
          dob: profileData.dateOfBirth || profileData.dob,
          languages: profileData.languages || [],
          certificates: [
            profileData.drivingLicenseCertificate,
            profileData.policeClearanceCertificate,
            profileData.medicalFitnessCertificate,
            profileData.addressProof,
            profileData.professionalTrainingCertificate,
          ].filter(Boolean),
          emergencyContact: profileData.emergencyContact || { name: "", phone: "", relationship: "" },
        },
        documents: {
          drivingLicenseCertificate: profileData.drivingLicenseCertificate || '',
          policeClearanceCertificate: profileData.policeClearanceCertificate || '',
          medicalFitnessCertificate: profileData.medicalFitnessCertificate || '',
          addressProof: profileData.addressProof || '',
          professionalTrainingCertificate: profileData.professionalTrainingCertificate || '',
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
    dateOfBirth?: string;
    languages?: string[];
    licensedSince?: string;
    experienceYears?: number;
  }) => {
    console.log('🔵 [CREATE DRIVER PROFILE] Creating profile with license:', data.licenseNumber);

    try {
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
          dob: res.data.dateOfBirth || data.dateOfBirth,
          languages: res.data.languages || data.languages || [],
          certificates: [],
          emergencyContact: { name: "", phone: "", relationship: "" },
        },
      };

      authService.setCurrentUser(updatedData);
      return updatedData;
    } catch (error: any) {
      if (error?.response?.status === 409) {
        console.warn('⚠️ [CREATE DRIVER PROFILE] Profile already exists, switching to update flow');
        return await authService.updateDriverProfile({
          licenseNumber: data.licenseNumber,
          bloodGroup: data.bloodGroup,
          dateOfBirth: data.dateOfBirth,
          languages: data.languages,
          licensedSince: data.licensedSince,
          experienceYears: data.experienceYears,
        } as any);
      }

      throw error;
    }
  },

  createDriverDocumentPresignedUpload: async (params: {
    category:
      | 'profileImage'
      | 'drivingLicenseCertificate'
      | 'policeClearanceCertificate'
      | 'medicalFitnessCertificate'
      | 'addressProof'
      | 'professionalTrainingCertificate';
    contentType: string;
    fileName?: string;
    expiresIn?: number;
  }) => {
    const res = await driverApi.post('/driver-profiles/me/documents/presign-upload', params);
    return res.data as {
      uploadUrl: string;
      fileUrl: string;
      key?: string;
      expiresIn?: number;
    };
  },

  resolveDriverFileViewUrl: async (fileUrl: string, expiresIn?: number) => {
    const source = String(fileUrl || '').trim();
    if (!source) return source;
    if (source.startsWith('data:')) return source;

    const canPresign = /^https?:\/\//i.test(source) || source.startsWith('driver-documents/');
    if (!canPresign) return source;

    try {
      const res = await driverApi.post('/driver-profiles/me/documents/presign-view', {
        fileUrl: source,
        expiresIn,
      });
      const presigned = res.data as { viewUrl?: string };
      return presigned?.viewUrl || source;
    } catch {
      return source;
    }
  },

  uploadDriverFilePresigned: async (
    file: File,
    category:
      | 'profileImage'
      | 'drivingLicenseCertificate'
      | 'policeClearanceCertificate'
      | 'medicalFitnessCertificate'
      | 'addressProof'
      | 'professionalTrainingCertificate',
  ) => {
    const contentType = file.type || 'application/octet-stream';

    const presign = await authService.createDriverDocumentPresignedUpload({
      category,
      contentType,
      fileName: file.name,
    });

    const putResponse = await fetch(presign.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      body: file,
    });

    if (!putResponse.ok) {
      throw new Error(`S3 upload failed with status ${putResponse.status}`);
    }

    return presign.fileUrl;
  },

  updateDriverProfile: async (data: Partial<DriverSignupData> & {
    profileImage?: string;
    bloodGroup?: string;
    dateOfBirth?: string;
    languages?: string[];
    licensedSince?: string;
    experienceYears?: number;
    emergencyContact?: { name?: string; phone?: string; relationship?: string };
    drivingLicenseCertificate?: string;
    policeClearanceCertificate?: string;
    medicalFitnessCertificate?: string;
    addressProof?: string;
    professionalTrainingCertificate?: string;
  }) => {
    const payload: any = {};
    
    // Map profile fields (accept both root-level and nested legacy structure)
    payload.bloodGroup = data.bloodGroup ?? data.personalInfo?.bloodGroup;
    payload.dateOfBirth = data.dateOfBirth ?? data.personalInfo?.dob;
    payload.languages = data.languages ?? data.personalInfo?.languages;
    payload.licenseNumber = (data as any).licenseNumber ?? data.driverLicenseNumber;
    
    // Map drivingExperience fields
    payload.licensedSince = data.licensedSince ?? (data as any).drivingExperience?.licensedSince;
    payload.experienceYears = data.experienceYears ?? (data as any).drivingExperience?.yearsOfExperience;
    if ((data as any).profileImage !== undefined) payload.profileImage = (data as any).profileImage;
    
    // Sprint 2: Individual document uploads
    if ((data as any).drivingLicenseCertificate) payload.drivingLicenseCertificate = (data as any).drivingLicenseCertificate;
    if ((data as any).policeClearanceCertificate) payload.policeClearanceCertificate = (data as any).policeClearanceCertificate;
    if ((data as any).medicalFitnessCertificate) payload.medicalFitnessCertificate = (data as any).medicalFitnessCertificate;
    if ((data as any).addressProof) payload.addressProof = (data as any).addressProof;
    if ((data as any).professionalTrainingCertificate) payload.professionalTrainingCertificate = (data as any).professionalTrainingCertificate;
    if ((data as any).emergencyContact) payload.emergencyContact = (data as any).emergencyContact;

    // Remove undefined keys so DTO validation remains clean
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined) delete payload[key];
    });
    
    console.log('🔵 [UPDATE DRIVER PROFILE] Sending:', payload);
    
    const res = await driverApi.put('/driver-profiles/me', payload);
    
    // Merge updated profile with current user data
    const currentUser = authService.getCurrentUser();
    const updatedData = {
      ...currentUser,
      ...res.data,
      driverLicenseNumber: res.data.licenseNumber,
      profileImage: res.data.profileImage ?? currentUser?.profileImage ?? null,
      personalInfo: {
        bloodGroup: res.data.bloodGroup,
        dob: res.data.dateOfBirth || res.data.dob,
        languages: res.data.languages || [],
        emergencyContact: res.data.emergencyContact || { name: "", phone: "", relationship: "" },
      },
      documents: {
        drivingLicenseCertificate: res.data.drivingLicenseCertificate,
        policeClearanceCertificate: res.data.policeClearanceCertificate,
        medicalFitnessCertificate: res.data.medicalFitnessCertificate,
        addressProof: res.data.addressProof,
        professionalTrainingCertificate: res.data.professionalTrainingCertificate,
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

            // Send location to driver-service - PATCH /driver-profiles/me/location
            const response = await driverApi.patch('/driver-profiles/me/location', {
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

      // GET /bookings/nearby-drivers?pickupLat=X&pickupLng=Y&radiusKm=Z
      const response = await bookingApi.get('/bookings/nearby-drivers', {
        params: {
          pickupLat: latitude,
          pickupLng: longitude,
          radiusKm,
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