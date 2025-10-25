/**
 * ArchiveMedicalRecordUseCase - Application Layer
 * Use case for archiving medical records
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { RecordId } from '../../domain/value-objects/RecordId';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';

export interface ArchiveMedicalRecordRequest {
  recordId: string;
  archivedBy: string;
  reason?: string;
}

export interface ArchiveMedicalRecordResponse {
  success: boolean;
  message: string;
  data?: {
    recordId: string;
    archivedAt: string;
    archivedBy: string;
    reason?: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class ArchiveMedicalRecordUseCase extends BaseHealthcareUseCase<ArchiveMedicalRecordRequest, ArchiveMedicalRecordResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {
    super();
  }

  override async execute(request: ArchiveMedicalRecordRequest): Promise<ArchiveMedicalRecordResponse> {
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

  protected async executeInternal(request: ArchiveMedicalRecordRequest): Promise<ArchiveMedicalRecordResponse> {
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

      medicalRecord.archive(request.archivedBy, request.reason);
      await this.medicalRecordRepository.update(medicalRecord);

      const events = medicalRecord.getUncommittedEvents();
      if (events.length > 0) {
        await this.eventPublisher.publishBatch(events);
        medicalRecord.markEventsAsCommitted();
      }

      return {
        success: true,
        message: 'Hồ sơ bệnh án đã được lưu trữ thành công',
        data: {
          recordId: request.recordId,
          archivedAt: medicalRecord.updatedAt.toISOString(),
          archivedBy: request.archivedBy,
          reason: request.reason
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lưu trữ hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: ArchiveMedicalRecordRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.recordId || request.recordId.trim() === '') {
      errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED_FIELD' });
    }

    if (!request.archivedBy || request.archivedBy.trim() === '') {
      errors.push({ field: 'archivedBy', message: 'ArchivedBy là bắt buộc', code: 'REQUIRED_FIELD' });
    }

    return { isValid: errors.length === 0, errors };
  }

  async authorize(request: ArchiveMedicalRecordRequest, userId: string): Promise<boolean> {
    return request.archivedBy === userId;
  }

  involvesPHI(request: ArchiveMedicalRecordRequest): boolean {
    return true;
  }

  getPatientId(request: ArchiveMedicalRecordRequest): string | null {
    return null;
  }

  getDescription(): string {
    return 'Lưu trữ hồ sơ bệnh án';
  }

  getRequiredPermissions(): string[] {
    return ['medical_record:archive'];
  }
}


