/**
 * Staff Service
 * API service for fetching doctors and staff
 */

import apiClient from './axios';

export interface Staff {
  id: string;
  staffId: string;
  userId: string;
  staffType:
  | 'doctor'
  | 'nurse'
  | 'admin'
  | 'receptionist'
  | 'technician'
  | 'pharmacist'
  | 'therapist';
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
    dailySchedules?: Array<{
      day: string;
      start: string;
      end: string;
    }>;
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
  licenseNumber?: string;
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
    items: Staff[]; // Backend uses "items" from ResponseHelper.paginated
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
      },
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
  const response = await apiClient.get<{ success: boolean; data: any }>(`/v1/staff/${staffId}`);
  const data = response.data.data;

  // Map snake_case to camelCase if needed
  const mapped: any = { ...data };

  if (data.staff_id !== undefined && !mapped.staffId) {
    mapped.staffId = data.staff_id;
  }

  if (data.years_of_experience !== undefined && !mapped.yearsOfExperience) {
    mapped.yearsOfExperience = data.years_of_experience;
  }

  if (data.consultation_fee !== undefined && !mapped.consultationFee) {
    mapped.consultationFee = data.consultation_fee;
  }
  // Employment info may carry years and status
  if (data.employmentInfo?.yearsOfExperience !== undefined) {
    mapped.yearsOfExperience = data.employmentInfo.yearsOfExperience;
  }
  if (data.employmentInfo?.employmentType && !mapped.employmentType) {
    mapped.employmentType = data.employmentInfo.employmentType;
  }
  if (data.employmentInfo?.isActive !== undefined && mapped.isActive === undefined) {
    mapped.isActive = data.employmentInfo.isActive;
  }

  if (data.user_id !== undefined && !mapped.userId) {
    mapped.userId = data.user_id;
  }

  if (data.staff_type !== undefined && !mapped.staffType) {
    mapped.staffType = data.staff_type;
  }

  if (data.personal_info !== undefined && !mapped.personalInfo) {
    mapped.personalInfo = data.personal_info;
  }

  if (data.professional_info !== undefined && !mapped.professionalInfo) {
    mapped.professionalInfo = data.professional_info;
  }

  if (data.work_schedule !== undefined && !mapped.workSchedule) {
    mapped.workSchedule = data.work_schedule;
  }
  if (mapped.workSchedule?.daily_schedules && !mapped.workSchedule.dailySchedules) {
    (mapped.workSchedule as any).dailySchedules = (mapped.workSchedule as any).daily_schedules;
  }

  if (data.is_active !== undefined && !mapped.isActive) {
    mapped.isActive = data.is_active;
  }

  return mapped as Staff;
}

export async function getStaffByUserId(userId: string): Promise<Staff | null> {
  try {
    const response = await apiClient.get<{ success: boolean; data: any }>(
      `/v1/staff/user/${userId}`,
      { params: { _ts: Date.now() } } // cache buster
    );
    const data = response.data.data;

    // Normalize snake_case from backend (in case gateway strips camelCase)
    const mapped: any = { ...data };

    if (data.staff_id !== undefined && !mapped.staffId) {
      mapped.staffId = data.staff_id;
    }
    if (data.user_id !== undefined && !mapped.userId) {
      mapped.userId = data.user_id;
    }
    if (data.staff_type !== undefined && !mapped.staffType) {
      mapped.staffType = data.staff_type;
    }
    if (data.personal_info !== undefined && !mapped.personalInfo) {
      mapped.personalInfo = data.personal_info;
    }
    if (data.professional_info !== undefined && !mapped.professionalInfo) {
      mapped.professionalInfo = data.professional_info;
    }
    if (data.work_schedule !== undefined && !mapped.workSchedule) {
      mapped.workSchedule = data.work_schedule;
    }
    if (mapped.workSchedule?.daily_schedules && !mapped.workSchedule.dailySchedules) {
      (mapped.workSchedule as any).dailySchedules = (mapped.workSchedule as any).daily_schedules;
    }
    if (data.is_active !== undefined && mapped.isActive === undefined) {
      mapped.isActive = data.is_active;
    }
    if (data.years_of_experience !== undefined && mapped.yearsOfExperience === undefined) {
      mapped.yearsOfExperience = data.years_of_experience;
    }
    if (data.consultation_fee !== undefined && mapped.consultationFee === undefined) {
      mapped.consultationFee = data.consultation_fee;
    }
    if (data.license_number !== undefined && mapped.licenseNumber === undefined) {
      mapped.licenseNumber = data.license_number;
    }
    if (
      data.employmentInfo?.yearsOfExperience !== undefined &&
      mapped.yearsOfExperience === undefined
    ) {
      mapped.yearsOfExperience = data.employmentInfo.yearsOfExperience;
    }
    if (data.employmentInfo?.employmentType && !mapped.employmentType) {
      mapped.employmentType = data.employmentInfo.employmentType;
    }
    if (data.employmentInfo?.isActive !== undefined && mapped.isActive === undefined) {
      mapped.isActive = data.employmentInfo.isActive;
    }

    return mapped as Staff;
  } catch (error) {
    console.error('Failed to fetch staff by userId', error);
    return null;
  }
}

/**
 * Self update staff profile (doctor/nurse)
 */
export async function updateMyStaffProfile(payload: {
  staffId?: string;
  personalInfo?: {
    fullName?: string;
    phoneNumber?: string;
    address?: {
      street?: string;
      ward?: string;
      district?: string;
      city?: string;
      province?: string;
      country?: string;
    };
  };
  professionalInfo?: {
    title?: string;
    position?: string;
    education?: string[];
    languages?: string[];
    bio?: string;
  };
}): Promise<{ success: boolean; data: Staff }> {
  // Use apiClient base (/api) so session cookie is sent via gateway
  const response = await apiClient.put('/v1/staff/me', payload);
  return response.data;
}

/**
 * Self update work schedule for current staff (doctor/nurse)
 */
export async function updateMySchedule(payload: {
  workSchedule: {
    workingDays: string[];
    workingHours: { start: string; end: string };
    timeZone: string;
    isFlexible: boolean;
    dailySchedules?: Array<{
      day: string;
      start: string;
      end: string;
    }>;
  };
  effectiveDate?: string;
}): Promise<{ success: boolean; data: any; message?: string }> {
  const response = await apiClient.put('/v1/staff/me/schedule', payload);
  return response.data;
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

export async function createStaffProfile(payload: {
  userId: string;
  staffType: 'doctor' | 'admin';
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    nationalId: string;
    nationality?: string;
    phoneNumber: string;
    email?: string;
    address?: {
      street?: string;
      ward?: string;
      district?: string;
      city?: string;
      province?: string;
      country?: string;
    };
  };
  professionalInfo: {
    title: string;
    department: string;
    position: string;
    education?: string[];
    languages?: string[];
    bio?: string;
  };
  workSchedule?: {
    workingDays?: string[];
    workingHours?: { start?: string; end?: string };
    timeZone?: string;
    isFlexible?: boolean;
  };
  licenseNumber: string;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'intern' | 'volunteer';
  hireDate: string;
  contractEndDate?: string;
  yearsOfExperience: number;
  consultationFee?: number | null;
  specializations?: Array<{ code: string; name: string; description?: string; isActive: boolean }>;
  vietnameseHealthcareLicense?: string;
  mohRegistrationNumber?: string;
}): Promise<{ success: boolean; data: any; message?: string }> {
  const response = await apiClient.post('/v1/staff', payload);
  return response.data;
}

export async function assignStaffToDepartment(
  staffId: string,
  options: { departmentId: string; departmentName?: string; role?: string; isPrimary?: boolean; startDate?: string }
): Promise<{ success: boolean; message?: string }> {
  const body = {
    staffId,
    departmentId: options.departmentId,
    departmentName: options.departmentName || '',
    role: options.role || 'Member',
    isPrimary: options.isPrimary ?? true,
    startDate: options.startDate || new Date().toISOString().slice(0, 10),
  };
  const response = await apiClient.post(`/v1/staff/${staffId}/departments`, body);
  return response.data;
}

export async function updateStaffInfo(
  staffId: string,
  data: Partial<Staff>
): Promise<{ success: boolean; data: { staffId: string }; message?: string }> {
  const response = await apiClient.put(`/v1/staff/${staffId}`, {
    staffId,
    ...data,
  });
  return response.data;
}

export async function suspendStaff(
  staffId: string,
  reason?: string
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.post(`/v1/staff/${staffId}/suspend`, { reason });
  return response.data;
}

export async function reactivateStaff(
  staffId: string
): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.post(`/v1/staff/${staffId}/reactivate`);
  return response.data;
}
