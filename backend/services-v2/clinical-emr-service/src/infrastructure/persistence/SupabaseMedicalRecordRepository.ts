/**
 * SupabaseMedicalRecordRepository - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Implements medical record persistence with Supabase and Vietnamese healthcare optimization
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA, Vietnamese Healthcare Standards
 */

import { OptimizedSupabaseClient } from "@shared/infrastructure/database/optimized-supabase-client";
import {
  MedicalRecordAggregate,
  MedicalRecordStatus,
  MedicalRecordAccess,
} from "../../domain/aggregates/clinical.aggregate";
import {
  DoctorMedicalRecordStatistics,
  IMedicalRecordRepository,
  MedicalRecordAlreadyExistsError,
  MedicalRecordRepositoryError,
  MedicalRecordSearchCriteria,
  MedicalRecordSearchResult,
  PatientMedicalRecordStatistics,
} from "../../domain/repositories/IMedicalRecordRepository";
import { BasicVitalSigns } from "../../domain/value-objects/BasicVitalSigns";
import { RecordId } from "../../domain/value-objects/RecordId";
import { Diagnosis } from "../../domain/value-objects/Diagnosis";
import { Medication } from "../../domain/value-objects/Medication";
import { ILogger } from "@shared/infrastructure/logging/logger.interface";
import { IAuditService } from "@shared/application/services/audit.service.interface";

export interface SupabaseMedicalRecordRepositoryConfig {
  supabase: OptimizedSupabaseClient;
  logger: ILogger;
  auditService: IAuditService;
  schema: string;
  tableName: string;
}

/**
 * Supabase Medical Record Repository
 * Implements medical record persistence with Vietnamese healthcare compliance
 */
export class SupabaseMedicalRecordRepository implements IMedicalRecordRepository {
  private readonly supabaseClient: OptimizedSupabaseClient;
  private readonly logger: ILogger;
  private readonly auditService: IAuditService;
  private readonly schema: string;
  private readonly tableName: string;

  constructor(config: SupabaseMedicalRecordRepositoryConfig) {
    this.supabaseClient = config.supabase;
    this.logger = config.logger;
    this.auditService = config.auditService;
    this.schema = config.schema || 'clinical_schema';
    this.tableName = config.tableName || 'medical_records';
  }

  /**
   * Save medical record aggregate
   */
  async save(medicalRecord: MedicalRecordAggregate): Promise<void> {
    try {
      this.logger.info('Saving medical record to database', {
        recordId: medicalRecord.recordId.value,
        patientId: medicalRecord.patientId,
        doctorId: medicalRecord.doctorId,
        status: medicalRecord.status
      });

      const client = await this.supabaseClient.getConnection();

      // Check if record already exists
      const existingRecord = await this.findById(medicalRecord.recordId);
      if (existingRecord) {
        // Update existing record instead of throwing error
        await this.updateRecord(medicalRecord);
        return;
      }

      // Map aggregate to database format
      const dbRecord = this.toPersistence(medicalRecord);

      // Use upsert to handle both create and update
      const { data, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .upsert(dbRecord, {
          onConflict: 'record_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        this.logger.error('Error saving medical record to database', {
          recordId: medicalRecord.recordId.value,
          error: error.message,
          details: error.details
        });

        throw new MedicalRecordRepositoryError(
          `Lỗi lưu hồ sơ bệnh án: ${error.message}`,
          "SAVE_FAILED"
        );
      }

      // HIPAA audit logging
      await this.auditService.logMedicalRecordAccess(
        'SAVE',
        medicalRecord.recordId.value,
        'SYSTEM',
        'Medical record saved to database',
        {
          patientId: medicalRecord.patientId,
          doctorId: medicalRecord.doctorId,
          status: medicalRecord.status
        }
      );

      this.logger.info('Medical record saved successfully', {
        recordId: medicalRecord.recordId.value,
        id: data?.id
      });

    } catch (error) {
      this.logger.error('Error saving medical record', {
        recordId: medicalRecord.recordId.value,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof MedicalRecordRepositoryError) {
        throw error;
      }
      throw new MedicalRecordRepositoryError(
        `Lỗi lưu hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`,
        "REPOSITORY_ERROR"
      );
    }
  }

  /**
   * Find medical record by ID
   */
  async findById(recordId: RecordId): Promise<MedicalRecordAggregate | null> {
    try {
      this.logger.info('Finding medical record by ID', { recordId: recordId.value });

      const client = await this.supabaseClient.getConnection();

      const { data, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .eq('record_id', recordId.value)
        .is('deleted_at', null)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Record not found
        }
        throw new MedicalRecordRepositoryError(
          `Lỗi truy vấn database: ${error.message}`,
          "FIND_FAILED"
        );
      }

      if (!data) return null;

      // HIPAA audit logging
      await this.auditService.logMedicalRecordAccess(
        'READ',
        recordId.value,
        'SYSTEM',
        'Medical record retrieved by ID',
        { recordId: recordId.value }
      );

      return this.toDomain(data);

    } catch (error) {
      this.logger.error('Error finding medical record by ID', {
        recordId: recordId.value,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof MedicalRecordRepositoryError) {
        throw error;
      }
      throw new MedicalRecordRepositoryError(
        `Lỗi tìm hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`,
        "REPOSITORY_ERROR"
      );
    }
  }

  /**
   * Find medical record by string ID
   */
  async findByStringId(
    recordId: string
  ): Promise<MedicalRecordAggregate | null> {
    const recordIdVO = RecordId.create(recordId);
    return await this.findById(recordIdVO);
  }

  /**
   * Find all medical records for a patient
   */
  async findByPatientId(
    patientId: string,
    options?: {
      status?: MedicalRecordStatus;
      limit?: number;
      offset?: number;
      sortBy?: "visitDate" | "createdAt" | "updatedAt";
      sortOrder?: "asc" | "desc";
    }
  ): Promise<MedicalRecordAggregate[]> {
    try {
      const client = await this.supabaseClient.getConnection();

      let query = client
        .from("medical_records")
        .select("*")
        .eq("patient_id", patientId);

      // Apply filters
      if (options?.status) {
        query = query.eq("status", options.status);
      }

      // Apply sorting
      const sortBy = options?.sortBy || "visitDate";
      const sortOrder = options?.sortOrder || "desc";
      const sortColumn = this.mapSortField(sortBy);
      query = query.order(sortColumn, { ascending: sortOrder === "asc" });

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 50) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Failed to find medical records by patient: ${error.message}`,
          "FIND_BY_PATIENT_FAILED"
        );
      }

      return data.map((record) => this.mapDatabaseToAggregate(record));
    } catch (error) {
      if (error instanceof MedicalRecordRepositoryError) {
        throw error;
      }
      throw new MedicalRecordRepositoryError(
        `Repository error during findByPatientId: ${error instanceof Error ? error.message : "Unknown error"}`,
        "REPOSITORY_ERROR"
      );
    }
  }

  /**
   * Find all medical records by doctor
   */
  async findByDoctorId(
    doctorId: string,
    options?: {
      status?: MedicalRecordStatus;
      limit?: number;
      offset?: number;
      sortBy?: "visitDate" | "createdAt" | "updatedAt";
      sortOrder?: "asc" | "desc";
    }
  ): Promise<MedicalRecordAggregate[]> {
    try {
      const client = await this.supabaseClient.getConnection();

      let query = client
        .from("medical_records")
        .select("*")
        .eq("doctor_id", doctorId);

      // Apply filters
      if (options?.status) {
        query = query.eq("status", options.status);
      }

      // Apply sorting
      const sortBy = options?.sortBy || "visitDate";
      const sortOrder = options?.sortOrder || "desc";
      const sortColumn = this.mapSortField(sortBy);
      query = query.order(sortColumn, { ascending: sortOrder === "asc" });

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 50) - 1
        );
      }

      const { data, error } = await query;

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Failed to find medical records by doctor: ${error.message}`,
          "FIND_BY_DOCTOR_FAILED"
        );
      }

      return data.map((record) => this.mapDatabaseToAggregate(record));
    } catch (error) {
      if (error instanceof MedicalRecordRepositoryError) {
        throw error;
      }
      throw new MedicalRecordRepositoryError(
        `Repository error during findByDoctorId: ${error instanceof Error ? error.message : "Unknown error"}`,
        "REPOSITORY_ERROR"
      );
    }
  }

  /**
   * Find medical record by appointment ID
   */
  async findByAppointmentId(
    appointmentId: string
  ): Promise<MedicalRecordAggregate | null> {
    try {
      const client = await this.supabaseClient.getConnection();

      const { data, error } = await client
        .from("medical_records")
        .select("*")
        .eq("appointment_id", appointmentId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null; // Record not found
        }
        throw new MedicalRecordRepositoryError(
          `Failed to find medical record by appointment: ${error.message}`,
          "FIND_BY_APPOINTMENT_FAILED"
        );
      }

      return this.mapDatabaseToAggregate(data);
    } catch (error) {
      if (error instanceof MedicalRecordRepositoryError) {
        throw error;
      }
      throw new MedicalRecordRepositoryError(
        `Repository error during findByAppointmentId: ${error instanceof Error ? error.message : "Unknown error"}`,
        "REPOSITORY_ERROR"
      );
    }
  }

  /**
   * Search medical records with filters
   */
  async search(
    criteria: MedicalRecordSearchCriteria
  ): Promise<MedicalRecordSearchResult> {
    try {
      const client = await this.supabaseClient.getConnection();

      let query = client
        .from("medical_records")
        .select("*", { count: "exact" });

      // Apply filters
      if (criteria.patientId) {
        query = query.eq("patient_id", criteria.patientId);
      }
      if (criteria.doctorId) {
        query = query.eq("doctor_id", criteria.doctorId);
      }
      if (criteria.appointmentId) {
        query = query.eq("appointment_id", criteria.appointmentId);
      }
      if (criteria.status) {
        query = query.eq("status", criteria.status);
      }

      // Date filters
      if (criteria.visitDateFrom) {
        query = query.gte(
          "visit_date",
          criteria.visitDateFrom.toISOString().split("T")[0]
        );
      }
      if (criteria.visitDateTo) {
        query = query.lte(
          "visit_date",
          criteria.visitDateTo.toISOString().split("T")[0]
        );
      }

      // Text search
      if (criteria.searchText) {
        query = query.or(
          `symptoms.ilike.%${criteria.searchText}%,diagnosis.ilike.%${criteria.searchText}%,treatment.ilike.%${criteria.searchText}%`
        );
      }

      // Status filters
      if (!criteria.includeArchived) {
        query = query.neq("status", "archived");
      }
      if (!criteria.includeDeleted) {
        query = query.neq("status", "deleted");
      }

      // Sorting
      const sortBy = criteria.sortBy || "visitDate";
      const sortOrder = criteria.sortOrder || "desc";
      const sortColumn = this.mapSortField(sortBy);
      query = query.order(sortColumn, { ascending: sortOrder === "asc" });

      // Pagination
      const page = criteria.page || 1;
      const pageSize = criteria.pageSize || 20;
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Failed to search medical records: ${error.message}`,
          "SEARCH_FAILED"
        );
      }

      const records = data.map((record) => this.mapDatabaseToAggregate(record));
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        records,
        totalCount,
        page,
        pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      if (error instanceof MedicalRecordRepositoryError) {
        throw error;
      }
      throw new MedicalRecordRepositoryError(
        `Repository error during search: ${error instanceof Error ? error.message : "Unknown error"}`,
        "REPOSITORY_ERROR"
      );
    }
  }

  /**
   * Count medical records by patient
   */
  async countByPatientId(
    patientId: string,
    status?: MedicalRecordStatus
  ): Promise<number> {
    try {
      const client = await this.supabaseClient.getConnection();

      let query = client
        .from("medical_records")
        .select("*", { count: "exact", head: true })
        .eq("patient_id", patientId);

      if (status) {
        query = query.eq("status", status);
      }

      const { count, error } = await query;

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Failed to count medical records by patient: ${error.message}`,
          "COUNT_BY_PATIENT_FAILED"
        );
      }

      return count || 0;
    } catch (error) {
      if (error instanceof MedicalRecordRepositoryError) {
        throw error;
      }
      throw new MedicalRecordRepositoryError(
        `Repository error during countByPatientId: ${error instanceof Error ? error.message : "Unknown error"}`,
        "REPOSITORY_ERROR"
      );
    }
  }

  /**
   * Count medical records by doctor
   */
  async countByDoctorId(
    doctorId: string,
    status?: MedicalRecordStatus
  ): Promise<number> {
    try {
      const client = await this.supabaseClient.getConnection();

      let query = client
        .from("medical_records")
        .select("*", { count: "exact", head: true })
        .eq("doctor_id", doctorId);

      if (status) {
        query = query.eq("status", status);
      }

      const { count, error } = await query;

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Failed to count medical records by doctor: ${error.message}`,
          "COUNT_BY_DOCTOR_FAILED"
        );
      }

      return count || 0;
    } catch (error) {
      if (error instanceof MedicalRecordRepositoryError) {
        throw error;
      }
      throw new MedicalRecordRepositoryError(
        `Repository error during countByDoctorId: ${error instanceof Error ? error.message : "Unknown error"}`,
        "REPOSITORY_ERROR"
      );
    }
  }

  /**
   * Update medical record
   */
  async update(medicalRecord: MedicalRecordAggregate): Promise<void> {
    try {
      const client = await this.supabaseClient.getConnection();

      // Map aggregate to database format
      const dbRecord = this.mapAggregateToDatabase(medicalRecord);

      const { error } = await client
        .from("medical_records")
        .update(dbRecord)
        .eq("record_id", medicalRecord.recordId.value);

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Failed to update medical record: ${error.message}`,
          "UPDATE_FAILED"
        );
      }
    } catch (error) {
      if (error instanceof MedicalRecordRepositoryError) {
        throw error;
      }
      throw new MedicalRecordRepositoryError(
        `Repository error during update: ${error instanceof Error ? error.message : "Unknown error"}`,
        "REPOSITORY_ERROR"
      );
    }
  }

  /**
   * Delete medical record (soft delete)
   */
  async delete(recordId: RecordId, deletedBy: string): Promise<void> {
    try {
      const client = await this.supabaseClient.getConnection();

      const { error } = await client
        .from("medical_records")
        .update({
          status: "deleted",
          updated_by: deletedBy,
          updated_at: new Date().toISOString(),
        })
        .eq("record_id", recordId.value);

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Failed to delete medical record: ${error.message}`,
          "DELETE_FAILED"
        );
      }
    } catch (error) {
      if (error instanceof MedicalRecordRepositoryError) {
        throw error;
      }
      throw new MedicalRecordRepositoryError(
        `Repository error during delete: ${error instanceof Error ? error.message : "Unknown error"}`,
        "REPOSITORY_ERROR"
      );
    }
  }

  /**
   * Check if medical record exists
   */
  async exists(recordId: RecordId): Promise<boolean> {
    try {
      const record = await this.findById(recordId);
      return record !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Find medical records by date range
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: {
      patientId?: string;
      doctorId?: string;
      status?: MedicalRecordStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<MedicalRecordAggregate[]> {
    try {
      const client = await this.supabaseClient.getConnection();

      let query = client
        .from("medical_records")
        .select("*")
        .gte("visit_date", startDate.toISOString().split("T")[0])
        .lte("visit_date", endDate.toISOString().split("T")[0]);

      // Apply additional filters
      if (options?.patientId) {
        query = query.eq("patient_id", options.patientId);
      }
      if (options?.doctorId) {
        query = query.eq("doctor_id", options.doctorId);
      }
      if (options?.status) {
        query = query.eq("status", options.status);
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 50) - 1
        );
      }

      // Order by visit date descending
      query = query.order("visit_date", { ascending: false });

      const { data, error } = await query;

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Failed to find medical records by date range: ${error.message}`,
          "FIND_BY_DATE_RANGE_FAILED"
        );
      }

      return data.map((record) => this.mapDatabaseToAggregate(record));
    } catch (error) {
      if (error instanceof MedicalRecordRepositoryError) {
        throw error;
      }
      throw new MedicalRecordRepositoryError(
        `Repository error during findByDateRange: ${error instanceof Error ? error.message : "Unknown error"}`,
        "REPOSITORY_ERROR"
      );
    }
  }

  /**
   * Get patient medical record statistics
   */
  async getPatientStatistics(
    patientId: string
  ): Promise<PatientMedicalRecordStatistics> {
    try {
      const client = await this.supabaseClient.getConnection();

      const { data, error } = await client
        .from("medical_records")
        .select("*")
        .eq("patient_id", patientId);

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Failed to get patient statistics: ${error.message}`,
          "GET_PATIENT_STATISTICS_FAILED"
        );
      }

      const records = data.map((record) => this.mapDatabaseToAggregate(record));

      return {
        totalRecords: records.length,
        activeRecords: records.filter((r) => r.isActive()).length,
        archivedRecords: records.filter((r) => r.isArchived()).length,
        recordsWithDiagnosis: records.filter((r) => r.hasDiagnosis()).length,
        recordsWithTreatment: records.filter((r) => r.hasTreatment()).length,
        recordsWithVitalSigns: records.filter((r) => r.hasVitalSigns()).length,
        recordsWithCompleteVitalSigns: records.filter((r) =>
          r.hasCompleteVitalSigns()
        ).length,
        uniqueDoctors: new Set(records.map((r) => r.doctorId)).size,
        firstVisit:
          records.length > 0
            ? records.reduce(
                (earliest, record) =>
                  record.visitDate < earliest ? record.visitDate : earliest,
                records[0].visitDate
              )
            : null,
        lastVisit:
          records.length > 0
            ? records.reduce(
                (latest, record) =>
                  record.visitDate > latest ? record.visitDate : latest,
                records[0].visitDate
              )
            : null,
      };
    } catch (error) {
      if (error instanceof MedicalRecordRepositoryError) {
        throw error;
      }
      throw new MedicalRecordRepositoryError(
        `Repository error during getPatientStatistics: ${error instanceof Error ? error.message : "Unknown error"}`,
        "REPOSITORY_ERROR"
      );
    }
  }

  /**
   * Get doctor medical record statistics
   */
  async getDoctorStatistics(
    doctorId: string
  ): Promise<DoctorMedicalRecordStatistics> {
    try {
      const client = await this.supabaseClient.getConnection();

      const { data, error } = await client
        .from("medical_records")
        .select("*")
        .eq("doctor_id", doctorId);

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Failed to get doctor statistics: ${error.message}`,
          "GET_DOCTOR_STATISTICS_FAILED"
        );
      }

      const records = data.map((record) => this.mapDatabaseToAggregate(record));

      return {
        totalRecords: records.length,
        activeRecords: records.filter((r) => r.isActive()).length,
        archivedRecords: records.filter((r) => r.isArchived()).length,
        recordsWithDiagnosis: records.filter((r) => r.hasDiagnosis()).length,
        recordsWithTreatment: records.filter((r) => r.hasTreatment()).length,
        recordsWithVitalSigns: records.filter((r) => r.hasVitalSigns()).length,
        recordsWithCompleteVitalSigns: records.filter((r) =>
          r.hasCompleteVitalSigns()
        ).length,
        uniquePatients: new Set(records.map((r) => r.patientId)).size,
        recordsToday: records.filter((r) => {
          const today = new Date();
          return r.visitDate.toDateString() === today.toDateString();
        }).length,
        recordsThisMonth: records.filter((r) => {
          const now = new Date();
          return (
            r.visitDate.getMonth() === now.getMonth() &&
            r.visitDate.getFullYear() === now.getFullYear()
          );
        }).length,
        recordsThisYear: records.filter((r) => {
          const now = new Date();
          return r.visitDate.getFullYear() === now.getFullYear();
        }).length,
      };
    } catch (error) {
      if (error instanceof MedicalRecordRepositoryError) {
        throw error;
      }
      throw new MedicalRecordRepositoryError(
        `Repository error during getDoctorStatistics: ${error instanceof Error ? error.message : "Unknown error"}`,
        "REPOSITORY_ERROR"
      );
    }
  }

  /**
   * Advanced search with full-text search and filtering
   */
  async advancedSearch(
    criteria: {
      searchText?: string;
      patientId?: string;
      doctorId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      diagnosisCode?: string;
      medicationCode?: string;
      hasCriticalDiagnoses?: boolean;
      hasActiveMedications?: boolean;
      hasVitalSigns?: boolean;
      fhirCompliant?: boolean;
      includeArchived?: boolean;
      includeDeleted?: boolean;
    },
    options?: {
      page?: number;
      pageSize?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
      useFullTextSearch?: boolean;
      minRelevanceScore?: number;
    }
  ): Promise<{
    records: MedicalRecordAggregate[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    searchMetrics?: {
      searchTime: number;
      indexUsed: boolean;
      relevanceScores?: number[];
    };
  }> {
    const startTime = Date.now();

    try {
      const client = await this.supabaseClient.getConnection();

      // Build base query with optimized joins
      let query = client.from("medical_records").select(
        `
          *,
          diagnoses:medical_record_diagnoses(*),
          medications:medical_record_medications(*),
          access_log:medical_record_access(*)
        `,
        { count: "exact" }
      );

      // Apply filters with proper indexing
      if (criteria.patientId) {
        query = query.eq("patient_id", criteria.patientId);
      }

      if (criteria.doctorId) {
        query = query.eq("doctor_id", criteria.doctorId);
      }

      // Date range with index optimization
      if (criteria.dateFrom) {
        query = query.gte(
          "visit_date",
          criteria.dateFrom.toISOString().split("T")[0]
        );
      }
      if (criteria.dateTo) {
        query = query.lte(
          "visit_date",
          criteria.dateTo.toISOString().split("T")[0]
        );
      }

      // Status filters
      if (!criteria.includeArchived) {
        query = query.neq("status", "archived");
      }
      if (!criteria.includeDeleted) {
        query = query.neq("status", "deleted");
      }

      // Full-text search with PostgreSQL FTS
      if (criteria.searchText && options?.useFullTextSearch) {
        const searchVector = criteria.searchText
          .split(" ")
          .map((term) => `'${term}':*`)
          .join(" & ");

        query = query.textSearch("search_vector", searchVector, {
          type: "websearch",
          config: "english",
        });
      } else if (criteria.searchText) {
        // Fallback to ILIKE search
        const searchPattern = `%${criteria.searchText}%`;
        query = query.or(
          `symptoms.ilike.${searchPattern},examination_notes.ilike.${searchPattern},notes.ilike.${searchPattern}`
        );
      }

      // Advanced filters using JSON operations
      if (criteria.diagnosisCode) {
        query = query.contains("diagnoses_json", [
          { code: criteria.diagnosisCode },
        ]);
      }

      if (criteria.medicationCode) {
        query = query.contains("medications_json", [
          { code: criteria.medicationCode },
        ]);
      }

      // Sorting with proper indexes
      const sortBy = options?.sortBy || "visit_date";
      const sortOrder = options?.sortOrder || "desc";
      const sortColumn = this.mapSortField(sortBy);
      query = query.order(sortColumn, { ascending: sortOrder === "asc" });

      // Pagination
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 20;
      const offset = (page - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Advanced search failed: ${error.message}`,
          "ADVANCED_SEARCH_FAILED"
        );
      }

      const records = data.map((record) => this.mapDatabaseToAggregate(record));
      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);
      const searchTime = Date.now() - startTime;

      // Apply post-processing filters for complex criteria
      let filteredRecords = records;

      if (criteria.hasCriticalDiagnoses) {
        filteredRecords = filteredRecords.filter(
          (r) => r.getCriticalDiagnoses().length > 0
        );
      }

      if (criteria.hasActiveMedications) {
        filteredRecords = filteredRecords.filter(
          (r) => r.getActiveMedications().length > 0
        );
      }

      if (criteria.hasVitalSigns) {
        filteredRecords = filteredRecords.filter((r) => r.hasVitalSigns());
      }

      if (criteria.fhirCompliant !== undefined) {
        filteredRecords = filteredRecords.filter(
          (r) => r.isFHIRCompliant() === criteria.fhirCompliant
        );
      }

      return {
        records: filteredRecords,
        totalCount: filteredRecords.length,
        page,
        pageSize,
        totalPages: Math.ceil(filteredRecords.length / pageSize),
        hasNextPage: page < Math.ceil(filteredRecords.length / pageSize),
        hasPreviousPage: page > 1,
        searchMetrics: {
          searchTime,
          indexUsed: !!criteria.searchText && !!options?.useFullTextSearch,
          relevanceScores: filteredRecords.map(() => Math.random()), // Placeholder for relevance scoring
        },
      };
    } catch (error) {
      if (error instanceof MedicalRecordRepositoryError) {
        throw error;
      }
      throw new MedicalRecordRepositoryError(
        `Repository error during advanced search: ${error instanceof Error ? error.message : "Unknown error"}`,
        "REPOSITORY_ERROR"
      );
    }
  }

  /**
   * Get medical records with FHIR export data
   */
  async findWithFHIRData(recordIds: string[]): Promise<
    Array<{
      record: MedicalRecordAggregate;
      fhirData: any;
      fhirValid: boolean;
    }>
  > {
    try {
      const records = await Promise.all(
        recordIds.map((id) => this.findByStringId(id))
      );

      return records
        .filter((record) => record !== null)
        .map((record) => ({
          record: record!,
          fhirData: record!.toFHIR(),
          fhirValid: record!.isFHIRCompliant(),
        }));
    } catch (error) {
      throw new MedicalRecordRepositoryError(
        `Failed to find records with FHIR data: ${error instanceof Error ? error.message : "Unknown error"}`,
        "FIND_WITH_FHIR_FAILED"
      );
    }
  }

  /**
   * Bulk update medical records
   */
  async bulkUpdate(
    updates: Array<{
      recordId: string;
      updates: Partial<{
        status: MedicalRecordStatus;
        notes: string;
        updatedBy: string;
      }>;
    }>
  ): Promise<void> {
    try {
      const client = await this.supabaseClient.getConnection();

      // Prepare bulk update data
      const bulkData = updates.map((update) => ({
        record_id: update.recordId,
        ...update.updates,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await client
        .from("medical_records")
        .upsert(bulkData, { onConflict: "record_id" });

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Bulk update failed: ${error.message}`,
          "BULK_UPDATE_FAILED"
        );
      }
    } catch (error) {
      if (error instanceof MedicalRecordRepositoryError) {
        throw error;
      }
      throw new MedicalRecordRepositoryError(
        `Repository error during bulk update: ${error instanceof Error ? error.message : "Unknown error"}`,
        "REPOSITORY_ERROR"
      );
    }
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(
    dateFrom: Date,
    dateTo: Date
  ): Promise<{
    totalRecords: number;
    recordsPerDay: Array<{ date: string; count: number }>;
    topDiagnoses: Array<{ code: string; display: string; count: number }>;
    topMedications: Array<{ code: string; name: string; count: number }>;
    doctorStatistics: Array<{
      doctorId: string;
      recordCount: number;
      avgRecordsPerDay: number;
    }>;
    patientStatistics: Array<{
      patientId: string;
      recordCount: number;
      lastVisit: Date;
    }>;
    fhirComplianceRate: number;
    avgRecordCompleteness: number;
  }> {
    try {
      const client = await this.supabaseClient.getConnection();

      // Get all records in date range
      const { data: records, error } = await client
        .from("medical_records")
        .select("*")
        .gte("visit_date", dateFrom.toISOString().split("T")[0])
        .lte("visit_date", dateTo.toISOString().split("T")[0])
        .neq("status", "deleted");

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Failed to get performance analytics: ${error.message}`,
          "ANALYTICS_FAILED"
        );
      }

      const aggregates = records.map((r) => this.mapDatabaseToAggregate(r));

      // Calculate analytics
      const totalRecords = aggregates.length;

      // Records per day
      const recordsByDate = new Map<string, number>();
      aggregates.forEach((record) => {
        const dateKey = record.visitDate.toISOString().split("T")[0];
        recordsByDate.set(dateKey, (recordsByDate.get(dateKey) || 0) + 1);
      });

      const recordsPerDay = Array.from(recordsByDate.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Top diagnoses
      const diagnosisCount = new Map<
        string,
        { display: string; count: number }
      >();
      aggregates.forEach((record) => {
        record.diagnoses.forEach((diagnosis) => {
          const existing = diagnosisCount.get(diagnosis.code) || {
            display: diagnosis.display,
            count: 0,
          };
          diagnosisCount.set(diagnosis.code, {
            ...existing,
            count: existing.count + 1,
          });
        });
      });

      const topDiagnoses = Array.from(diagnosisCount.entries())
        .map(([code, { display, count }]) => ({ code, display, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Top medications
      const medicationCount = new Map<
        string,
        { name: string; count: number }
      >();
      aggregates.forEach((record) => {
        record.medications.forEach((medication) => {
          const existing = medicationCount.get(medication.code) || {
            name: medication.name,
            count: 0,
          };
          medicationCount.set(medication.code, {
            ...existing,
            count: existing.count + 1,
          });
        });
      });

      const topMedications = Array.from(medicationCount.entries())
        .map(([code, { name, count }]) => ({ code, name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Doctor statistics
      const doctorStats = new Map<
        string,
        { recordCount: number; dates: Set<string> }
      >();
      aggregates.forEach((record) => {
        const existing = doctorStats.get(record.doctorId) || {
          recordCount: 0,
          dates: new Set(),
        };
        existing.recordCount++;
        existing.dates.add(record.visitDate.toISOString().split("T")[0]);
        doctorStats.set(record.doctorId, existing);
      });

      const doctorStatistics = Array.from(doctorStats.entries())
        .map(([doctorId, { recordCount, dates }]) => ({
          doctorId,
          recordCount,
          avgRecordsPerDay: recordCount / dates.size,
        }))
        .sort((a, b) => b.recordCount - a.recordCount);

      // Patient statistics
      const patientStats = new Map<
        string,
        { recordCount: number; lastVisit: Date }
      >();
      aggregates.forEach((record) => {
        const existing = patientStats.get(record.patientId);
        if (!existing || record.visitDate > existing.lastVisit) {
          patientStats.set(record.patientId, {
            recordCount: (existing?.recordCount || 0) + 1,
            lastVisit: record.visitDate,
          });
        } else {
          existing.recordCount++;
        }
      });

      const patientStatistics = Array.from(patientStats.entries())
        .map(([patientId, { recordCount, lastVisit }]) => ({
          patientId,
          recordCount,
          lastVisit,
        }))
        .sort((a, b) => b.recordCount - a.recordCount);

      // FHIR compliance rate
      const fhirCompliantCount = aggregates.filter((r) =>
        r.isFHIRCompliant()
      ).length;
      const fhirComplianceRate =
        totalRecords > 0 ? fhirCompliantCount / totalRecords : 0;

      // Average record completeness
      const completenessScores = aggregates.map((record) => {
        let score = 0;
        if (record.symptoms) score += 0.2;
        if (record.examinationNotes) score += 0.2;
        if (record.diagnoses.length > 0) score += 0.3;
        if (record.medications.length > 0) score += 0.2;
        if (record.hasVitalSigns()) score += 0.1;
        return score;
      });

      const avgRecordCompleteness =
        completenessScores.length > 0
          ? completenessScores.reduce((sum, score) => sum + score, 0) /
            completenessScores.length
          : 0;

      return {
        totalRecords,
        recordsPerDay,
        topDiagnoses,
        topMedications,
        doctorStatistics,
        patientStatistics,
        fhirComplianceRate,
        avgRecordCompleteness,
      };
    } catch (error) {
      if (error instanceof MedicalRecordRepositoryError) {
        throw error;
      }
      throw new MedicalRecordRepositoryError(
        `Repository error during analytics: ${error instanceof Error ? error.message : "Unknown error"}`,
        "REPOSITORY_ERROR"
      );
    }
  }

  /**
   * Map aggregate to database format with enhanced data
   */
  private mapAggregateToDatabase(aggregate: MedicalRecordAggregate): any {
    return {
      record_id: aggregate.recordId.value,
      patient_id: aggregate.patientId,
      doctor_id: aggregate.doctorId,
      appointment_id: aggregate.appointmentId,
      visit_date: aggregate.visitDate.toISOString().split("T")[0],
      symptoms: aggregate.symptoms,
      examination_notes: aggregate.examinationNotes,
      diagnosis: aggregate.diagnosis,
      treatment: aggregate.treatment,
      medications: aggregate.medications,
      notes: aggregate.notes,
      vital_signs: aggregate.vitalSigns
        ? {
            temperature: aggregate.vitalSigns.temperature,
            bloodPressure: aggregate.vitalSigns.bloodPressure,
            heartRate: aggregate.vitalSigns.heartRate,
            weight: aggregate.vitalSigns.weight,
            height: aggregate.vitalSigns.height,
          }
        : {},
      // Enhanced fields for better querying
      diagnoses_json: aggregate.diagnoses.map((d) => ({
        code: d.code,
        display: d.display,
        category: d.category,
        severity: d.severity,
        status: d.status,
        isPrimary: d.isPrimary(),
        isCritical: d.isCritical(),
      })),
      medications_json: aggregate.medications.map((m) => ({
        code: m.code,
        name: m.name,
        genericName: m.genericName,
        isActive: m.isActive(),
        isHighPriority: m.isHighPriority(),
      })),
      fhir_resource_id: aggregate.fhirResourceId,
      fhir_compliant: aggregate.isFHIRCompliant(),
      specialty_code: aggregate.specialtyCode,
      has_vital_signs: aggregate.hasVitalSigns(),
      has_complete_vital_signs: aggregate.hasCompleteVitalSigns(),
      critical_diagnoses_count: aggregate.getCriticalDiagnoses().length,
      active_medications_count: aggregate.getActiveMedications().length,
      // Search vector for full-text search
      search_vector: this.generateSearchVector(aggregate),
      status: aggregate.status,
      created_at: aggregate.createdAt.toISOString(),
      updated_at: aggregate.updatedAt.toISOString(),
      created_by: aggregate.createdBy,
      updated_by: aggregate.updatedBy,
    };
  }

  /**
   * Generate search vector for full-text search
   */
  private generateSearchVector(aggregate: MedicalRecordAggregate): string {
    const searchableText: string[] = [];

    if (aggregate.symptoms) searchableText.push(aggregate.symptoms);
    if (aggregate.examinationNotes)
      searchableText.push(aggregate.examinationNotes);
    if (aggregate.notes) searchableText.push(aggregate.notes);

    // Add diagnosis information
    aggregate.diagnoses.forEach((d) => {
      searchableText.push(d.display);
      searchableText.push(d.code);
    });

    // Add medication information
    aggregate.medications.forEach((m) => {
      searchableText.push(m.name);
      searchableText.push(m.code);
      if (m.genericName) searchableText.push(m.genericName);
    });

    return searchableText.join(" ");
  }

  /**
   * Map database record to aggregate
   */
  private mapDatabaseToAggregate(dbRecord: any): MedicalRecordAggregate {
    const recordId = RecordId.create(dbRecord.record_id);

    let vitalSigns: BasicVitalSigns | undefined;
    if (dbRecord.vital_signs && Object.keys(dbRecord.vital_signs).length > 0) {
      vitalSigns = BasicVitalSigns.create(dbRecord.vital_signs);
    }

    // Parse diagnoses from JSON
    let diagnoses: Diagnosis[] = [];
    if (dbRecord.diagnoses_json) {
      try {
        const diagnosesData = typeof dbRecord.diagnoses_json === 'string' 
          ? JSON.parse(dbRecord.diagnoses_json)
          : dbRecord.diagnoses_json;
        
        diagnoses = diagnosesData.map((d: any) => Diagnosis.create(
          d.code,
          d.display,
          d.category,
          d.severity,
          d.status,
          d.recorded_by || dbRecord.created_by
        ));
      } catch (e) {
        diagnoses = [];
      }
    }

    // Parse medications from JSON  
    let medications: Medication[] = [];
    if (dbRecord.medications_json) {
      try {
        const medicationsData = typeof dbRecord.medications_json === 'string'
          ? JSON.parse(dbRecord.medications_json)
          : dbRecord.medications_json;
        
        medications = medicationsData.map((m: any) => Medication.create(
          m.code,
          m.name,
          m.strength,
          m.dosage_form,
          m.route,
          m.dosage,
          m.frequency,
          m.frequency_unit,
          m.instructions,
          m.prescribed_by || dbRecord.created_by
        ));
      } catch (e) {
        medications = [];
      }
    }

    return MedicalRecordAggregate.reconstitute({
      recordId,
      patientId: dbRecord.patient_id,
      doctorId: dbRecord.doctor_id,
      appointmentId: dbRecord.appointment_id,
      visitDate: new Date(dbRecord.visit_date),
      symptoms: dbRecord.symptoms,
      examinationNotes: dbRecord.examination_notes,
      diagnosis: dbRecord.diagnosis,
      treatment: dbRecord.treatment,
      medicationsLegacy: dbRecord.medications,
      notes: dbRecord.notes,
      vitalSigns,
      diagnoses,
      medications,
      fhirResourceId: dbRecord.fhir_resource_id,
      fhirVersion: dbRecord.fhir_version,
      fhirProfile: dbRecord.fhir_profile,
      vietnameseMedicalCode: dbRecord.vietnamese_medical_code,
      specialtyCode: dbRecord.specialty_code,
      hospitalCode: dbRecord.hospital_code,
      status: dbRecord.status,
      createdAt: new Date(dbRecord.created_at),
      updatedAt: new Date(dbRecord.updated_at),
      createdBy: dbRecord.created_by,
      updatedBy: dbRecord.updated_by,
      accessLog: dbRecord.access_log_json ? JSON.parse(dbRecord.access_log_json) : [],
      lastAccessedAt: dbRecord.last_accessed_at ? new Date(dbRecord.last_accessed_at) : undefined,
      lastAccessedBy: dbRecord.last_accessed_by
    });
  }

  /**
   * Map sort field to database column
   */
  private mapSortField(sortBy: string): string {
    const mapping: Record<string, string> = {
      visitDate: "visit_date",
      createdAt: "created_at",
      updatedAt: "updated_at",
      recordId: "record_id",
    };
    return mapping[sortBy] || "visit_date";
  }

  /**
   * Get next sequence number for record ID generation
   */
  async getNextSequenceNumber(yearMonth: string): Promise<number> {
    try {
      const client = await this.supabaseClient.getConnection();

      // Get the highest sequence number for the given year-month
      const { data, error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .select('record_id')
        .like('record_id', `MR-${yearMonth}-%`)
        .order('record_id', { ascending: false })
        .limit(1);

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Lỗi lấy sequence number: ${error.message}`,
          "SEQUENCE_ERROR"
        );
      }

      if (!data || data.length === 0) {
        return 1; // First record for this year-month
      }

      // Extract sequence number from record ID (format: MR-YYYYMM-XXX)
      const lastRecordId = data[0].record_id;
      const sequencePart = lastRecordId.split('-')[2];
      const lastSequence = parseInt(sequencePart, 10);

      return lastSequence + 1;

    } catch (error) {
      this.logger.error('Error getting next sequence number', {
        yearMonth,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new MedicalRecordRepositoryError(
        `Lỗi tạo sequence number: ${error instanceof Error ? error.message : 'Unknown error'}`,
        "SEQUENCE_ERROR"
      );
    }
  }

  /**
   * Update existing medical record
   */
  private async updateRecord(medicalRecord: MedicalRecordAggregate): Promise<void> {
    try {
      this.logger.info('Updating medical record', {
        recordId: medicalRecord.recordId.value
      });

      const client = await this.supabaseClient.getConnection();
      const dbRecord = this.toPersistence(medicalRecord);

      const { error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .update(dbRecord)
        .eq('record_id', medicalRecord.recordId.value);

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Lỗi cập nhật hồ sơ bệnh án: ${error.message}`,
          "UPDATE_FAILED"
        );
      }

      // HIPAA audit logging
      await this.auditService.logMedicalRecordAccess(
        'UPDATE',
        medicalRecord.recordId.value,
        'SYSTEM',
        'Medical record updated',
        {
          patientId: medicalRecord.patientId,
          doctorId: medicalRecord.doctorId
        }
      );

    } catch (error) {
      this.logger.error('Error updating medical record', {
        recordId: medicalRecord.recordId.value,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new MedicalRecordRepositoryError(
        `Lỗi cập nhật hồ sơ bệnh án: ${error instanceof Error ? error.message : 'Unknown error'}`,
        "UPDATE_ERROR"
      );
    }
  }

  /**
   * Convert domain aggregate to persistence format
   */
  private toPersistence(medicalRecord: MedicalRecordAggregate): any {
    return {
      id: medicalRecord.id,
      record_id: medicalRecord.recordId.value,
      patient_id: medicalRecord.patientId,
      doctor_id: medicalRecord.doctorId,
      appointment_id: medicalRecord.appointmentId,
      visit_date: medicalRecord.visitDate.toISOString(),
      symptoms: medicalRecord.symptoms,
      examination_notes: medicalRecord.examinationNotes,
      diagnosis: medicalRecord.diagnosis,
      treatment: medicalRecord.treatment,
      medications: medicalRecord.medicationsLegacy,
      notes: medicalRecord.notes,

      // Enhanced fields
      diagnoses_json: JSON.stringify(medicalRecord.diagnoses.map(d => d.toPersistence())),
      medications_json: JSON.stringify(medicalRecord.medications.map(m => m.toPersistence())),
      vital_signs_json: medicalRecord.vitalSigns ? JSON.stringify(medicalRecord.vitalSigns.toPersistence()) : null,

      // FHIR fields
      fhir_resource_id: medicalRecord.fhirResourceId,
      fhir_version: medicalRecord.fhirVersion || '4.0.1',
      fhir_profile: medicalRecord.fhirProfile,

      // Vietnamese healthcare fields
      vietnamese_medical_code: medicalRecord.vietnameseMedicalCode,
      specialty_code: medicalRecord.specialtyCode,
      hospital_code: medicalRecord.hospitalCode,

      // Status and audit
      status: medicalRecord.status,
      created_at: medicalRecord.createdAt.toISOString(),
      updated_at: medicalRecord.updatedAt.toISOString(),
      created_by: medicalRecord.createdBy,
      updated_by: medicalRecord.updatedBy,

      // Access log
      access_log_json: medicalRecord.accessLog ? JSON.stringify(medicalRecord.accessLog) : null,
      last_accessed_at: medicalRecord.lastAccessedAt?.toISOString(),
      last_accessed_by: medicalRecord.lastAccessedBy,

      version: medicalRecord.version || 0
    };
  }

  /**
   * Find recent medical records
   */
  async findRecent(
    limit: number = 20,
    status?: MedicalRecordStatus
  ): Promise<MedicalRecordAggregate[]> {
    try {
      const client = await this.supabaseClient.getConnection();

      let query = client
        .schema(this.schema)
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Failed to find recent records: ${error.message}`,
          'FIND_RECENT_FAILED'
        );
      }

      return data.map(record => this.mapDatabaseToAggregate(record));
    } catch (error) {
      throw new MedicalRecordRepositoryError(
        `Repository error during findRecent: ${error instanceof Error ? error.message : 'Unknown'}`,
        'REPOSITORY_ERROR'
      );
    }
  }

  /**
   * Bulk save medical records
   */
  async bulkSave(medicalRecords: MedicalRecordAggregate[]): Promise<void> {
    try {
      const client = await this.supabaseClient.getConnection();

      const records = medicalRecords.map(mr => this.toPersistence(mr));

      const { error } = await client
        .schema(this.schema)
        .from(this.tableName)
        .upsert(records, { onConflict: 'record_id' });

      if (error) {
        throw new MedicalRecordRepositoryError(
          `Bulk save failed: ${error.message}`,
          'BULK_SAVE_FAILED'
        );
      }
    } catch (error) {
      throw new MedicalRecordRepositoryError(
        `Repository error during bulkSave: ${error instanceof Error ? error.message : 'Unknown'}`,
        'REPOSITORY_ERROR'
      );
    }
  }
}
