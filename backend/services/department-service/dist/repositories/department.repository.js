"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentRepository = void 0;
const database_config_1 = require("../config/database.config");
class DepartmentRepository {
    async findAll(filters = {}, page = 1, limit = 20) {
        try {
            let query = database_config_1.supabaseAdmin
                .from('departments')
                .select('*');
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
            const { count } = await database_config_1.supabaseAdmin
                .from('departments')
                .select('*', { count: 'exact', head: true });
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
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async findById(departmentId) {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
                .from('departments')
                .select('*')
                .eq('department_id', departmentId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to fetch department: ${error.message}`);
            }
            const { data: subDepartments } = await database_config_1.supabaseAdmin
                .from('departments')
                .select('*')
                .eq('parent_department_id', departmentId);
            const { count: doctorCount } = await database_config_1.supabaseAdmin
                .from('doctors')
                .select('*', { count: 'exact', head: true })
                .eq('department_id', departmentId);
            const { count: roomCount } = await database_config_1.supabaseAdmin
                .from('rooms')
                .select('*', { count: 'exact', head: true })
                .eq('department_id', departmentId);
            return {
                ...data,
                sub_departments: subDepartments || [],
                doctor_count: doctorCount || 0,
                room_count: roomCount || 0
            };
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async create(departmentData) {
        try {
            const departmentId = await this.generateDepartmentId(departmentData.parent_department_id);
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
            const { data, error } = await database_config_1.supabaseAdmin
                .from('departments')
                .insert(newDepartment)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to create department: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async update(departmentId, updateData) {
        try {
            const updatedData = {
                ...updateData,
                updated_at: new Date().toISOString()
            };
            const { data, error } = await database_config_1.supabaseAdmin
                .from('departments')
                .update(updatedData)
                .eq('department_id', departmentId)
                .select()
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to update department: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async delete(departmentId) {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
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
                    return false;
                }
                throw new Error(`Failed to delete department: ${error.message}`);
            }
            return true;
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getStats() {
        try {
            const { count: totalDepartments } = await database_config_1.supabaseAdmin
                .from('departments')
                .select('*', { count: 'exact', head: true });
            const { count: activeDepartments } = await database_config_1.supabaseAdmin
                .from('departments')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            const { count: departmentsWithHead } = await database_config_1.supabaseAdmin
                .from('departments')
                .select('*', { count: 'exact', head: true })
                .not('head_doctor_id', 'is', null);
            const { count: totalDoctors } = await database_config_1.supabaseAdmin
                .from('doctors')
                .select('*', { count: 'exact', head: true });
            const { count: totalRooms } = await database_config_1.supabaseAdmin
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
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getSubDepartments(parentDepartmentId) {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
                .from('departments')
                .select('*')
                .eq('parent_department_id', parentDepartmentId)
                .eq('is_active', true);
            if (error) {
                throw new Error(`Failed to fetch sub-departments: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getDepartmentDoctors(departmentId) {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
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
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getDepartmentRooms(departmentId) {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
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
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getDepartmentTree() {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
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
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getChildDepartments(parentId) {
        try {
            return [];
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getDepartmentPath(departmentId) {
        try {
            const department = await this.findById(departmentId);
            if (!department) {
                return [];
            }
            const path = [department];
            let currentDept = department;
            while (currentDept.parent_department_id) {
                const parent = await this.findById(currentDept.parent_department_id);
                if (parent) {
                    path.unshift(parent);
                    currentDept = parent;
                }
                else {
                    break;
                }
            }
            return path;
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    buildDepartmentTree(departments) {
        const departmentMap = new Map();
        const tree = [];
        departments.forEach(dept => {
            departmentMap.set(dept.department_id, {
                ...dept,
                children: []
            });
        });
        departments.forEach(dept => {
            const deptNode = departmentMap.get(dept.department_id);
            if (dept.parent_department_id) {
                const parent = departmentMap.get(dept.parent_department_id);
                if (parent) {
                    parent.children.push(deptNode);
                }
            }
            else {
                tree.push(deptNode);
            }
        });
        return tree;
    }
    async generateDepartmentId(parentId) {
        try {
            if (parentId) {
                const { data, error } = await database_config_1.supabaseAdmin
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
            }
            else {
                const { data, error } = await database_config_1.supabaseAdmin
                    .from('departments')
                    .select('department_id')
                    .like('department_id', 'DEPT%')
                    .not('department_id', 'like', '%-%')
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
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.DepartmentRepository = DepartmentRepository;
//# sourceMappingURL=department.repository.js.map