import { apiClient } from "../api/client";

export interface PrescriptionDetail {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PrescriptionRecord {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  status: "active" | "completed" | "cancelled";
  medications: PrescriptionDetail[];
  notes: string;
  diagnosis: string;
  totalCost: number;
}

export interface PrescriptionResponse {
  success: boolean;
  data?: PrescriptionRecord | PrescriptionRecord[];
  message?: string;
  error?: string;
}

export class PrescriptionServiceAPI {
  private static instance: PrescriptionServiceAPI;
  // Fixed: Changed from provider-staff-service to clinical-emr-service
  private baseUrl: string =
    "/clinical-emr-service/api/v2/clinical-emr/prescriptions";

  private constructor() {}

  public static getInstance(): PrescriptionServiceAPI {
    if (!PrescriptionServiceAPI.instance) {
      PrescriptionServiceAPI.instance = new PrescriptionServiceAPI();
    }
    return PrescriptionServiceAPI.instance;
  }

  async getAllPrescriptions(params?: {
    patientId?: string;
    doctorId?: string;
    status?: string;
  }): Promise<PrescriptionResponse> {
    let url = this.baseUrl;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.patientId) queryParams.append("patientId", params.patientId);
      if (params.doctorId) queryParams.append("doctorId", params.doctorId);
      if (params.status) queryParams.append("status", params.status);
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
    }
    const response = await apiClient.get<PrescriptionRecord[]>(url);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getPrescriptionById(id: string): Promise<PrescriptionResponse> {
    const response = await apiClient.get<PrescriptionRecord>(
      `${this.baseUrl}/${id}`
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async createPrescription(
    prescription: Omit<PrescriptionRecord, "id" | "date" | "totalCost">
  ): Promise<PrescriptionResponse> {
    const response = await apiClient.post<PrescriptionRecord>(
      this.baseUrl,
      prescription
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async updatePrescription(
    id: string,
    prescription: Partial<PrescriptionRecord>
  ): Promise<PrescriptionResponse> {
    const response = await apiClient.put<PrescriptionRecord>(
      `${this.baseUrl}/${id}`,
      prescription
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async deletePrescription(id: string): Promise<PrescriptionResponse> {
    const response = await apiClient.delete<PrescriptionRecord>(
      `${this.baseUrl}/${id}`
    );
    return {
      success: response.success,
      message: response.message,
      error: response.error,
    };
  }
}

export const prescriptionServiceAPI = PrescriptionServiceAPI.getInstance();
