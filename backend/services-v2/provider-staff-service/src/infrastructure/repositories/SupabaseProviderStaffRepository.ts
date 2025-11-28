/**
 * SupabaseProviderStaffRepository - Infrastructure Repository
 * V2 Clean Architecture + DDD Implementation
 * Provider Staff repository with Vietnamese healthcare compliance and HIPAA audit logging
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { IProviderStaffRepository } from "../../domain/repositories/IProviderStaffRepository";
import { ProviderStaff } from "../../domain/aggregates/ProviderStaff";
import { StaffId } from "../../domain/value-objects/StaffId";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ILogger } from "../../application/interfaces/ILogger";
import { IAuditService } from "../../application/interfaces/IAuditService";
import { CircuitBreakerFactory } from "../resilience/CircuitBreaker";
import { OutboxService } from "../outbox/OutboxService";

/**
 * Supabase Provider Staff Repository
 * Handles all provider staff data persistence with Vietnamese healthcare compliance
 * Uses Circuit Breaker pattern for resilience
 */
export class SupabaseProviderStaffRepository
  implements IProviderStaffRepository
{
  private readonly supabaseClient: SupabaseClient;
  private readonly logger: ILogger;
  private readonly auditService: IAuditService;
  private readonly tableName: string;
  private readonly fullTableName: string;
  private readonly outboxService?: OutboxService;
  private readonly circuitBreaker =
    CircuitBreakerFactory.getBreaker("staff-repository");

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    logger: ILogger,
    auditService: IAuditService,
    schema: string = "provider_schema",
    tableName: string = "staff_profiles",
    outboxService?: OutboxService,
  ) {
    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema },
      global: { headers: { "X-Client-Info": "provider-staff-service" } },
    }) as any;

    this.logger = logger;
    this.auditService = auditService;
    this.tableName = tableName;
    // Don't prefix schema - Supabase client already configured with schema
    this.fullTableName = this.tableName;
    this.outboxService = outboxService;
  }

  /**
   * Find staff by ID (business identifier - staff_id)
   * Note: staffId parameter is the business identifier (e.g., 'DOC-CARD-202501-001')
   * Database column: staff_id (VARCHAR, UNIQUE)
   */
  async findById(staffId: StaffId): Promise<ProviderStaff | null> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info("Finding staff by business ID", {
            staffId: staffId.value,
            repository: "SupabaseProviderStaffRepository",
          });

          const { data, error } = await this.supabaseClient
            .from(this.fullTableName)
            .select("*")
            .eq("staff_id", staffId.value)
            .single();

          if (error) {
            if (error.code === "PGRST116") {
              // No rows returned
              this.logger.info("Staff not found", { staffId: staffId.value });
              return null;
            }
            throw new Error(`Lỗi truy vấn cơ sở dữ liệu: ${error.message}`);
          }

          if (!data) {
            return null;
          }

          // HIPAA audit logging
          await this.auditService.logDataAccess({
            action: "STAFF_READ",
            resourceType: "provider_staff",
            resourceId: data.id,
            userId: "system",
            timestamp: new Date(),
            details: {
              operation: "findById",
              dataAccessed: "staff_profile",
              complianceLevel: "hipaa",
            },
          });

          const staff = ProviderStaff.fromPersistenceData(data);

          this.logger.info("Staff found successfully", {
            staffId: staffId.value,
            staffType: staff.staffType,
            isActive: staff.isActive,
          });

          return staff;
        } catch (error) {
          this.logger.error("Error finding staff by business ID", {
            staffId: staffId.value,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn("Circuit breaker fallback for findById", {
          staffId: staffId.value,
        });
        return null;
      },
    );
  }

  /**
   * Find staff by user ID
   */
  async findByUserId(userId: string): Promise<ProviderStaff | null> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info("Finding staff by user ID", {
            userId,
            repository: "SupabaseProviderStaffRepository",
          });

          const { data, error } = await this.supabaseClient
            .from(this.fullTableName)
            .select("*")
            .eq("user_id", userId)
            .single();

          if (error) {
            if (error.code === "PGRST116") {
              // No rows returned
              this.logger.info("Staff not found for user", { userId });
              return null;
            }
            throw new Error(`Lỗi truy vấn cơ sở dữ liệu: ${error.message}`);
          }

          if (!data) {
            return null;
          }

          // HIPAA audit logging
          await this.auditService.logDataAccess({
            action: "STAFF_READ",
            resourceType: "provider_staff",
            resourceId: data.id,
            userId: "system",
            timestamp: new Date(),
            details: {
              operation: "findByUserId",
              searchUserId: userId,
              dataAccessed: "staff_profile",
              complianceLevel: "hipaa",
            },
          });

          const staff = ProviderStaff.fromPersistenceData(data);

          this.logger.info("Staff found by user ID", {
            userId,
            staffId: staff.id,
            staffType: staff.staffType,
          });

          return staff;
        } catch (error) {
          this.logger.error("Error finding staff by user ID", {
            userId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn("Circuit breaker fallback for findByUserId", {
          userId,
        });
        return null;
      },
    );
  }

  /**
   * Find staff by license or registration number
   * Accepts professional license, MOH registration, or Vietnamese healthcare license
   */
  async findByLicenseNumber(
    licenseNumber: string,
  ): Promise<ProviderStaff | null> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          const normalizedLicense = (licenseNumber || "").trim();
          if (!normalizedLicense) {
            throw new Error("Số giấy phép hành nghề không được để trống");
          }

          const maskedIdentifier = this.maskLicenseNumber(normalizedLicense);

          this.logger.info("Finding staff by license/registration identifier", {
            licenseNumber: maskedIdentifier,
            repository: "SupabaseProviderStaffRepository",
          });

          const searchTargets = [
            { column: "license_number", description: "professional_license" },
            {
              column: "moh_registration_number",
              description: "moh_registration",
            },
            {
              column: "vietnamese_healthcare_license",
              description: "healthcare_license",
            },
          ] as const;

          let matchedRecord: any | null = null;
          let matchedColumn: string | null = null;

          for (const target of searchTargets) {
            const record = await this.fetchStaffRecordByIdentifier(
              target.column,
              normalizedLicense,
            );

            if (record) {
              matchedRecord = record;
              matchedColumn = target.description;
              break;
            }
          }

          if (!matchedRecord) {
            this.logger.info(
              "Staff not found for license/registration identifier",
              {
                licenseNumber: maskedIdentifier,
              },
            );
            return null;
          }

          // HIPAA audit logging
          await this.auditService.logDataAccess({
            action: "STAFF_READ",
            resourceType: "provider_staff",
            resourceId: matchedRecord.id,
            userId: "system",
            timestamp: new Date(),
            details: {
              operation: "findByLicenseNumber",
              searchCriteria: matchedColumn,
              dataAccessed: "staff_profile",
              complianceLevel: "hipaa",
            },
          });

          const staff = ProviderStaff.fromPersistenceData(matchedRecord);

          this.logger.info("Staff found by license/registration identifier", {
            licenseNumber: maskedIdentifier,
            matchType: matchedColumn,
            staffId: staff.id,
            staffType: staff.staffType,
          });

          return staff;
        } catch (error) {
          this.logger.error("Error finding staff by license number", {
            licenseNumber: this.maskLicenseNumber(licenseNumber),
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn("Circuit breaker fallback for findByLicenseNumber", {
          licenseNumber: this.maskLicenseNumber(licenseNumber),
        });
        return null;
      },
    );
  }

  /**
   * Save staff (create or update)
   */
  async save(staff: ProviderStaff): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info("Saving staff", {
            staffId: staff.id,
            staffType: staff.staffType,
            isActive: staff.isActive,
            repository: "SupabaseProviderStaffRepository",
          });

          // Convert to persistence format
          const persistenceData = staff.toPersistence();

          // Check if staff exists
          const staffId = staff.staffId;
          const existingStaff = await this.findById(staffId);
          const isUpdate = !!existingStaff;
          if (isUpdate) {
            // Update existing staff by business identifier (staff_id)
            const { error } = await this.supabaseClient
              .from(this.fullTableName)
              .update(persistenceData)
              .eq("staff_id", staff.staffIdValue)
              .select()
              .single();

            if (error) {
              throw new Error(`Lỗi cập nhật nhân viên: ${error.message}`);
            }
          } else {
            // Create new staff
            const { error } = await this.supabaseClient
              .from(this.fullTableName)
              .insert(persistenceData)
              .select()
              .single();

            if (error) {
              throw new Error(`Lỗi tạo nhân viên: ${error.message}`);
            }
          }

          // HIPAA audit logging
          await this.auditService.logDataAccess({
            action: isUpdate ? "STAFF_UPDATE" : "STAFF_CREATE",
            resourceType: "provider_staff",
            resourceId: persistenceData.id,
            userId: "system",
            timestamp: new Date(),
            details: {
              operation: isUpdate ? "update" : "create",
              staffType: staff.staffType,
              dataModified: "staff_profile",
              complianceLevel: "hipaa",
              vietnameseHealthcareCompliant:
                staff.isVietnameseHealthcareCompliant(),
              hipaaCompliant: staff.isHIPAACompliant(),
            },
          });

          this.logger.info("Staff saved successfully", {
            staffId: staff.staffIdValue,
            operation: isUpdate ? "update" : "create",
            staffType: staff.staffType,
            isActive: staff.isActive,
          });

          await this.persistDomainEvents(staff);
        } catch (error) {
          this.logger.error("Error saving staff", {
            staffId: staff.staffIdValue,
            staffType: staff.staffType,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      },
      async () => {
        this.logger.error(
          "Circuit breaker fallback for save - operation failed",
          {
            staffId: staff.id,
          },
        );
        throw new Error(
          "Unable to save staff - service temporarily unavailable",
        );
      },
    );
  }

  /**
   * Update existing staff
   */
  async update(staff: ProviderStaff): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info("Updating staff", {
            staffId: staff.id,
            staffType: staff.staffType,
            repository: "SupabaseProviderStaffRepository",
          });

          const persistenceData = staff.toPersistence();

          // Use staff_id (business ID) for update, not id (UUID)
          const { error } = await this.supabaseClient
            .from(this.fullTableName)
            .update(persistenceData)
            .eq("staff_id", staff.staffIdValue);

          if (error) {
            throw new Error(`Lỗi cập nhật nhân viên: ${error.message}`);
          }

          await this.auditService.logDataAccess({
            action: "STAFF_UPDATE",
            resourceType: "provider_staff",
            resourceId: staff.staffIdValue,
            userId: "system",
            timestamp: new Date(),
            details: {
              operation: "update",
              staffType: staff.staffType,
              dataModified: "staff_profile",
              complianceLevel: "hipaa",
            },
          });

          this.logger.info("Staff updated successfully", {
            staffId: staff.id,
          });

          await this.persistDomainEvents(staff);
        } catch (error) {
          this.logger.error("Error updating staff", {
            staffId: staff.id,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      },
      async () => {
        this.logger.error("Circuit breaker fallback for update", {
          staffId: staff.id,
        });
        throw new Error(
          "Unable to update staff - service temporarily unavailable",
        );
      },
    );
  }

  /**
   * Delete staff (soft delete)
   */
  async delete(staffId: StaffId): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info("Deleting staff", {
            staffId: staffId.value,
            repository: "SupabaseProviderStaffRepository",
          });

          // Soft delete by setting is_active to false
          const { error } = await this.supabaseClient
            .from(this.fullTableName)
            .update({
              is_active: false,
              status: "terminated",
              updated_at: new Date().toISOString(),
            })
            .eq("staff_id", staffId.value);

          if (error) {
            throw new Error(`Lỗi xóa nhân viên: ${error.message}`);
          }

          // HIPAA audit logging
          await this.auditService.logDataAccess({
            action: "STAFF_DELETE",
            resourceType: "provider_staff",
            resourceId: staffId.value,
            userId: "system",
            timestamp: new Date(),
            details: {
              operation: "soft_delete",
              dataModified: "staff_status",
              complianceLevel: "hipaa",
            },
          });

          this.logger.info("Staff deleted successfully", {
            staffId: staffId.value,
          });
        } catch (error) {
          this.logger.error("Error deleting staff", {
            staffId: staffId.value,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      },
      async () => {
        this.logger.error(
          "Circuit breaker fallback for delete - operation failed",
          {
            staffId: staffId.value,
          },
        );
        throw new Error(
          "Unable to delete staff - service temporarily unavailable",
        );
      },
    );
  }

  /**
   * Find all staff with filters
   */
  async findAll(filters?: any): Promise<ProviderStaff[]> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info("Finding all staff", {
            filters,
            repository: "SupabaseProviderStaffRepository",
          });

          let query = this.supabaseClient.from(this.fullTableName).select("*");

          // Apply filters
          if (filters) {
            if (filters.staffType) {
              query = query.eq("staff_type", filters.staffType);
            }
            if (filters.status) {
              query = query.eq("status", filters.status);
            }
            if (filters.isActive !== undefined) {
              query = query.eq("is_active", filters.isActive);
            }
            if (filters.departmentId) {
              // This would require a join with department assignments
              // For now, we'll skip this filter
            }
          }

          const { data, error } = await query;

          if (error) {
            throw new Error(
              `Lỗi truy vấn danh sách nhân viên: ${error.message}`,
            );
          }

          const staff = (data || []).map((item) =>
            ProviderStaff.fromPersistenceData(item),
          );

          // HIPAA audit logging
          await this.auditService.logDataAccess({
            action: "STAFF_LIST",
            resourceType: "provider_staff",
            resourceId: "multiple",
            userId: "system",
            timestamp: new Date(),
            details: {
              operation: "findAll",
              resultCount: staff.length,
              filters: filters || {},
              dataAccessed: "staff_list",
              complianceLevel: "hipaa",
            },
          });

          this.logger.info("Staff list retrieved", {
            count: staff.length,
            filters,
          });

          return staff;
        } catch (error) {
          this.logger.error("Error finding all staff", {
            filters,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn("Circuit breaker fallback for findAll", { filters });
        return [];
      },
    );
  }

  /**
   * Check if repository is healthy
   */
  async isHealthy(): Promise<boolean> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          // Simple health check - try to count records
          const { count, error } = await this.supabaseClient
            .from(this.fullTableName)
            .select("*", { count: "exact", head: true });

          if (error) {
            this.logger.error("Repository health check failed", {
              error: error.message,
              repository: "SupabaseProviderStaffRepository",
            });
            return false;
          }

          this.logger.info("Repository health check passed", {
            recordCount: count,
            repository: "SupabaseProviderStaffRepository",
          });

          return true;
        } catch (error) {
          this.logger.error("Repository health check error", {
            error: error instanceof Error ? error.message : "Unknown error",
            repository: "SupabaseProviderStaffRepository",
          });
          return false;
        }
      },
      async () => {
        this.logger.warn("Circuit breaker fallback for isHealthy");
        return false;
      },
    );
  }

  /**
   * Find staff by department
   * Uses JSONB containment operator (@>) with GIN index for fast queries
   */
  async findByDepartment(departmentId: string): Promise<ProviderStaff[]> {
    try {
      this.logger.info("Finding staff by department", {
        departmentId,
        repository: "SupabaseProviderStaffRepository",
      });

      // Query using JSONB containment operator with proper JSONB format
      // GIN index on department_assignments enables fast queries
      const { data, error } = await this.supabaseClient
        .from(this.fullTableName)
        .select("*")
        .contains("department_assignments", JSON.stringify([{ departmentId }]));

      if (error) {
        this.logger.error("Supabase query error in findByDepartment", {
          departmentId,
          error: error.message,
          code: error.code,
        });
        throw new Error(`Failed to find staff by department: ${error.message}`);
      }

      if (!data || data.length === 0) {
        this.logger.info("No staff found for department", { departmentId });
        return [];
      }

      this.logger.info("Staff found for department", {
        departmentId,
        count: data.length,
      });

      // Map database records to domain entities
      return data.map((record) => ProviderStaff.fromPersistenceData(record));
    } catch (error) {
      this.logger.error("Error finding staff by department", {
        departmentId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Find staff by specialization
   */
  async findBySpecialization(
    specializationCode: string,
  ): Promise<ProviderStaff[]> {
    try {
      this.logger.info("Finding staff by specialization", {
        specializationCode,
        repository: "SupabaseProviderStaffRepository",
      });

      // Query staff with matching specialization in JSONB array with proper format
      const { data, error } = await this.supabaseClient
        .from(this.fullTableName)
        .select("*")
        .contains(
          "specializations",
          JSON.stringify([{ code: specializationCode }]),
        )
        .eq("is_active", true);

      if (error) {
        this.logger.error("Supabase error finding staff by specialization", {
          error: error.message,
          specializationCode,
        });
        throw new Error(
          `Failed to find staff by specialization: ${error.message}`,
        );
      }

      if (!data || data.length === 0) {
        this.logger.info("No staff found with specialization", {
          specializationCode,
        });
        return [];
      }

      // Map to domain entities
      const staffList = data.map((row) =>
        ProviderStaff.fromPersistenceData(row),
      );

      this.logger.info("Staff found by specialization", {
        specializationCode,
        count: staffList.length,
      });

      return staffList;
    } catch (error) {
      this.logger.error("Error finding staff by specialization", {
        specializationCode,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Find available staff by type and department
   * NOTE: Runtime availability (date/time filtering) belongs to Appointments Service
   */
  async findAvailableStaff(filters: {
    staffType?: string;
    departmentId?: string;
    // REMOVED: date, timeSlot - Belongs to Scheduling/Appointment Service
  }): Promise<ProviderStaff[]> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info("Finding available staff", {
            filters,
            repository: "SupabaseProviderStaffRepository",
          });

          // Query active staff with availability data in JSONB
          let query = this.supabaseClient
            .from(this.fullTableName)
            .select("*")
            .eq("is_active", true);

          if (filters.staffType) {
            query = query.eq("staff_type", filters.staffType);
          }

          if (filters.departmentId) {
            query = query.contains("department_assignments", [
              { departmentId: filters.departmentId },
            ]);
          }

          const { data, error } = await query;

          if (error) {
            throw new Error(
              `Lỗi truy vấn nhân viên khả dụng: ${error.message}`,
            );
          }

          const staff = (data || []).map((item) =>
            ProviderStaff.fromPersistenceData(item),
          );

          // REMOVED: date/time filtering - Belongs to Scheduling/Appointment Service
          // Appointments Service should:
          // 1. Call this method to get staff by type/department
          // 2. Get work schedule templates via StaffScheduleUpdatedEvent
          // 3. Calculate runtime availability = template - booked appointments

          this.logger.info("Available staff found", {
            count: staff.length,
            filters,
          });

          return staff;
        } catch (error) {
          this.logger.error("Error finding available staff", {
            filters,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn("Circuit breaker fallback for findAvailableStaff", {
          filters,
        });
        return [];
      },
    );
  }

  /**
   * Check if staff exists
   */
  async exists(staffId: StaffId): Promise<boolean> {
    try {
      const staff = await this.findById(staffId);
      return staff !== null;
    } catch (error) {
      this.logger.error("Error checking staff existence", {
        staffId: staffId.value,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return false;
    }
  }

  /**
   * Count staff with filters
   */
  async count(filters?: {
    staffType?: string;
    status?: string;
    isActive?: boolean;
  }): Promise<number> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info("Counting staff", {
            filters,
            repository: "SupabaseProviderStaffRepository",
          });

          let query = this.supabaseClient
            .from(this.fullTableName)
            .select("*", { count: "exact", head: true });

          if (filters) {
            if (filters.staffType) {
              query = query.eq("staff_type", filters.staffType);
            }
            if (filters.status) {
              query = query.eq("status", filters.status);
            }
            if (filters.isActive !== undefined) {
              query = query.eq("is_active", filters.isActive);
            }
          }

          const { count, error } = await query;

          if (error) {
            throw new Error(`Lỗi đếm nhân viên: ${error.message}`);
          }

          this.logger.info("Staff counted", {
            count: count || 0,
            filters,
          });

          return count || 0;
        } catch (error) {
          this.logger.error("Error counting staff", {
            filters,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn("Circuit breaker fallback for count", { filters });
        return 0;
      },
    );
  }

  /**
   * Get repository statistics
   */
  async getStatistics(): Promise<any> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          const { count: totalCount } = await this.supabaseClient
            .from(this.fullTableName)
            .select("*", { count: "exact", head: true });

          const { count: activeCount } = await this.supabaseClient
            .from(this.fullTableName)
            .select("*", { count: "exact", head: true })
            .eq("is_active", true);

          return {
            total: totalCount || 0,
            active: activeCount || 0,
            inactive: (totalCount || 0) - (activeCount || 0),
            repository: "SupabaseProviderStaffRepository",
            lastUpdated: new Date().toISOString(),
          };
        } catch (error) {
          this.logger.error("Error getting repository statistics", {
            error: error instanceof Error ? error.message : "Unknown error",
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn("Circuit breaker fallback for getStatistics");
        return {
          total: 0,
          active: 0,
          inactive: 0,
          repository: "SupabaseProviderStaffRepository",
          lastUpdated: new Date().toISOString(),
          fallback: true,
        };
      },
    );
  }

  /**
   * Persist domain events to outbox and mark them as committed
   */
  private async persistDomainEvents(staff: ProviderStaff): Promise<void> {
    const events = staff.getUncommittedEvents();
    if (!events.length) {
      return;
    }

    if (!this.outboxService) {
      this.logger.warn("OutboxService not configured; events not persisted", {
        staffId: staff.staffIdValue,
        eventCount: events.length,
      });
      staff.markEventsAsCommitted();
      return;
    }

    for (const event of events) {
      await this.outboxService.storeEvent(event);
    }

    staff.markEventsAsCommitted();
  }

  /**
   * Mask license number for logging
   */
  private maskLicenseNumber(licenseNumber: string): string {
    if (licenseNumber.length <= 4) return "***";
    return licenseNumber.substring(0, 4) + "*".repeat(licenseNumber.length - 4);
  }

  /**
   * Fetch staff record by identifier column with case-insensitive comparison
   */
  private async fetchStaffRecordByIdentifier(
    column: string,
    value: string,
  ): Promise<any | null> {
    const { data, error } = await this.supabaseClient
      .from(this.fullTableName)
      .select("*")
      .ilike(column, value)
      .limit(1);

    if (error) {
      throw new Error(`Lỗi truy vấn cột ${column}: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0];
  }

  // REMOVED: isTimeSlotAvailable() - Belongs to Scheduling/Appointment Service (bounded context violation)
}
