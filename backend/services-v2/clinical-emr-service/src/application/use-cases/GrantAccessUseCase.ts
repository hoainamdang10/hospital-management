/**
 * GrantAccessUseCase - Application Layer
 * Use case for granting access to medical record
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { RecordId } from '../../domain/value-objects/RecordId';

export interface GrantAccessRequest {
  recordId: string;
  grantedTo: string;
  grantedBy: string;
  accessLevel: 'read' | 'write' | 'full';
  expiresAt?: Date;
  purpose?: string;
}

export interface GrantAccessResponse {
  success: boolean;
  message: string;
  data?: {
    recordId: string;
    grantedTo: string;
    accessLevel: string;
    grantedAt: string;
    expiresAt?: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class GrantAccessUseCase extends BaseHealthcareUseCase<GrantAccessRequest, GrantAccessResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository
  ) {
    super();
  }

  override async execute(request: GrantAccessRequest): Promise<GrantAccessResponse> {
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

  protected async executeInternal(request: GrantAccessRequest): Promise<GrantAccessResponse> {
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

      // Log access grant in access log
      medicalRecord.recordReadAccess(
        request.grantedBy,
        `Cấp quyền ${request.accessLevel} cho ${request.grantedTo}`
      );

      await this.medicalRecordRepository.update(medicalRecord);

      return {
        success: true,
        message: 'Quyền truy cập đã được cấp thành công',
        data: {
          recordId: request.recordId,
          grantedTo: request.grantedTo,
          accessLevel: request.accessLevel,
          grantedAt: new Date().toISOString(),
          expiresAt: request.expiresAt?.toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi cấp quyền truy cập: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: GrantAccessRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.recordId) errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
    if (!request.grantedTo) errors.push({ field: 'grantedTo', message: 'GrantedTo là bắt buộc', code: 'REQUIRED' });
    if (!request.grantedBy) errors.push({ field: 'grantedBy', message: 'GrantedBy là bắt buộc', code: 'REQUIRED' });
    if (!request.accessLevel) errors.push({ field: 'accessLevel', message: 'AccessLevel là bắt buộc', code: 'REQUIRED' });

    return { isValid: errors.length === 0, errors };
  }

  async authorize(request: GrantAccessRequest, userId: string): Promise<boolean> {
    return request.grantedBy === userId;
  }

  involvesPHI(request: GrantAccessRequest): boolean {
    return true;
  }

  getPatientId(request: GrantAccessRequest): string | null {
    return null;
  }

  getDescription(): string {
    return 'Cấp quyền truy cập hồ sơ bệnh án';
  }

  getRequiredPermissions(): string[] {
    return ['medical_record:share', 'access:grant'];
  }
}


