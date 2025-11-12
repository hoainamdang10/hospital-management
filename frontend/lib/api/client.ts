/**
 * @deprecated THIS FILE IS DEPRECATED!
 * 
 * DO NOT USE FOR NEW CODE - Use axios.ts instead
 * 
 * This file uses localStorage-based authentication which has been replaced
 * with session-based authentication using HTTP-only cookies.
 * 
 * Migration completed:
 * - ✅ patient.service.ts → uses axios.ts
 * - ✅ availability.service.ts → uses axios.ts
 * - ✅ notifications.service.ts → uses axios.ts
 * - ✅ All new services → use axios.ts
 * 
 * This file is kept for backward compatibility only and will be removed in the future.
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, STORAGE_KEYS, ERROR_MESSAGES } from '@/lib/constants';

/**
 * @deprecated Axios instance for API calls - USE axios.ts INSTEAD
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add auth token to requests
 */
apiClient.interceptors.request.use(
  (config) => {
    // Get access token from localStorage
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors and token refresh
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(`${API_CONFIG.BASE_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        // Update tokens in localStorage
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
        
        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - Clear tokens and redirect to login
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Handle other errors
    return Promise.reject(error);
  }
);

/**
 * API Error Handler
 */
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string }>;
    
    // Network error
    if (!axiosError.response) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    // Server error with message
    if (axiosError.response.data?.message) {
      return axiosError.response.data.message;
    }
    
    if (axiosError.response.data?.error) {
      return axiosError.response.data.error;
    }
    
    // HTTP status errors
    switch (axiosError.response.status) {
      case 401:
        return ERROR_MESSAGES.UNAUTHORIZED;
      case 403:
        return ERROR_MESSAGES.FORBIDDEN;
      case 404:
        return ERROR_MESSAGES.NOT_FOUND;
      case 422:
        return ERROR_MESSAGES.VALIDATION_ERROR;
      case 500:
        return ERROR_MESSAGES.SERVER_ERROR;
      default:
        return ERROR_MESSAGES.UNKNOWN_ERROR;
    }
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Generic API request wrapper with error handling
 */
export async function apiRequest<T = any>(
  config: AxiosRequestConfig
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    const response = await apiClient(config);
    return { data: response.data, error: null };
  } catch (error) {
    return { data: null, error: handleApiError(error) };
  }
}

export default apiClient;
