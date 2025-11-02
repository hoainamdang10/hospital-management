/**
 * AddMedicationUseCase - Application Layer
 * Use case for adding medication to medical record
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { RecordId } from '../../domain/value-objects/RecordId';
import { Medication, DosageForm, RouteOfAdministration, FrequencyUnit } from '../../domain/value-objects/Medication';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';

export interface AddMedicationRequest {
  recordId: string;
  code: string;
  name: string;
  strength?: string;
  dosageForm?: DosageForm;
  route?: RouteOfAdministration;
  dosage?: string;
  frequency?: number;
  frequencyUnit?: FrequencyUnit;
  instructions?: string;
  prescribedBy: string;
}

export interface AddMedicationResponse {
  success: boolean;
  message: string;
  data?: {
    recordId: string;
    medicationCode: string;
    addedAt: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class AddMedicationUseCase extends BaseHealthcareUseCase<AddMedicationRequest, AddMedicationResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {
    super();
  }

  override async execute(request: AddMedicationRequest): Promise<AddMedicationResponse> {
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

  protected async executeInternal(request: AddMedicationRequest): Promise<AddMedicationResponse> {
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

      const medication = Medication.create(
        request.code,
        request.name,
        request.strength || '',
        request.dosageForm || DosageForm.TABLET,
        request.route || RouteOfAdministration.ORAL,
        request.dosage || '',
        request.frequency?.toString() || '',
        request.frequencyUnit || FrequencyUnit.TIMES_PER_DAY,
        request.instructions || '',
        request.prescribedBy
      );

      medicalRecord.addMedication(medication, request.prescribedBy);
      await this.medicalRecordRepository.update(medicalRecord);

      const events = medicalRecord.getUncommittedEvents();
      if (events.length > 0) {
        await this.eventPublisher.publishBatch(events);
        medicalRecord.markEventsAsCommitted();
      }

      return {
        success: true,
        message: 'Thuốc đã được thêm thành công',
        data: {
          recordId: request.recordId,
          medicationCode: request.code,
          addedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi thêm thuốc: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  override async validate(request: AddMedicationRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    if (!request.recordId) errors.push({ field: 'recordId', message: 'RecordId là bắt buộc', code: 'REQUIRED' });
    if (!request.code) errors.push({ field: 'code', message: 'Medication code là bắt buộc', code: 'REQUIRED' });
    if (!request.name) errors.push({ field: 'name', message: 'Medication name là bắt buộc', code: 'REQUIRED' });
    if (!request.prescribedBy) errors.push({ field: 'prescribedBy', message: 'PrescribedBy là bắt buộc', code: 'REQUIRED' });

    return { isValid: errors.length === 0, errors };
  }

  async authorize(request: AddMedicationRequest, userId: string): Promise<boolean> {
    return request.prescribedBy === userId;
  }

  involvesPHI(request: AddMedicationRequest): boolean {
    return true;
  }

  getPatientId(request: AddMedicationRequest): string | null {
    return null;
  }

  getDescription(): string {
    return 'Thêm thuốc vào hồ sơ bệnh án';
  }

  getRequiredPermissions(): string[] {
    return ['medical_record:update', 'medication:prescribe'];
  }
}


