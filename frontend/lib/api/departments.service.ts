/**
 * Departments API Service
 * Calls Department Service backend through API Gateway
 * Backend: API Gateway (/api) -> Department Service (3025)
 */

import apiClient from './axios';

export interface Department {
  id: string;
  code: string;
  nameEn: string;
  nameVi: string;
  description: string;
  phone?: string;
  email?: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  doctorCount?: number;
  patientCount?: number;
}

export interface DepartmentResponse {
  success: boolean;
  data: Department | Department[];
  total?: number;
  source?: string;
  message?: string;
}

/**
 * Get all departments
 */
export async function getDepartments(): Promise<Department[]> {
  try {
    const response = await apiClient.get<DepartmentResponse>('/departments');
    
    if (response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching departments:', error);
    return [];
  }
}

/**
 * Get a single department by ID
 */
export async function getDepartmentById(id: string): Promise<{ success: boolean; data: Department }> {
  try {
    const response = await apiClient.get<DepartmentResponse>(`/departments/${id}`);
    
    if (response.data.success && !Array.isArray(response.data.data)) {
      return {
        success: true,
        data: response.data.data,
      };
    }
    
    throw new Error('Department not found');
  } catch (error: any) {
    console.error('Error fetching department:', error);
    throw error;
  }
}

/**
 * Get department by code
 */
export async function getDepartmentByCode(code: string): Promise<{ success: boolean; data: Department }> {
  try {
    const response = await apiClient.get<DepartmentResponse>(`/departments/code/${code}`);
    
    if (response.data.success && !Array.isArray(response.data.data)) {
      return {
        success: true,
        data: response.data.data,
      };
    }
    
    throw new Error('Department not found');
  } catch (error: any) {
    console.error('Error fetching department by code:', error);
    throw error;
  }
}

/**
 * Get department icon based on code
 */
export function getDepartmentIcon(code: string): string {
  const icons: Record<string, string> = {
    CARD: '🫀',
    ORTH: '🦴',
    PEDI: '👶',
    INTE: '🏥',
    EMER: '🚑',
    RADI: '📷',
    LABO: '🔬',
    ADMI: '📋',
  };
  return icons[code] || '🏥';
}

/**
 * Create a new department
 */
export async function createDepartment(data: {
  code: string;
  nameEn: string;
  nameVi: string;
  description: string;
  phone?: string;
  email?: string;
  location?: string;
  isActive?: boolean;
}): Promise<{ success: boolean; data: Department; message?: string }> {
  try {
    const response = await apiClient.post<DepartmentResponse>('/departments', data);
    
    if (response.data.success && !Array.isArray(response.data.data)) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    }
    
    throw new Error('Failed to create department');
  } catch (error: any) {
    console.error('Error creating department:', error);
    throw error;
  }
}

/**
 * Update an existing department
 */
export async function updateDepartment(
  id: string,
  data: {
    code?: string;
    nameEn?: string;
    nameVi?: string;
    description?: string;
    phone?: string;
    email?: string;
    location?: string;
    isActive?: boolean;
  }
): Promise<{ success: boolean; data: Department; message?: string }> {
  try {
    const response = await apiClient.put<DepartmentResponse>(`/departments/${id}`, data);
    
    if (response.data.success && !Array.isArray(response.data.data)) {
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
      };
    }
    
    throw new Error('Failed to update department');
  } catch (error: any) {
    console.error('Error updating department:', error);
    throw error;
  }
}

/**
 * Delete a department (soft delete)
 */
export async function deleteDepartment(id: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/departments/${id}`);
    
    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error('Error deleting department:', error);
    throw error;
  }
}

/**
 * Get staff members in a department
 */
export async function getDepartmentStaff(departmentId: string): Promise<{
  success: boolean;
  data: any[];
  total: number;
  department?: Department;
}> {
  try {
    const response = await apiClient.get(`/departments/${departmentId}/staff`);
    
    return {
      success: response.data.success,
      data: response.data.data || [],
      total: response.data.total || 0,
      department: response.data.department,
    };
  } catch (error: any) {
    console.error(`Error fetching department staff for ${departmentId}:`, error.response?.data || error.message);
    // Return empty result instead of failing
    return {
      success: true,
      data: [],
      total: 0,
    };
  }
}

/**
 * Add staff member to department
 */
export async function addStaffToDepartment(
  departmentId: string,
  staffId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiClient.post(`/departments/${departmentId}/staff`, {
      staffId,
    });
    
    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error('Error adding staff to department:', error);
    throw error;
  }
}

/**
 * Remove staff member from department
 */
export async function removeStaffFromDepartment(
  departmentId: string,
  staffId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiClient.delete(`/departments/${departmentId}/staff/${staffId}`);
    
    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error('Error removing staff from department:', error);
    throw error;
  }
}

/**
 * Get department head (trưởng khoa)
 */
export async function getDepartmentHead(departmentId: string): Promise<{
  success: boolean;
  data: any | null;
  department?: Department;
}> {
  try {
    const response = await apiClient.get(`/departments/${departmentId}/head`);
    
    return {
      success: response.data.success,
      data: response.data.data,
      department: response.data.department,
    };
  } catch (error: any) {
    console.error(`Error fetching department head for ${departmentId}:`, error.response?.data || error.message);
    // Return empty result instead of throwing
    return {
      success: true,
      data: null,
    };
  }
}

/**
 * Set department head (trưởng khoa)
 */
export async function setDepartmentHead(
  departmentId: string,
  staffId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await apiClient.put(`/departments/${departmentId}/head`, {
      staffId,
    });
    
    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error('Error setting department head:', error);
    throw error;
  }
}
