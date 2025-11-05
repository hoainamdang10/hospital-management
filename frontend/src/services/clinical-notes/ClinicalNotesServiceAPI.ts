import { apiClient } from "../api/client";

export interface ClinicalNote {
  id: string;
  patientId: string;
  patientName: string;
  authorId: string;
  authorName: string;
  noteType: "progress" | "assessment" | "plan" | "procedure" | "discharge";
  content: string;
  createdAt: string;
  updatedAt?: string;
  cosignedBy?: string;
  cosignedAt?: string;
  status: "draft" | "final" | "cosigned";
}

export interface ClinicalNoteResponse {
  success: boolean;
  data?: ClinicalNote | ClinicalNote[];
  message?: string;
  error?: string;
}

export class ClinicalNotesServiceAPI {
  private static instance: ClinicalNotesServiceAPI;
  private baseUrl: string =
    "/clinical-emr-service/api/v2/clinical-emr/clinical-notes";

  private constructor() {}

  public static getInstance(): ClinicalNotesServiceAPI {
    if (!ClinicalNotesServiceAPI.instance) {
      ClinicalNotesServiceAPI.instance = new ClinicalNotesServiceAPI();
    }
    return ClinicalNotesServiceAPI.instance;
  }

  async getAllClinicalNotes(params?: {
    patientId?: string;
    authorId?: string;
    noteType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ClinicalNoteResponse> {
    let url = this.baseUrl;
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.patientId) queryParams.append("patientId", params.patientId);
      if (params.authorId) queryParams.append("authorId", params.authorId);
      if (params.noteType) queryParams.append("type", params.noteType);
      if (params.startDate) queryParams.append("startDate", params.startDate);
      if (params.endDate) queryParams.append("endDate", params.endDate);
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
    }
    const response = await apiClient.get<ClinicalNote[]>(url);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getClinicalNoteById(id: string): Promise<ClinicalNoteResponse> {
    const response = await apiClient.get<ClinicalNote>(`${this.baseUrl}/${id}`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async createClinicalNote(
    note: Omit<ClinicalNote, "id" | "createdAt" | "updatedAt">
  ): Promise<ClinicalNoteResponse> {
    const response = await apiClient.post<ClinicalNote>(this.baseUrl, note);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async updateClinicalNote(
    id: string,
    note: Partial<ClinicalNote>
  ): Promise<ClinicalNoteResponse> {
    const response = await apiClient.put<ClinicalNote>(
      `${this.baseUrl}/${id}`,
      note
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async cosignClinicalNote(
    noteId: string,
    cosignerId: string
  ): Promise<ClinicalNoteResponse> {
    const response = await apiClient.post<ClinicalNote>(
      `${this.baseUrl}/${noteId}/cosign`,
      { cosignerId }
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getPatientClinicalNotes(
    patientId: string
  ): Promise<ClinicalNoteResponse> {
    const response = await apiClient.get<ClinicalNote[]>(
      `${this.baseUrl}?patientId=${patientId}`
    );
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }
}

export const clinicalNotesServiceAPI = ClinicalNotesServiceAPI.getInstance();
