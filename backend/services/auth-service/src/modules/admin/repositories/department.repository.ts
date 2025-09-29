import { supabaseAdmin } from '../../../config/supabase';
import { 
  Department, 
  CreateDepartmentRequest, 
  UpdateDepartmentRequest,
  DepartmentWithDetails,
  DepartmentFilters,
  DepartmentStats,
  PaginationParams
} from '../types/admin.types';

export class DepartmentRepository {
  
  // Get all departments with optional filters and pagination
  async findAll(filters: DepartmentFilters = {}, pagination: PaginationParams): Promise<{
    departments: DepartmentWithDetails[];
    total: number;
    totalPages: number;
  }> {
    try {
      let query = supabaseAdmin
        .from('departments')
        .select('*');

      // Apply filters
      if (filters.search) {
        query = query.or(`department_name.ilike.%${filters.search}%,department_code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters.parent_department_id) {
        query = query.eq('parent_department_id', filters.parent_department_id);
      }

      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters.head_doctor_id) {
        query = query.eq('head_doctor_id', filters.head_doctor_id);
      }

      // Get total count
      const { count } = await supabaseAdmin
        .from('departments')
        .select('*', { count: 'exact', head: true });

      // Apply sorting
      query = query.order(pagination.sort_by, { ascending: pagination.sort_order === 'asc' });

      // Apply pagination
      const offset = (pagination.page - 1) * pagination.limit;
      query = query.range(offset, offset + pagination.limit - 1);

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch departments: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / pagination.limit);

      return {
        departments: data || [],
        total: count || 0,
        totalPages
      };
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get department by ID with details
  async findById(departmentId: string): Promise<DepartmentWithDetails | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('departments')
        .select('*')
        .eq('department_id', departmentId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to fetch department: ${error.message}`);
      }

      // Get sub-departments
      const { data: subDepartments } = await supabaseAdmin
        .from('departments')
        .select('*')
        .eq('parent_department_id', departmentId);

      // Get doctor count
      const { count: doctorCount } = await supabaseAdmin
        .from('doctor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', departmentId);

      // Get room count
      const { count: roomCount } = await supabaseAdmin
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('department_id', departmentId);

      return {
        ...data,
        sub_departments: subDepartments || [],
        doctor_count: doctorCount || 0,
        room_count: roomCount || 0,
        total_sub_departments: subDepartments?.length || 0
      };
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get department statistics
  async getStats(): Promise<DepartmentStats> {
    try {
      // Get total departments
      const { count: totalDepartments } = await supabaseAdmin
        .from('departments')
        .select('*', { count: 'exact', head: true });

      // Get active departments
      const { count: activeDepartments } = await supabaseAdmin
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get departments with head doctors
      const { count: departmentsWithHead } = await supabaseAdmin
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .not('head_doctor_id', 'is', null);

      // Get total doctors
      const { count: totalDoctors } = await supabaseAdmin
        .from('doctor_profiles')
        .select('*', { count: 'exact', head: true });

      // Get total rooms
      const { count: totalRooms } = await supabaseAdmin
        .from('rooms')
        .select('*', { count: 'exact', head: true });

      const departmentsWithoutHead = (totalDepartments || 0) - (departmentsWithHead || 0);
      const averageDoctorsPerDepartment = totalDepartments ? (totalDoctors || 0) / totalDepartments : 0;

      return {
        total_departments: totalDepartments || 0,
        active_departments: activeDepartments || 0,
        departments_with_head: departmentsWithHead || 0,
        departments_without_head: departmentsWithoutHead,
        total_doctors: totalDoctors || 0,
        total_rooms: totalRooms || 0,
        average_doctors_per_department: Math.round(averageDoctorsPerDepartment * 100) / 100
      };
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Create new department
  async create(departmentData: CreateDepartmentRequest): Promise<Department> {
    try {
      // Generate department ID based on parent
      const departmentId = await this.generateDepartmentId(departmentData.parent_department_id);

      // Calculate level and path
      let level = 1;
      let path = `/${departmentId}`;

      if (departmentData.parent_department_id) {
        const parent = await this.findById(departmentData.parent_department_id);
        if (parent) {
          level = (parent.level || 1) + 1;
          path = `${parent.path || '/' + parent.department_id}/${departmentId}`;
        }
      }

      const newDepartment = {
        department_id: departmentId,
        ...departmentData,
        level,
        path,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('departments')
        .insert(newDepartment)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create department: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update department
  async update(departmentId: string, updateData: UpdateDepartmentRequest): Promise<Department | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('departments')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('department_id', departmentId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Not found
        }
        throw new Error(`Failed to update department: ${error.message}`);
      }

      return data;
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete department (soft delete)
  async delete(departmentId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('departments')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('department_id', departmentId);

      if (error) {
        throw new Error(`Failed to delete department: ${error.message}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get department tree structure
  async getDepartmentTree(): Promise<DepartmentWithDetails[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('department_name', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch department tree: ${error.message}`);
      }

      const departments = data || [];
      const tree = this.buildDepartmentTree(departments);
      return tree;
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get child departments
  async getChildDepartments(parentId: string): Promise<Department[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('departments')
        .select('*')
        .eq('parent_department_id', parentId)
        .eq('is_active', true)
        .order('department_name', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch child departments: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get doctors in department
  async getDepartmentDoctors(departmentId: string): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('doctor_profiles')
        .select('doctor_id, full_name, specialty, is_active')
        .eq('department_id', departmentId)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to fetch department doctors: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get rooms in department
  async getDepartmentRooms(departmentId: string): Promise<any[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('rooms')
        .select('*')
        .eq('department_id', departmentId)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to fetch department rooms: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to generate department ID
  private async generateDepartmentId(parentId?: string): Promise<string> {
    try {
      const { data, error } = await supabaseAdmin
        .from('departments')
        .select('department_id')
        .order('department_id', { ascending: false })
        .limit(1);

      if (error) {
        throw new Error(`Failed to generate department ID: ${error.message}`);
      }

      const lastId = data?.[0]?.department_id;
      if (!lastId) {
        return 'DEPT001';
      }

      const numericPart = parseInt(lastId.replace('DEPT', ''));
      const nextNumber = numericPart + 1;
      return `DEPT${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to build department tree
  private buildDepartmentTree(departments: Department[]): DepartmentWithDetails[] {
    const departmentMap = new Map<string, DepartmentWithDetails>();
    const rootDepartments: DepartmentWithDetails[] = [];

    // Create map of all departments
    departments.forEach(dept => {
      departmentMap.set(dept.department_id, { ...dept, children: [] });
    });

    // Build tree structure
    departments.forEach(dept => {
      const department = departmentMap.get(dept.department_id)!;
      
      if (dept.parent_department_id) {
        const parent = departmentMap.get(dept.parent_department_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(department);
        }
      } else {
        rootDepartments.push(department);
      }
    });

    return rootDepartments;
  }
}
