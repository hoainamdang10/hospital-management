/**
 * SupabaseProviderStaffRepository - Infrastructure Repository
 * V2 Clean Architecture + DDD Implementation
 * Provider Staff repository with Vietnamese healthcare compliance and HIPAA audit logging
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { IProviderStaffRepository } from '../../domain/repositories/IProviderStaffRepository';
import { ProviderStaff } from '../../domain/aggregates/ProviderStaff';
import { StaffId } from '../../domain/value-objects/StaffId';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ILogger } from '../../application/interfaces/ILogger';
import { IAuditService } from '../../application/interfaces/IAuditService';
import { CircuitBreakerFactory } from '../resilience/CircuitBreaker';

/**
 * Supabase Provider Staff Repository
 * Handles all provider staff data persistence with Vietnamese healthcare compliance
 * Uses Circuit Breaker pattern for resilience
 */
export class SupabaseProviderStaffRepository implements IProviderStaffRepository {
  private readonly supabaseClient: SupabaseClient;
  private readonly logger: ILogger;
  private readonly auditService: IAuditService;
  private readonly schema: string;
  private readonly tableName: string;
  private readonly fullTableName: string;
  private readonly circuitBreaker = CircuitBreakerFactory.getBreaker('staff-repository');

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    logger: ILogger,
    auditService: IAuditService,
    schema: string = 'provider_schema',
    tableName: string = 'provider_staff'
  ) {
    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      db: { schema },
      global: { headers: { 'X-Client-Info': 'provider-staff-service' } }
    }) as any;

    this.logger = logger;
    this.auditService = auditService;
    this.schema = schema;
    this.tableName = tableName;
    this.fullTableName = `${this.schema}.${this.tableName}`;
  }

  /**
   * Find staff by ID
   */
  async findById(staffId: StaffId): Promise<ProviderStaff | null> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Finding staff by ID', {
            staffId: staffId.value,
            repository: 'SupabaseProviderStaffRepository'
          });

          const { data, error } = await this.supabaseClient
            .from(this.fullTableName)
            .select('*')
            .eq('id', staffId.value)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              // No rows returned
              this.logger.info('Staff not found', { staffId: staffId.value });
              return null;
            }
            throw new Error(`Lỗi truy vấn cơ sở dữ liệu: ${error.message}`);
          }

          if (!data) {
            return null;
          }

          // HIPAA audit logging
          await this.auditService.logDataAccess({
            action: 'STAFF_READ',
            resourceType: 'provider_staff',
            resourceId: staffId.value,
            userId: 'system',
            timestamp: new Date(),
            details: {
              operation: 'findById',
              dataAccessed: 'staff_profile',
              complianceLevel: 'hipaa'
            }
          });

          const staff = ProviderStaff.fromPersistence(data);

          this.logger.info('Staff found successfully', {
            staffId: staffId.value,
            staffType: staff.staffType,
            isActive: staff.isActive
          });

          return staff;

        } catch (error) {
          this.logger.error('Error finding staff by ID', {
            staffId: staffId.value,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn('Circuit breaker fallback for findById', { staffId: staffId.value });
        return null;
      }
    );
  }

  /**
   * Find staff by user ID
   */
  async findByUserId(userId: string): Promise<ProviderStaff | null> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Finding staff by user ID', {
            userId,
            repository: 'SupabaseProviderStaffRepository'
          });

          const { data, error } = await this.supabaseClient
            .from(this.fullTableName)
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              // No rows returned
              this.logger.info('Staff not found for user', { userId });
              return null;
            }
            throw new Error(`Lỗi truy vấn cơ sở dữ liệu: ${error.message}`);
          }

          if (!data) {
            return null;
          }

          // HIPAA audit logging
          await this.auditService.logDataAccess({
            action: 'STAFF_READ',
            resourceType: 'provider_staff',
            resourceId: data.id,
            userId: 'system',
            timestamp: new Date(),
            details: {
              operation: 'findByUserId',
              searchUserId: userId,
              dataAccessed: 'staff_profile',
              complianceLevel: 'hipaa'
            }
          });

          const staff = ProviderStaff.fromPersistence(data);

          this.logger.info('Staff found by user ID', {
            userId,
            staffId: staff.id.value,
            staffType: staff.staffType
          });

          return staff;

        } catch (error) {
          this.logger.error('Error finding staff by user ID', {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn('Circuit breaker fallback for findByUserId', { userId });
        return null;
      }
    );
  }

  /**
   * Find staff by license number
   */
  async findByLicenseNumber(licenseNumber: string): Promise<ProviderStaff | null> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Finding staff by license number', {
            licenseNumber: this.maskLicenseNumber(licenseNumber),
            repository: 'SupabaseProviderStaffRepository'
          });

          const { data, error } = await this.supabaseClient
            .from(this.fullTableName)
            .select('*')
            .eq('license_number', licenseNumber)
            .single();

          if (error) {
            if (error.code === 'PGRST116') {
              // No rows returned
              this.logger.info('Staff not found for license number', {
                licenseNumber: this.maskLicenseNumber(licenseNumber)
              });
              return null;
            }
            throw new Error(`Lỗi truy vấn cơ sở dữ liệu: ${error.message}`);
          }

          if (!data) {
            return null;
          }

          // HIPAA audit logging
          await this.auditService.logDataAccess({
            action: 'STAFF_READ',
            resourceType: 'provider_staff',
            resourceId: data.id,
            userId: 'system',
            timestamp: new Date(),
            details: {
              operation: 'findByLicenseNumber',
              searchCriteria: 'license_number',
              dataAccessed: 'staff_profile',
              complianceLevel: 'hipaa'
            }
          });

          const staff = ProviderStaff.fromPersistence(data);

          this.logger.info('Staff found by license number', {
            licenseNumber: this.maskLicenseNumber(licenseNumber),
            staffId: staff.id.value,
            staffType: staff.staffType
          });

          return staff;

        } catch (error) {
          this.logger.error('Error finding staff by license number', {
            licenseNumber: this.maskLicenseNumber(licenseNumber),
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn('Circuit breaker fallback for findByLicenseNumber', {
          licenseNumber: this.maskLicenseNumber(licenseNumber)
        });
        return null;
      }
    );
  }

  /**
   * Save staff (create or update)
   */
  async save(staff: ProviderStaff): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Saving staff', {
            staffId: staff.id.value,
            staffType: staff.staffType,
            isActive: staff.isActive,
            repository: 'SupabaseProviderStaffRepository'
          });

          // Convert to persistence format
          const persistenceData = staff.toPersistence();

          // Check if staff exists
          const existingStaff = await this.findById(staff.id);
          const isUpdate = !!existingStaff;

          let result;
          if (isUpdate) {
            // Update existing staff
            const { data, error } = await this.supabaseClient
              .from(this.fullTableName)
              .update(persistenceData)
              .eq('id', staff.id.value)
              .select()
              .single();

            if (error) {
              throw new Error(`Lỗi cập nhật nhân viên: ${error.message}`);
            }
            result = data;
          } else {
            // Create new staff
            const { data, error } = await this.supabaseClient
              .from(this.fullTableName)
              .insert(persistenceData)
              .select()
              .single();

            if (error) {
              throw new Error(`Lỗi tạo nhân viên: ${error.message}`);
            }
            result = data;
          }

          // HIPAA audit logging
          await this.auditService.logDataAccess({
            action: isUpdate ? 'STAFF_UPDATE' : 'STAFF_CREATE',
            resourceType: 'provider_staff',
            resourceId: staff.id.value,
            userId: 'system',
            timestamp: new Date(),
            details: {
              operation: isUpdate ? 'update' : 'create',
              staffType: staff.staffType,
              dataModified: 'staff_profile',
              complianceLevel: 'hipaa',
              vietnameseHealthcareCompliant: staff.isVietnameseHealthcareCompliant(),
              hipaaCompliant: staff.isHIPAACompliant()
            }
          });

          this.logger.info('Staff saved successfully', {
            staffId: staff.id.value,
            operation: isUpdate ? 'update' : 'create',
            staffType: staff.staffType,
            isActive: staff.isActive
          });

        } catch (error) {
          this.logger.error('Error saving staff', {
            staffId: staff.id.value,
            staffType: staff.staffType,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      },
      async () => {
        this.logger.error('Circuit breaker fallback for save - operation failed', {
          staffId: staff.id.value
        });
        throw new Error('Unable to save staff - service temporarily unavailable');
      }
    );
  }

  /**
   * Delete staff (soft delete)
   */
  async delete(staffId: StaffId): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Deleting staff', {
            staffId: staffId.value,
            repository: 'SupabaseProviderStaffRepository'
          });

          // Soft delete by setting is_active to false
          const { error } = await this.supabaseClient
            .from(this.fullTableName)
            .update({
              is_active: false,
              status: 'terminated',
              updated_at: new Date().toISOString()
            })
            .eq('id', staffId.value);

          if (error) {
            throw new Error(`Lỗi xóa nhân viên: ${error.message}`);
          }

          // HIPAA audit logging
          await this.auditService.logDataAccess({
            action: 'STAFF_DELETE',
            resourceType: 'provider_staff',
            resourceId: staffId.value,
            userId: 'system',
            timestamp: new Date(),
            details: {
              operation: 'soft_delete',
              dataModified: 'staff_status',
              complianceLevel: 'hipaa'
            }
          });

          this.logger.info('Staff deleted successfully', {
            staffId: staffId.value
          });

        } catch (error) {
          this.logger.error('Error deleting staff', {
            staffId: staffId.value,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      },
      async () => {
        this.logger.error('Circuit breaker fallback for delete - operation failed', {
          staffId: staffId.value
        });
        throw new Error('Unable to delete staff - service temporarily unavailable');
      }
    );
  }

  /**
   * Find all staff with filters
   */
  async findAll(filters?: any): Promise<ProviderStaff[]> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Finding all staff', {
            filters,
            repository: 'SupabaseProviderStaffRepository'
          });

          let query = this.supabaseClient.from(this.fullTableName).select('*');

          // Apply filters
          if (filters) {
            if (filters.staffType) {
              query = query.eq('staff_type', filters.staffType);
            }
            if (filters.status) {
              query = query.eq('status', filters.status);
            }
            if (filters.isActive !== undefined) {
              query = query.eq('is_active', filters.isActive);
            }
            if (filters.departmentId) {
              // This would require a join with department assignments
              // For now, we'll skip this filter
            }
          }

          const { data, error } = await query;

          if (error) {
            throw new Error(`Lỗi truy vấn danh sách nhân viên: ${error.message}`);
          }

          const staff = (data || []).map(item => ProviderStaff.fromPersistence(item));

          // HIPAA audit logging
          await this.auditService.logDataAccess({
            action: 'STAFF_LIST',
            resourceType: 'provider_staff',
            resourceId: 'multiple',
            userId: 'system',
            timestamp: new Date(),
            details: {
              operation: 'findAll',
              resultCount: staff.length,
              filters: filters || {},
              dataAccessed: 'staff_list',
              complianceLevel: 'hipaa'
            }
          });

          this.logger.info('Staff list retrieved', {
            count: staff.length,
            filters
          });

          return staff;

        } catch (error) {
          this.logger.error('Error finding all staff', {
            filters,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn('Circuit breaker fallback for findAll', { filters });
        return [];
      }
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
            .select('*', { count: 'exact', head: true });

          if (error) {
            this.logger.error('Repository health check failed', {
              error: error.message,
              repository: 'SupabaseProviderStaffRepository'
            });
            return false;
          }

          this.logger.info('Repository health check passed', {
            recordCount: count,
            repository: 'SupabaseProviderStaffRepository'
          });

          return true;

        } catch (error) {
          this.logger.error('Repository health check error', {
            error: error instanceof Error ? error.message : 'Unknown error',
            repository: 'SupabaseProviderStaffRepository'
          });
          return false;
        }
      },
      async () => {
        this.logger.warn('Circuit breaker fallback for isHealthy');
        return false;
      }
    );
  }

  /**
   * Find staff by department
   */
  async findByDepartment(departmentId: string): Promise<ProviderStaff[]> {
    try {
      this.logger.info('Finding staff by department', {
        departmentId,
        repository: 'SupabaseProviderStaffRepository'
      });

      // TODO: Implement when department_assignments table is ready
      // For now, return empty array
      this.logger.warn('findByDepartment not fully implemented - requires department_assignments table');
      return [];

    } catch (error) {
      this.logger.error('Error finding staff by department', {
        departmentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Find staff by specialization
   */
  async findBySpecialization(specializationCode: string): Promise<ProviderStaff[]> {
    try {
      this.logger.info('Finding staff by specialization', {
        specializationCode,
        repository: 'SupabaseProviderStaffRepository'
      });

      // TODO: Implement when specializations are stored in separate table
      // For now, return empty array
      this.logger.warn('findBySpecialization not fully implemented - requires specializations table');
      return [];

    } catch (error) {
      this.logger.error('Error finding staff by specialization', {
        specializationCode,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Find available staff for scheduling
   */
  async findAvailableStaff(filters: {
    staffType?: string;
    departmentId?: string;
    date?: Date;
    timeSlot?: string;
  }): Promise<ProviderStaff[]> {
    return await this.circuitBreaker.execute(
      async () => {
        try {
          this.logger.info('Finding available staff', {
            filters,
            repository: 'SupabaseProviderStaffRepository'
          });

          // TODO: Implement when availability/schedule tables are ready
          // For now, return active staff of specified type
          const query = this.supabaseClient
            .from(this.fullTableName)
            .select('*')
            .eq('is_active', true)
            .eq('is_accepting_new_patients', true);

          if (filters.staffType) {
            query.eq('staff_type', filters.staffType);
          }

          const { data, error } = await query;

          if (error) {
            throw new Error(`Lỗi truy vấn nhân viên khả dụng: ${error.message}`);
          }

          const staff = (data || []).map(item => ProviderStaff.fromPersistence(item));

          this.logger.info('Available staff found', {
            count: staff.length,
            filters
          });

          return staff;

        } catch (error) {
          this.logger.error('Error finding available staff', {
            filters,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn('Circuit breaker fallback for findAvailableStaff', { filters });
        return [];
      }
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
      this.logger.error('Error checking staff existence', {
        staffId: staffId.value,
        error: error instanceof Error ? error.message : 'Unknown error'
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
          this.logger.info('Counting staff', {
            filters,
            repository: 'SupabaseProviderStaffRepository'
          });

          let query = this.supabaseClient
            .from(this.fullTableName)
            .select('*', { count: 'exact', head: true });

          if (filters) {
            if (filters.staffType) {
              query = query.eq('staff_type', filters.staffType);
            }
            if (filters.status) {
              query = query.eq('status', filters.status);
            }
            if (filters.isActive !== undefined) {
              query = query.eq('is_active', filters.isActive);
            }
          }

          const { count, error } = await query;

          if (error) {
            throw new Error(`Lỗi đếm nhân viên: ${error.message}`);
          }

          this.logger.info('Staff counted', {
            count: count || 0,
            filters
          });

          return count || 0;

        } catch (error) {
          this.logger.error('Error counting staff', {
            filters,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn('Circuit breaker fallback for count', { filters });
        return 0;
      }
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
            .select('*', { count: 'exact', head: true });

          const { count: activeCount } = await this.supabaseClient
            .from(this.fullTableName)
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

          return {
            total: totalCount || 0,
            active: activeCount || 0,
            inactive: (totalCount || 0) - (activeCount || 0),
            repository: 'SupabaseProviderStaffRepository',
            lastUpdated: new Date().toISOString()
          };

        } catch (error) {
          this.logger.error('Error getting repository statistics', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          throw error;
        }
      },
      async () => {
        this.logger.warn('Circuit breaker fallback for getStatistics');
        return {
          total: 0,
          active: 0,
          inactive: 0,
          repository: 'SupabaseProviderStaffRepository',
          lastUpdated: new Date().toISOString(),
          fallback: true
        };
      }
    );
  }

  /**
   * Mask license number for logging
   */
  private maskLicenseNumber(licenseNumber: string): string {
    if (licenseNumber.length <= 4) return '***';
    return licenseNumber.substring(0, 4) + '*'.repeat(licenseNumber.length - 4);
  }
}
