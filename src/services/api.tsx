import axios from 'axios';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;

  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    userApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    driverApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    bookingApi.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
    delete userApi.defaults.headers.common['Authorization'];
    delete driverApi.defaults.headers.common['Authorization'];
    delete bookingApi.defaults.headers.common['Authorization'];
  }
}

// Auth Service API (Port 3001)
const api = axios.create({
  baseURL: import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,
});

// User Service API (Port 3002)
export const userApi = axios.create({
  baseURL: import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3002',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,
});

// Driver Service API (Port 3003)
export const driverApi = axios.create({
  baseURL: import.meta.env.VITE_DRIVER_SERVICE_URL || 'http://localhost:3003',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,
});

// Booking Service API (Port 3004) - Sprint 2
export const bookingApi = axios.create({
  baseURL: import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3004',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,
});

// Shared interceptor configurations
const requestInterceptor = (config: any) => {
  const token = authToken || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log(`📤 [API REQUEST] ${config.method?.toUpperCase()} ${config.url}`, 
    config.data ? config.data : '');
  
  return config;
};

const requestErrorInterceptor = (error: any) => {
  console.error('❌ [API REQUEST ERROR]:', error);
  return Promise.reject(error);
};

const responseInterceptor = (response: any) => {
  console.log(`✅ [API RESPONSE] ${response.status} ${response.config.url}`);
  return response;
};

const responseErrorInterceptor = (error: any) => {
  console.error('❌ [API ERROR]:', {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    message: error.response?.data?.message || error.message,
    data: error.response?.data,
  });

  const isAuthEndpoint = error.config?.url?.includes('/login') || 
                        error.config?.url?.includes('/register');
  
  // Don't redirect on profile/data endpoints - let components handle 401
  const isProfileEndpoint = error.config?.url?.includes('/profiles/') ||
                           error.config?.url?.includes('/driver-profiles/') ||
                           error.config?.url?.includes('/bookings') ||
                           error.config?.url?.includes('/vehicles');
  
  if (error.response?.status === 401 && !isAuthEndpoint && !isProfileEndpoint) {
    console.warn('⚠️ [UNAUTHORIZED] Clearing localStorage and redirecting');
    localStorage.clear();
    window.location.href = '/';
  }
  
  return Promise.reject(error);
};

// Apply interceptors to all API instances
[api, userApi, driverApi, bookingApi].forEach(instance => {
  instance.interceptors.request.use(requestInterceptor, requestErrorInterceptor);
  instance.interceptors.response.use(responseInterceptor, responseErrorInterceptor);
});

export default api;