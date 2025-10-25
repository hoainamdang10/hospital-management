/**
 * ExportToFHIRUseCase - Application Layer
 * Use case for exporting medical record to FHIR format
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { RecordId } from '../../domain/value-objects/RecordId';

export interface ExportToFHIRRequest {
  recordId: string;
  fhirProfile?: string;
  includeReferences?: boolean;
  requestedBy: string;
}

export interface ExportToFHIRResponse {
  success: boolean;
  message: string;
  data?: {
    fhirResource: any;
    resourceType: string;
    fhirVersion: string;
    exportedAt: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class ExportToFHIRUseCase extends BaseHealthcareUseCase<ExportToFHIRRequest, ExportToFHIRResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository
  ) {
    super();
  }

  override async execute(request: ExportToFHIRRequest): Promise<ExportToFHIRResponse> {
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

  protected async executeInternal(request: ExportToFHIRRequest): Promise<ExportToFHIRResponse> {
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

      // Log access
      medicalRecord.recordReadAccess(request.requestedBy, 'FHIR Export');

      const fhirResource = medicalRecord.toFHIR();

      if (request.fhirProfile) {
        fhirResource.meta.profile = [request.fhirProfile];
      }

      await this.medicalRecordRepository.update(medicalRecord);

      return {
        success: true,
        message: 'FHIR resource đã được export thành công',
        data: {
          fhirResource,
          resourceType: 'Composition',
          fhirVersion: '4.0.1',
          exportedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi export FHIR: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: ExportToFHIRRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.recordId) errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
    if (!request.requestedBy) errors.push({ field: 'requestedBy', message: 'RequestedBy là bắt buộc', code: 'REQUIRED' });

    return { isValid: errors.length === 0, errors };
  }

  async authorize(request: ExportToFHIRRequest, userId: string): Promise<boolean> {
    return request.requestedBy === userId;
  }

  involvesPHI(request: ExportToFHIRRequest): boolean {
    return true;
  }

  getPatientId(request: ExportToFHIRRequest): string | null {
    return null;
  }

  getDescription(): string {
    return 'Export hồ sơ bệnh án sang định dạng FHIR';
  }

  getRequiredPermissions(): string[] {
    return ['medical_record:read', 'fhir:export'];
  }
}


