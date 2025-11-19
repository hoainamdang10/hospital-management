import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create axios instance
// Use Next.js API proxy (/api/*) for same-origin requests
// This fixes cross-origin cookie issues (localhost:3000 vs localhost:3101)
const apiClient = axios.create({
  // Use Next.js API proxy for same-origin requests (fixes cookie issues)
  baseURL: '/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests (session-based auth)
});

// Request interceptor - Session-based auth (no need for Bearer token)
// Cookies are automatically sent with withCredentials: true
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // No need to manually attach token - session cookie is sent automatically
    // API Gateway reads session_token from cookies
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 (session expired)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // If 401 Unauthorized - session expired or invalid
    if (error.response?.status === 401) {
      console.warn('[axios] 401 Unauthorized received', {
        url: error.config?.url,
        hasSessionCookie: document.cookie.includes('session_token')
      });
      
      // Only redirect if NOT already on auth pages
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.startsWith('/auth/');
        if (!isAuthPage) {
          console.warn('[axios] Session expired, redirecting to login');
          window.location.href = '/auth/login?session=expired';
        }
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

export default apiClient;

// Export types
export type { AxiosError, AxiosResponse } from 'axios';
