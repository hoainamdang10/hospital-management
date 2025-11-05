import { apiClient } from "../api/client";

export interface QueueItem {
  id: string;
  queueNumber: number;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientAge: number;
  appointmentId?: string;
  appointmentTime?: string;
  doctorId: string;
  doctorName: string;
  department: string;
  room: string;
  visitType: "scheduled" | "walkin" | "emergency";
  priority: "low" | "normal" | "high" | "urgent";
  status:
    | "waiting"
    | "called"
    | "in-progress"
    | "completed"
    | "no-show"
    | "cancelled";
  checkedInAt: string;
  calledAt?: string;
  estimatedWaitTime: number;
  notes?: string;
}

export interface QueueResponse {
  success: boolean;
  data?: QueueItem | QueueItem[];
  message?: string;
  error?: string;
}

export class QueueServiceAPI {
  private static instance: QueueServiceAPI;
  // Fixed: Changed from provider-staff-service to appointments-service
  private baseUrl: string = "/appointments-service/api/v1/queue";

  private constructor() {}

  public static getInstance(): QueueServiceAPI {
    if (!QueueServiceAPI.instance) {
      QueueServiceAPI.instance = new QueueServiceAPI();
    }
    return QueueServiceAPI.instance;
  }

  async getAllQueueItems(params?: {
    status?: string;
    doctorId?: string;
    department?: string;
  }): Promise<QueueResponse> {
    let url = this.baseUrl;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append("status", params.status);
      if (params.doctorId) queryParams.append("doctorId", params.doctorId);
      if (params.department)
        queryParams.append("department", params.department);
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
    }
    const response = await apiClient.get<QueueItem[]>(url);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getQueueItemById(id: string): Promise<QueueResponse> {
    const response = await apiClient.get<QueueItem>(`${this.baseUrl}/${id}`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async createQueueItem(
    item: Omit<QueueItem, "id" | "queueNumber" | "checkedInAt">
  ): Promise<QueueResponse> {
    const response = await apiClient.post<QueueItem>(this.baseUrl, item);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async updateQueueItem(
    id: string,
    item: Partial<QueueItem>
  ): Promise<QueueResponse> {
    const response = await apiClient.put<QueueItem>(
      `${this.baseUrl}/${id}`,
      item
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async deleteQueueItem(id: string): Promise<QueueResponse> {
    const response = await apiClient.delete<QueueItem>(`${this.baseUrl}/${id}`);
    return {
      success: response.success,
      message: response.message,
      error: response.error,
    };
  }

  async callNextPatient(doctorId: string): Promise<QueueResponse> {
    // Note: Backend endpoint might be different, need to verify
    const response = await apiClient.post<QueueItem>(`${this.baseUrl}/join`, {
      doctorId,
    });
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async updateQueueStatus(
    id: string,
    status: QueueItem["status"]
  ): Promise<QueueResponse> {
    const response = await apiClient.patch<QueueItem>(
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
}

export const queueServiceAPI = QueueServiceAPI.getInstance();
