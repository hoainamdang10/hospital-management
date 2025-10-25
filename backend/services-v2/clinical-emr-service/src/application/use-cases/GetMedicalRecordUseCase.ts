/**
 * GetMedicalRecordUseCase - Application Layer
 * Use case for retrieving medical records by ID
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase, ValidationResult } from '@shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository, MedicalRecordNotFoundError } from '../../domain/repositories/IMedicalRecordRepository';
import { RecordId } from '../../domain/value-objects/RecordId';
import { MedicalRecordStatus } from '../../domain/aggregates/clinical.aggregate';
import { 
  GetMedicalRecordRequest, 
  GetMedicalRecordResponse, 
  validateGetMedicalRecordRequest,
  mapMedicalRecordToDto
} from '../dto/GetMedicalRecordRequest';

export class GetMedicalRecordUseCase extends BaseHealthcareUseCase<GetMedicalRecordRequest, GetMedicalRecordResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository
  ) {
    super();
  }

  /**
   * Public execute method - required by BaseHealthcareUseCase
   */
  public override async execute(request: GetMedicalRecordRequest): Promise<GetMedicalRecordResponse> {
    // Validate
    const validation = await this.validate(request);
    if (!validation.isValid) {
      return {
        success: false,
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
  protected async executeInternal(request: GetMedicalRecordRequest): Promise<GetMedicalRecordResponse> {
    try {
      // Create RecordId value object
      const recordId = RecordId.create(request.recordId);

      // Find medical record
      const medicalRecord = await this.medicalRecordRepository.findById(recordId);

      if (!medicalRecord) {
        return {
          success: false,
          message: `Không tìm thấy hồ sơ bệnh án với ID: ${request.recordId}`,
          errors: [{
            field: 'recordId',
            message: `Hồ sơ bệnh án với ID ${request.recordId} không tồn tại`,
            code: 'MEDICAL_RECORD_NOT_FOUND'
          }]
        };
      }

      // Check if record is archived and if archived records are allowed
      if (medicalRecord.isArchived() && !request.includeArchived) {
        return {
          success: false,
          message: 'Hồ sơ bệnh án đã được lưu trữ',
          errors: [{
            field: 'recordId',
            message: 'Hồ sơ bệnh án này đã được lưu trữ và không thể truy cập',
            code: 'MEDICAL_RECORD_ARCHIVED'
          }]
        };
      }

      // Check if record is deleted
      if (medicalRecord.isDeleted()) {
        return {
          success: false,
          message: 'Hồ sơ bệnh án đã bị xóa',
          errors: [{
            field: 'recordId',
            message: 'Hồ sơ bệnh án này đã bị xóa và không thể truy cập',
            code: 'MEDICAL_RECORD_DELETED'
          }]
        };
      }

      // Map to DTO
      const medicalRecordDto = mapMedicalRecordToDto(medicalRecord);

      // Filter vital signs if not requested
      if (!request.includeVitalSigns) {
        delete medicalRecordDto.vitalSigns;
      }

      return {
        success: true,
        message: 'Lấy thông tin hồ sơ bệnh án thành công',
        data: medicalRecordDto
      };

    } catch (error) {
      if (error instanceof MedicalRecordNotFoundError) {
        return {
          success: false,
          message: error.message,
          errors: [{
            field: 'recordId',
            message: error.message,
            code: 'MEDICAL_RECORD_NOT_FOUND'
          }]
        };
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

      // Handle other errors
      throw new Error(`Lỗi khi lấy thông tin hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate request
   */
  override async validate(request: GetMedicalRecordRequest): Promise<ValidationResult> {
    const errors = validateGetMedicalRecordRequest(request);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check authorization
   */
  async authorize(request: GetMedicalRecordRequest, userId: string): Promise<boolean> {
    try {
      // Get the medical record to check ownership
      const recordId = RecordId.create(request.recordId);
      const medicalRecord = await this.medicalRecordRepository.findById(recordId);

      if (!medicalRecord) {
        // If record doesn't exist, deny access
        return false;
      }

      // Authorization rules:
      // 1. Doctors can view records they created
      // 2. Patients can view their own records
      // 3. Admins can view all records (would need role check)
      // 4. The user making the request should match requestedBy

      if (request.requestedBy !== userId) {
        return false;
      }

      // Check if user is the doctor who created the record
      if (medicalRecord.doctorId === userId) {
        return true;
      }

      // Check if user is the patient
      if (medicalRecord.patientId === userId) {
        return true;
      }

      // Check if user is the creator
      if (medicalRecord.createdBy === userId) {
        return true;
      }

      // For now, deny access if none of the above conditions are met
      // In a real system, we would also check for admin roles, etc.
      return false;

    } catch (error) {
      // If there's an error during authorization, deny access
      return false;
    }
  }

  /**
   * Check if involves PHI
   */
  involvesPHI(request: GetMedicalRecordRequest): boolean {
    return true; // Medical records always involve PHI
  }

  /**
   * Get patient ID
   */
  getPatientId(request: GetMedicalRecordRequest): string | null {
    // We need to get the medical record to extract patient ID
    // This is a limitation of the interface - we might need to modify it
    // For now, return null and handle patient ID extraction in the audit logging
    return null;
  }

  /**
   * Get patient ID from medical record (helper method)
   */
  private async getPatientIdFromRecord(recordId: string): Promise<string | null> {
    try {
      const recordIdVO = RecordId.create(recordId);
      const medicalRecord = await this.medicalRecordRepository.findById(recordIdVO);
      return medicalRecord ? medicalRecord.patientId : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get use case description for audit
   */
  getDescription(): string {
    return 'Xem thông tin hồ sơ bệnh án';
  }

  /**
   * Get required permissions
   */
  getRequiredPermissions(): string[] {
    return ['medical_record:read'];
  }

  /**
   * Enhanced authorization with role-based access control
   */
  async authorizeWithRoles(request: GetMedicalRecordRequest, userId: string, userRoles: string[]): Promise<boolean> {
    // Admin can access all records
    if (userRoles.includes('admin') || userRoles.includes('system_admin')) {
      return true;
    }

    // Use the basic authorization for other roles
    return await this.authorize(request, userId);
  }

  /**
   * Get audit information for this use case execution
   */
  async getAuditInfoAsync(request: GetMedicalRecordRequest) {
    const baseAuditInfo = super.getAuditInfo(request);
    const patientId = await this.getPatientIdFromRecord(request.recordId);
    
    return {
      ...baseAuditInfo,
      action: 'READ_MEDICAL_RECORD',
      resourceType: 'MedicalRecord',
      resourceId: request.recordId,
      patientId,
      details: {
        recordId: request.recordId,
        includeArchived: request.includeArchived,
        includeVitalSigns: request.includeVitalSigns,
        requestedBy: request.requestedBy
      },
      complianceLevel: 'HIPAA',
      vietnameseDescription: 'Xem thông tin hồ sơ bệnh án'
    };
  }

  /**
   * Check if user can access archived records
   */
  private async canAccessArchivedRecords(userId: string, userRoles: string[]): Promise<boolean> {
    // Only admins and doctors can access archived records
    return userRoles.includes('admin') || 
           userRoles.includes('doctor') || 
           userRoles.includes('system_admin');
  }

  /**
   * Enhanced execute with role-based access control
   */
  async executeWithRoles(
    request: GetMedicalRecordRequest, 
    userId: string, 
    userRoles: string[]
  ): Promise<GetMedicalRecordResponse> {
    // Check authorization with roles
    const authorized = await this.authorizeWithRoles(request, userId, userRoles);
    if (!authorized) {
      return {
        success: false,
        message: 'Bạn không có quyền truy cập hồ sơ bệnh án này',
        errors: [{
          field: 'authorization',
          message: 'Không có quyền truy cập',
          code: 'UNAUTHORIZED_ACCESS'
        }]
      };
    }

    // Check if user can access archived records
    if (request.includeArchived && !(await this.canAccessArchivedRecords(userId, userRoles))) {
      request.includeArchived = false; // Force to false if user can't access archived records
    }

    // Execute the use case
    return await this.executeInternal(request);
  }
}
