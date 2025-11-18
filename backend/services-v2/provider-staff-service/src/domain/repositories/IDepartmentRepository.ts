/**
 * Department Repository Interface - Domain Layer
 * Simple CRUD operations for Department entity
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Repository Pattern
 */

import { Department } from '../entities/Department';

export interface DepartmentStaffAssignment {
  department: Department;
  isActive: boolean;
  staffId: string;
}

export interface IDepartmentRepository {
  /**
   * Find department by ID
   */
  findById(id: string): Promise<Department | null>;

  /**
   * Find department by code (CARD, ORTH, PEDI, etc.)
   */
  findByCode(code: string): Promise<Department | null>;

  /**
   * Find all departments
   * @param activeOnly - If true, return only active departments
   */
  findAll(activeOnly?: boolean): Promise<Department[]>;

  /**
   * Find departments by staff assignment
   */
  findByStaffId(staffId: string, options?: { includeInactive?: boolean }): Promise<DepartmentStaffAssignment[]>;

  /**
   * Save department (insert or update)
   */
  save(department: Department): Promise<void>;

  /**
   * Delete department (soft delete - set is_active = false)
   */
  delete(id: string): Promise<void>;

  /**
   * Count total departments
   */
  count(activeOnly?: boolean): Promise<number>;

  /**
   * Update stored staff count for analytics
   */
  updateStaffCount(id: string, staffCount: number): Promise<void>;

  /**
   * Update active staff count (e.g., when staff status changes)
   */
  updateActiveStaffCount(id: string, activeStaffCount: number): Promise<void>;

  /**
   * Assign staff to department (persist mapping)
   */
  assignStaffToDepartment(
    staffId: string,
    departmentId: string,
    metadata?: { staffName?: string; assignmentType?: string; assignedBy?: string }
  ): Promise<void>;

  /**
   * Remove staff from specific department assignment
   */
  removeStaffFromDepartment(staffId: string, departmentId: string): Promise<void>;

  /**
   * Toggle active flag for all assignments of a staff member
   */
  setStaffAssignmentsActive(staffId: string, isActive: boolean): Promise<void>;
}

