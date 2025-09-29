"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentRepository = void 0;
const supabase_1 = require("../../../config/supabase");
class DepartmentRepository {
    async findAll(filters = {}, pagination) {
        try {
            let query = supabase_1.supabaseAdmin
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
            const { count } = await supabase_1.supabaseAdmin
                .from('departments')
                .select('*', { count: 'exact', head: true });
            query = query.order(pagination.sort_by, { ascending: pagination.sort_order === 'asc' });
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
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async findById(departmentId) {
        try {
            const { data, error } = await supabase_1.supabaseAdmin
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
            const { data: subDepartments } = await supabase_1.supabaseAdmin
                .from('departments')
                .select('*')
                .eq('parent_department_id', departmentId);
            const { count: doctorCount } = await supabase_1.supabaseAdmin
                .from('doctor_profiles')
                .select('*', { count: 'exact', head: true })
                .eq('department_id', departmentId);
            const { count: roomCount } = await supabase_1.supabaseAdmin
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
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getStats() {
        try {
            const { count: totalDepartments } = await supabase_1.supabaseAdmin
                .from('departments')
                .select('*', { count: 'exact', head: true });
            const { count: activeDepartments } = await supabase_1.supabaseAdmin
                .from('departments')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            const { count: departmentsWithHead } = await supabase_1.supabaseAdmin
                .from('departments')
                .select('*', { count: 'exact', head: true })
                .not('head_doctor_id', 'is', null);
            const { count: totalDoctors } = await supabase_1.supabaseAdmin
                .from('doctor_profiles')
                .select('*', { count: 'exact', head: true });
            const { count: totalRooms } = await supabase_1.supabaseAdmin
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
            const { data, error } = await supabase_1.supabaseAdmin
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
            const { data, error } = await supabase_1.supabaseAdmin
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
            const { error } = await supabase_1.supabaseAdmin
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
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getDepartmentTree() {
        try {
            const { data, error } = await supabase_1.supabaseAdmin
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
            const { data, error } = await supabase_1.supabaseAdmin
                .from('departments')
                .select('*')
                .eq('parent_department_id', parentId)
                .eq('is_active', true)
                .order('department_name', { ascending: true });
            if (error) {
                throw new Error(`Failed to fetch child departments: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getDepartmentDoctors(departmentId) {
        try {
            const { data, error } = await supabase_1.supabaseAdmin
                .from('doctor_profiles')
                .select('doctor_id, full_name, specialty, is_active')
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
            const { data, error } = await supabase_1.supabaseAdmin
                .from('rooms')
                .select('*')
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
    async generateDepartmentId(parentId) {
        try {
            const { data, error } = await supabase_1.supabaseAdmin
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
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    buildDepartmentTree(departments) {
        const departmentMap = new Map();
        const rootDepartments = [];
        departments.forEach(dept => {
            departmentMap.set(dept.department_id, { ...dept, children: [] });
        });
        departments.forEach(dept => {
            const department = departmentMap.get(dept.department_id);
            if (dept.parent_department_id) {
                const parent = departmentMap.get(dept.parent_department_id);
                if (parent) {
                    parent.children = parent.children || [];
                    parent.children.push(department);
                }
            }
            else {
                rootDepartments.push(department);
            }
        });
        return rootDepartments;
    }
}
exports.DepartmentRepository = DepartmentRepository;
//# sourceMappingURL=department.repository.js.map