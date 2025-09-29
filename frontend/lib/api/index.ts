// Export API client - Named exports for better tree-shaking
export { apiClient, ApiClient, handleApiError, isApiSuccess, getApiError } from './client';

// Export authentication API - Named exports
export { authServiceApi } from './auth';

// Export API services - Named exports for better tree-shaking
export { doctorsApi } from './doctors';
export { patientsApi } from './patients';
export { appointmentsApi } from './appointments';
export { departmentsApi } from './departments';
export { roomsApi } from './rooms';

// Export microservices APIs - Named exports
export { medicalRecordsApi } from './medical-records';
export { prescriptionsApi } from './prescriptions';
export { billingApi } from './billing';
export { paymentsApi } from './payments';

// Re-export types for convenience
export type {
  Doctor,
  Patient,
  Appointment,
  Department,
  Room,
  ApiResponse,
  DoctorForm,
  PatientForm,
  AppointmentForm,
  DepartmentForm,
  RoomForm,
  FilterOptions,
} from '../types';
