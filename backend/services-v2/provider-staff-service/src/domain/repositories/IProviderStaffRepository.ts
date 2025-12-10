/**
 * IProviderStaffRepository - Domain Repository Interface
 * V2 Clean Architecture + DDD Implementation
 * Repository interface for Provider Staff aggregate
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { ProviderStaff } from "../aggregates/ProviderStaff";
import { StaffId } from "../value-objects/StaffId";

/**
 * Provider Staff Repository Interface
 * Defines contract for staff data persistence
 */
export interface IProviderStaffRepository {
  /**
   * Find staff by ID
   */
  findById(staffId: StaffId): Promise<ProviderStaff | null>;

  /**
   * Find staff by user ID
   */
  findByUserId(userId: string): Promise<ProviderStaff | null>;

  /**
   * Find staff by license number
   */
  findByLicenseNumber(licenseNumber: string): Promise<ProviderStaff | null>;

  /**
   * Find all staff with optional filters
   */
  findAll(filters?: {
    staffType?: string;
    status?: string;
    isActive?: boolean;
    departmentId?: string;
  }): Promise<ProviderStaff[]>;

  /**
   * Find staff by department
   */
  findByDepartment(departmentId: string): Promise<ProviderStaff[]>;

  /**
   * Find available staff by type and department
   * NOTE: Runtime availability (date/time filtering) belongs to Appointments Service
   * This method only filters by static properties (staffType, departmentId)
   */
  findAvailableStaff(filters: {
    staffType?: string;
    departmentId?: string;
    // REMOVED: date, timeSlot - Belongs to Scheduling/Appointment Service
  }): Promise<ProviderStaff[]>;

  /**
   * Save staff (create or update)
   */
  save(staff: ProviderStaff): Promise<void>;

  /**
   * Update existing staff
   */
  update(staff: ProviderStaff): Promise<void>;

  /**
   * Delete staff (soft delete)
   */
  delete(staffId: StaffId): Promise<void>;

  /**
   * Hard delete staff (permanent delete from database)
   * Use with caution - this action cannot be undone
   * Will fail if staff has associated appointments
   */
  hardDelete(staffId: StaffId): Promise<void>;

  /**
   * Hard delete staff profile by linked Identity user ID
   * Used when Identity Service performs a permanent account deletion
   */
  hardDeleteByUserId(
    userId: string,
    options?: { deletedBy?: string; reason?: string },
  ): Promise<{ deleted: boolean; staffId?: string }>;

  /**
   * Check if staff exists
   */
  exists(staffId: StaffId): Promise<boolean>;

  /**
   * Count staff with filters
   */
  count(filters?: {
    staffType?: string;
    status?: string;
    isActive?: boolean;
  }): Promise<number>;

  /**
   * Get repository statistics
   */
  getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byType?: Record<string, number>;
    byStatus?: Record<string, number>;
  }>;
}
