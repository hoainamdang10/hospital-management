import { apiClient } from './client';
import { Appointment, AppointmentForm, ApiResponse, FilterOptions } from '../types';

// Appointments API endpoints
export const appointmentsApi = {
  // Get all appointments
  getAll: async (filters?: FilterOptions): Promise<ApiResponse<Appointment[]>> => {
    return apiClient.get<Appointment[]>('/appointments', filters);
  },

  // Get appointment by ID
  getById: async (id: string): Promise<ApiResponse<Appointment>> => {
    return apiClient.get<Appointment>(`/appointments/${id}`);
  },

  // Create new appointment
  create: async (appointmentData: AppointmentForm): Promise<ApiResponse<Appointment>> => {
    return apiClient.post<Appointment>('/appointments', appointmentData);
  },

  // Update appointment
  update: async (id: string, appointmentData: Partial<AppointmentForm>): Promise<ApiResponse<Appointment>> => {
    return apiClient.put<Appointment>(`/appointments/${id}`, appointmentData);
  },

  // Delete appointment
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/appointments/${id}`);
  },

  // Update appointment status
  updateStatus: async (id: string, status: Appointment['status']): Promise<ApiResponse<Appointment>> => {
    return apiClient.patch<Appointment>(`/appointments/${id}/status`, { status });
  },

  // Get appointments by patient ID
  getByPatientId: async (patientId: string): Promise<ApiResponse<Appointment[]>> => {
    return apiClient.get<Appointment[]>(`/appointments/patient/${patientId}`);
  },

  // Get appointments by doctor ID
  getByDoctorId: async (doctorId: string): Promise<ApiResponse<Appointment[]>> => {
    return apiClient.get<Appointment[]>(`/appointments/doctor/${doctorId}`);
  },

  // Get available time slots for a doctor on a specific date
  getAvailableSlots: async (doctorId: string, date: string): Promise<ApiResponse<string[]>> => {
    return apiClient.get<string[]>(`/appointments/available-slots`, { doctorId, date });
  },

  // Cancel appointment
  cancel: async (id: string, reason?: string): Promise<ApiResponse<Appointment>> => {
    return apiClient.patch<Appointment>(`/appointments/${id}/cancel`, { reason });
  },

  // Reschedule appointment
  reschedule: async (id: string, newDate: string, newTime: string): Promise<ApiResponse<Appointment>> => {
    return apiClient.patch<Appointment>(`/appointments/${id}/reschedule`, {
      appointment_date: newDate,
      appointment_time: newTime
    });
  },
};
