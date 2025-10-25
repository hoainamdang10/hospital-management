/**
 * UpdateVitalSignsUseCase - Application Layer
 * Use case for updating vital signs in medical record
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { RecordId } from '../../domain/value-objects/RecordId';
import { BasicVitalSigns } from '../../domain/value-objects/BasicVitalSigns';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';

export interface UpdateVitalSignsRequest {
  recordId: string;
  vitalSigns: {
    temperature?: number;
    bloodPressure?: string;
    heartRate?: number;
    weight?: number;
    height?: number;
  };
  updatedBy: string;
}

export interface UpdateVitalSignsResponse {
  success: boolean;
  message: string;
  data?: {
    recordId: string;
    vitalSigns: any;
    updatedAt: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class UpdateVitalSignsUseCase extends BaseHealthcareUseCase<UpdateVitalSignsRequest, UpdateVitalSignsResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {
    super();
  }

  override async execute(request: UpdateVitalSignsRequest): Promise<UpdateVitalSignsResponse> {
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

  protected async executeInternal(request: UpdateVitalSignsRequest): Promise<UpdateVitalSignsResponse> {
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

      const vitalSigns = BasicVitalSigns.create(request.vitalSigns);
      medicalRecord.updateVitalSigns(vitalSigns, request.updatedBy);
      await this.medicalRecordRepository.update(medicalRecord);

      const events = medicalRecord.getUncommittedEvents();
      if (events.length > 0) {
        await this.eventPublisher.publishBatch(events);
        medicalRecord.markEventsAsCommitted();
      }

      return {
        success: true,
        message: 'Sinh hiệu đã được cập nhật thành công',
        data: {
          recordId: request.recordId,
          vitalSigns: vitalSigns.toJSON(),
          updatedAt: medicalRecord.updatedAt.toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi cập nhật sinh hiệu: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: UpdateVitalSignsRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.recordId) errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
    if (!request.updatedBy) errors.push({ field: 'updatedBy', message: 'UpdatedBy là bắt buộc', code: 'REQUIRED' });
    
    if (!request.vitalSigns || Object.keys(request.vitalSigns).length === 0) {
      errors.push({ field: 'vitalSigns', message: 'Ít nhất một sinh hiệu phải được cung cấp', code: 'REQUIRED' });
    }

    return { isValid: errors.length === 0, errors };
  }

  async authorize(request: UpdateVitalSignsRequest, userId: string): Promise<boolean> {
    return request.updatedBy === userId;
  }

  involvesPHI(request: UpdateVitalSignsRequest): boolean {
    return true;
  }

  getPatientId(request: UpdateVitalSignsRequest): string | null {
    return null;
  }

  getDescription(): string {
    return 'Cập nhật sinh hiệu trong hồ sơ bệnh án';
  }

  getRequiredPermissions(): string[] {
    return ['medical_record:update', 'vital_signs:update'];
  }
}


