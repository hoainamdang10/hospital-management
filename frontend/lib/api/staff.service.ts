/**
 * Staff Service
 * API service for fetching doctors and staff
 */

import apiClient from './axios';

export interface Staff {
  id: string;
  staffId: string;
  userId: string;
  staffType: 'doctor' | 'nurse' | 'admin' | 'receptionist' | 'technician' | 'pharmacist' | 'therapist';
  personalInfo: {
    fullName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth?: string;
    gender: string;
    nationality: string;
    address?: {
      street: string;
      ward: string;
      district: string;
      city: string;
      province: string;
      country: string;
    };
  };
  professionalInfo: {
    title: string;
    department: string;
    position: string;
    education: string[];
    languages: string[];
    bio?: string;
  };
  workSchedule: {
    workingDays: string[];
    workingHours: {
      start: string;
      end: string;
    };
    timeZone: string;
    isFlexible: boolean;
  };
  specializations: Array<{
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
  }>;
  credentials: Array<{
    credentialNumber?: string;
    credentialType: string;
    issuingAuthority: string;
    issueDate?: string;
    expiryDate?: string;
    isValid: boolean;
  }>;
  certifications: Array<{
    certificationName: string;
    issuingOrganization: string;
    issueDate?: string;
    expiryDate?: string;
    isValid: boolean;
  }>;
  yearsOfExperience: number;
  consultationFee?: number;
  status: 'active' | 'inactive' | 'suspended' | 'on_leave' | 'terminated';
  isActive: boolean;
}

export interface SearchStaffParams {
  searchTerm?: string;
  staffType?: string;
  departmentId?: string;
  specialization?: string;
  status?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface SearchStaffResponse {
  success: boolean;
  message?: string;
  data: {
    items: Staff[];  // Backend uses "items" from ResponseHelper.paginated
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

/**
 * Search staff (doctors, nurses, etc.)
 */
export const searchStaff = async (params: SearchStaffParams): Promise<SearchStaffResponse> => {
  const response = await apiClient.get('/v1/staff/search', { params });
  return response.data;
};

/**
 * Get doctors by department (PUBLIC - no auth required for appointment booking)
 */
export async function getDoctorsByDepartment(
  departmentId: string,
  limit: number = 20
): Promise<Staff[]> {
  try {
    const response = await apiClient.get('/v1/staff/search', { 
      params: {
        departmentId,
        staffType: 'doctor',
        status: 'active',
        isActive: true,
        limit,
      }
    });
    return response.data?.data?.items ?? [];
  } catch (error) {
    console.error('Failed to fetch doctors:', error);
    return [];
  }
}

/**
 * Get staff by ID
 */
export async function getStaffById(staffId: string): Promise<Staff> {
  const response = await apiClient.get<{ success: boolean; data: Staff }>(
    `/v1/staff/${staffId}`
  );
  return response.data.data;
}

/**
 * Calculate years of experience from createdAt
 */
export function calculateExperience(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  const years = now.getFullYear() - created.getFullYear();
  return Math.max(0, years);
}
