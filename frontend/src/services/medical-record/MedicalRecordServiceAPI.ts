import { apiClient } from "../api/client";

export interface VitalSigns {
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  weight: string;
  height: string;
  respiratoryRate?: string;
  [key: string]: string | undefined;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  doctorId: string;
  doctorName: string;
  date: string;
  visitType: "consultation" | "followup" | "emergency" | "routine";
  chiefComplaint: string;
  presentIllness: string;
  pastMedicalHistory: string;
  physicalExamination: string;
  vitalSigns: VitalSigns;
  diagnosis: string;
  treatment: string;
  medications: string;
  notes: string;
  nextAppointment?: string;
  status: "active" | "completed" | "pending";
}

export interface MedicalRecordResponse {
  success: boolean;
  data?: MedicalRecord | MedicalRecord[];
  message?: string;
  error?: string;
}

export class MedicalRecordServiceAPI {
  private static instance: MedicalRecordServiceAPI;
  // Fixed: Changed from provider-staff-service to clinical-emr-service
  private baseUrl: string =
    "/clinical-emr-service/api/v2/clinical-emr/medical-records";

  private constructor() {}

  public static getInstance(): MedicalRecordServiceAPI {
    if (!MedicalRecordServiceAPI.instance) {
      MedicalRecordServiceAPI.instance = new MedicalRecordServiceAPI();
    }
    return MedicalRecordServiceAPI.instance;
  }

  async getAllMedicalRecords(params?: {
    patientId?: string;
    doctorId?: string;
    status?: string;
  }): Promise<MedicalRecordResponse> {
    let url = this.baseUrl;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.patientId) queryParams.append("patientId", params.patientId);
      if (params.doctorId) queryParams.append("doctorId", params.doctorId);
      if (params.status) queryParams.append("status", params.status);
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
    }
    const response = await apiClient.get<MedicalRecord[]>(url);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getMedicalRecordById(id: string): Promise<MedicalRecordResponse> {
    const response = await apiClient.get<MedicalRecord>(
      `${this.baseUrl}/${id}`
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async createMedicalRecord(
    record: Omit<MedicalRecord, "id" | "date">
  ): Promise<MedicalRecordResponse> {
    const response = await apiClient.post<MedicalRecord>(this.baseUrl, record);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async updateMedicalRecord(
    id: string,
    record: Partial<MedicalRecord>
  ): Promise<MedicalRecordResponse> {
    const response = await apiClient.put<MedicalRecord>(
      `${this.baseUrl}/${id}`,
      record
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async deleteMedicalRecord(id: string): Promise<MedicalRecordResponse> {
    const response = await apiClient.delete<MedicalRecord>(
      `${this.baseUrl}/${id}`
    );
    return {
      success: response.success,
      message: response.message,
      error: response.error,
    };
  }
}

export const medicalRecordServiceAPI = MedicalRecordServiceAPI.getInstance();
