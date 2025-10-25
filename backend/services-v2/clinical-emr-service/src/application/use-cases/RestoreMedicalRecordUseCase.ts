/**
 * RestoreMedicalRecordUseCase - Application Layer
 * Use case for restoring archived medical records
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { RecordId } from '../../domain/value-objects/RecordId';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';

export interface RestoreMedicalRecordRequest {
  recordId: string;
  restoredBy: string;
  reason?: string;
}

export interface RestoreMedicalRecordResponse {
  success: boolean;
  message: string;
  data?: {
    recordId: string;
    restoredAt: string;
    restoredBy: string;
    reason?: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class RestoreMedicalRecordUseCase extends BaseHealthcareUseCase<RestoreMedicalRecordRequest, RestoreMedicalRecordResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {
    super();
  }

  override async execute(request: RestoreMedicalRecordRequest): Promise<RestoreMedicalRecordResponse> {
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

  protected async executeInternal(request: RestoreMedicalRecordRequest): Promise<RestoreMedicalRecordResponse> {
    try {
      const recordId = RecordId.create(request.recordId);
      const medicalRecord = await this.medicalRecordRepository.findById(recordId);

      if (!medicalRecord) {
        return {
          success: false,
          message: `Không tìm thấy hồ sơ bệnh án với ID: ${request.recordId}`,
          errors: [{
            field: 'recordId',
            message: 'Hồ sơ bệnh án không tồn tại',
            code: 'MEDICAL_RECORD_NOT_FOUND'
          }]
        };
      }

      medicalRecord.restore(request.restoredBy, request.reason);
      await this.medicalRecordRepository.update(medicalRecord);

      const events = medicalRecord.getUncommittedEvents();
      if (events.length > 0) {
        await this.eventPublisher.publishBatch(events);
        medicalRecord.markEventsAsCommitted();
      }

      return {
        success: true,
        message: 'Hồ sơ bệnh án đã được khôi phục thành công',
        data: {
          recordId: request.recordId,
          restoredAt: medicalRecord.updatedAt.toISOString(),
          restoredBy: request.restoredBy,
          reason: request.reason
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi khôi phục hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: RestoreMedicalRecordRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.recordId || request.recordId.trim() === '') {
      errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED_FIELD' });
    }

    if (!request.restoredBy || request.restoredBy.trim() === '') {
      errors.push({ field: 'restoredBy', message: 'RestoredBy là bắt buộc', code: 'REQUIRED_FIELD' });
    }

    return { isValid: errors.length === 0, errors };
  }

  async authorize(request: RestoreMedicalRecordRequest, userId: string): Promise<boolean> {
    return request.restoredBy === userId;
  }

  involvesPHI(request: RestoreMedicalRecordRequest): boolean {
    return true;
  }

  getPatientId(request: RestoreMedicalRecordRequest): string | null {
    return null;
  }

  getDescription(): string {
    return 'Khôi phục hồ sơ bệnh án đã lưu trữ';
  }

  getRequiredPermissions(): string[] {
    return ['medical_record:restore'];
  }
}


