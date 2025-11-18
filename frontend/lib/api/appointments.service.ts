import apiClient from './axios';
import type {
  ScheduleAppointmentRequest,
  ScheduleAppointmentResponse,
  AppointmentReadModel,
  ListAppointmentsResponse,
  ListAppointmentsParams,
  SuccessResponse,
  CancelAppointmentRequest,
} from '@/lib/types/appointments';

/**
 * Appointments Service
 * Handles all appointment-related API calls
 */
export const appointmentsService = {
  /**
   * Schedule a new appointment (Simplified MVP endpoint)
   * POST /api/v1/appointments/book
   */
  async schedule(data: any): Promise<ScheduleAppointmentResponse> {
    const response = await apiClient.post<ScheduleAppointmentResponse>(
      '/v1/appointments/book',
      data
    );
    return response.data;
  },

  /**
   * List appointments with denormalized data (CQRS Read Model)
   * GET /api/v2/appointments
   */
  async list(params?: ListAppointmentsParams): Promise<ListAppointmentsResponse> {
    const response = await apiClient.get<ListAppointmentsResponse>('/v2/appointments', {
      params,
    });
    return response.data;
  },

  /**
   * Get appointment by ID with denormalized data
   * GET /api/v2/appointments/:id
   */
  async getById(id: string): Promise<AppointmentReadModel> {
    const response = await apiClient.get<AppointmentReadModel>(`/v2/appointments/${id}`);
    return response.data;
  },

  /**
   * Confirm appointment
   * POST /api/v1/appointments/:id/confirm
   */
  async confirm(id: string): Promise<SuccessResponse> {
    const response = await apiClient.post<SuccessResponse>(
      `/v1/appointments/${id}/confirm`
    );
    return response.data;
  },

  /**
   * Cancel appointment
   * POST /api/v1/appointments/:id/cancel
   */
  async cancel(id: string, data: CancelAppointmentRequest): Promise<SuccessResponse> {
    const response = await apiClient.post<SuccessResponse>(
      `/v1/appointments/${id}/cancel`,
      data
    );
    return response.data;
  },

  /**
   * Reschedule appointment
   * POST /api/v1/appointments/:id/reschedule
   */
  async reschedule(
    id: string,
    data: {
      appointmentDate: string;
      appointmentTime: string;
      reason?: string;
    }
  ): Promise<SuccessResponse> {
    const response = await apiClient.post<SuccessResponse>(
      `/v1/appointments/${id}/reschedule`,
      data
    );
    return response.data;
  },

  /**
   * Get appointments for a specific patient
   * GET /api/v2/patients/:patientId/appointments
   */
  async getPatientAppointments(
    patientId: string,
    params?: {
      page?: number;
      pageSize?: number;
      status?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<ListAppointmentsResponse> {
    const response = await apiClient.get<ListAppointmentsResponse>(
      `/v2/patients/${patientId}/appointments`,
      { params }
    );
    return response.data;
  },
};
