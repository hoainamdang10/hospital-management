/**
 * AddDiagnosisCommandHandler - Application Layer
 * Command handler for adding diagnosis to medical records
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase, ValidationResult } from '../../../../shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../../domain/repositories/IMedicalRecordRepository';
import { IDomainEventPublisher } from '../../../../shared/domain/events/IDomainEventPublisher';
import { RecordId } from '../../../domain/value-objects/RecordId';
import { 
  Diagnosis, 
  DiagnosisCategory, 
  DiagnosisSeverity, 
  DiagnosisStatus 
} from '../../../domain/value-objects/Diagnosis';

/**
 * Add Diagnosis Command
 */
export interface AddDiagnosisCommand {
  recordId: string;
  diagnosisCode: string;
  diagnosisDisplay: string;
  category: DiagnosisCategory;
  severity: DiagnosisSeverity;
  status: DiagnosisStatus;
  addedBy: string;
  
  // Optional fields
  description?: string;
  onsetDate?: string;
  vietnameseClassification?: string;
  specialtyCode?: string;
  notes?: string;
  confidence?: number;
}

/**
 * Add Diagnosis Response
 */
export interface AddDiagnosisResponse {
  success: boolean;
  message: string;
  data?: {
    recordId: string;
    diagnosisCode: string;
    diagnosisDisplay: string;
    category: DiagnosisCategory;
    severity: DiagnosisSeverity;
    status: DiagnosisStatus;
    addedAt: string;
    addedBy: string;
    fhirCompliant: boolean;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Add Diagnosis Command Handler
 */
export class AddDiagnosisCommandHandler extends BaseHealthcareUseCase<AddDiagnosisCommand, AddDiagnosisResponse> {
  
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {
    super();
  }

  /**
   * Execute the command
   */
  protected async executeInternal(command: AddDiagnosisCommand): Promise<AddDiagnosisResponse> {
    try {
      // Create RecordId value object
      const recordId = RecordId.create(command.recordId);

      // Find existing medical record
      const medicalRecord = await this.medicalRecordRepository.findById(recordId);

      if (!medicalRecord) {
        return {
          success: false,
          message: `Không tìm thấy hồ sơ bệnh án với ID: ${command.recordId}`,
          errors: [{
            field: 'recordId',
            message: `Hồ sơ bệnh án với ID ${command.recordId} không tồn tại`,
            code: 'MEDICAL_RECORD_NOT_FOUND'
          }]
        };
      }

      // Check if record can be updated
      if (medicalRecord.isDeleted()) {
        return {
          success: false,
          message: 'Không thể thêm chẩn đoán cho hồ sơ bệnh án đã bị xóa',
          errors: [{
            field: 'recordId',
            message: 'Hồ sơ bệnh án này đã bị xóa',
            code: 'MEDICAL_RECORD_DELETED'
          }]
        };
      }

      if (medicalRecord.isArchived()) {
        return {
          success: false,
          message: 'Không thể thêm chẩn đoán cho hồ sơ bệnh án đã được lưu trữ',
          errors: [{
            field: 'recordId',
            message: 'Hồ sơ bệnh án này đã được lưu trữ',
            code: 'MEDICAL_RECORD_ARCHIVED'
          }]
        };
      }

      // Create diagnosis value object
      const diagnosis = this.createDiagnosis(command);

      // Add diagnosis to medical record
      medicalRecord.addDiagnosis(diagnosis, command.addedBy);

      // Save updated record
      await this.medicalRecordRepository.update(medicalRecord);

      // Publish domain events
      const events = medicalRecord.getUncommittedEvents();
      if (events.length > 0) {
        await this.eventPublisher.publishBatch(events);
        medicalRecord.markEventsAsCommitted();
      }

      return {
        success: true,
        message: 'Chẩn đoán đã được thêm thành công',
        data: {
          recordId: command.recordId,
          diagnosisCode: diagnosis.code,
          diagnosisDisplay: diagnosis.display,
          category: diagnosis.category,
          severity: diagnosis.severity,
          status: diagnosis.status,
          addedAt: new Date().toISOString(),
          addedBy: command.addedBy,
          fhirCompliant: this.validateFHIRCompliance(diagnosis)
        }
      };

    } catch (error) {
      // Handle domain validation errors
      if (error instanceof Error) {
        if (error.message.includes('đã tồn tại')) {
          return {
            success: false,
            message: 'Chẩn đoán đã tồn tại',
            errors: [{
              field: 'diagnosisCode',
              message: error.message,
              code: 'DIAGNOSIS_ALREADY_EXISTS'
            }]
          };
        }

        if (error.message.includes('là bắt buộc') || error.message.includes('không hợp lệ')) {
          return {
            success: false,
            message: 'Lỗi validation dữ liệu',
            errors: [{
              field: 'diagnosis',
              message: error.message,
              code: 'DIAGNOSIS_VALIDATION_ERROR'
            }]
          };
        }
      }

      // Handle RecordId validation errors
      if (error instanceof Error && error.message.includes('định dạng')) {
        return {
          success: false,
          message: 'Định dạng RecordId không hợp lệ',
          errors: [{
            field: 'recordId',
            message: error.message,
            code: 'INVALID_RECORD_ID_FORMAT'
          }]
        };
      }

      throw new Error(`Lỗi khi thêm chẩn đoán: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create diagnosis value object from command
   */
  private createDiagnosis(command: AddDiagnosisCommand): Diagnosis {
    const options: any = {
      description: command.description,
      onsetDate: command.onsetDate ? new Date(command.onsetDate) : undefined,
      vietnameseClassification: command.vietnameseClassification,
      specialtyCode: command.specialtyCode,
      notes: command.notes,
      confidence: command.confidence
    };

    // Determine if this is Vietnamese or ICD-10 diagnosis
    if (command.vietnameseClassification === 'BYT-VN-2024' || command.specialtyCode) {
      return Diagnosis.createVietnamese(
        command.diagnosisCode,
        command.diagnosisDisplay,
        command.category,
        command.severity,
        command.specialtyCode || 'GENE', // Default to general if not specified
        command.addedBy,
        {
          status: command.status,
          description: command.description,
          onsetDate: options.onsetDate,
          notes: command.notes,
          confidence: command.confidence
        }
      );
    } else {
      return Diagnosis.fromICD10(
        command.diagnosisCode,
        command.diagnosisDisplay,
        command.category,
        command.severity,
        command.addedBy,
        {
          status: command.status,
          description: command.description,
          onsetDate: options.onsetDate,
          notes: command.notes,
          confidence: command.confidence
        }
      );
    }
  }

  /**
   * Validate FHIR compliance
   */
  private validateFHIRCompliance(diagnosis: Diagnosis): boolean {
    try {
      diagnosis.toFHIR();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate command
   */
  async validate(command: AddDiagnosisCommand): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    // Required fields validation
    if (!command.recordId || command.recordId.trim() === '') {
      errors.push({
        field: 'recordId',
        message: 'RecordId là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!command.diagnosisCode || command.diagnosisCode.trim() === '') {
      errors.push({
        field: 'diagnosisCode',
        message: 'Mã chẩn đoán là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!command.diagnosisDisplay || command.diagnosisDisplay.trim() === '') {
      errors.push({
        field: 'diagnosisDisplay',
        message: 'Tên chẩn đoán là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!command.addedBy || command.addedBy.trim() === '') {
      errors.push({
        field: 'addedBy',
        message: 'Người thêm chẩn đoán là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    // Enum validation
    if (!Object.values(DiagnosisCategory).includes(command.category)) {
      errors.push({
        field: 'category',
        message: 'Loại chẩn đoán không hợp lệ',
        code: 'INVALID_ENUM_VALUE'
      });
    }

    if (!Object.values(DiagnosisSeverity).includes(command.severity)) {
      errors.push({
        field: 'severity',
        message: 'Mức độ nghiêm trọng không hợp lệ',
        code: 'INVALID_ENUM_VALUE'
      });
    }

    if (!Object.values(DiagnosisStatus).includes(command.status)) {
      errors.push({
        field: 'status',
        message: 'Trạng thái chẩn đoán không hợp lệ',
        code: 'INVALID_ENUM_VALUE'
      });
    }

    // Date validation
    if (command.onsetDate) {
      const onsetDate = new Date(command.onsetDate);
      const now = new Date();
      
      if (onsetDate > now) {
        errors.push({
          field: 'onsetDate',
          message: 'Ngày khởi phát không thể trong tương lai',
          code: 'INVALID_DATE'
        });
      }
    }

    // Confidence validation
    if (command.confidence !== undefined && (command.confidence < 0 || command.confidence > 100)) {
      errors.push({
        field: 'confidence',
        message: 'Độ tin cậy phải từ 0-100',
        code: 'INVALID_RANGE'
      });
    }

    // Business rule validation
    if (command.category === DiagnosisCategory.PRIMARY) {
      // Additional validation for primary diagnosis
      if (command.status === DiagnosisStatus.REFUTED) {
        errors.push({
          field: 'status',
          message: 'Chẩn đoán chính không thể có trạng thái bác bỏ',
          code: 'BUSINESS_RULE_VIOLATION'
        });
      }
    }

    if (command.severity === DiagnosisSeverity.CRITICAL) {
      // Critical diagnoses should have high confidence
      if (command.confidence !== undefined && command.confidence < 80) {
        errors.push({
          field: 'confidence',
          message: 'Chẩn đoán nguy kịch cần có độ tin cậy ít nhất 80%',
          code: 'BUSINESS_RULE_VIOLATION'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check authorization
   */
  async authorize(command: AddDiagnosisCommand, userId: string): Promise<boolean> {
    try {
      // Get the medical record to check ownership
      const recordId = RecordId.create(command.recordId);
      const medicalRecord = await this.medicalRecordRepository.findById(recordId);

      if (!medicalRecord) {
        return false;
      }

      // Authorization rules:
      // 1. Only doctors can add diagnoses
      // 2. The addedBy field should match the userId
      // 3. Doctors can only add diagnoses to records they created or are assigned to

      if (command.addedBy !== userId) {
        return false;
      }

      // Check if user is the doctor who created the record
      if (medicalRecord.doctorId === userId) {
        return true;
      }

      // Check if user is the original creator
      if (medicalRecord.createdBy === userId) {
        return true;
      }

      return false;

    } catch (error) {
      return false;
    }
  }

  /**
   * Check if involves PHI
   */
  involvesPHI(command: AddDiagnosisCommand): boolean {
    return true; // Adding diagnosis always involves PHI
  }

  /**
   * Get patient ID
   */
  getPatientId(command: AddDiagnosisCommand): string | null {
    return null; // Will be extracted from medical record
  }

  /**
   * Get use case description
   */
  getDescription(): string {
    return 'Thêm chẩn đoán vào hồ sơ bệnh án';
  }

  /**
   * Get required permissions
   */
  getRequiredPermissions(): string[] {
    return ['medical_record:update', 'diagnosis:add'];
  }
}
