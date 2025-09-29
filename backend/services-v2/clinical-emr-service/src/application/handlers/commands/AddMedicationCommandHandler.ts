/**
 * AddMedicationCommandHandler - Application Layer
 * Command handler for adding medication to medical records
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
  Medication, 
  MedicationStatus,
  DosageForm,
  RouteOfAdministration,
  FrequencyUnit
} from '../../../domain/value-objects/Medication';

/**
 * Add Medication Command
 */
export interface AddMedicationCommand {
  recordId: string;
  medicationCode: string;
  medicationName: string;
  strength: string;
  dosageForm: DosageForm;
  route: RouteOfAdministration;
  dosage: string;
  frequency: string;
  frequencyUnit: FrequencyUnit;
  instructions: string;
  prescribedBy: string;
  
  // Optional fields
  genericName?: string;
  brandName?: string;
  duration?: string;
  specialInstructions?: string;
  startDate?: string;
  endDate?: string;
  vietnameseDrugCode?: string;
  registrationNumber?: string;
  manufacturer?: string;
  contraindications?: string[];
  sideEffects?: string[];
  interactions?: string[];
  allergies?: string[];
  notes?: string;
  priority?: 'routine' | 'urgent' | 'stat';
}

/**
 * Add Medication Response
 */
export interface AddMedicationResponse {
  success: boolean;
  message: string;
  data?: {
    recordId: string;
    medicationCode: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    instructions: string;
    prescribedAt: string;
    prescribedBy: string;
    fhirCompliant: boolean;
    vietnameseSummary: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Add Medication Command Handler
 */
export class AddMedicationCommandHandler extends BaseHealthcareUseCase<AddMedicationCommand, AddMedicationResponse> {
  
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {
    super();
  }

  /**
   * Execute the command
   */
  protected async executeInternal(command: AddMedicationCommand): Promise<AddMedicationResponse> {
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
          message: 'Không thể thêm thuốc cho hồ sơ bệnh án đã bị xóa',
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
          message: 'Không thể thêm thuốc cho hồ sơ bệnh án đã được lưu trữ',
          errors: [{
            field: 'recordId',
            message: 'Hồ sơ bệnh án này đã được lưu trữ',
            code: 'MEDICAL_RECORD_ARCHIVED'
          }]
        };
      }

      // Create medication value object
      const medication = this.createMedication(command);

      // Add medication to medical record
      medicalRecord.addMedication(medication, command.prescribedBy);

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
        message: 'Thuốc đã được thêm thành công',
        data: {
          recordId: command.recordId,
          medicationCode: medication.code,
          medicationName: medication.name,
          dosage: medication.dosage,
          frequency: medication.frequency,
          instructions: medication.instructions,
          prescribedAt: new Date().toISOString(),
          prescribedBy: command.prescribedBy,
          fhirCompliant: this.validateFHIRCompliance(medication),
          vietnameseSummary: medication.getVietnameseSummary()
        }
      };

    } catch (error) {
      // Handle domain validation errors
      if (error instanceof Error) {
        if (error.message.includes('đang được sử dụng')) {
          return {
            success: false,
            message: 'Thuốc đã tồn tại và đang được sử dụng',
            errors: [{
              field: 'medicationCode',
              message: error.message,
              code: 'MEDICATION_ALREADY_ACTIVE'
            }]
          };
        }

        if (error.message.includes('là bắt buộc') || error.message.includes('không hợp lệ')) {
          return {
            success: false,
            message: 'Lỗi validation dữ liệu',
            errors: [{
              field: 'medication',
              message: error.message,
              code: 'MEDICATION_VALIDATION_ERROR'
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

      throw new Error(`Lỗi khi thêm thuốc: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create medication value object from command
   */
  private createMedication(command: AddMedicationCommand): Medication {
    const options: any = {
      genericName: command.genericName,
      brandName: command.brandName,
      duration: command.duration,
      specialInstructions: command.specialInstructions,
      startDate: command.startDate ? new Date(command.startDate) : undefined,
      endDate: command.endDate ? new Date(command.endDate) : undefined,
      vietnameseDrugCode: command.vietnameseDrugCode,
      registrationNumber: command.registrationNumber,
      manufacturer: command.manufacturer,
      contraindications: command.contraindications,
      sideEffects: command.sideEffects,
      interactions: command.interactions,
      allergies: command.allergies,
      notes: command.notes,
      priority: command.priority
    };

    // Determine if this is Vietnamese medication
    if (command.vietnameseDrugCode && command.registrationNumber) {
      return Medication.createVietnamese(
        command.vietnameseDrugCode,
        command.medicationName,
        command.strength,
        command.dosageForm,
        command.route,
        command.dosage,
        command.frequency,
        command.frequencyUnit,
        command.instructions,
        command.prescribedBy,
        command.registrationNumber,
        {
          genericName: command.genericName,
          brandName: command.brandName,
          duration: command.duration,
          manufacturer: command.manufacturer,
          specialInstructions: command.specialInstructions,
          startDate: options.startDate,
          endDate: options.endDate,
          contraindications: command.contraindications,
          sideEffects: command.sideEffects,
          notes: command.notes
        }
      );
    } else {
      return Medication.create(
        command.medicationCode,
        command.medicationName,
        command.strength,
        command.dosageForm,
        command.route,
        command.dosage,
        command.frequency,
        command.frequencyUnit,
        command.instructions,
        command.prescribedBy,
        options
      );
    }
  }

  /**
   * Validate FHIR compliance
   */
  private validateFHIRCompliance(medication: Medication): boolean {
    try {
      medication.toFHIR();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate command
   */
  async validate(command: AddMedicationCommand): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    // Required fields validation
    if (!command.recordId || command.recordId.trim() === '') {
      errors.push({
        field: 'recordId',
        message: 'RecordId là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!command.medicationCode || command.medicationCode.trim() === '') {
      errors.push({
        field: 'medicationCode',
        message: 'Mã thuốc là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!command.medicationName || command.medicationName.trim() === '') {
      errors.push({
        field: 'medicationName',
        message: 'Tên thuốc là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!command.strength || command.strength.trim() === '') {
      errors.push({
        field: 'strength',
        message: 'Hàm lượng thuốc là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!command.dosage || command.dosage.trim() === '') {
      errors.push({
        field: 'dosage',
        message: 'Liều dùng là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!command.frequency || command.frequency.trim() === '') {
      errors.push({
        field: 'frequency',
        message: 'Tần suất dùng là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!command.instructions || command.instructions.trim() === '') {
      errors.push({
        field: 'instructions',
        message: 'Hướng dẫn sử dụng là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!command.prescribedBy || command.prescribedBy.trim() === '') {
      errors.push({
        field: 'prescribedBy',
        message: 'Người kê đơn là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    // Enum validation
    if (!Object.values(DosageForm).includes(command.dosageForm)) {
      errors.push({
        field: 'dosageForm',
        message: 'Dạng bào chế không hợp lệ',
        code: 'INVALID_ENUM_VALUE'
      });
    }

    if (!Object.values(RouteOfAdministration).includes(command.route)) {
      errors.push({
        field: 'route',
        message: 'Đường dùng thuốc không hợp lệ',
        code: 'INVALID_ENUM_VALUE'
      });
    }

    if (!Object.values(FrequencyUnit).includes(command.frequencyUnit)) {
      errors.push({
        field: 'frequencyUnit',
        message: 'Đơn vị tần suất không hợp lệ',
        code: 'INVALID_ENUM_VALUE'
      });
    }

    // Date validation
    if (command.startDate && command.endDate) {
      const startDate = new Date(command.startDate);
      const endDate = new Date(command.endDate);
      
      if (startDate >= endDate) {
        errors.push({
          field: 'dateRange',
          message: 'Ngày bắt đầu phải trước ngày kết thúc',
          code: 'INVALID_DATE_RANGE'
        });
      }
    }

    // Vietnamese drug validation
    if (command.vietnameseDrugCode) {
      const vietnameseCodeRegex = /^VN-[A-Z0-9]{5}-[A-Z0-9]{2}$/;
      if (!vietnameseCodeRegex.test(command.vietnameseDrugCode)) {
        errors.push({
          field: 'vietnameseDrugCode',
          message: 'Mã thuốc Việt Nam phải có định dạng VN-XXXXX-XX',
          code: 'INVALID_FORMAT'
        });
      }
    }

    if (command.registrationNumber) {
      const regNumberRegex = /^VD-[0-9]{5}-[0-9]{2}$/;
      if (!regNumberRegex.test(command.registrationNumber)) {
        errors.push({
          field: 'registrationNumber',
          message: 'Số đăng ký lưu hành phải có định dạng VD-XXXXX-XX',
          code: 'INVALID_FORMAT'
        });
      }
    }

    // Strength format validation
    const strengthRegex = /^[0-9]+(\.[0-9]+)?(mg|g|ml|l|%|IU|mcg|units?)$/i;
    if (command.strength && !strengthRegex.test(command.strength)) {
      errors.push({
        field: 'strength',
        message: 'Hàm lượng phải có định dạng số + đơn vị (ví dụ: 500mg, 5ml)',
        code: 'INVALID_FORMAT'
      });
    }

    // Dosage format validation
    const dosageRegex = /^[0-9]+(\.[0-9]+)?\s*(viên|ml|gói|thìa|giọt|lần xịt|ống|vỉ)$/i;
    if (command.dosage && !dosageRegex.test(command.dosage)) {
      errors.push({
        field: 'dosage',
        message: 'Liều dùng phải có định dạng số + đơn vị (ví dụ: 1 viên, 5ml)',
        code: 'INVALID_FORMAT'
      });
    }

    // Business rule validation
    if (command.priority === 'stat' || command.priority === 'urgent') {
      // High priority medications should have clear instructions
      if (!command.specialInstructions) {
        errors.push({
          field: 'specialInstructions',
          message: 'Thuốc ưu tiên cao cần có hướng dẫn đặc biệt',
          code: 'BUSINESS_RULE_VIOLATION'
        });
      }
    }

    // Drug interaction validation
    if (command.interactions && command.interactions.length > 0) {
      // Should have contraindications or special instructions
      if (!command.contraindications && !command.specialInstructions) {
        errors.push({
          field: 'interactions',
          message: 'Thuốc có tương tác cần có chống chỉ định hoặc hướng dẫn đặc biệt',
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
  async authorize(command: AddMedicationCommand, userId: string): Promise<boolean> {
    try {
      // Get the medical record to check ownership
      const recordId = RecordId.create(command.recordId);
      const medicalRecord = await this.medicalRecordRepository.findById(recordId);

      if (!medicalRecord) {
        return false;
      }

      // Authorization rules:
      // 1. Only doctors can prescribe medications
      // 2. The prescribedBy field should match the userId
      // 3. Doctors can only prescribe for records they created or are assigned to

      if (command.prescribedBy !== userId) {
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
  involvesPHI(command: AddMedicationCommand): boolean {
    return true; // Adding medication always involves PHI
  }

  /**
   * Get patient ID
   */
  getPatientId(command: AddMedicationCommand): string | null {
    return null; // Will be extracted from medical record
  }

  /**
   * Get use case description
   */
  getDescription(): string {
    return 'Thêm thuốc vào hồ sơ bệnh án';
  }

  /**
   * Get required permissions
   */
  getRequiredPermissions(): string[] {
    return ['medical_record:update', 'medication:prescribe'];
  }
}
