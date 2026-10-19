import axios from 'axios';

const getApiBaseUrl = (): string => {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (fromEnv && fromEnv.trim()) return fromEnv;

  // In local development, default to the local backend.
  if (import.meta.env.DEV) return 'https://darkorchid-kudu-454380.hostingersite.com/api';

  // Production / fallback
  return 'https://darkorchid-kudu-454380.hostingersite.com/api';
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData - let axios handle it
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    // Dev-only debug: log outgoing requests and whether auth header is present
    if (import.meta.env.DEV) {
      try {
        // eslint-disable-next-line no-console
        console.debug('[api] request', { url: config.url, method: config.method, hasAuth: !!config.headers?.Authorization });
      } catch (e) {
        // ignore
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      // Handle 401 Unauthorized - Token expired or invalid
      if (error.response.status === 401) {
        // Don't automatically clear storage / redirect for auth-related endpoints
        const reqUrl = error.config?.url || '';
        const skipAuthEndpoints = ['/auth/login', '/auth/register', '/auth/logout'];
        const isAuthEndpoint = skipAuthEndpoints.some((ep) => reqUrl.includes(ep));

        // Helpful debug log
        // eslint-disable-next-line no-console
        console.debug('[api] 401 from', reqUrl, 'skipRedirect=', isAuthEndpoint);

        if (!isAuthEndpoint) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth:changed'));
          // Avoid a hard reload loop if we're already navigating to /login
          if (window.location.pathname !== '/login') {
            window.location.replace('/login');
          }
        }
      }
      
      // Handle blob responses (e.g. export errors) – extract JSON message
      let errorMessage = 'An error occurred';
      if (error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          errorMessage = json.message || errorMessage;
        } catch {
          // not JSON, keep generic message
        }
      } else {
        errorMessage = error.response.data?.message || errorMessage;
      }

      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);

export default api;
