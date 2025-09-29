import logger from "@hospital/shared/dist/utils/logger";
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * REST API Service Configuration
 */
interface RestApiConfig {
  baseURL: string;
  token?: string;
  requestId: string;
  language: "vi" | "en";
  timeout?: number;
}

/**
 * Standard API Response from microservices
 */
interface StandardApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    version: string;
    service: string;
  };
}

/**
 * REST API Service
 * Handles communication with existing microservices
 */
export class RestApiService {
  private client: AxiosInstance;
  private config: RestApiConfig;

  constructor(config: RestApiConfig) {
    this.config = config;

    // Create axios instance with default configuration
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Request-ID": config.requestId,
        "Accept-Language": config.language === "vi" ? "vi-VN" : "en-US",
        "X-API-Version": "v2",
      },
    });

    // Add authentication header if token is provided
    if (config.token) {
      this.client.defaults.headers.common["Authorization"] =
        `Bearer ${config.token}`;
    }

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug("REST API Request:", {
          method: config.method?.toUpperCase(),
          url: config.url,
          requestId: this.config.requestId,
        });
        return config;
      },
      (error) => {
        logger.error("REST API Request Error:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse<StandardApiResponse>) => {
        logger.debug("REST API Response:", {
          status: response.status,
          url: response.config.url,
          success: response.data.success,
          requestId: this.config.requestId,
        });
        return response;
      },
      (error) => {
        logger.error("REST API Response Error:", {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message,
          requestId: this.config.requestId,
        });
        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * Doctor Service API calls
   */
  async getDoctors(params?: {
    page?: number;
    limit?: number;
    search?: string;
    specialization?: string;
    departmentId?: string;
  }): Promise<StandardApiResponse> {
    const response = await this.client.get("/api/doctors", { params });
    return response.data;
  }

  async getDoctor(id: string): Promise<StandardApiResponse> {
    const response = await this.client.get(`/api/doctors/${id}`);
    return response.data;
  }

  async createDoctor(data: any): Promise<StandardApiResponse> {
    const response = await this.client.post("/api/doctors", data);
    return response.data;
  }

  async updateDoctor(id: string, data: any): Promise<StandardApiResponse> {
    const response = await this.client.put(`/api/doctors/${id}`, data);
    return response.data;
  }

  async deleteDoctor(id: string): Promise<StandardApiResponse> {
    const response = await this.client.delete(`/api/doctors/${id}`);
    return response.data;
  }

  async getDoctorSchedule(
    doctor_id: string,
    date?: string
  ): Promise<StandardApiResponse> {
    const params = date ? { date } : {};
    const response = await this.client.get(
      `/api/doctors/${doctor_id}/schedule`,
      { params }
    );
    return response.data;
  }

  async getDoctorStats(doctor_id: string): Promise<StandardApiResponse> {
    const response = await this.client.get(`/api/doctors/${doctor_id}/stats`);
    return response.data;
  }

  /**
   * Patient Service API calls
   */
  async getPatients(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<StandardApiResponse> {
    const response = await this.client.get("/api/patients", { params });
    return response.data;
  }

  async getPatient(id: string): Promise<StandardApiResponse> {
    const response = await this.client.get(`/api/patients/${id}`);
    return response.data;
  }

  async createPatient(data: any): Promise<StandardApiResponse> {
    const response = await this.client.post("/api/patients", data);
    return response.data;
  }

  async updatePatient(id: string, data: any): Promise<StandardApiResponse> {
    const response = await this.client.put(`/api/patients/${id}`, data);
    return response.data;
  }

  async deletePatient(id: string): Promise<StandardApiResponse> {
    const response = await this.client.delete(`/api/patients/${id}`);
    return response.data;
  }

  async getPatientByProfile(profileId: string): Promise<StandardApiResponse> {
    const response = await this.client.get(
      `/api/patients/profile/${profileId}`
    );
    return response.data;
  }

  async searchPatients(params: {
    query: string;
    limit?: number;
    offset?: number;
    [key: string]: any;
  }): Promise<StandardApiResponse> {
    const response = await this.client.get("/api/patients/search", { params });
    return response.data;
  }

  async getPatientMedicalSummary(
    patient_id: string
  ): Promise<StandardApiResponse> {
    const response = await this.client.get(
      `/api/patients/${patient_id}/medical-summary`
    );
    return response.data;
  }

  async getPatientStats(patient_id: string): Promise<StandardApiResponse> {
    const response = await this.client.get(`/api/patients/${patient_id}/stats`);
    return response.data;
  }

  async getPatientDoctorHistory(
    patient_id: string,
    doctor_id: string,
    limit: number
  ): Promise<StandardApiResponse> {
    const response = await this.client.get(
      `/api/patients/${doctor_id}/history`,
      {
        params: { limit },
      }
    );
    return response.data;
  }

  async activatePatient(id: string): Promise<StandardApiResponse> {
    const response = await this.client.post(`/api/patients/${id}/activate`);
    return response.data;
  }

  async deactivatePatient(id: string): Promise<StandardApiResponse> {
    const response = await this.client.post(`/api/patients/${id}/deactivate`);
    return response.data;
  }

  async updatePatientMedicalInfo(
    id: string,
    medicalInfo: any
  ): Promise<StandardApiResponse> {
    const response = await this.client.put(
      `/api/patients/${id}/medical-info`,
      medicalInfo
    );
    return response.data;
  }

  async updatePatientInsurance(
    id: string,
    insuranceInfo: any
  ): Promise<StandardApiResponse> {
    const response = await this.client.put(
      `/api/patients/${id}/insurance`,
      insuranceInfo
    );
    return response.data;
  }

  /**
   * Appointment Service API calls
   */
  async getAppointments(params?: {
    page?: number;
    limit?: number;
    doctor_id?: string;
    patient_id?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<StandardApiResponse> {
    const response = await this.client.get("/api/appointments", { params });
    return response.data;
  }

  async getAppointment(id: string): Promise<StandardApiResponse> {
    const response = await this.client.get(`/api/appointments/${id}`);
    return response.data;
  }

  async createAppointment(data: any): Promise<StandardApiResponse> {
    const response = await this.client.post("/api/appointments", data);
    return response.data;
  }

  async updateAppointment(id: string, data: any): Promise<StandardApiResponse> {
    const response = await this.client.put(`/api/appointments/${id}`, data);
    return response.data;
  }

  async cancelAppointment(
    id: string,
    reason: string
  ): Promise<StandardApiResponse> {
    const response = await this.client.post(`/api/appointments/${id}/cancel`, {
      reason,
    });
    return response.data;
  }

  async getAvailableSlots(
    doctor_id: string,
    date: string
  ): Promise<StandardApiResponse> {
    const response = await this.client.get(
      `/api/appointments/available-slots`,
      {
        params: { doctor_id, date },
      }
    );
    return response.data;
  }

  async getTodayAppointments(params: {
    doctor_id?: string;
    departmentId?: string;
    status?: string;
    date: string;
  }): Promise<StandardApiResponse> {
    const response = await this.client.get("/api/appointments/today", {
      params,
    });
    return response.data;
  }

  async getUpcomingAppointments(params: {
    doctor_id?: string;
    patient_id?: string;
    days?: number;
    limit?: number;
  }): Promise<StandardApiResponse> {
    const response = await this.client.get("/api/appointments/upcoming", {
      params,
    });
    return response.data;
  }

  async getAppointmentStats(params: {
    doctor_id?: string;
    patient_id?: string;
    departmentId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<StandardApiResponse> {
    const response = await this.client.get("/api/appointments/stats", {
      params,
    });
    return response.data;
  }

  async confirmAppointment(id: string): Promise<StandardApiResponse> {
    const response = await this.client.post(`/api/appointments/${id}/confirm`);
    return response.data;
  }

  async rescheduleAppointment(
    id: string,
    data: { newDate: string; newTime: string }
  ): Promise<StandardApiResponse> {
    const response = await this.client.post(
      `/api/appointments/${id}/reschedule`,
      data
    );
    return response.data;
  }

  async checkInAppointment(id: string): Promise<StandardApiResponse> {
    const response = await this.client.post(`/api/appointments/${id}/checkin`);
    return response.data;
  }

  async completeAppointment(
    id: string,
    notes?: string
  ): Promise<StandardApiResponse> {
    const response = await this.client.post(
      `/api/appointments/${id}/complete`,
      { notes }
    );
    return response.data;
  }

  /**
   * Department Service API calls
   */
  async getDepartments(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Promise<StandardApiResponse> {
    const response = await this.client.get("/api/departments", { params });
    return response.data;
  }

  async getDepartment(id: string): Promise<StandardApiResponse> {
    const response = await this.client.get(`/api/departments/${id}`);
    return response.data;
  }

  async createDepartment(data: any): Promise<StandardApiResponse> {
    const response = await this.client.post("/api/departments", data);
    return response.data;
  }

  async updateDepartment(id: string, data: any): Promise<StandardApiResponse> {
    const response = await this.client.put(`/api/departments/${id}`, data);
    return response.data;
  }

  /**
   * Medical Records Service API calls
   */
  async getMedicalRecords(params?: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
    [key: string]: any;
  }): Promise<StandardApiResponse> {
    const response = await this.client.get("/api/medical-records", { params });
    return response.data;
  }

  async getMedicalRecord(id: string): Promise<StandardApiResponse> {
    const response = await this.client.get(`/api/medical-records/${id}`);
    return response.data;
  }

  async createMedicalRecord(data: any): Promise<StandardApiResponse> {
    const response = await this.client.post("/api/medical-records", data);
    return response.data;
  }

  async updateMedicalRecord(
    id: string,
    data: any
  ): Promise<StandardApiResponse> {
    const response = await this.client.put(`/api/medical-records/${id}`, data);
    return response.data;
  }

  async deleteMedicalRecord(id: string): Promise<StandardApiResponse> {
    const response = await this.client.delete(`/api/medical-records/${id}`);
    return response.data;
  }

  async getPatientMedicalRecords(params: {
    patient_id: string;
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<StandardApiResponse> {
    const { patient_id, ...queryParams } = params;
    const response = await this.client.get(
      `/api/medical-records/patient/${patient_id}`,
      {
        params: queryParams,
      }
    );
    return response.data;
  }

  async getDoctorMedicalRecords(params: {
    doctor_id: string;
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<StandardApiResponse> {
    const { doctor_id, ...queryParams } = params;
    const response = await this.client.get(
      `/api/medical-records/doctor/${doctor_id}`,
      {
        params: queryParams,
      }
    );
    return response.data;
  }

  async searchMedicalRecords(params: {
    query: string;
    limit?: number;
    offset?: number;
    [key: string]: any;
  }): Promise<StandardApiResponse> {
    const response = await this.client.get("/api/medical-records/search", {
      params,
    });
    return response.data;
  }

  async getVitalSignsHistory(params: {
    patient_id: string;
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<StandardApiResponse> {
    const response = await this.client.get("/api/medical-records/vital-signs", {
      params,
    });
    return response.data;
  }

  async getLabResults(params: {
    patient_id: string;
    testType?: string;
    limit?: number;
    offset?: number;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<StandardApiResponse> {
    const response = await this.client.get("/api/medical-records/lab-results", {
      params,
    });
    return response.data;
  }

  /**
   * Authentication Service API calls
   */
  async validateToken(token: string): Promise<StandardApiResponse> {
    const response = await this.client.post("/api/auth/validate", { token });
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<StandardApiResponse> {
    const response = await this.client.post("/api/auth/refresh", {
      refreshToken,
    });
    return response.data;
  }

  /**
   * Generic API call method
   */
  async request<T = any>(
    config: AxiosRequestConfig
  ): Promise<StandardApiResponse<T>> {
    const response = await this.client.request(config);
    return response.data;
  }

  /**
   * Batch requests for DataLoader
   */
  async batchRequest<T = any>(
    requests: AxiosRequestConfig[]
  ): Promise<StandardApiResponse<T>[]> {
    const promises = requests.map((config) => this.client.request(config));
    const responses = await Promise.allSettled(promises);

    return responses.map((result) => {
      if (result.status === "fulfilled") {
        return result.value.data;
      } else {
        // Return error response for failed requests
        return {
          success: false,
          data: null as T,
          error: {
            message: result.reason.message || "Request failed",
            code: "BATCH_REQUEST_ERROR",
          },
        };
      }
    });
  }

  /**
   * Format axios errors to GraphQL errors
   */
  private formatError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      const message =
        data?.error?.message || data?.message || `HTTP ${status} Error`;
      const vietnameseMessage = this.translateErrorMessage(message);

      const graphqlError = new Error(vietnameseMessage);
      (graphqlError as any).extensions = {
        code: data?.error?.code || `HTTP_${status}`,
        status,
        originalMessage: message,
        vietnamese: vietnameseMessage,
      };

      return graphqlError;
    } else if (error.request) {
      // Network error
      const message = "Không thể kết nối đến dịch vụ";
      const graphqlError = new Error(message);
      (graphqlError as any).extensions = {
        code: "NETWORK_ERROR",
        vietnamese: message,
      };

      return graphqlError;
    } else {
      // Other error
      const message = error.message || "Lỗi không xác định";
      const graphqlError = new Error(message);
      (graphqlError as any).extensions = {
        code: "UNKNOWN_ERROR",
        vietnamese: message,
      };

      return graphqlError;
    }
  }

  /**
   * Translate error messages to Vietnamese
   */
  private translateErrorMessage(message: string): string {
    const translations: Record<string, string> = {
      "Not found": "Không tìm thấy",
      Unauthorized: "Yêu cầu xác thực",
      Forbidden: "Không có quyền truy cập",
      "Bad Request": "Yêu cầu không hợp lệ",
      "Internal Server Error": "Lỗi hệ thống",
      "Service Unavailable": "Dịch vụ không khả dụng",
      "Validation Error": "Lỗi xác thực dữ liệu",
      "Duplicate Entry": "Dữ liệu trùng lặp",
      "Invalid Email": "Email không hợp lệ",
      "Invalid Phone": "Số điện thoại không hợp lệ",
    };

    for (const [english, vietnamese] of Object.entries(translations)) {
      if (message.includes(english)) {
        return message.replace(english, vietnamese);
      }
    }

    return message;
  }

  /**
   * Update authentication token
   */
  updateToken(token: string): void {
    this.config.token = token;
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  /**
   * Remove authentication token
   */
  removeToken(): void {
    this.config.token = undefined;
    delete this.client.defaults.headers.common["Authorization"];
  }

  // Missing methods for GraphQL resolvers
  async getDoctorReviews(params: any): Promise<StandardApiResponse> {
    const response = await this.client.get("/api/doctors/reviews", { params });
    return response.data;
  }

  async createDoctorReview(data: any): Promise<StandardApiResponse> {
    const response = await this.client.post("/api/doctors/reviews", data);
    return response.data;
  }

  async updateDoctorReview(
    id: string,
    data: any
  ): Promise<StandardApiResponse> {
    const response = await this.client.put(`/api/doctors/reviews/${id}`, data);
    return response.data;
  }

  async deleteDoctorReview(id: string): Promise<StandardApiResponse> {
    const response = await this.client.delete(`/api/doctors/reviews/${id}`);
    return response.data;
  }

  async getRoom(id: string): Promise<StandardApiResponse> {
    const response = await this.client.get(`/api/departments/rooms/${id}`);
    return response.data;
  }

  async getRooms(params: any): Promise<StandardApiResponse> {
    const response = await this.client.get("/api/departments/rooms", {
      params,
    });
    return response.data;
  }

  /**
   * Receptionist Service API calls
   */
  async getReceptionistQueue(params?: {
    date?: string;
    doctor_id?: string;
    department_id?: string;
  }): Promise<StandardApiResponse> {
    const response = await this.client.get("/api/checkin/queue", { params });
    return response.data;
  }
}

export default RestApiService;
