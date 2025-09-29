/**
 * SearchMedicalRecordsUseCase - Application Layer
 * Use case for searching and filtering medical records with advanced criteria
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, HIPAA, Vietnamese Healthcare Standards
 */

import { BaseHealthcareUseCase, ValidationResult } from '../../../shared/application/use-cases/base/use-case.interface';
import { IMedicalRecordRepository } from '../../domain/repositories/IMedicalRecordRepository';
import { MedicalRecordAggregate, MedicalRecordStatus } from '../../domain/aggregates/clinical.aggregate';
import { DiagnosisCategory, DiagnosisSeverity, DiagnosisStatus } from '../../domain/value-objects/Diagnosis';
import { MedicationStatus } from '../../domain/value-objects/Medication';

/**
 * Search Criteria Interface
 */
export interface SearchCriteria {
  // Basic search
  patientId?: string;
  doctorId?: string;
  appointmentId?: string;
  
  // Date range
  visitDateFrom?: string;
  visitDateTo?: string;
  createdDateFrom?: string;
  createdDateTo?: string;
  
  // Text search
  symptoms?: string;
  diagnosisText?: string;
  medicationText?: string;
  notes?: string;
  
  // Status filters
  status?: MedicalRecordStatus[];
  
  // Diagnosis filters
  diagnosisCode?: string;
  diagnosisCategory?: DiagnosisCategory[];
  diagnosisSeverity?: DiagnosisSeverity[];
  diagnosisStatus?: DiagnosisStatus[];
  
  // Medication filters
  medicationCode?: string;
  medicationStatus?: MedicationStatus[];
  
  // Vietnamese medical filters
  specialtyCode?: string;
  hospitalCode?: string;
  
  // FHIR filters
  fhirCompliant?: boolean;
  
  // Advanced filters
  hasVitalSigns?: boolean;
  hasPrimaryDiagnosis?: boolean;
  hasActiveMedications?: boolean;
  hasCriticalDiagnoses?: boolean;
  
  // Full-text search
  fullTextSearch?: string;
}

/**
 * Sort Options
 */
export interface SortOptions {
  field: 'visitDate' | 'createdAt' | 'updatedAt' | 'patientId' | 'doctorId';
  direction: 'asc' | 'desc';
}

/**
 * Pagination Options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

/**
 * Search Medical Records Request
 */
export interface SearchMedicalRecordsRequest {
  criteria: SearchCriteria;
  sort?: SortOptions;
  pagination?: PaginationOptions;
  searchedBy: string;
  
  // Response options
  includeDetails?: boolean;
  includeDiagnoses?: boolean;
  includeMedications?: boolean;
  includeVitalSigns?: boolean;
  includeAccessLog?: boolean;
  
  // Security options
  respectAccessControl?: boolean;
  auditSearch?: boolean;
}

/**
 * Search Results
 */
export interface SearchResults {
  records: MedicalRecordSummary[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Medical Record Summary for Search Results
 */
export interface MedicalRecordSummary {
  recordId: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  visitDate: string;
  status: MedicalRecordStatus;
  
  // Summary information
  summary: string;
  symptoms?: string;
  
  // Diagnosis summary
  diagnosesCount: number;
  primaryDiagnosis?: {
    code: string;
    display: string;
    severity: DiagnosisSeverity;
  };
  hasCriticalDiagnoses: boolean;
  
  // Medication summary
  medicationsCount: number;
  activeMedicationsCount: number;
  hasHighPriorityMedications: boolean;
  
  // Vital signs
  hasVitalSigns: boolean;
  vitalSignsSummary?: string;
  
  // Metadata
  fhirCompliant: boolean;
  specialtyCode?: string;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  
  // Detailed information (if requested)
  details?: {
    examinationNotes?: string;
    notes?: string;
    diagnoses?: any[];
    medications?: any[];
    vitalSigns?: any;
    accessLog?: any[];
  };
}

/**
 * Search Medical Records Response
 */
export interface SearchMedicalRecordsResponse {
  success: boolean;
  message: string;
  data?: {
    results: SearchResults;
    searchCriteria: SearchCriteria;
    executionTime: number;
    searchId: string;
  };
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Search Medical Records Use Case
 */
export class SearchMedicalRecordsUseCase extends BaseHealthcareUseCase<SearchMedicalRecordsRequest, SearchMedicalRecordsResponse> {
  
  constructor(
    private readonly medicalRecordRepository: IMedicalRecordRepository
  ) {
    super();
  }

  /**
   * Execute the use case
   */
  protected async executeInternal(request: SearchMedicalRecordsRequest): Promise<SearchMedicalRecordsResponse> {
    const startTime = Date.now();
    
    try {
      // Set default pagination if not provided
      const pagination = request.pagination || { page: 1, limit: 20 };
      pagination.offset = (pagination.page - 1) * pagination.limit;

      // Set default sort if not provided
      const sort = request.sort || { field: 'visitDate', direction: 'desc' };

      // Execute search
      const searchResults = await this.executeSearch(request.criteria, sort, pagination, request);

      // Calculate execution time
      const executionTime = Date.now() - startTime;

      // Generate search ID for audit
      const searchId = this.generateSearchId(request.searchedBy);

      // Audit search if requested
      if (request.auditSearch !== false) {
        await this.auditSearch(request, searchResults.totalCount, executionTime, searchId);
      }

      return {
        success: true,
        message: `Tìm thấy ${searchResults.totalCount} hồ sơ bệnh án phù hợp`,
        data: {
          results: searchResults,
          searchCriteria: request.criteria,
          executionTime,
          searchId
        }
      };

    } catch (error) {
      throw new Error(`Lỗi khi tìm kiếm hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute search with criteria
   */
  private async executeSearch(
    criteria: SearchCriteria,
    sort: SortOptions,
    pagination: PaginationOptions,
    request: SearchMedicalRecordsRequest
  ): Promise<SearchResults> {
    // Get all medical records that match criteria
    const allRecords = await this.medicalRecordRepository.search(criteria, sort);

    // Apply access control if requested
    const accessibleRecords = request.respectAccessControl !== false 
      ? await this.filterByAccessControl(allRecords, request.searchedBy)
      : allRecords;

    // Calculate pagination
    const totalCount = accessibleRecords.length;
    const totalPages = Math.ceil(totalCount / pagination.limit);
    const hasNextPage = pagination.page < totalPages;
    const hasPreviousPage = pagination.page > 1;

    // Get paginated results
    const paginatedRecords = accessibleRecords.slice(
      pagination.offset!,
      pagination.offset! + pagination.limit
    );

    // Convert to summary format
    const recordSummaries = await Promise.all(
      paginatedRecords.map(record => this.convertToSummary(record, request))
    );

    return {
      records: recordSummaries,
      totalCount,
      page: pagination.page,
      limit: pagination.limit,
      totalPages,
      hasNextPage,
      hasPreviousPage
    };
  }

  /**
   * Filter records by access control
   */
  private async filterByAccessControl(
    records: MedicalRecordAggregate[],
    userId: string
  ): Promise<MedicalRecordAggregate[]> {
    return records.filter(record => {
      // Users can access records they created or are assigned to
      return record.doctorId === userId || record.createdBy === userId;
    });
  }

  /**
   * Convert medical record to summary format
   */
  private async convertToSummary(
    record: MedicalRecordAggregate,
    request: SearchMedicalRecordsRequest
  ): Promise<MedicalRecordSummary> {
    // Log read access for HIPAA compliance
    record.recordReadAccess(
      request.searchedBy,
      'Tìm kiếm hồ sơ bệnh án'
    );

    const primaryDiagnosis = record.diagnoses.find(d => d.isPrimary());
    const activeMedications = record.medications.filter(m => m.isActive());

    const summary: MedicalRecordSummary = {
      recordId: record.recordId.value,
      patientId: record.patientId,
      doctorId: record.doctorId,
      appointmentId: record.appointmentId,
      visitDate: record.visitDate.toISOString(),
      status: record.status,
      
      summary: record.getSummary(),
      symptoms: record.symptoms,
      
      diagnosesCount: record.diagnoses.length,
      primaryDiagnosis: primaryDiagnosis ? {
        code: primaryDiagnosis.code,
        display: primaryDiagnosis.display,
        severity: primaryDiagnosis.severity
      } : undefined,
      hasCriticalDiagnoses: record.getCriticalDiagnoses().length > 0,
      
      medicationsCount: record.medications.length,
      activeMedicationsCount: activeMedications.length,
      hasHighPriorityMedications: record.getHighPriorityMedications().length > 0,
      
      hasVitalSigns: record.hasVitalSigns(),
      vitalSignsSummary: record.vitalSigns?.getSummary(),
      
      fhirCompliant: record.isFHIRCompliant(),
      specialtyCode: record.specialtyCode,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      lastAccessedAt: record.getLastAccessInfo()?.date.toISOString()
    };

    // Include detailed information if requested
    if (request.includeDetails) {
      summary.details = {
        examinationNotes: record.examinationNotes,
        notes: record.notes
      };

      if (request.includeDiagnoses) {
        summary.details.diagnoses = record.diagnoses.map(d => d.toJSON());
      }

      if (request.includeMedications) {
        summary.details.medications = record.medications.map(m => m.toJSON());
      }

      if (request.includeVitalSigns && record.vitalSigns) {
        summary.details.vitalSigns = record.vitalSigns.toJSON();
      }

      if (request.includeAccessLog) {
        summary.details.accessLog = record.accessLog;
      }
    }

    return summary;
  }

  /**
   * Generate unique search ID
   */
  private generateSearchId(userId: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    return `SEARCH-${userId}-${timestamp}`;
  }

  /**
   * Audit search operation
   */
  private async auditSearch(
    request: SearchMedicalRecordsRequest,
    resultCount: number,
    executionTime: number,
    searchId: string
  ): Promise<void> {
    // In a real implementation, this would log to an audit system
    console.log(`Search Audit: ${searchId}`, {
      searchedBy: request.searchedBy,
      criteria: request.criteria,
      resultCount,
      executionTime,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Validate request
   */
  async validate(request: SearchMedicalRecordsRequest): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string; code: string }> = [];

    // Required fields validation
    if (!request.searchedBy || request.searchedBy.trim() === '') {
      errors.push({
        field: 'searchedBy',
        message: 'Người tìm kiếm là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    if (!request.criteria || Object.keys(request.criteria).length === 0) {
      errors.push({
        field: 'criteria',
        message: 'Ít nhất một tiêu chí tìm kiếm là bắt buộc',
        code: 'REQUIRED_FIELD'
      });
    }

    // Pagination validation
    if (request.pagination) {
      if (request.pagination.page < 1) {
        errors.push({
          field: 'pagination.page',
          message: 'Số trang phải lớn hơn 0',
          code: 'INVALID_PAGINATION'
        });
      }

      if (request.pagination.limit < 1 || request.pagination.limit > 100) {
        errors.push({
          field: 'pagination.limit',
          message: 'Số lượng kết quả phải từ 1-100',
          code: 'INVALID_PAGINATION'
        });
      }
    }

    // Date range validation
    if (request.criteria.visitDateFrom && request.criteria.visitDateTo) {
      const fromDate = new Date(request.criteria.visitDateFrom);
      const toDate = new Date(request.criteria.visitDateTo);
      
      if (fromDate > toDate) {
        errors.push({
          field: 'criteria.visitDate',
          message: 'Ngày bắt đầu phải trước ngày kết thúc',
          code: 'INVALID_DATE_RANGE'
        });
      }
    }

    if (request.criteria.createdDateFrom && request.criteria.createdDateTo) {
      const fromDate = new Date(request.criteria.createdDateFrom);
      const toDate = new Date(request.criteria.createdDateTo);
      
      if (fromDate > toDate) {
        errors.push({
          field: 'criteria.createdDate',
          message: 'Ngày tạo bắt đầu phải trước ngày tạo kết thúc',
          code: 'INVALID_DATE_RANGE'
        });
      }
    }

    // Enum validation
    if (request.criteria.status) {
      const invalidStatuses = request.criteria.status.filter(
        status => !Object.values(MedicalRecordStatus).includes(status)
      );
      if (invalidStatuses.length > 0) {
        errors.push({
          field: 'criteria.status',
          message: `Trạng thái không hợp lệ: ${invalidStatuses.join(', ')}`,
          code: 'INVALID_ENUM_VALUE'
        });
      }
    }

    if (request.criteria.diagnosisCategory) {
      const invalidCategories = request.criteria.diagnosisCategory.filter(
        category => !Object.values(DiagnosisCategory).includes(category)
      );
      if (invalidCategories.length > 0) {
        errors.push({
          field: 'criteria.diagnosisCategory',
          message: `Loại chẩn đoán không hợp lệ: ${invalidCategories.join(', ')}`,
          code: 'INVALID_ENUM_VALUE'
        });
      }
    }

    if (request.criteria.diagnosisSeverity) {
      const invalidSeverities = request.criteria.diagnosisSeverity.filter(
        severity => !Object.values(DiagnosisSeverity).includes(severity)
      );
      if (invalidSeverities.length > 0) {
        errors.push({
          field: 'criteria.diagnosisSeverity',
          message: `Mức độ nghiêm trọng không hợp lệ: ${invalidSeverities.join(', ')}`,
          code: 'INVALID_ENUM_VALUE'
        });
      }
    }

    if (request.criteria.medicationStatus) {
      const invalidStatuses = request.criteria.medicationStatus.filter(
        status => !Object.values(MedicationStatus).includes(status)
      );
      if (invalidStatuses.length > 0) {
        errors.push({
          field: 'criteria.medicationStatus',
          message: `Trạng thái thuốc không hợp lệ: ${invalidStatuses.join(', ')}`,
          code: 'INVALID_ENUM_VALUE'
        });
      }
    }

    // Sort validation
    if (request.sort) {
      const validSortFields = ['visitDate', 'createdAt', 'updatedAt', 'patientId', 'doctorId'];
      if (!validSortFields.includes(request.sort.field)) {
        errors.push({
          field: 'sort.field',
          message: `Trường sắp xếp không hợp lệ: ${request.sort.field}`,
          code: 'INVALID_SORT_FIELD'
        });
      }

      if (!['asc', 'desc'].includes(request.sort.direction)) {
        errors.push({
          field: 'sort.direction',
          message: `Hướng sắp xếp không hợp lệ: ${request.sort.direction}`,
          code: 'INVALID_SORT_DIRECTION'
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
  async authorize(request: SearchMedicalRecordsRequest, userId: string): Promise<boolean> {
    // Basic authorization - user must match searchedBy
    if (request.searchedBy !== userId) {
      return false;
    }

    // Additional authorization rules can be added here
    // For example, checking if user has search permissions
    return true;
  }

  /**
   * Check if involves PHI
   */
  involvesPHI(request: SearchMedicalRecordsRequest): boolean {
    return true; // Medical record searches always involve PHI
  }

  /**
   * Get patient ID
   */
  getPatientId(request: SearchMedicalRecordsRequest): string | null {
    return request.criteria.patientId || null;
  }

  /**
   * Get use case description
   */
  getDescription(): string {
    return 'Tìm kiếm hồ sơ bệnh án với tiêu chí nâng cao';
  }

  /**
   * Get required permissions
   */
  getRequiredPermissions(): string[] {
    return ['medical_record:read', 'medical_record:search'];
  }
}
