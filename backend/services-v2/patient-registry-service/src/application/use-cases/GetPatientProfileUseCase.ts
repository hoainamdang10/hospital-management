/**
 * GetPatientProfileUseCase - Application Use Case
 *
 * Retrieves patient profile information
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';
import { Patient } from '../../domain/aggregates/Patient';

export interface GetPatientProfileRequest {
  patientId?: string;
  userId?: string;
  nationalId?: string;
  requestedBy: string;
}

export interface GetPatientProfileResponse {
  success: boolean;
  message: string;
  errors?: string[];
  data?: {
    patientId: string;
    userId: string;
    personalInfo: {
      fullName: string;
      dateOfBirth: string;
      gender: string;
      nationalId: string;
      nationality: string;
      ethnicity?: string;
      occupation?: string;
      maritalStatus?: string;
    };
    contactInfo: {
      primaryPhone: string;
      secondaryPhone?: string;
      email?: string;
      preferredContactMethod: string;
      address: {
        street: string;
        ward: string;
        district: string;
        city: string;
        postalCode?: string;
        country: string;
      };
    };
    basicMedicalInfo: {
      bloodType?: string;
      knownAllergies: string[];
      emergencyMedicalInfo?: string;
    };
    insuranceInfo?: {
      provider: string;
      policyNumber: string;
      groupNumber?: string;
      validFrom: string;
      validTo: string;
      coverageType: string;
      isVietnameseInsurance: boolean;
      bhytNumber?: string;
      isPrimary: boolean;
      isActive: boolean;
    };
    emergencyContacts: Array<{
      id: string;
      name: string;
      relationship: string;
      primaryPhone: string;
      secondaryPhone?: string;
      email?: string;
      address?: string;
      isPrimary: boolean;
    }>;
    consents: Array<{
      id: string;
      consentType: string;
      isGranted: boolean;
      grantedAt?: string;
      revokedAt?: string;
      expiresAt?: string;
    }>;
    status: string;
    mergedInto?: string;
    links: Array<{
      otherPatientId: string;
      linkType: string;
      createdAt: string;
      createdBy: string;
    }>;
    createdAt: string;
    updatedAt: string;
  };
}

export class GetPatientProfileUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository
  ) {}

  async execute(request: GetPatientProfileRequest): Promise<GetPatientProfileResponse> {
    try {
      // 1. Find patient by one of the identifiers
      let patient: Patient | null = null;

      if (request.patientId) {
        const patientId = PatientId.create(request.patientId);
        patient = await this.patientRepository.findById(patientId);
      } else if (request.userId) {
        patient = await this.patientRepository.findByUserId(request.userId);
      } else if (request.nationalId) {
        patient = await this.patientRepository.findByNationalId(request.nationalId);
      } else {
        return {
          success: false,
          message: 'Vui lòng cung cấp patientId, userId hoặc nationalId',
          errors: ['MISSING_IDENTIFIER']
        };
      }

      if (!patient) {
        return {
          success: false,
          message: 'Không tìm thấy bệnh nhân',
          errors: ['PATIENT_NOT_FOUND']
        };
      }

      // 2. Map patient aggregate to response DTO
      const personalInfo = patient.getPersonalInfo();
      const contactInfo = patient.getContactInfo();
      const basicMedicalInfo = patient.getBasicMedicalInfo();
      const insuranceInfo = patient.getInsuranceInfo();
      const emergencyContacts = patient.getEmergencyContacts();
      const consents = patient.getConsents();
      const links = patient.getLinks();

      return {
        success: true,
        message: 'Lấy thông tin bệnh nhân thành công',
        data: {
          patientId: patient.getPatientId() || '',
          userId: patient.getUserId(),
          personalInfo: {
            fullName: personalInfo.fullName,
            dateOfBirth: personalInfo.dateOfBirth.toISOString(),
            gender: personalInfo.gender,
            nationalId: personalInfo.nationalId,
            nationality: personalInfo.nationality,
            ethnicity: personalInfo.ethnicity,
            occupation: personalInfo.occupation,
            maritalStatus: personalInfo.maritalStatus
          },
          contactInfo: {
            primaryPhone: contactInfo.primaryPhone,
            secondaryPhone: contactInfo.secondaryPhone,
            email: contactInfo.email,
            preferredContactMethod: contactInfo.preferredContactMethod,
            address: {
              street: contactInfo.address.street,
              ward: contactInfo.address.ward,
              district: contactInfo.address.district,
              city: contactInfo.address.city,
              postalCode: contactInfo.address.postalCode,
              country: contactInfo.address.country
            }
          },
          basicMedicalInfo: {
            bloodType: basicMedicalInfo.bloodType,
            knownAllergies: basicMedicalInfo.knownAllergies,
            emergencyMedicalInfo: basicMedicalInfo.emergencyMedicalInfo
          },
          insuranceInfo: insuranceInfo ? {
            provider: insuranceInfo.provider,
            policyNumber: insuranceInfo.policyNumber,
            groupNumber: insuranceInfo.groupNumber,
            validFrom: insuranceInfo.validFrom.toISOString(),
            validTo: insuranceInfo.validTo.toISOString(),
            coverageType: insuranceInfo.coverageType,
            isVietnameseInsurance: insuranceInfo.isVietnameseInsurance,
            bhytNumber: insuranceInfo.bhytNumber,
            isPrimary: insuranceInfo.isPrimary,
            isActive: insuranceInfo.isActive
          } : undefined,
          emergencyContacts: emergencyContacts.map(contact => ({
            id: contact.getId(),
            name: contact.name,
            relationship: contact.relationship,
            primaryPhone: contact.primaryPhone,
            secondaryPhone: contact.secondaryPhone,
            email: contact.email,
            address: contact.address,
            isPrimary: contact.isPrimary
          })),
          consents: consents.map(consent => ({
            id: consent.getId(),
            consentType: consent.consentType,
            isGranted: consent.isGranted(),
            grantedAt: consent.grantedAt.toISOString(),
            revokedAt: consent.revokedAt()?.toISOString(),
            expiresAt: consent.expiresAt?.toISOString()
          })),
          status: patient.getStatus().valueOf(),
          mergedInto: patient.getMergedInto()?.value,
          links: links.map(link => ({
            otherPatientId: link.otherPatientId.value,
            linkType: link.linkType,
            createdAt: link.createdAt.toISOString(),
            createdBy: link.createdBy
          })),
          createdAt: patient.getProps().createdAt.toISOString(),
          updatedAt: patient.getProps().updatedAt.toISOString()
        }
      };

    } catch (error) {
      // Handle validation errors
      if (error instanceof Error) {
        return {
          success: false,
          message: 'Lấy thông tin bệnh nhân thất bại',
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

