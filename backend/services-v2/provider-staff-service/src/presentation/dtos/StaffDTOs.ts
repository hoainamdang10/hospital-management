/**
 * Staff DTOs - Data Transfer Objects
 * Provider/Staff Service V2
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, RESTful API
 */

import {
  StaffType,
  StaffStatus,
  EmploymentType,
} from "../../domain/aggregates/ProviderStaff";

// ==================== REQUEST DTOs ====================

export interface RegisterStaffRequestDto {
  userId: string;
  staffType: StaffType;
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: "male" | "female" | "other";
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
    workingHours?: {
      start?: string;
      end?: string;
    };
    timeZone?: string;
    isFlexible?: boolean;
  };
  licenseNumber: string;
  employmentType: EmploymentType;
  hireDate: string;
  contractEndDate?: string;
  yearsOfExperience: number;
  consultationFee?: number;
  vietnameseHealthcareLicense?: string;
  mohRegistrationNumber?: string;
}

export interface UpdateStaffInfoRequestDto {
  staffId: string;
  personalInfo?: {
    phoneNumber?: string;
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
  professionalInfo?: {
    title?: string;
    department?: string;
    position?: string;
    education?: string[];
    languages?: string[];
    bio?: string;
  };
  workSchedule?: {
    workingDays?: string[];
    workingHours?: {
      start?: string;
      end?: string;
    };
    timeZone?: string;
    isFlexible?: boolean;
  };
  consultationFee?: number;
}

export interface UpdateStaffStatusRequestDto {
  staffId: string;
  status: StaffStatus;
  reason?: string;
}

export interface AddStaffCredentialRequestDto {
  staffId: string;
  credentialType: string;
  credentialNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate?: string;
  verificationStatus: "pending" | "verified" | "rejected";
}

export interface AssignStaffToDepartmentRequestDto {
  staffId: string;
  departmentId: string;
  departmentName: string;
  role: string;
  isPrimary: boolean;
  startDate: string;
  endDate?: string;
}

export interface SearchStaffRequestDto {
  searchTerm?: string;
  staffType?: StaffType;
  departmentId?: string;
  status?: StaffStatus;
  isActive?: boolean;
  // REMOVED: isAcceptingNewPatients - Belongs to Scheduling/Appointment Service
  page?: number;
  limit?: number;
}

// ==================== RESPONSE DTOs ====================

export interface StaffResponseDto {
  id: string;
  userId: string;
  staffType: StaffType;
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    nationalId: string;
    nationality: string;
    phoneNumber: string;
    email?: string;
    address: {
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
  licenseNumber: string;
  employmentType: EmploymentType;
  hireDate: string;
  contractEndDate?: string;
  yearsOfExperience: number;
  consultationFee?: number;
  credentials: Array<{
    type: string;
    number: string;
    issuingAuthority: string;
    issueDate: string;
    expiryDate?: string;
    verificationStatus: string;
  }>;
  departmentAssignments: Array<{
    departmentId: string;
    departmentName: string;
    role: string;
    isPrimary: boolean;
    startDate: string;
    endDate?: string;
  }>;
  // REMOVED: rating - Belongs to Review/Rating Service
  // REMOVED: totalPatients - Belongs to Scheduling/Appointment Service
  // REMOVED: isAcceptingNewPatients - Belongs to Scheduling/Appointment Service
  status: StaffStatus;
  isActive: boolean;
  registrationDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffListResponseDto {
  staff: StaffResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StaffStatisticsResponseDto {
  totalStaff: number;
  activeStaff: number;
  byType: Record<StaffType, number>;
  byStatus: Record<StaffStatus, number>;
  byDepartment: Record<string, number>;
  // REMOVED: averageRating - Belongs to Review/Rating Service
  averageExperience: number;
}

// ==================== COMMON RESPONSE ====================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: any;
  timestamp?: string;
  path?: string;
}
