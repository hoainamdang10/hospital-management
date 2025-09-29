/**
 * IMedicalRecordRepository - Domain Repository Interface
 * Repository interface for medical record aggregate
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern
 */

import { MedicalRecordAggregate, MedicalRecordStatus } from '../aggregates/clinical.aggregate';
import { RecordId } from '../value-objects/RecordId';

export interface IMedicalRecordRepository {
  /**
   * Save medical record aggregate
   */
  save(medicalRecord: MedicalRecordAggregate): Promise<void>;

  /**
   * Find medical record by ID
   */
  findById(recordId: RecordId): Promise<MedicalRecordAggregate | null>;

  /**
   * Find medical record by string ID
   */
  findByStringId(recordId: string): Promise<MedicalRecordAggregate | null>;

  /**
   * Find all medical records for a patient
   */
  findByPatientId(
    patientId: string,
    options?: {
      status?: MedicalRecordStatus;
      limit?: number;
      offset?: number;
      sortBy?: 'visitDate' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<MedicalRecordAggregate[]>;

  /**
   * Find all medical records by doctor
   */
  findByDoctorId(
    doctorId: string,
    options?: {
      status?: MedicalRecordStatus;
      limit?: number;
      offset?: number;
      sortBy?: 'visitDate' | 'createdAt' | 'updatedAt';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<MedicalRecordAggregate[]>;

  /**
   * Find medical record by appointment ID
   */
  findByAppointmentId(appointmentId: string): Promise<MedicalRecordAggregate | null>;

  /**
   * Search medical records with filters
   */
  search(criteria: MedicalRecordSearchCriteria): Promise<MedicalRecordSearchResult>;

  /**
   * Count medical records by patient
   */
  countByPatientId(patientId: string, status?: MedicalRecordStatus): Promise<number>;

  /**
   * Count medical records by doctor
   */
  countByDoctorId(doctorId: string, status?: MedicalRecordStatus): Promise<number>;

  /**
   * Update medical record
   */
  update(medicalRecord: MedicalRecordAggregate): Promise<void>;

  /**
   * Delete medical record (soft delete)
   */
  delete(recordId: RecordId, deletedBy: string): Promise<void>;

  /**
   * Check if medical record exists
   */
  exists(recordId: RecordId): Promise<boolean>;

  /**
   * Get medical records statistics for a patient
   */
  getPatientStatistics(patientId: string): Promise<PatientMedicalRecordStatistics>;

  /**
   * Get medical records statistics for a doctor
   */
  getDoctorStatistics(doctorId: string): Promise<DoctorMedicalRecordStatistics>;

  /**
   * Find recent medical records
   */
  findRecent(
    limit?: number,
    status?: MedicalRecordStatus
  ): Promise<MedicalRecordAggregate[]>;

  /**
   * Find medical records by date range
   */
  findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: {
      patientId?: string;
      doctorId?: string;
      status?: MedicalRecordStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<MedicalRecordAggregate[]>;

  /**
   * Bulk save medical records
   */
  bulkSave(medicalRecords: MedicalRecordAggregate[]): Promise<void>;

  /**
   * Get next sequence number for record ID generation
   */
  getNextSequenceNumber(yearMonth: string): Promise<number>;
}

/**
 * Medical record search criteria
 */
export interface MedicalRecordSearchCriteria {
  // Basic filters
  patientId?: string;
  doctorId?: string;
  appointmentId?: string;
  status?: MedicalRecordStatus;

  // Date filters
  visitDateFrom?: Date;
  visitDateTo?: Date;
  createdDateFrom?: Date;
  createdDateTo?: Date;

  // Text search
  searchText?: string; // Search in symptoms, diagnosis, treatment, notes
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  medications?: string;

  // Vital signs filters
  hasVitalSigns?: boolean;
  hasCompleteVitalSigns?: boolean;

  // Pagination
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;

  // Sorting
  sortBy?: 'visitDate' | 'createdAt' | 'updatedAt' | 'recordId';
  sortOrder?: 'asc' | 'desc';

  // Additional filters
  includeArchived?: boolean;
  includeDeleted?: boolean;
}

/**
 * Medical record search result
 */
export interface MedicalRecordSearchResult {
  records: MedicalRecordAggregate[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Patient medical record statistics
 */
export interface PatientMedicalRecordStatistics {
  patientId: string;
  totalRecords: number;
  activeRecords: number;
  archivedRecords: number;
  recordsWithDiagnosis: number;
  recordsWithTreatment: number;
  recordsWithVitalSigns: number;
  recordsWithCompleteVitalSigns: number;
  firstVisitDate?: Date;
  lastVisitDate?: Date;
  mostCommonDiagnoses: string[];
  uniqueDoctors: number;
  averageVisitsPerMonth: number;
}

/**
 * Doctor medical record statistics
 */
export interface DoctorMedicalRecordStatistics {
  doctorId: string;
  totalRecords: number;
  activeRecords: number;
  archivedRecords: number;
  recordsThisMonth: number;
  recordsThisYear: number;
  uniquePatients: number;
  averageRecordsPerDay: number;
  mostCommonDiagnoses: string[];
  recordsWithCompleteVitalSigns: number;
  completionRate: number; // Percentage of records with diagnosis and treatment
}

/**
 * Repository error types
 */
export class MedicalRecordRepositoryError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'MedicalRecordRepositoryError';
  }
}

export class MedicalRecordNotFoundError extends MedicalRecordRepositoryError {
  constructor(recordId: string) {
    super(`Không tìm thấy hồ sơ bệnh án với ID: ${recordId}`, 'MEDICAL_RECORD_NOT_FOUND');
  }
}

export class MedicalRecordAlreadyExistsError extends MedicalRecordRepositoryError {
  constructor(recordId: string) {
    super(`Hồ sơ bệnh án với ID ${recordId} đã tồn tại`, 'MEDICAL_RECORD_ALREADY_EXISTS');
  }
}

export class MedicalRecordConcurrencyError extends MedicalRecordRepositoryError {
  constructor(recordId: string) {
    super(`Hồ sơ bệnh án ${recordId} đã được cập nhật bởi người khác`, 'MEDICAL_RECORD_CONCURRENCY_ERROR');
  }
}

export class MedicalRecordValidationError extends MedicalRecordRepositoryError {
  constructor(message: string) {
    super(`Lỗi validation hồ sơ bệnh án: ${message}`, 'MEDICAL_RECORD_VALIDATION_ERROR');
  }
}

/**
 * Repository configuration
 */
export interface MedicalRecordRepositoryConfig {
  connectionString?: string;
  schema: string;
  tableName: string;
  enableCaching?: boolean;
  cacheExpirationMinutes?: number;
  enableAuditLog?: boolean;
  enableMetrics?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
}

/**
 * Repository health check result
 */
export interface RepositoryHealthCheck {
  isHealthy: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastCheckTime: Date;
  responseTimeMs: number;
  errorMessage?: string;
  statistics?: {
    totalQueries: number;
    successfulQueries: number;
    failedQueries: number;
    averageResponseTime: number;
  };
}

/**
 * Extended repository interface with health monitoring
 */
export interface IMedicalRecordRepositoryExtended extends IMedicalRecordRepository {
  /**
   * Check repository health
   */
  checkHealth(): Promise<RepositoryHealthCheck>;

  /**
   * Get repository statistics
   */
  getStatistics(): Promise<RepositoryStatistics>;

  /**
   * Clear cache (if caching is enabled)
   */
  clearCache(): Promise<void>;

  /**
   * Optimize repository performance
   */
  optimize(): Promise<void>;
}

/**
 * Repository statistics
 */
export interface RepositoryStatistics {
  totalRecords: number;
  activeRecords: number;
  archivedRecords: number;
  deletedRecords: number;
  recordsCreatedToday: number;
  recordsCreatedThisWeek: number;
  recordsCreatedThisMonth: number;
  averageRecordsPerDay: number;
  databaseSize: number;
  indexEfficiency: number;
  queryPerformance: {
    averageSelectTime: number;
    averageInsertTime: number;
    averageUpdateTime: number;
    averageDeleteTime: number;
  };
}
