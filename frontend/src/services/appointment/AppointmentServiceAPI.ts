import { apiClient } from "../api/client";

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  type: "consultation" | "follow-up" | "emergency";
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  symptoms: string;
  notes?: string;
  fee: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppointmentResponse {
  success: boolean;
  data?: Appointment | Appointment[];
  message?: string;
  error?: string;
}

export class AppointmentServiceAPI {
  private static instance: AppointmentServiceAPI;
  // Fixed: Changed from provider-staff-service to appointments-service
  private baseUrl: string = "/appointments-service/appointments";

  private constructor() {}

  public static getInstance(): AppointmentServiceAPI {
    if (!AppointmentServiceAPI.instance) {
      AppointmentServiceAPI.instance = new AppointmentServiceAPI();
    }
    return AppointmentServiceAPI.instance;
  }

  async getAllAppointments(params?: {
    status?: string;
    doctorId?: string;
    patientId?: string;
    date?: string;
  }): Promise<AppointmentResponse> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append("status", params.status);
    if (params?.doctorId) queryParams.append("doctorId", params.doctorId);
    if (params?.patientId) queryParams.append("patientId", params.patientId);
    if (params?.date) queryParams.append("date", params.date);

    const query = queryParams.toString();
    const endpoint = query ? `${this.baseUrl}?${query}` : this.baseUrl;

    const response = await apiClient.get<Appointment[]>(endpoint);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getAppointmentById(id: string): Promise<AppointmentResponse> {
    const response = await apiClient.get<Appointment>(`${this.baseUrl}/${id}`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async createAppointment(
    appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt">
  ): Promise<AppointmentResponse> {
    const response = await apiClient.post<Appointment>(
      this.baseUrl,
      appointment
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async updateAppointment(
    id: string,
    appointment: Partial<Appointment>
  ): Promise<AppointmentResponse> {
    const response = await apiClient.put<Appointment>(
      `${this.baseUrl}/${id}`,
      appointment
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async deleteAppointment(id: string): Promise<AppointmentResponse> {
    const response = await apiClient.delete<Appointment>(
      `${this.baseUrl}/${id}`
    );
    return {
      success: response.success,
      message: response.message,
      error: response.error,
    };
  }

  async updateAppointmentStatus(
    id: string,
    status: "scheduled" | "in-progress" | "completed" | "cancelled"
  ): Promise<AppointmentResponse> {
    const response = await apiClient.patch<Appointment>(
      `${this.baseUrl}/${id}/status`,
      { status }
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getAppointmentsByDate(date: string): Promise<AppointmentResponse> {
    const response = await apiClient.get<Appointment[]>(
      `${this.baseUrl}/date/${date}`
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  // Appointment Operations
  async confirmAppointment(
    id: string,
    notes?: string
  ): Promise<AppointmentResponse> {
    const response = await apiClient.post<Appointment>(
      `${this.baseUrl}/${id}/confirm`,
      { notes }
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async completeAppointment(
    id: string,
    notes?: string
  ): Promise<AppointmentResponse> {
    const response = await apiClient.post<Appointment>(
      `${this.baseUrl}/${id}/complete`,
      { notes }
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async cancelAppointment(
    id: string,
    reason: string
  ): Promise<AppointmentResponse> {
    const response = await apiClient.post<Appointment>(
      `${this.baseUrl}/${id}/cancel`,
      { reason }
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async rescheduleAppointment(
    id: string,
    newDate: string,
    newTime: string,
    reason?: string
  ): Promise<AppointmentResponse> {
    const response = await apiClient.post<Appointment>(
      `${this.baseUrl}/${id}/reschedule`,
      { newDate, newTime, reason }
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async checkInAppointment(id: string): Promise<AppointmentResponse> {
    const response = await apiClient.post<Appointment>(
      `${this.baseUrl}/${id}/check-in`
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async markNoShow(id: string, reason?: string): Promise<AppointmentResponse> {
    const response = await apiClient.post<Appointment>(
      `${this.baseUrl}/${id}/no-show`,
      { reason }
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async startAppointment(id: string): Promise<AppointmentResponse> {
    const response = await apiClient.post<Appointment>(
      `${this.baseUrl}/${id}/start`
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  // Query Operations
  async getPatientAppointments(
    patientId: string
  ): Promise<AppointmentResponse> {
    const response = await apiClient.get<Appointment[]>(
      `/appointments-service/patients/${patientId}/appointments`
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getDoctorAppointments(doctorId: string): Promise<AppointmentResponse> {
    const response = await apiClient.get<Appointment[]>(
      `/appointments-service/doctors/${doctorId}/appointments`
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }
}

export const appointmentServiceAPI = AppointmentServiceAPI.getInstance();
