import axios from 'axios';

/**
 * API Clients for different microservices
 * Each service has its own port in development
 */

// Base configuration
const baseConfig = {
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Department Service (Port 3025)
export const departmentClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_DEPARTMENT_API || '',
  ...baseConfig,
});

// Provider/Staff Service (Port 3002)
export const staffClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_STAFF_API || '',
  ...baseConfig,
});

// Appointments Service (Port 3004)
export const appointmentsClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_APPOINTMENTS_API || '',
  ...baseConfig,
});

// Clinical EMR Service (Port 3007)
export const clinicalClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_CLINICAL_API || '',
  ...baseConfig,
});

// Patient Registry Service (Port 3003)
export const patientClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_PATIENT_API || '',
  ...baseConfig,
});

// Add JWT token interceptor to all clients
const clients = [departmentClient, staffClient, appointmentsClient, clinicalClient, patientClient];

clients.forEach((client) => {
  client.interceptors.request.use(
    (config) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Handle 401 Unauthorized
      if (error.response?.status === 401) {
        // Skip redirect in development mode
        const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true' || process.env.NODE_ENV === 'development';
        
        if (!isDevMode && typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/auth/login';
        } else if (isDevMode) {
          console.log('[DEV MODE] 401 Unauthorized - redirect skipped');
        }
      }
      return Promise.reject(error);
    }
  );
});
