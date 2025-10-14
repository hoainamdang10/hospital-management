/**
 * IProviderStaffRepository - Domain Repository Interface
 * V2 Clean Architecture + DDD Implementation
 * Repository interface for Provider Staff aggregate
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Healthcare Standards, HIPAA
 */

import { ProviderStaff } from '../aggregates/ProviderStaff';
import { StaffId } from '../value-objects/StaffId';

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
    specialization?: string;
  }): Promise<ProviderStaff[]>;

  /**
   * Find staff by department
   */
  findByDepartment(departmentId: string): Promise<ProviderStaff[]>;

  /**
   * Find staff by specialization
   */
  findBySpecialization(specializationCode: string): Promise<ProviderStaff[]>;

  /**
   * Find available staff for scheduling
   */
  findAvailableStaff(filters: {
    staffType?: string;
    departmentId?: string;
    date?: Date;
    timeSlot?: string;
  }): Promise<ProviderStaff[]>;

  /**
   * Save staff (create or update)
   */
  save(staff: ProviderStaff): Promise<void>;

  /**
   * Delete staff (soft delete)
   */
  delete(staffId: StaffId): Promise<void>;

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

