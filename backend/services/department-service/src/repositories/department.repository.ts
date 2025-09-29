import { supabaseAdmin } from '../config/database.config';
import { 
  Department, 
  CreateDepartmentRequest, 
  UpdateDepartmentRequest,
  DepartmentWithDetails,
  DepartmentSearchFilters,
  DepartmentStats
} from '../types/department.types';

export class DepartmentRepository {
  
  // Get all departments with optional filters and pagination
  async findAll(filters: DepartmentSearchFilters = {}, page = 1, limit = 20): Promise<{
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

      // Apply pagination
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch departments: ${error.message}`);
      }

      const totalPages = Math.ceil((count || 0) / limit);

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
        .from('doctors')
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
        room_count: roomCount || 0
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
      const updatedData = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('departments')
        .update(updatedData)
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

  // Soft delete department
  async delete(departmentId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('departments')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('department_id', departmentId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return false; // Not found
        }
        throw new Error(`Failed to delete department: ${error.message}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get department statistics
  async getStats(): Promise<DepartmentStats> {
    try {
      // Get department counts
      const { count: totalDepartments } = await supabaseAdmin
        .from('departments')
        .select('*', { count: 'exact', head: true });

      const { count: activeDepartments } = await supabaseAdmin
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: departmentsWithHead } = await supabaseAdmin
        .from('departments')
        .select('*', { count: 'exact', head: true })
        .not('head_doctor_id', 'is', null);

      // Get doctor and room counts
      const { count: totalDoctors } = await supabaseAdmin
        .from('doctors')
        .select('*', { count: 'exact', head: true });

      const { count: totalRooms } = await supabaseAdmin
        .from('rooms')
        .select('*', { count: 'exact', head: true });

      const averageDoctorsPerDepartment = activeDepartments ? 
        Math.round((totalDoctors || 0) / activeDepartments * 100) / 100 : 0;

      return {
        total_departments: totalDepartments || 0,
        active_departments: activeDepartments || 0,
        departments_with_head: departmentsWithHead || 0,
        departments_without_head: (activeDepartments || 0) - (departmentsWithHead || 0),
        total_doctors: totalDoctors || 0,
        total_rooms: totalRooms || 0,
        average_doctors_per_department: averageDoctorsPerDepartment
      };
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get sub-departments
  async getSubDepartments(parentDepartmentId: string): Promise<Department[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('departments')
        .select('*')
        .eq('parent_department_id', parentDepartmentId)
        .eq('is_active', true);

      if (error) {
        throw new Error(`Failed to fetch sub-departments: ${error.message}`);
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
        .from('doctors')
        .select(`
          doctor_id,
          full_name,
          specialty,
          qualification,
          license_number,
          is_active
        `)
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
        .select(`
          room_id,
          room_number,
          room_type,
          capacity,
          status,
          location,
          is_active
        `)
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

  // Get department hierarchy tree
  async getDepartmentTree(): Promise<any[]> {
    try {
      // Get all departments (don't filter by level since it might be null)
      const { data, error } = await supabaseAdmin
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('department_name', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch department tree: ${error.message}`);
      }

      // Build hierarchy
      const departments = data || [];
      const tree = this.buildDepartmentTree(departments);
      return tree;
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get children of a department (temporarily disabled - column doesn't exist)
  async getChildDepartments(parentId: string): Promise<Department[]> {
    try {
      // TODO: Enable when parent_department_id column is added
      // const { data, error } = await supabaseAdmin
      //   .from('departments')
      //   .select('*')
      //   .eq('parent_department_id', parentId)
      //   .eq('is_active', true)
      //   .order('department_name', { ascending: true });

      // For now, return empty array
      return [];
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get department path (breadcrumb)
  async getDepartmentPath(departmentId: string): Promise<Department[]> {
    try {
      const department = await this.findById(departmentId);
      if (!department) {
        return [];
      }

      const path: Department[] = [department];
      let currentDept = department;

      // Traverse up the hierarchy
      while (currentDept.parent_department_id) {
        const parent = await this.findById(currentDept.parent_department_id);
        if (parent) {
          path.unshift(parent);
          currentDept = parent;
        } else {
          break;
        }
      }

      return path;
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Build tree structure from flat array
  private buildDepartmentTree(departments: Department[]): any[] {
    const departmentMap = new Map();
    const tree: any[] = [];

    // Create map for quick lookup
    departments.forEach(dept => {
      departmentMap.set(dept.department_id, {
        ...dept,
        children: []
      });
    });

    // Build tree
    departments.forEach(dept => {
      const deptNode = departmentMap.get(dept.department_id);

      if (dept.parent_department_id) {
        const parent = departmentMap.get(dept.parent_department_id);
        if (parent) {
          parent.children.push(deptNode);
        }
      } else {
        tree.push(deptNode);
      }
    });

    return tree;
  }

  // Generate department ID (updated for sub-departments)
  private async generateDepartmentId(parentId?: string): Promise<string> {
    try {
      if (parentId) {
        // Generate sub-department ID
        const { data, error } = await supabaseAdmin
          .from('departments')
          .select('department_id')
          .like('department_id', `${parentId}-%`)
          .order('department_id', { ascending: false })
          .limit(1);

        if (error) {
          throw new Error(`Failed to generate sub-department ID: ${error.message}`);
        }

        let nextNumber = 1;
        if (data && data.length > 0) {
          const lastId = data[0].department_id;
          const parts = lastId.split('-');
          const lastNumber = parseInt(parts[parts.length - 1]);
          nextNumber = lastNumber + 1;
        }

        return `${parentId}-${nextNumber.toString().padStart(2, '0')}`;
      } else {
        // Generate main department ID
        const { data, error } = await supabaseAdmin
          .from('departments')
          .select('department_id')
          .like('department_id', 'DEPT%')
          .not('department_id', 'like', '%-%') // Exclude sub-departments
          .order('department_id', { ascending: false })
          .limit(1);

        if (error) {
          throw new Error(`Failed to generate department ID: ${error.message}`);
        }

        let nextNumber = 1;
        if (data && data.length > 0) {
          const lastId = data[0].department_id;
          const lastNumber = parseInt(lastId.replace('DEPT', ''));
          nextNumber = lastNumber + 1;
        }

        return `DEPT${nextNumber.toString().padStart(3, '0')}`;
      }
    } catch (error) {
      throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
