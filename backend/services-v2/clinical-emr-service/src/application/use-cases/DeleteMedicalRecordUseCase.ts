/**
 * DeleteMedicalRecordUseCase - Application Layer
 * Use case for soft-deleting medical records
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { RecordId } from '../../domain/value-objects/RecordId';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';

export interface DeleteMedicalRecordRequest {
  recordId: string;
  deletedBy: string;
  reason: string;
}

export interface DeleteMedicalRecordResponse {
  success: boolean;
  message: string;
  data?: {
    recordId: string;
    deletedAt: string;
    deletedBy: string;
    reason: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class DeleteMedicalRecordUseCase extends BaseHealthcareUseCase<DeleteMedicalRecordRequest, DeleteMedicalRecordResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {
    super();
  }

  override async execute(request: DeleteMedicalRecordRequest): Promise<DeleteMedicalRecordResponse> {
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

  protected async executeInternal(request: DeleteMedicalRecordRequest): Promise<DeleteMedicalRecordResponse> {
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

      // Soft delete
      await this.medicalRecordRepository.delete(recordId, request.deletedBy);

      return {
        success: true,
        message: 'Hồ sơ bệnh án đã được xóa thành công',
        data: {
          recordId: request.recordId,
          deletedAt: new Date().toISOString(),
          deletedBy: request.deletedBy,
          reason: request.reason
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi xóa hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: DeleteMedicalRecordRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.recordId || request.recordId.trim() === '') {
      errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED_FIELD' });
    }

    if (!request.deletedBy || request.deletedBy.trim() === '') {
      errors.push({ field: 'deletedBy', message: 'DeletedBy là bắt buộc', code: 'REQUIRED_FIELD' });
    }

    if (!request.reason || request.reason.trim() === '') {
      errors.push({ field: 'reason', message: 'Reason là bắt buộc khi xóa hồ sơ', code: 'REQUIRED_FIELD' });
    }

    return { isValid: errors.length === 0, errors };
  }

  async authorize(request: DeleteMedicalRecordRequest, userId: string): Promise<boolean> {
    return request.deletedBy === userId;
  }

  involvesPHI(request: DeleteMedicalRecordRequest): boolean {
    return true;
  }

  getPatientId(request: DeleteMedicalRecordRequest): string | null {
    return null;
  }

  getDescription(): string {
    return 'Xóa hồ sơ bệnh án';
  }

  getRequiredPermissions(): string[] {
    return ['medical_record:delete', 'admin'];
  }
}


