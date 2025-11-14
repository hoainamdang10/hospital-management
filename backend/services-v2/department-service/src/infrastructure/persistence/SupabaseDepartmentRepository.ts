/**
 * Supabase Department Repository - Infrastructure Layer
 * Implementation of IDepartmentRepository using Supabase
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Repository Pattern
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Department, DepartmentProps } from '../../domain/entities/Department';
import { DepartmentStaffAssignment, IDepartmentRepository } from '../../domain/repositories/IDepartmentRepository';

export class SupabaseDepartmentRepository implements IDepartmentRepository {
  private readonly supabase: SupabaseClient;
  private readonly schema = 'departments_schema';
  private readonly departmentsTable = 'departments';
  private readonly assignmentsTable = 'department_staff_assignments';

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async findById(id: string): Promise<Department | null> {
    try {
      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.departmentsTable)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[SupabaseDepartmentRepository] Error finding by ID:', error.message);
        return null;
      }

      return data ? this.toDomain(data) : null;
    } catch (error: any) {
      console.error('[SupabaseDepartmentRepository] Exception in findById:', error.message);
      return null;
    }
  }

  async findByCode(code: string): Promise<Department | null> {
    try {
      const { data, error } = await this.supabase
        .schema(this.schema)
        .from(this.departmentsTable)
        .select('*')
        .eq('department_code', code.toUpperCase())
        .single();

      if (error) {
        console.error('[SupabaseDepartmentRepository] Error finding by code:', error.message);
        return null;
      }

      return data ? this.toDomain(data) : null;
    } catch (error: any) {
      console.error('[SupabaseDepartmentRepository] Exception in findByCode:', error.message);
      return null;
    }
  }

  async findAll(activeOnly: boolean = true): Promise<Department[]> {
    try {
      let query = this.supabase
        .schema(this.schema)
        .from(this.departmentsTable)
        .select('*');

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query.order('department_name_en', { ascending: true });

      if (error) {
        console.error('[SupabaseDepartmentRepository] Error finding all:', error.message);
        return [];
      }

      return data ? data.map((record) => this.toDomain(record)) : [];
    } catch (error: any) {
      console.error('[SupabaseDepartmentRepository] Exception in findAll:', error.message);
      return [];
    }
  }

  async save(department: Department): Promise<void> {
    try {
      const record = this.toPersistence(department);

      const { error } = await this.supabase
        .schema(this.schema)
        .from(this.departmentsTable)
        .upsert(record, { onConflict: 'id' });

      if (error) {
        throw new Error(`Failed to save department: ${error.message}`);
      }
    } catch (error: any) {
      console.error('[SupabaseDepartmentRepository] Error saving department:', error.message);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .schema(this.schema)
        .from(this.departmentsTable)
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete department: ${error.message}`);
      }
    } catch (error: any) {
      console.error('[SupabaseDepartmentRepository] Error deleting department:', error.message);
      throw error;
    }
  }

  async count(activeOnly: boolean = true): Promise<number> {
    try {
      let query = this.supabase
        .schema(this.schema)
        .from(this.departmentsTable)
        .select('*', { count: 'exact', head: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { count, error } = await query;

      if (error) {
        console.error('[SupabaseDepartmentRepository] Error counting:', error.message);
        return 0;
      }

      return count || 0;
    } catch (error: any) {
      console.error('[SupabaseDepartmentRepository] Exception in count:', error.message);
      return 0;
    }
  }

  async findByStaffId(staffId: string, options?: { includeInactive?: boolean }): Promise<DepartmentStaffAssignment[]> {
    try {
      let query = this.supabase
        .schema(this.schema)
        .from(this.assignmentsTable)
        .select('is_active, staff_id, department:departments (*)')
        .eq('staff_id', staffId);

      if (!options?.includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[SupabaseDepartmentRepository] Error finding by staff:', error.message);
        return [];
      }

      if (!data) {
        return [];
      }

      return data
        .filter((row: any) => row.department)
        .map((row: any) => ({
          department: this.toDomain(row.department),
          isActive: row.is_active,
          staffId: row.staff_id,
        }));
    } catch (error: any) {
      console.error('[SupabaseDepartmentRepository] Exception in findByStaffId:', error.message);
      return [];
    }
  }

  async updateStaffCount(id: string, staffCount: number): Promise<void> {
    await this.updateCounts(id, { staff_count: staffCount });
  }

  async updateActiveStaffCount(id: string, activeStaffCount: number): Promise<void> {
    await this.updateCounts(id, { active_staff_count: activeStaffCount });
  }

  async assignStaffToDepartment(
    staffId: string,
    departmentId: string,
    metadata?: { staffName?: string; assignmentType?: string; assignedBy?: string }
  ): Promise<void> {
    const { error } = await this.supabase
      .schema(this.schema)
      .from(this.assignmentsTable)
      .upsert({
        department_id: departmentId,
        staff_id: staffId,
        staff_name: metadata?.staffName,
        assignment_type: metadata?.assignmentType,
        assigned_by: metadata?.assignedBy,
        is_active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'department_id,staff_id' });

    if (error) {
      throw new Error(`Failed to assign staff to department: ${error.message}`);
    }
  }

  async removeStaffFromDepartment(staffId: string, departmentId: string): Promise<void> {
    const { error } = await this.supabase
      .schema(this.schema)
      .from(this.assignmentsTable)
      .update({
        is_active: false,
        last_status: 'removed',
        updated_at: new Date().toISOString(),
      })
      .eq('staff_id', staffId)
      .eq('department_id', departmentId);

    if (error) {
      throw new Error(`Failed to remove staff from department: ${error.message}`);
    }
  }

  async setStaffAssignmentsActive(staffId: string, isActive: boolean): Promise<void> {
    const { error } = await this.supabase
      .schema(this.schema)
      .from(this.assignmentsTable)
      .update({
        is_active: isActive,
        last_status: isActive ? 'active' : 'inactive',
        updated_at: new Date().toISOString(),
      })
      .eq('staff_id', staffId);

    if (error) {
      throw new Error(`Failed to update staff assignment status: ${error.message}`);
    }
  }

  private async updateCounts(id: string, values: Record<string, number>): Promise<void> {
    const { error } = await this.supabase
      .schema(this.schema)
      .from(this.departmentsTable)
      .update({
        ...values,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update department counts: ${error.message}`);
    }
  }

  private toDomain(record: any): Department {
    const props: DepartmentProps = {
      departmentCode: record.department_code,
      departmentNameEn: record.department_name_en,
      departmentNameVi: record.department_name_vi,
      description: record.description,
      phone: record.phone,
      email: record.email,
      location: record.location,
      isActive: record.is_active,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      createdBy: record.created_by,
      updatedBy: record.updated_by,
      headOfDepartmentId: record.head_of_department_id,
      headOfDepartmentName: record.head_of_department_name,
      headOfDepartmentEmail: record.head_of_department_email,
      staffCount: record.staff_count ?? 0,
      activeStaffCount: record.active_staff_count ?? record.staff_count ?? 0,
    };

    return new Department(record.id, props);
  }

  private toPersistence(department: Department): any {
    return {
      id: department.id,
      department_code: department.code,
      department_name_en: department.nameEn,
      department_name_vi: department.nameVi,
      description: department.description,
      phone: department.phone,
      email: department.email,
      location: department.location,
      is_active: department.isActive,
      created_at: department.createdAt.toISOString(),
      updated_at: department.updatedAt.toISOString(),
      created_by: department.props.createdBy,
      updated_by: department.props.updatedBy,
      head_of_department_id: department.props.headOfDepartmentId,
      head_of_department_name: department.props.headOfDepartmentName,
      head_of_department_email: department.props.headOfDepartmentEmail,
      staff_count: department.staffCount,
      active_staff_count: department.activeStaffCount,
    };
  }
}

