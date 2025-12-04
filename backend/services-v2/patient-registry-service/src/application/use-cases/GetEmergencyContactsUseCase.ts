/**
 * GetEmergencyContactsUseCase - Application Layer
 * Get all emergency contacts for a patient
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, HIPAA
 */

import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { PatientId } from '../../domain/value-objects/PatientId';
import { ILogger } from '@shared/application/services/logger.interface';
import type { EmergencyContact } from '../../domain/entities/EmergencyContact';

export interface GetEmergencyContactsCommand {
  patientId: string;
  requestedBy: string;
}

export interface EmergencyContactDTO {
  id: string;
  name: string;
  relationship: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email?: string;
  address?: string;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetEmergencyContactsResult {
  success: boolean;
  data?: {
    patientId: string;
    contacts: EmergencyContactDTO[];
    totalCount: number;
  };
  message: string;
  errors?: string[];
}

/**
 * Use Case: Get Emergency Contacts
 */
export class GetEmergencyContactsUseCase {
  constructor(
    private patientRepository: IPatientRepository,
    private logger: ILogger
  ) { }

  async execute(command: GetEmergencyContactsCommand): Promise<GetEmergencyContactsResult> {
    this.logger.info('Getting emergency contacts', {
      patientId: command.patientId,
      requestedBy: command.requestedBy
    });

    try {
      // 1. Validate input
      if (!command.patientId || command.patientId.trim().length === 0) {
        return {
          success: false,
          message: 'Patient ID không được để trống',
          errors: ['INVALID_PATIENT_ID']
        };
      }

      if (!command.requestedBy || command.requestedBy.trim().length === 0) {
        return {
          success: false,
          message: 'Người yêu cầu không được để trống',
          errors: ['INVALID_REQUESTED_BY']
        };
      }

      // 2. Find patient - Handle both UUID and PAT-YYYYMM-XXX formats
      let patient: any = null;
      const inputId = command.patientId.trim();

      // Check if input is UUID format
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

      if (uuidRegex.test(inputId)) {
        // Try to find by userId (UUID)
        patient = await this.patientRepository.findByUserId(inputId);
      } else {
        // Assume it's PAT-YYYYMM-XXX format
        try {
          const patientId = PatientId.create(inputId);
          patient = await this.patientRepository.findById(patientId);
        } catch (error) {
          // If not valid PAT format, try to find by userId as fallback
          patient = await this.patientRepository.findByUserId(inputId);
        }
      }

      if (!patient) {
        return {
          success: false,
          message: `Không tìm thấy bệnh nhân với ID: ${command.patientId}`,
          errors: ['PATIENT_NOT_FOUND']
        };
      }

      // 3. Get emergency contacts
      const contacts = patient.getEmergencyContacts();

      // 4. Map to DTOs
      const contactDTOs: EmergencyContactDTO[] = contacts.map((contact: EmergencyContact) => ({
        id: contact.getId(),
        name: contact.name,
        relationship: contact.relationship,
        primaryPhone: contact.primaryPhone,
        secondaryPhone: contact.secondaryPhone,
        email: contact.email,
        address: contact.address,
        isPrimary: contact.isPrimary,
        isActive: contact.isActive,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt
      }));

      this.logger.info('Emergency contacts retrieved successfully', {
        patientId: command.patientId,
        contactCount: contactDTOs.length
      });

      return {
        success: true,
        data: {
          patientId: command.patientId,
          contacts: contactDTOs,
          totalCount: contactDTOs.length
        },
        message: 'Lấy danh sách người liên hệ khẩn cấp thành công'
      };

    } catch (error) {
      this.logger.error('Error getting emergency contacts', {
        patientId: command.patientId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        success: false,
        message: 'Lỗi khi lấy danh sách người liên hệ khẩn cấp',
        errors: [error instanceof Error ? error.message : 'UNKNOWN_ERROR']
      };
    }
  }
}

