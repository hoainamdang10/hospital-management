/**
 * AddDiagnosisUseCase - Application Layer
 * Use case for adding diagnosis to medical record
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { RecordId } from '../../domain/value-objects/RecordId';
import { Diagnosis, DiagnosisCategory, DiagnosisSeverity, DiagnosisStatus } from '../../domain/value-objects/Diagnosis';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';

export interface AddDiagnosisRequest {
  recordId: string;
  code: string;
  display: string;
  category: DiagnosisCategory;
  severity: DiagnosisSeverity;
  status: DiagnosisStatus;
  recordedBy: string;
}

export interface AddDiagnosisResponse {
  success: boolean;
  message: string;
  data?: {
    recordId: string;
    diagnosisCode: string;
    addedAt: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class AddDiagnosisUseCase extends BaseHealthcareUseCase<AddDiagnosisRequest, AddDiagnosisResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {
    super();
  }

  override async execute(request: AddDiagnosisRequest): Promise<AddDiagnosisResponse> {
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

  protected async executeInternal(request: AddDiagnosisRequest): Promise<AddDiagnosisResponse> {
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

      const diagnosis = Diagnosis.create(
        request.code,
        request.display,
        request.category,
        request.severity,
        request.status,
        request.recordedBy
      );

      medicalRecord.addDiagnosis(diagnosis, request.recordedBy);
      await this.medicalRecordRepository.update(medicalRecord);

      const events = medicalRecord.getUncommittedEvents();
      if (events.length > 0) {
        await this.eventPublisher.publishBatch(events);
        medicalRecord.markEventsAsCommitted();
      }

      return {
        success: true,
        message: 'Chẩn đoán đã được thêm thành công',
        data: {
          recordId: request.recordId,
          diagnosisCode: request.code,
          addedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi thêm chẩn đoán: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: AddDiagnosisRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.recordId) errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
    if (!request.code) errors.push({ field: 'code', message: 'Diagnosis code là bắt buộc', code: 'REQUIRED' });
    if (!request.display) errors.push({ field: 'display', message: 'Diagnosis display là bắt buộc', code: 'REQUIRED' });
    if (!request.recordedBy) errors.push({ field: 'recordedBy', message: 'RecordedBy là bắt buộc', code: 'REQUIRED' });

    return { isValid: errors.length === 0, errors };
  }

  async authorize(request: AddDiagnosisRequest, userId: string): Promise<boolean> {
    return request.recordedBy === userId;
  }

  involvesPHI(request: AddDiagnosisRequest): boolean {
    return true;
  }

  getPatientId(request: AddDiagnosisRequest): string | null {
    return null;
  }

  getDescription(): string {
    return 'Thêm chẩn đoán vào hồ sơ bệnh án';
  }

  getRequiredPermissions(): string[] {
    return ['medical_record:update', 'diagnosis:add'];
  }
}


