import { apiClient } from "../api/client";

export interface Equipment {
  id: string;
  name: string;
  type: string;
  model: string;
  manufacturer: string;
  serialNumber: string;
  location: string;
  department: string;
  status: "active" | "maintenance" | "broken" | "inactive";
  purchaseDate: string;
  warrantyExpiry: string;
  lastMaintenance: string;
  nextMaintenance: string;
  cost: number;
  condition: "excellent" | "good" | "fair" | "poor";
  batteryLevel?: number;
  isConnected?: boolean;
  temperature?: number;
}

export interface MaintenanceRecord {
  id: string;
  equipmentId: string;
  type: "preventive" | "corrective" | "emergency";
  date: string;
  technician: string;
  description: string;
  cost: number;
  partsReplaced: string[];
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  nextDue?: string;
}

export interface EquipmentResponse {
  success: boolean;
  data?: Equipment | Equipment[];
  message?: string;
  error?: string;
}

export interface MaintenanceResponse {
  success: boolean;
  data?: MaintenanceRecord | MaintenanceRecord[];
  message?: string;
  error?: string;
}

export class EquipmentServiceAPI {
  private static instance: EquipmentServiceAPI;
  private baseUrl: string = "/provider-staff-service/equipment";

  private constructor() {}

  public static getInstance(): EquipmentServiceAPI {
    if (!EquipmentServiceAPI.instance) {
      EquipmentServiceAPI.instance = new EquipmentServiceAPI();
    }
    return EquipmentServiceAPI.instance;
  }

  async getAllEquipment(): Promise<EquipmentResponse> {
    const response = await apiClient.get<Equipment[]>(this.baseUrl);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async getEquipmentById(id: string): Promise<EquipmentResponse> {
    const response = await apiClient.get<Equipment>(`${this.baseUrl}/${id}`);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async createEquipment(equipment: Omit<Equipment, "id">): Promise<EquipmentResponse> {
    const response = await apiClient.post<Equipment>(this.baseUrl, equipment);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async updateEquipment(id: string, equipment: Partial<Equipment>): Promise<EquipmentResponse> {
    const response = await apiClient.put<Equipment>(`${this.baseUrl}/${id}`, equipment);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async deleteEquipment(id: string): Promise<EquipmentResponse> {
    const response = await apiClient.delete<Equipment>(`${this.baseUrl}/${id}`);
    return {
      success: response.success,
      message: response.message,
      error: response.error,
    };
  }

  async getAllMaintenanceRecords(equipmentId?: string): Promise<MaintenanceResponse> {
    const url = equipmentId 
      ? `${this.baseUrl}/maintenance?equipmentId=${equipmentId}`
      : `${this.baseUrl}/maintenance`;
    const response = await apiClient.get<MaintenanceRecord[]>(url);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async createMaintenanceRecord(record: Omit<MaintenanceRecord, "id">): Promise<MaintenanceResponse> {
    const response = await apiClient.post<MaintenanceRecord>(`${this.baseUrl}/maintenance`, record);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }

  async updateMaintenanceRecord(id: string, record: Partial<MaintenanceRecord>): Promise<MaintenanceResponse> {
    const response = await apiClient.put<MaintenanceRecord>(`${this.baseUrl}/maintenance/${id}`, record);
    return {
      success: response.success,
      data: response.data,
      message: response.message,
      error: response.error,
    };
  }
}

export const equipmentServiceAPI = EquipmentServiceAPI.getInstance();

