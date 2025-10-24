/**
 * Department Repository Interface - Domain Layer
 * Simple CRUD operations for Department entity
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Repository Pattern
 */

import { Department } from '../entities/Department';

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
}

