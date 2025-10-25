/**
 * RemoveMedicationUseCase - Application Layer
 * Use case for removing medication from medical record
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { RecordId } from '../../domain/value-objects/RecordId';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';

export interface RemoveMedicationRequest {
  recordId: string;
  medicationCode: string;
  removedBy: string;
  reason?: string;
}

export interface RemoveMedicationResponse {
  success: boolean;
  message: string;
  data?: {
    recordId: string;
    medicationCode: string;
    removedAt: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class RemoveMedicationUseCase extends BaseHealthcareUseCase<RemoveMedicationRequest, RemoveMedicationResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {
    super();
  }

  override async execute(request: RemoveMedicationRequest): Promise<RemoveMedicationResponse> {
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

  protected async executeInternal(request: RemoveMedicationRequest): Promise<RemoveMedicationResponse> {
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

      medicalRecord.removeMedication(request.medicationCode, request.removedBy, request.reason);
      await this.medicalRecordRepository.update(medicalRecord);

      const events = medicalRecord.getUncommittedEvents();
      if (events.length > 0) {
        await this.eventPublisher.publishBatch(events);
        medicalRecord.markEventsAsCommitted();
      }

      return {
        success: true,
        message: 'Thuốc đã được xóa thành công',
        data: {
          recordId: request.recordId,
          medicationCode: request.medicationCode,
          removedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi xóa thuốc: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: RemoveMedicationRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.recordId) errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
    if (!request.medicationCode) errors.push({ field: 'medicationCode', message: 'Medication code là bắt buộc', code: 'REQUIRED' });
    if (!request.removedBy) errors.push({ field: 'removedBy', message: 'RemovedBy là bắt buộc', code: 'REQUIRED' });

    return { isValid: errors.length === 0, errors };
  }

  async authorize(request: RemoveMedicationRequest, userId: string): Promise<boolean> {
    return request.removedBy === userId;
  }

  involvesPHI(request: RemoveMedicationRequest): boolean {
    return true;
  }

  getPatientId(request: RemoveMedicationRequest): string | null {
    return null;
  }

  getDescription(): string {
    return 'Xóa thuốc khỏi hồ sơ bệnh án';
  }

  getRequiredPermissions(): string[] {
    return ['medical_record:update', 'medication:remove'];
  }
}


