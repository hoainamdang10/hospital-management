/**
 * CreateMedicalRecordUseCase - Application Layer
 * Use case for creating new medical records
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { MedicalRecordAggregate } from '../../domain/aggregates/clinical.aggregate';
import { RecordId } from '../../domain/value-objects/RecordId';
import { BasicVitalSigns } from '../../domain/value-objects/BasicVitalSigns';
import { CreateMedicalRecordRequest, CreateMedicalRecordResponse, validateCreateMedicalRecordRequest } from '../dto/CreateMedicalRecordRequest';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';

export class CreateMedicalRecordUseCase extends BaseHealthcareUseCase<CreateMedicalRecordRequest, CreateMedicalRecordResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository,
    private readonly eventPublisher: IDomainEventPublisher
  ) {
    super();
  }

  /**
   * Public execute method - required by BaseHealthcareUseCase
   */
  override async execute(request: CreateMedicalRecordRequest): Promise<CreateMedicalRecordResponse> {
    // Validate
    const validation = await this.validate(request);
    if (!validation.isValid) {
      return {
        success: false,
        recordId: '',
        message: 'Validation failed',
        errors: validation.errors
      };
    }
    
    // Execute
    return await this.executeInternal(request);
  }

  /**
   * Execute the use case
   */
  protected async executeInternal(request: CreateMedicalRecordRequest): Promise<CreateMedicalRecordResponse> {
    try {
      // Generate new record ID
      const recordId = RecordId.generate();

      // Create vital signs if provided
      let vitalSigns: BasicVitalSigns | undefined;
      if (request.vitalSigns) {
        vitalSigns = BasicVitalSigns.create({
          temperature: request.vitalSigns.temperature,
          bloodPressure: request.vitalSigns.bloodPressure,
          heartRate: request.vitalSigns.heartRate,
          weight: request.vitalSigns.weight,
          height: request.vitalSigns.height
        });
      }

      // Create medical record aggregate
      const medicalRecord = MedicalRecordAggregate.create(
        recordId,
        request.patientId,
        request.doctorId,
        new Date(request.visitDate),
        request.createdBy,
        {
          appointmentId: request.appointmentId,
          symptoms: request.symptoms,
          examinationNotes: request.examinationNotes,
          diagnosis: request.diagnosis,
          treatment: request.treatment,
          medicationsLegacy: request.medications,
          notes: request.notes,
          vitalSigns: vitalSigns
        }
      );

      // Save to repository
      await this.medicalRecordRepository.save(medicalRecord);

      // Publish domain events
      const events = medicalRecord.getUncommittedEvents();
      if (events.length > 0) {
        await this.eventPublisher.publishBatch(events);
        medicalRecord.markEventsAsCommitted();
      }

      // Return success response
      return {
        success: true,
        recordId: recordId.value,
        message: 'Hồ sơ bệnh án đã được tạo thành công',
        data: {
          recordId: recordId.value,
          patientId: request.patientId,
          doctorId: request.doctorId,
          visitDate: request.visitDate,
          status: 'active',
          createdAt: medicalRecord.createdAt.toISOString(),
          createdBy: request.createdBy
        }
      };

    } catch (error) {
      // Handle domain validation errors
      if (error instanceof Error && error.message.includes('là bắt buộc')) {
        return {
          success: false,
          recordId: '',
          message: 'Lỗi validation dữ liệu',
          errors: [{
            field: 'general',
            message: error.message,
            code: 'DOMAIN_VALIDATION_ERROR'
          }]
        };
      }

      // Handle repository errors
      if (error instanceof Error && error.message.includes('đã tồn tại')) {
        return {
          success: false,
          recordId: '',
          message: 'Hồ sơ bệnh án đã tồn tại',
          errors: [{
            field: 'recordId',
            message: error.message,
            code: 'RECORD_ALREADY_EXISTS'
          }]
        };
      }

      // Handle other errors
      throw new Error(`Lỗi khi tạo hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate request
   */
  override async validate(request: CreateMedicalRecordRequest): Promise<ValidationResult> {
    const errors = validateCreateMedicalRecordRequest(request);
    
    // Additional business validation
    if (errors.length === 0) {
      // Check if appointment exists and is not already linked to another medical record
      if (request.appointmentId) {
        const existingRecord = await this.medicalRecordRepository.findByAppointmentId(request.appointmentId);
        if (existingRecord) {
          errors.push({
            field: 'appointmentId',
            message: 'Cuộc hẹn này đã có hồ sơ bệnh án',
            code: 'APPOINTMENT_ALREADY_HAS_RECORD'
          });
        }
      }

      // Validate that patient and doctor exist (this would typically call other services)
      // For now, we'll skip this validation as it requires integration with other services
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check authorization
   */
  async authorize(request: CreateMedicalRecordRequest, userId: string): Promise<boolean> {
    // Only doctors can create medical records
    // The doctorId in the request should match the userId (doctor creating the record)
    // Or the userId should be the createdBy field
    
    // For now, we'll check if the user is the doctor or the creator
    return request.doctorId === userId || request.createdBy === userId;
  }

  /**
   * Check if involves PHI
   */
  involvesPHI(request: CreateMedicalRecordRequest): boolean {
    return true; // Medical records always involve PHI
  }

  /**
   * Get patient ID
   */
  getPatientId(request: CreateMedicalRecordRequest): string | null {
    return request.patientId;
  }

  /**
   * Get use case description for audit
   */
  getDescription(): string {
    return 'Tạo hồ sơ bệnh án mới';
  }

  /**
   * Get required permissions
   */
  getRequiredPermissions(): string[] {
    return ['medical_record:create', 'patient:read', 'doctor:read'];
  }

  /**
   * Check if user has required permissions
   */
  private async checkPermissions(userId: string, permissions: string[]): Promise<boolean> {
    // This would typically call a permission service
    // For now, we'll assume the user has permissions if they're authorized
    return true;
  }

  /**
   * Validate business rules
   */
  private async validateBusinessRules(request: CreateMedicalRecordRequest): Promise<string[]> {
    const violations: string[] = [];

    // Rule: Cannot create medical record for future date beyond 7 days
    const visitDate = new Date(request.visitDate);
    const maxFutureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    if (visitDate > maxFutureDate) {
      violations.push('Không thể tạo hồ sơ bệnh án cho ngày khám quá 7 ngày trong tương lai');
    }

    // Rule: Cannot create medical record for date more than 1 year in the past
    const minPastDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    if (visitDate < minPastDate) {
      violations.push('Không thể tạo hồ sơ bệnh án cho ngày khám quá 1 năm trong quá khứ');
    }

    // Rule: If vital signs are provided, at least one measurement should be present
    if (request.vitalSigns) {
      const { temperature, bloodPressure, heartRate, weight, height } = request.vitalSigns;
      if (!temperature && !bloodPressure && !heartRate && !weight && !height) {
        violations.push('Nếu cung cấp sinh hiệu, ít nhất một chỉ số phải được nhập');
      }
    }

    // Rule: If diagnosis is provided, symptoms or examination notes should also be provided
    if (request.diagnosis && !request.symptoms && !request.examinationNotes) {
      violations.push('Nếu có chẩn đoán, cần có triệu chứng hoặc ghi chú khám bệnh');
    }

    // Rule: If treatment is provided, diagnosis should also be provided
    if (request.treatment && !request.diagnosis) {
      violations.push('Nếu có điều trị, cần có chẩn đoán');
    }

    return violations;
  }

  /**
   * Enhanced validation with business rules
   */
  async validateWithBusinessRules(request: CreateMedicalRecordRequest): Promise<ValidationResult> {
    // First, run basic validation
    const basicValidation = await this.validate(request);
    
    if (!basicValidation.isValid) {
      return basicValidation;
    }

    // Then, run business rules validation
    const businessRuleViolations = await this.validateBusinessRules(request);
    
    if (businessRuleViolations.length > 0) {
      const businessRuleErrors = businessRuleViolations.map(violation => ({
        field: 'businessRule',
        message: violation,
        code: 'BUSINESS_RULE_VIOLATION'
      }));

      return {
        isValid: false,
        errors: businessRuleErrors
      };
    }

    return {
      isValid: true,
      errors: []
    };
  }

  /**
   * Get audit information for this use case execution
   */
  override getAuditInfo(request: CreateMedicalRecordRequest) {
    const baseAuditInfo = super.getAuditInfo(request);
    
    return {
      ...baseAuditInfo,
      action: 'CREATE_MEDICAL_RECORD',
      resourceType: 'MedicalRecord',
      details: {
        patientId: request.patientId,
        doctorId: request.doctorId,
        appointmentId: request.appointmentId,
        visitDate: request.visitDate,
        hasSymptoms: !!request.symptoms,
        hasDiagnosis: !!request.diagnosis,
        hasTreatment: !!request.treatment,
        hasVitalSigns: !!request.vitalSigns,
        createdBy: request.createdBy
      },
      complianceLevel: 'HIPAA',
      vietnameseDescription: 'Tạo hồ sơ bệnh án mới'
    };
  }
}
