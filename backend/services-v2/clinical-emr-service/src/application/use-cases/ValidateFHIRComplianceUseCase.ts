/**
 * ValidateFHIRComplianceUseCase - Application Layer
 * Use case for validating FHIR compliance of medical record
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { RecordId } from '../../domain/value-objects/RecordId';

export interface ValidateFHIRComplianceRequest {
  recordId: string;
  requestedBy: string;
}

export interface ValidateFHIRComplianceResponse {
  success: boolean;
  message: string;
  data?: {
    recordId: string;
    isCompliant: boolean;
    validationErrors: string[];
    fhirVersion: string;
    validatedAt: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class ValidateFHIRComplianceUseCase extends BaseHealthcareUseCase<ValidateFHIRComplianceRequest, ValidateFHIRComplianceResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository
  ) {
    super();
  }

  override async execute(request: ValidateFHIRComplianceRequest): Promise<ValidateFHIRComplianceResponse> {
    const validation = await this.validate(request);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      };
    }
    
    return await this.executeInternal(request);
  }

  protected async executeInternal(request: ValidateFHIRComplianceRequest): Promise<ValidateFHIRComplianceResponse> {
    try {
      const recordId = RecordId.create(request.recordId);
      const medicalRecord = await this.medicalRecordRepository.findById(recordId);

      if (!medicalRecord) {
        return {
          success: false,
          message: 'Không tìm thấy hồ sơ bệnh án',
          errors: [{ field: 'recordId', message: 'Hồ sơ không tồn tại', code: 'NOT_FOUND' }]
        };
      }

      const complianceResult = medicalRecord.validateFHIRCompliance();

      return {
        success: true,
        message: complianceResult.isValid ? 'Hồ sơ tuân thủ FHIR' : 'Hồ sơ chưa tuân thủ FHIR đầy đủ',
        data: {
          recordId: request.recordId,
          isCompliant: complianceResult.isValid,
          validationErrors: complianceResult.errors,
          fhirVersion: '4.0.1',
          validatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi kiểm tra FHIR compliance: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: ValidateFHIRComplianceRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.recordId) errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
    if (!request.requestedBy) errors.push({ field: 'requestedBy', message: 'RequestedBy là bắt buộc', code: 'REQUIRED' });

    return { isValid: errors.length === 0, errors };
  }

  async authorize(request: ValidateFHIRComplianceRequest, userId: string): Promise<boolean> {
    return request.requestedBy === userId;
  }

  involvesPHI(request: ValidateFHIRComplianceRequest): boolean {
    return true;
  }

  getPatientId(request: ValidateFHIRComplianceRequest): string | null {
    return null;
  }

  getDescription(): string {
    return 'Kiểm tra tuân thủ FHIR của hồ sơ bệnh án';
  }

  getRequiredPermissions(): string[] {
    return ['medical_record:read', 'fhir:validate'];
  }
}


