/**
 * GetStaffProfileUseCase
 * Use case for retrieving staff profile information
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IProviderStaffRepository } from '../repositories/IProviderStaffRepository';
import { StaffId } from '../../domain/value-objects/StaffId';

export interface GetStaffProfileRequest {
  staffId: string;
}

export interface GetStaffProfileResponse {
  success: boolean;
  data?: {
    id: string;
    fullName: string;
    citizenId?: string;
    dateOfBirth?: string;
    gender?: string;
    phoneNumber?: string;
    email?: string;
    address?: string;
    licenseNumber?: string;
    specialization?: string;
    yearsOfExperience?: number;
    qualifications?: string[];
    certifications?: string[];
    staffType: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
}

export class GetStaffProfileUseCase {
  constructor(
    private readonly staffRepository: IProviderStaffRepository
  ) {}

  async execute(request: GetStaffProfileRequest): Promise<GetStaffProfileResponse> {
    try {
      const staffId = StaffId.fromString(request.staffId);
      const staff = await this.staffRepository.findById(staffId);

      if (!staff) {
        return {
          success: false,
          message: 'Staff not found'
        };
      }

      return {
        success: true,
        data: {
          id: staff.id,
          fullName: staff.personalInfo.fullName,
          citizenId: staff.personalInfo.citizenId,
          dateOfBirth: staff.personalInfo.dateOfBirth?.toISOString(),
          gender: staff.personalInfo.gender,
          phoneNumber: staff.personalInfo.phoneNumber,
          email: staff.personalInfo.email,
          address: staff.personalInfo.address,
          licenseNumber: staff.professionalInfo.licenseNumber,
          specialization: staff.professionalInfo.specialization,
          yearsOfExperience: staff.professionalInfo.yearsOfExperience,
          qualifications: staff.professionalInfo.qualifications,
          certifications: staff.professionalInfo.certifications,
          staffType: staff.staffType,
          isActive: staff.isActive,
          createdAt: staff.createdAt.toISOString(),
          updatedAt: staff.updatedAt.toISOString()
        },
        message: 'Staff profile retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

