/**
 * Department Service Client Interface
 * Provider/Staff Service V2
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Inter-Service Communication
 */

export interface DepartmentDTO {
  id: string;
  code: string;
  nameEn: string;
  nameVi: string;
  description?: string;
  phone?: string;
  email?: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentServiceResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Interface for Department Service Client
 * Used to communicate with Department Service
 */
export interface IDepartmentServiceClient {
  /**
   * Get department by ID
   */
  getDepartmentById(id: string): Promise<DepartmentDTO | null>;

  /**
   * Get department by code (CARD, ORTH, PEDI, etc.)
   */
  getDepartmentByCode(code: string): Promise<DepartmentDTO | null>;

  /**
   * Validate if department exists and is active
   */
  validateDepartment(id: string): Promise<boolean>;

  /**
   * Get all active departments
   */
  getAllActiveDepartments(): Promise<DepartmentDTO[]>;

  /**
   * Health check for Department Service
   */
  healthCheck(): Promise<boolean>;
}
