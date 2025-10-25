/**
 * RemoveDiagnosisUseCase - Application Layer
 * Use case for removing diagnosis from medical record
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { RecordId } from '../../domain/value-objects/RecordId';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';

export interface RemoveDiagnosisRequest {
  recordId: string;
  diagnosisCode: string;
  removedBy: string;
  reason?: string;
}

export interface RemoveDiagnosisResponse {
  success: boolean;
  message: string;
  data?: {
    recordId: string;
    diagnosisCode: string;
    removedAt: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class RemoveDiagnosisUseCase extends BaseHealthcareUseCase<RemoveDiagnosisRequest, RemoveDiagnosisResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {
    super();
  }

  override async execute(request: RemoveDiagnosisRequest): Promise<RemoveDiagnosisResponse> {
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

  protected async executeInternal(request: RemoveDiagnosisRequest): Promise<RemoveDiagnosisResponse> {
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

      medicalRecord.removeDiagnosis(request.diagnosisCode, request.removedBy, request.reason);
      await this.medicalRecordRepository.update(medicalRecord);

      const events = medicalRecord.getUncommittedEvents();
      if (events.length > 0) {
        await this.eventPublisher.publishBatch(events);
        medicalRecord.markEventsAsCommitted();
      }

      return {
        success: true,
        message: 'Chẩn đoán đã được xóa thành công',
        data: {
          recordId: request.recordId,
          diagnosisCode: request.diagnosisCode,
          removedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi xóa chẩn đoán: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: RemoveDiagnosisRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.recordId) errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
    if (!request.diagnosisCode) errors.push({ field: 'diagnosisCode', message: 'Diagnosis code là bắt buộc', code: 'REQUIRED' });
    if (!request.removedBy) errors.push({ field: 'removedBy', message: 'RemovedBy là bắt buộc', code: 'REQUIRED' });

    return { isValid: errors.length === 0, errors };
  }

  async authorize(request: RemoveDiagnosisRequest, userId: string): Promise<boolean> {
    return request.removedBy === userId;
  }

  involvesPHI(request: RemoveDiagnosisRequest): boolean {
    return true;
  }

  getPatientId(request: RemoveDiagnosisRequest): string | null {
    return null;
  }

  getDescription(): string {
    return 'Xóa chẩn đoán khỏi hồ sơ bệnh án';
  }

  getRequiredPermissions(): string[] {
    return ['medical_record:update', 'diagnosis:remove'];
  }
}


