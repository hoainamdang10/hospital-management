/**
 * RevokeAccessUseCase - Application Layer
 * Use case for revoking access to medical record
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { RecordId } from '../../domain/value-objects/RecordId';

export interface RevokeAccessRequest {
  recordId: string;
  revokedFrom: string;
  revokedBy: string;
  reason?: string;
}

export interface RevokeAccessResponse {
  success: boolean;
  message: string;
  data?: {
    recordId: string;
    revokedFrom: string;
    revokedAt: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class RevokeAccessUseCase extends BaseHealthcareUseCase<RevokeAccessRequest, RevokeAccessResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository
  ) {
    super();
  }

  override async execute(request: RevokeAccessRequest): Promise<RevokeAccessResponse> {
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

  protected async executeInternal(request: RevokeAccessRequest): Promise<RevokeAccessResponse> {
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

      // Log access revocation in access log
      medicalRecord.recordReadAccess(
        request.revokedBy,
        `Thu hồi quyền truy cập của ${request.revokedFrom}. Lý do: ${request.reason || 'Không có'}`
      );

      await this.medicalRecordRepository.update(medicalRecord);

      return {
        success: true,
        message: 'Quyền truy cập đã được thu hồi thành công',
        data: {
          recordId: request.recordId,
          revokedFrom: request.revokedFrom,
          revokedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi thu hồi quyền truy cập: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: RevokeAccessRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.recordId) errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
    if (!request.revokedFrom) errors.push({ field: 'revokedFrom', message: 'RevokedFrom là bắt buộc', code: 'REQUIRED' });
    if (!request.revokedBy) errors.push({ field: 'revokedBy', message: 'RevokedBy là bắt buộc', code: 'REQUIRED' });

    return { isValid: errors.length === 0, errors };
  }

  async authorize(request: RevokeAccessRequest, userId: string): Promise<boolean> {
    return request.revokedBy === userId;
  }

  involvesPHI(request: RevokeAccessRequest): boolean {
    return true;
  }

  getPatientId(request: RevokeAccessRequest): string | null {
    return null;
  }

  getDescription(): string {
    return 'Thu hồi quyền truy cập hồ sơ bệnh án';
  }

  getRequiredPermissions(): string[] {
    return ['medical_record:share', 'access:revoke'];
  }
}


