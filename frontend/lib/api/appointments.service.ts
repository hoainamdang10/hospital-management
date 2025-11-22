import apiClient from './axios';
import type {
  ScheduleAppointmentResponse,
  AppointmentReadModel,
  ListAppointmentsResponse,
  ListAppointmentsParams,
  SuccessResponse,
  CancelAppointmentRequest,
  CancelAppointmentResponse,
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
    const response = await apiClient.get<any>('/v1/appointments', {
      params,
    });

    // Backend returns: { success, data: { appointments, total, page, pageSize, totalPages } }
    const result = response.data.data || response.data; // Support both nested and flat structure

    return {
      success: response.data.success,
      appointments: result.appointments || [],
      totalCount: result.total || 0,
      hasMore: result.total > result.page * result.pageSize,
    };
  },

  /**
   * Get appointment by ID with denormalized data
   * GET /api/v1/appointments/:id
   */
  async getById(id: string): Promise<AppointmentReadModel> {
    const response = await apiClient.get<any>(`/v1/appointments/${id}`);
    // Handle legacy response structure
    return response.data.appointment;
  },

  /**
   * Confirm appointment
   * POST /api/v1/appointments/:id/confirm
   */
  async confirm(id: string): Promise<SuccessResponse> {
    const response = await apiClient.post<SuccessResponse>(`/v1/appointments/${id}/confirm`);
    return response.data;
  },

  /**
   * Cancel appointment
   * POST /api/v1/appointments/:id/cancel
   */
  async cancel(id: string, data: CancelAppointmentRequest): Promise<CancelAppointmentResponse> {
    const response = await apiClient.post<CancelAppointmentResponse>(
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
    const response = await apiClient.get<any>(`/v1/appointments`, {
      params: { patientId, ...(params || {}) },
    });
    return {
      success: response.data.success,
      appointments: response.data.appointments || [],
      totalCount: response.data.total || 0,
      hasMore: response.data.total > response.data.page * response.data.pageSize,
    };
  },
  /**
   * Get appointment statistics
   * GET /api/appointments/statistics
   */
  async getStatistics(params: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
    doctorId?: string;
    departmentId?: string;
  }): Promise<any> {
    const response = await apiClient.get('/appointments/statistics', { params });
    return response.data;
  },
};
