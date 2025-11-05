import { apiClient } from "../api/client";

export interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  specialization: string;
  experience: number;
  status: "active" | "inactive" | "on-leave";
  avatar?: string;
  rating?: number;
  patientsCount?: number;
  scheduleToday?: number;
  education: string;
  bio?: string;
  joinDate: string;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  day: string;
  time: string;
  type: string;
  status: "available" | "busy";
}

export interface DoctorResponse {
  success: boolean;
  data?: Doctor | Doctor[];
  message?: string;
  error?: string;
}

export class DoctorServiceAPI {
  private static instance: DoctorServiceAPI;
  private baseUrl: string = "/provider-staff-service/doctors";

  private constructor() {}

  public static getInstance(): DoctorServiceAPI {
    if (!DoctorServiceAPI.instance) {
      DoctorServiceAPI.instance = new DoctorServiceAPI();
    }
    return DoctorServiceAPI.instance;
  }

  async getAllDoctors(): Promise<DoctorResponse> {
    const response = await apiClient.get<Doctor[]>(this.baseUrl);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getDoctorById(id: string): Promise<DoctorResponse> {
    const response = await apiClient.get<Doctor>(`${this.baseUrl}/${id}`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async createDoctor(doctor: Omit<Doctor, "id" | "joinDate">): Promise<DoctorResponse> {
    const response = await apiClient.post<Doctor>(this.baseUrl, doctor);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async updateDoctor(id: string, doctor: Partial<Doctor>): Promise<DoctorResponse> {
    const response = await apiClient.put<Doctor>(`${this.baseUrl}/${id}`, doctor);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async deleteDoctor(id: string): Promise<DoctorResponse> {
    const response = await apiClient.delete<Doctor>(`${this.baseUrl}/${id}`);
    return {
      success: response.success,
      message: response.message,
      error: response.error,
    };
  }

  async searchDoctors(query: string): Promise<DoctorResponse> {
    const response = await apiClient.get<Doctor[]>(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getDoctorSchedule(doctorId: string): Promise<{
    success: boolean;
    data?: DoctorSchedule[];
    message?: string;
    error?: string;
  }> {
    const response = await apiClient.get<DoctorSchedule[]>(`${this.baseUrl}/${doctorId}/schedule`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async updateDoctorSchedule(doctorId: string, schedule: DoctorSchedule[]): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    const response = await apiClient.put(`${this.baseUrl}/${doctorId}/schedule`, schedule);
    return {
      success: response.success,
      message: response.message,
      error: response.error,
    };
  }
}

export const doctorServiceAPI = DoctorServiceAPI.getInstance();

