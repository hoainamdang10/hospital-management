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
    // Normalize payload (backend may return snake_case and nested doctor/patient objects)
    const raw = response.data?.appointment || response.data?.data || response.data;

    const doctor = raw?.doctor || {};
    const patient = raw?.patient || {};

    return {
      // Core IDs
      id: raw.id || raw.appointmentId || raw.appointment_id || id,
      appointmentId: raw.appointmentId || raw.appointment_id || raw.id || id,
      patientId:
        raw.patientId || raw.patient_id || patient.patientId || patient.patient_id || raw.patient,
      doctorId:
        raw.doctorId ||
        raw.doctor_id ||
        doctor.doctorId ||
        doctor.doctor_id ||
        raw.providerId ||
        raw.provider_id,

      // Date/Time
      appointmentDate: raw.appointmentDate || raw.appointment_date || raw.date || raw.scheduledDate,
      appointmentTime: raw.appointmentTime || raw.appointment_time || raw.time || raw.scheduledTime,
      durationMinutes: raw.durationMinutes || raw.duration_minutes,

      // Meta
      type: raw.type,
      priority: raw.priority,
      status: raw.status,
      roomId: raw.roomId || raw.room_id,
      departmentId: raw.departmentId || raw.department_id,

      // Patient info (flattened for UI)
      patient: {
        patientId:
          patient.patientId || patient.patient_id || raw.patientId || raw.patient_id || raw.patient,
        fullName: patient.fullName || patient.full_name || raw.patientFullName,
        phone: patient.phone || patient.phoneNumber || raw.patientPhone,
        email: patient.email || raw.patientEmail,
        dateOfBirth: patient.dateOfBirth || patient.date_of_birth || raw.patientDateOfBirth,
        gender: patient.gender || raw.patientGender,
        nationalId: patient.nationalId || patient.national_id || raw.patientNationalId,
        insuranceNumber: patient.insuranceNumber || raw.patientInsuranceNumber,
        insuranceType: patient.insuranceType || raw.patientInsuranceType,
        address: patient.address || raw.patientAddress,
      },
      doctor: {
        doctorId:
          doctor.doctorId ||
          doctor.doctor_id ||
          raw.doctorId ||
          raw.doctor_id ||
          raw.providerId ||
          raw.provider_id,
        fullName: doctor.fullName || doctor.full_name || raw.doctorFullName || raw.doctorName,
        specialization: doctor.specialization || raw.doctorSpecialization,
        department: doctor.department || raw.doctorDepartment,
        licenseNumber: doctor.licenseNumber || raw.doctorLicenseNumber,
        phone: doctor.phone || raw.doctorPhone,
        email: doctor.email || raw.doctorEmail,
      },

      // Flat aliases for backward compatibility
      doctorName: doctor.fullName || doctor.full_name || raw.doctorFullName || raw.doctorName,
      doctorFullName: doctor.fullName || doctor.full_name || raw.doctorFullName || raw.doctorName,
      doctorSpecialization: doctor.specialization || raw.doctorSpecialization,
      doctorDepartment: doctor.department || raw.doctorDepartment,
      doctorLicenseNumber: doctor.licenseNumber || raw.doctorLicenseNumber,
      doctorPhone: doctor.phone || raw.doctorPhone,
      doctorEmail: doctor.email || raw.doctorEmail,

      patientName: patient.fullName || patient.full_name || raw.patientFullName,
      patientFullName: patient.fullName || patient.full_name || raw.patientFullName,
      patientPhone: patient.phone || patient.phoneNumber || raw.patientPhone,
      patientEmail: patient.email || raw.patientEmail,
      patientDateOfBirth: patient.dateOfBirth || patient.date_of_birth || raw.patientDateOfBirth,
      patientGender: patient.gender || raw.patientGender,
      patientNationalId: patient.nationalId || patient.national_id || raw.patientNationalId,
      patientInsuranceNumber:
        patient.insuranceNumber || raw.patientInsuranceNumber || raw.insuranceNumber,
      patientInsuranceType: patient.insuranceType || raw.patientInsuranceType || raw.insuranceType,
      patientAddress: patient.address || raw.patientAddress,

      // Appointment details
      reason: raw.reason,
      chiefComplaint: raw.chiefComplaint,
      symptoms: raw.symptoms,
      notes: raw.notes,
      specialInstructions: raw.specialInstructions,
      requiredEquipment: raw.requiredEquipment,

      // Financial
      consultationFee: raw.consultationFee,
      additionalFees: raw.additionalFees,
      paymentStatus: raw.paymentStatus,

      // Timestamps
      checkedInAt: raw.checkedInAt,
      startedAt: raw.startedAt,
      completedAt: raw.completedAt,
      cancelledAt: raw.cancelledAt,
      cancellationReason: raw.cancellationReason,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      syncedAt: raw.syncedAt,
    } as AppointmentReadModel;
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
    const normalizeTime = (time: string): string => {
      // Already HH:mm:ss
      if (/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(time)) return time;
      // HH:mm -> HH:mm:00
      if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) return `${time}:00`;
      // ISO -> take HH:mm:ss
      const parsed = new Date(time);
      if (!isNaN(parsed.getTime())) {
        return parsed.toTimeString().split(' ')[0];
      }
      // Fallback: return as-is (server validation sẽ chặn nếu sai)
      return time;
    };

    const response = await apiClient.post<SuccessResponse>(`/v1/appointments/${id}/reschedule`, {
      ...data,
      appointmentTime: normalizeTime(data.appointmentTime),
      reason: data.reason || 'Đổi lịch hẹn',
    });
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

    // Backend returns: { success, data: { appointments, total, page, pageSize, totalPages } }
    const result = response.data.data || response.data; // Support both nested and flat structure

    // Normalize snake_case to camelCase (ListAppointmentsQuery uses snake_case)
    const normalizedAppointments = (result.appointments || []).map((apt: any) => ({
      id: apt.id || apt.appointment_id,
      appointmentId: apt.appointment_id,
      appointmentDate: apt.appointment_date,
      appointmentTime: apt.appointment_time,
      durationMinutes: apt.duration_minutes,
      type: apt.type,
      priority: apt.priority,
      status: apt.status,
      patientId: apt.patient_id,
      patientFullName: apt.patient_full_name,
      patientPhone: apt.patient_phone,
      patientEmail: apt.patient_email,
      doctorId: apt.doctor_id,
      doctorName:
        apt.doctor_full_name ||
        apt.doctor_name ||
        apt.doctorName ||
        apt.doctor?.fullName ||
        apt.doctor_id,
      doctorFullName:
        apt.doctor_full_name || apt.doctor_name || apt.doctorName || apt.doctor?.fullName,
      doctorSpecialization: apt.doctor_specialization || apt.doctor?.specialization,
      doctorDepartment: apt.doctor_department,
      consultationFee: apt.consultation_fee,
      paymentStatus: apt.payment_status,
      reason: apt.reason,
      createdAt: apt.created_at,
    }));

    return {
      success: response.data.success,
      appointments: normalizedAppointments,
      totalCount: result.total || 0,
      hasMore: result.total > result.page * result.pageSize,
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

  /**
   * Get appointments for a doctor
   * GET /api/v1/doctors/:doctorId/appointments
   */
  async getDoctorAppointments(
    doctorId: string,
    params?: ListAppointmentsParams
  ): Promise<ListAppointmentsResponse> {
    const response = await apiClient.get<any>(`/v1/doctors/${doctorId}/appointments`, {
      params: {
        ...(params || {}),
        _ts: Date.now(), // cache buster to avoid stale 304
      },
    });
    const payload = response.data.data || response.data;
    return {
      success: payload.success ?? response.data.success ?? true,
      appointments: payload.appointments || payload.data || [],
      totalCount: payload.total || payload.totalCount || 0,
      hasMore:
        (payload.total || 0) > (payload.page || 1) * (payload.pageSize || payload.limit || 10),
    };
  },

  /**
   * Check-in appointment
   * POST /api/v1/appointments/:id/check-in
   */
  async checkInAppointment(id: string): Promise<SuccessResponse> {
    const response = await apiClient.post<SuccessResponse>(`/v1/appointments/${id}/check-in`);
    return response.data;
  },

  /**
   * Start appointment
   * POST /api/v1/appointments/:id/start
   */
  async startAppointment(id: string): Promise<SuccessResponse> {
    const response = await apiClient.post<SuccessResponse>(`/v1/appointments/${id}/start`);
    return response.data;
  },

  /**
   * Complete appointment
   * POST /api/v1/appointments/:id/complete
   */
  async completeAppointment(id: string): Promise<SuccessResponse> {
    const response = await apiClient.post<SuccessResponse>(`/v1/appointments/${id}/complete`);
    return response.data;
  },
};
