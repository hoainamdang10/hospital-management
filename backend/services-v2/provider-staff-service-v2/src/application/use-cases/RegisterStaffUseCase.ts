/**
 * RegisterStaffUseCase
 * Use case for registering new staff members
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IProviderStaffRepository } from '../repositories/IProviderStaffRepository';
import { ProviderStaff, StaffType } from '../../domain/aggregates/ProviderStaff';
import { PersonalInfo } from '../../domain/value-objects/PersonalInfo';
import { ProfessionalInfo } from '../../domain/value-objects/ProfessionalInfo';

export interface RegisterStaffRequest {
  // Personal Info
  fullName: string;
  citizenId?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  phoneNumber?: string;
  email?: string;
  address?: string;

  // Professional Info
  licenseNumber?: string;
  specialization?: string;
  yearsOfExperience?: number;
  qualifications?: string[];
  certifications?: string[];

  // Staff Type
  staffType: StaffType;
}

export interface RegisterStaffResponse {
  success: boolean;
  staffId?: string;
  message: string;
}

export class RegisterStaffUseCase {
  constructor(
    private readonly staffRepository: IProviderStaffRepository
  ) {}

  async execute(request: RegisterStaffRequest): Promise<RegisterStaffResponse> {
    try {
      // Create value objects
      const personalInfo = PersonalInfo.create({
        fullName: request.fullName,
        citizenId: request.citizenId,
        dateOfBirth: request.dateOfBirth ? new Date(request.dateOfBirth) : undefined,
        gender: request.gender,
        phoneNumber: request.phoneNumber,
        email: request.email,
        address: request.address
      });

      const professionalInfo = ProfessionalInfo.create({
        licenseNumber: request.licenseNumber,
        specialization: request.specialization,
        yearsOfExperience: request.yearsOfExperience,
        qualifications: request.qualifications,
        certifications: request.certifications
      });

      // Create staff aggregate
      const staff = ProviderStaff.create(
        personalInfo,
        professionalInfo,
        request.staffType
      );

      // Save to repository
      await this.staffRepository.save(staff);

      return {
        success: true,
        staffId: staff.id,
        message: 'Staff registered successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

