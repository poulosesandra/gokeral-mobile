import axios from 'axios';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;

  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // prefer in-memory token, fall back to localStorage for backwards compatibility
    const token = authToken || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`📤 [API REQUEST] ${config.method?.toUpperCase()} ${config.url}`, 
      config.data ? config.data : '');
    
    return config;
  },
  (error) => {
    console.error('❌ [API REQUEST ERROR]:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API RESPONSE] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ [API ERROR]:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    });

    // Only redirect to home on 401 if it's NOT a login/register endpoint
    const isAuthEndpoint = error.config?.url?.includes('/login') || 
                          error.config?.url?.includes('/register');
    
    if (error.response?.status === 401 && !isAuthEndpoint) {
      console.warn('⚠️ [UNAUTHORIZED] Clearing localStorage and redirecting');
      localStorage.clear();
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export default api;