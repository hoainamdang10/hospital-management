/**
 * UpdatePatientInfoUseCase - Application Use Case
 * 
 * Handles patient information updates
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';
import { PersonalInfo } from '../../domain/value-objects/PersonalInfo';
import { ContactInfo, Address } from '../../domain/value-objects/ContactInfo';
import { BasicMedicalInfo, BloodType } from '../../domain/value-objects/BasicMedicalInfo';
import { InsuranceInfo } from '../../domain/entities/InsuranceInfo';

export interface UpdatePatientInfoRequest {
  patientId: string;
  personalInfo?: {
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    nationalId: string;
    nationality: string;
    ethnicity?: string;
    occupation?: string;
    maritalStatus?: string;
  };
  contactInfo?: {
    primaryPhone: string;
    secondaryPhone?: string;
    email?: string;
    preferredContactMethod: 'phone' | 'email' | 'sms';
    address: {
      street: string;
      ward: string;
      district: string;
      city: string;
      postalCode?: string;
      country: string;
    };
  };
  basicMedicalInfo?: {
    bloodType?: BloodType;
    knownAllergies?: string[];
    emergencyMedicalInfo?: string;
  };
  insuranceInfo?: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
    validFrom: string;
    validTo: string;
    coverageType: 'BHYT' | 'BHTN' | 'private' | 'self_pay';
    isVietnameseInsurance: boolean;
    bhytNumber?: string;
    isPrimary: boolean;
  };
  updatedBy: string;
}

export interface UpdatePatientInfoResponse {
  success: boolean;
  message: string;
  errors?: string[];
}

export class UpdatePatientInfoUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository
  ) {}

  async execute(request: UpdatePatientInfoRequest): Promise<UpdatePatientInfoResponse> {
    try {
      // 1. Find patient
      const patientId = PatientId.create(request.patientId);
      const patient = await this.patientRepository.findById(patientId);

      if (!patient) {
        return {
          success: false,
          message: 'Không tìm thấy bệnh nhân',
          errors: ['PATIENT_NOT_FOUND']
        };
      }

      // 2. Check if patient is active
      if (!patient.isActive()) {
        return {
          success: false,
          message: 'Không thể cập nhật bệnh nhân không hoạt động',
          errors: ['PATIENT_NOT_ACTIVE']
        };
      }

      // 3. Update personal info (if provided)
      if (request.personalInfo) {
        const personalInfo = PersonalInfo.create({
          fullName: request.personalInfo.fullName,
          dateOfBirth: new Date(request.personalInfo.dateOfBirth),
          gender: request.personalInfo.gender,
          nationalId: request.personalInfo.nationalId,
          nationality: request.personalInfo.nationality,
          ethnicity: request.personalInfo.ethnicity,
          occupation: request.personalInfo.occupation,
          maritalStatus: request.personalInfo.maritalStatus
        });

        patient.updatePersonalInfo(personalInfo, request.updatedBy);
      }

      // 4. Update contact info (if provided)
      if (request.contactInfo) {
        const contactInfo = ContactInfo.create({
          primaryPhone: request.contactInfo.primaryPhone,
          secondaryPhone: request.contactInfo.secondaryPhone,
          email: request.contactInfo.email,
          preferredContactMethod: request.contactInfo.preferredContactMethod,
          address: request.contactInfo.address as Address
        });

        patient.updateContactInfo(contactInfo, request.updatedBy);
      }

      // 5. Update basic medical info (if provided)
      if (request.basicMedicalInfo) {
        const basicMedicalInfo = BasicMedicalInfo.create({
          bloodType: request.basicMedicalInfo.bloodType,
          knownAllergies: request.basicMedicalInfo.knownAllergies || [],
          emergencyMedicalInfo: request.basicMedicalInfo.emergencyMedicalInfo
        });

        patient.updateBasicMedicalInfo(basicMedicalInfo, request.updatedBy);
      }

      // 6. Update insurance info (if provided)
      if (request.insuranceInfo) {
        const insuranceInfo = InsuranceInfo.create({
          provider: request.insuranceInfo.provider,
          policyNumber: request.insuranceInfo.policyNumber,
          groupNumber: request.insuranceInfo.groupNumber,
          validFrom: new Date(request.insuranceInfo.validFrom),
          validTo: new Date(request.insuranceInfo.validTo),
          coverageType: request.insuranceInfo.coverageType,
          isVietnameseInsurance: request.insuranceInfo.isVietnameseInsurance,
          bhytNumber: request.insuranceInfo.bhytNumber,
          isPrimary: request.insuranceInfo.isPrimary,
          isActive: true
        });

        patient.updateInsuranceInfo(insuranceInfo, request.updatedBy);
      }

      // 7. Save updated patient
      await this.patientRepository.save(patient);

      // 8. Return success response
      return {
        success: true,
        message: 'Cập nhật thông tin bệnh nhân thành công'
      };

    } catch (error) {
      // Handle validation errors
      if (error instanceof Error) {
        return {
          success: false,
          message: 'Cập nhật thông tin bệnh nhân thất bại',
          errors: [error.message]
        };
      }

      // Handle unexpected errors
      return {
        success: false,
        message: 'Đã xảy ra lỗi không mong muốn',
        errors: ['UNEXPECTED_ERROR']
      };
    }
  }
}

