import { apiClient } from './client';
import { Department, DepartmentForm, ApiResponse, FilterOptions } from '../types';

// Departments API endpoints
export const departmentsApi = {
  // Get all departments
  getAll: async (filters?: FilterOptions): Promise<ApiResponse<Department[]>> => {
    return apiClient.get<Department[]>('/departments', filters);
  },

  // Get department by ID
  getById: async (id: string): Promise<ApiResponse<Department>> => {
    return apiClient.get<Department>(`/departments/${id}`);
  },

  // Create new department
  create: async (departmentData: DepartmentForm): Promise<ApiResponse<Department>> => {
    return apiClient.post<Department>('/departments', departmentData);
  },

  // Update department
  update: async (id: string, departmentData: Partial<DepartmentForm>): Promise<ApiResponse<Department>> => {
    return apiClient.put<Department>(`/departments/${id}`, departmentData);
  },

  // Delete department
  delete: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return apiClient.delete<{ message: string }>(`/departments/${id}`);
  },
};
