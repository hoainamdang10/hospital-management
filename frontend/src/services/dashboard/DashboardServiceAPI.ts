import { apiClient } from "../api/client";

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  activeDoctors: number;
  monthlyRevenue: number;
  patientChange?: string;
  appointmentChange?: string;
  doctorChange?: string;
  revenueChange?: string;
}

export interface RecentActivity {
  id: string;
  time: string;
  action: string;
  status: "completed" | "in-progress" | "upcoming";
  userId?: string;
  userName?: string;
}

export interface AppointmentStats {
  completed: number;
  pending: number;
  cancelled: number;
}

export interface MonthlyData {
  month: string;
  patients: number;
  revenue: number;
}

export interface DashboardResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export class DashboardServiceAPI {
  private static instance: DashboardServiceAPI;
  private baseUrl: string = "/provider-staff-service/dashboard";

  private constructor() {}

  public static getInstance(): DashboardServiceAPI {
    if (!DashboardServiceAPI.instance) {
      DashboardServiceAPI.instance = new DashboardServiceAPI();
    }
    return DashboardServiceAPI.instance;
  }

  async getStats(role?: string): Promise<DashboardResponse> {
    const endpoint = role ? `${this.baseUrl}/stats?role=${role}` : `${this.baseUrl}/stats`;
    const response = await apiClient.get<DashboardStats>(endpoint);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getRecentActivities(limit?: number): Promise<DashboardResponse> {
    const endpoint = limit ? `${this.baseUrl}/activities?limit=${limit}` : `${this.baseUrl}/activities`;
    const response = await apiClient.get<RecentActivity[]>(endpoint);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getAppointmentStats(): Promise<DashboardResponse> {
    const response = await apiClient.get<AppointmentStats>(`${this.baseUrl}/appointment-stats`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getMonthlyData(months?: number): Promise<DashboardResponse> {
    const endpoint = months ? `${this.baseUrl}/monthly?months=${months}` : `${this.baseUrl}/monthly`;
    const response = await apiClient.get<MonthlyData[]>(endpoint);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getDailyPatients(days?: number): Promise<DashboardResponse> {
    const endpoint = days ? `${this.baseUrl}/daily-patients?days=${days}` : `${this.baseUrl}/daily-patients`;
    const response = await apiClient.get<any[]>(endpoint);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }
}

export const dashboardServiceAPI = DashboardServiceAPI.getInstance();

