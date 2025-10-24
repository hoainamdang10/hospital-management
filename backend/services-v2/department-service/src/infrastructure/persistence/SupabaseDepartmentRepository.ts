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
import { IDepartmentRepository } from '../../domain/repositories/IDepartmentRepository';

export class SupabaseDepartmentRepository implements IDepartmentRepository {
  private supabase: SupabaseClient;
  private readonly schema = 'departments_schema';

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async findById(id: string): Promise<Department | null> {
    try {
      const { data, error } = await this.supabase
        .schema(this.schema)
        .from('departments')
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
        .from('departments')
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
        .from('departments')
        .select('*');

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query.order('department_name_en', { ascending: true });

      if (error) {
        console.error('[SupabaseDepartmentRepository] Error finding all:', error.message);
        return [];
      }

      return data ? data.map(record => this.toDomain(record)) : [];
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
        .from('departments')
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
      // Soft delete - set is_active = false
      const { error } = await this.supabase
        .schema(this.schema)
        .from('departments')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
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
        .from('departments')
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

  /**
   * Convert database record to domain entity
   */
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
      updatedBy: record.updated_by
    };

    return new Department(record.id, props);
  }

  /**
   * Convert domain entity to database record
   */
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
      updated_by: department.props.updatedBy
    };
  }
}

