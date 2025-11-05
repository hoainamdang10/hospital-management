import { apiClient } from "../api/client";

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address: string;
  emergencyContact?: string;
  bloodType?: string;
  medicalHistory?: string[];
  allergies?: string[];
  createdAt: string;
}

export interface PatientResponse {
  success: boolean;
  data?: Patient | Patient[];
  message?: string;
  error?: string;
}

export class PatientServiceAPI {
  private static instance: PatientServiceAPI;
  private baseUrl: string = "/patient-registry-service/api/v1/patients";

  private constructor() {}

  public static getInstance(): PatientServiceAPI {
    if (!PatientServiceAPI.instance) {
      PatientServiceAPI.instance = new PatientServiceAPI();
    }
    return PatientServiceAPI.instance;
  }

  async getAllPatients(): Promise<PatientResponse> {
    const response = await apiClient.get<Patient[]>(this.baseUrl);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getPatientById(id: string): Promise<PatientResponse> {
    const response = await apiClient.get<Patient>(`${this.baseUrl}/${id}`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async createPatient(
    patient: Omit<Patient, "id" | "createdAt">
  ): Promise<PatientResponse> {
    const response = await apiClient.post<Patient>(this.baseUrl, patient);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async updatePatient(
    id: string,
    patient: Partial<Patient>
  ): Promise<PatientResponse> {
    const response = await apiClient.put<Patient>(
      `${this.baseUrl}/${id}`,
      patient
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async deletePatient(id: string): Promise<PatientResponse> {
    const response = await apiClient.delete<Patient>(`${this.baseUrl}/${id}`);
    return {
      success: response.success,
      message: response.message,
      error: response.error,
    };
  }

  async searchPatients(query: string): Promise<PatientResponse> {
    const response = await apiClient.get<Patient[]>(
      `${this.baseUrl}/search?q=${encodeURIComponent(query)}`
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  // Advanced Patient Operations
  async getPatientByUserId(userId: string): Promise<PatientResponse> {
    const response = await apiClient.get<Patient>(
      `${this.baseUrl}/user/${userId}`
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getPatientByNationalId(nationalId: string): Promise<PatientResponse> {
    const response = await apiClient.get<Patient>(
      `${this.baseUrl}/national-id/${nationalId}`
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getPatientByBHYTNumber(bhytNumber: string): Promise<PatientResponse> {
    const response = await apiClient.get<Patient>(
      `${this.baseUrl}/bhyt/${bhytNumber}`
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getPatientStatistics(): Promise<{
    success: boolean;
    data?: {
      total: number;
      active: number;
      inactive: number;
      newToday: number;
      newThisMonth: number;
    };
    message?: string;
    error?: string;
  }> {
    const response = await apiClient.get<{
      total: number;
      active: number;
      inactive: number;
      newToday: number;
      newThisMonth: number;
    }>(`${this.baseUrl}/statistics`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async validateInsurance(
    insuranceNumber: string,
    insuranceType: "BHYT" | "BHTN"
  ): Promise<{
    success: boolean;
    data?: {
      isValid: boolean;
      policyNumber: string;
      beneficiaryName: string;
      validFrom?: string;
      validTo?: string;
    };
    message?: string;
    error?: string;
  }> {
    const response = await apiClient.post<{
      isValid: boolean;
      policyNumber: string;
      beneficiaryName: string;
      validFrom?: string;
      validTo?: string;
    }>(`${this.baseUrl}/validate-insurance`, {
      insuranceNumber,
      insuranceType,
    });
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async addEmergencyContact(
    patientId: string,
    contact: {
      name: string;
      relationship: string;
      phone: string;
      email?: string;
    }
  ): Promise<{
    success: boolean;
    data?: { contactId: string };
    message?: string;
    error?: string;
  }> {
    const response = await apiClient.post<{ contactId: string }>(
      `${this.baseUrl}/${patientId}/emergency-contacts`,
      contact
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }
}

export const patientServiceAPI = PatientServiceAPI.getInstance();
