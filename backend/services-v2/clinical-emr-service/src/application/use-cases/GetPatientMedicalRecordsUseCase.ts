/**
 * GetPatientMedicalRecordsUseCase - Application Layer
 * Use case for retrieving all medical records for a patient
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase, ValidationResult } from '../../../shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { MedicalRecordAggregate } from '../../domain/aggregates/clinical.aggregate';
import { 
  GetPatientMedicalRecordsRequest, 
  GetPatientMedicalRecordsResponse, 
  validateGetPatientMedicalRecordsRequest,
  setDefaultValues,
  toRepositoryOptions
} from '../dto/GetPatientMedicalRecordsRequest';
import { mapMedicalRecordToDto } from '../dto/GetMedicalRecordRequest';

export class GetPatientMedicalRecordsUseCase extends BaseHealthcareUseCase<GetPatientMedicalRecordsRequest, GetPatientMedicalRecordsResponse> {
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository
  ) {
    super();
  }

  /**
   * Execute the use case
   */
  protected async executeInternal(request: GetPatientMedicalRecordsRequest): Promise<GetPatientMedicalRecordsResponse> {
    try {
      // Set default values
      const requestWithDefaults = setDefaultValues(request);

      // Convert to repository options
      const repositoryOptions = toRepositoryOptions(requestWithDefaults);

      // Add date filters if provided
      if (requestWithDefaults.visitDateFrom || requestWithDefaults.visitDateTo) {
        const dateRangeRecords = await this.medicalRecordRepository.findByDateRange(
          requestWithDefaults.visitDateFrom ? new Date(requestWithDefaults.visitDateFrom) : new Date('1900-01-01'),
          requestWithDefaults.visitDateTo ? new Date(requestWithDefaults.visitDateTo) : new Date(),
          {
            patientId: requestWithDefaults.patientId,
            doctorId: requestWithDefaults.doctorId,
            status: requestWithDefaults.status,
            limit: repositoryOptions.limit,
            offset: repositoryOptions.offset
          }
        );

        return await this.buildResponse(dateRangeRecords, requestWithDefaults);
      }

      // Get medical records for patient
      const medicalRecords = await this.medicalRecordRepository.findByPatientId(
        requestWithDefaults.patientId,
        repositoryOptions
      );

      return await this.buildResponse(medicalRecords, requestWithDefaults);

    } catch (error) {
      throw new Error(`Lỗi khi lấy danh sách hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build response with pagination and statistics
   */
  private async buildResponse(
    medicalRecords: MedicalRecordAggregate[], 
    request: GetPatientMedicalRecordsRequest
  ): Promise<GetPatientMedicalRecordsResponse> {
    // Filter records based on request criteria
    let filteredRecords = medicalRecords;

    // Apply additional filters
    if (request.hasDiagnosis !== undefined) {
      filteredRecords = filteredRecords.filter(record => 
        request.hasDiagnosis ? record.hasDiagnosis() : !record.hasDiagnosis()
      );
    }

    if (request.hasTreatment !== undefined) {
      filteredRecords = filteredRecords.filter(record => 
        request.hasTreatment ? record.hasTreatment() : !record.hasTreatment()
      );
    }

    if (request.hasVitalSigns !== undefined) {
      filteredRecords = filteredRecords.filter(record => 
        request.hasVitalSigns ? record.hasVitalSigns() : !record.hasVitalSigns()
      );
    }

    if (request.doctorId) {
      filteredRecords = filteredRecords.filter(record => record.doctorId === request.doctorId);
    }

    // Filter archived records if not requested
    if (!request.includeArchived) {
      filteredRecords = filteredRecords.filter(record => !record.isArchived());
    }

    // Map to DTOs
    const recordDtos = filteredRecords.map(record => {
      const dto = mapMedicalRecordToDto(record);
      
      // Filter vital signs if not requested
      if (!request.includeVitalSigns) {
        delete dto.vitalSigns;
      }
      
      return dto;
    });

    // Calculate pagination
    const page = request.page || 1;
    const pageSize = request.pageSize || 20;
    const totalCount = await this.medicalRecordRepository.countByPatientId(
      request.patientId, 
      request.status
    );
    const totalPages = Math.ceil(totalCount / pageSize);

    // Calculate statistics
    const statistics = await this.calculateStatistics(request.patientId, medicalRecords);

    return {
      success: true,
      message: `Tìm thấy ${recordDtos.length} hồ sơ bệnh án`,
      data: {
        records: recordDtos,
        pagination: {
          totalCount,
          page,
          pageSize,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        statistics
      }
    };
  }

  /**
   * Calculate statistics for patient medical records
   */
  private async calculateStatistics(patientId: string, records: MedicalRecordAggregate[]) {
    const activeRecords = records.filter(r => r.isActive()).length;
    const archivedRecords = records.filter(r => r.isArchived()).length;
    const recordsWithDiagnosis = records.filter(r => r.hasDiagnosis()).length;
    const recordsWithTreatment = records.filter(r => r.hasTreatment()).length;
    const recordsWithVitalSigns = records.filter(r => r.hasVitalSigns()).length;
    const recordsWithCompleteVitalSigns = records.filter(r => r.hasCompleteVitalSigns()).length;

    // Get unique doctors
    const uniqueDoctors = new Set(records.map(r => r.doctorId)).size;

    // Get date range
    const visitDates = records.map(r => r.visitDate).sort((a, b) => a.getTime() - b.getTime());
    const firstVisit = visitDates.length > 0 ? visitDates[0] : undefined;
    const lastVisit = visitDates.length > 0 ? visitDates[visitDates.length - 1] : undefined;

    return {
      totalRecords: records.length,
      activeRecords,
      archivedRecords,
      recordsWithDiagnosis,
      recordsWithTreatment,
      recordsWithVitalSigns,
      recordsWithCompleteVitalSigns,
      uniqueDoctors,
      dateRange: {
        firstVisit: firstVisit?.toISOString(),
        lastVisit: lastVisit?.toISOString()
      }
    };
  }

  /**
   * Validate request
   */
  async validate(request: GetPatientMedicalRecordsRequest): Promise<ValidationResult> {
    const errors = validateGetPatientMedicalRecordsRequest(request);
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check authorization
   */
  async authorize(request: GetPatientMedicalRecordsRequest, userId: string): Promise<boolean> {
    // Authorization rules:
    // 1. Patients can view their own records
    // 2. Doctors can view records for their patients (would need to check doctor-patient relationship)
    // 3. Admins can view all records
    // 4. The user making the request should match requestedBy

    if (request.requestedBy !== userId) {
      return false;
    }

    // Check if user is the patient
    if (request.patientId === userId) {
      return true;
    }

    // For doctors, we would need to check if they have treated this patient
    // This would require integration with other services or additional repository methods
    // For now, we'll allow if the doctorId filter matches the userId
    if (request.doctorId === userId) {
      return true;
    }

    // For now, deny access if none of the above conditions are met
    // In a real system, we would also check for admin roles, doctor-patient relationships, etc.
    return false;
  }

  /**
   * Check if involves PHI
   */
  involvesPHI(request: GetPatientMedicalRecordsRequest): boolean {
    return true; // Medical records always involve PHI
  }

  /**
   * Get patient ID
   */
  getPatientId(request: GetPatientMedicalRecordsRequest): string | null {
    return request.patientId;
  }

  /**
   * Get use case description for audit
   */
  getDescription(): string {
    return 'Xem danh sách hồ sơ bệnh án của bệnh nhân';
  }

  /**
   * Get required permissions
   */
  getRequiredPermissions(): string[] {
    return ['medical_record:read', 'patient:read'];
  }

  /**
   * Enhanced authorization with role-based access control
   */
  async authorizeWithRoles(request: GetPatientMedicalRecordsRequest, userId: string, userRoles: string[]): Promise<boolean> {
    // Admin can access all records
    if (userRoles.includes('admin') || userRoles.includes('system_admin')) {
      return true;
    }

    // Doctors can access records for their patients
    if (userRoles.includes('doctor')) {
      // In a real system, we would check doctor-patient relationship
      // For now, allow if doctorId filter is specified and matches userId
      if (request.doctorId === userId) {
        return true;
      }
      
      // Or if no doctorId filter is specified, we could check if the doctor has any records for this patient
      if (!request.doctorId) {
        const doctorRecords = await this.medicalRecordRepository.findByPatientId(request.patientId, {
          limit: 1,
          offset: 0
        });
        return doctorRecords.some(record => record.doctorId === userId);
      }
    }

    // Use the basic authorization for other cases
    return await this.authorize(request, userId);
  }

  /**
   * Get audit information for this use case execution
   */
  getAuditInfo(request: GetPatientMedicalRecordsRequest) {
    const baseAuditInfo = super.getAuditInfo(request);
    
    return {
      ...baseAuditInfo,
      action: 'READ_PATIENT_MEDICAL_RECORDS',
      resourceType: 'MedicalRecord',
      patientId: request.patientId,
      details: {
        patientId: request.patientId,
        doctorId: request.doctorId,
        status: request.status,
        includeArchived: request.includeArchived,
        includeVitalSigns: request.includeVitalSigns,
        dateRange: {
          from: request.visitDateFrom,
          to: request.visitDateTo
        },
        pagination: {
          page: request.page,
          pageSize: request.pageSize
        },
        filters: {
          hasDiagnosis: request.hasDiagnosis,
          hasTreatment: request.hasTreatment,
          hasVitalSigns: request.hasVitalSigns
        },
        requestedBy: request.requestedBy
      },
      complianceLevel: 'HIPAA',
      vietnameseDescription: 'Xem danh sách hồ sơ bệnh án của bệnh nhân'
    };
  }

  /**
   * Enhanced execute with role-based access control and performance optimization
   */
  async executeWithRoles(
    request: GetPatientMedicalRecordsRequest, 
    userId: string, 
    userRoles: string[]
  ): Promise<GetPatientMedicalRecordsResponse> {
    // Check authorization with roles
    const authorized = await this.authorizeWithRoles(request, userId, userRoles);
    if (!authorized) {
      return {
        success: false,
        message: 'Bạn không có quyền truy cập hồ sơ bệnh án của bệnh nhân này',
        errors: [{
          field: 'authorization',
          message: 'Không có quyền truy cập',
          code: 'UNAUTHORIZED_ACCESS'
        }]
      };
    }

    // Check if user can access archived records
    if (request.includeArchived && !await this.canAccessArchivedRecords(userId, userRoles)) {
      request.includeArchived = false; // Force to false if user can't access archived records
    }

    // Execute the use case
    return await this.executeInternal(request);
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
}
