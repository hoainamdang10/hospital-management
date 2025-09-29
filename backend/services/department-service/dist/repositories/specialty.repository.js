"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecialtyRepository = void 0;
const database_config_1 = require("../config/database.config");
class SpecialtyRepository {
    async findAll(filters = {}, page = 1, limit = 20) {
        try {
            let query = database_config_1.supabaseAdmin
                .from('specialties')
                .select('*');
            if (filters.search) {
                query = query.or(`specialty_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
            }
            if (filters.department_id) {
                query = query.eq('department_id', filters.department_id);
            }
            if (filters.is_active !== undefined) {
                query = query.eq('is_active', filters.is_active);
            }
            if (filters.min_consultation_time) {
                query = query.gte('average_consultation_time', filters.min_consultation_time);
            }
            if (filters.max_consultation_time) {
                query = query.lte('average_consultation_time', filters.max_consultation_time);
            }
            const { count } = await database_config_1.supabaseAdmin
                .from('specialties')
                .select('*', { count: 'exact', head: true });
            const offset = (page - 1) * limit;
            query = query.range(offset, offset + limit - 1);
            query = query.order('specialty_name', { ascending: true });
            const { data, error } = await query;
            if (error) {
                throw new Error(`Failed to fetch specialties: ${error.message}`);
            }
            const totalPages = Math.ceil((count || 0) / limit);
            return {
                specialties: data || [],
                total: count || 0,
                totalPages
            };
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async findById(specialtyId) {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
                .from('specialties')
                .select('*')
                .eq('specialty_id', specialtyId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to fetch specialty: ${error.message}`);
            }
            const { count: doctorCount } = await database_config_1.supabaseAdmin
                .from('doctors')
                .select('*', { count: 'exact', head: true })
                .eq('specialty', data.specialty_name)
                .eq('is_active', true);
            return {
                ...data,
                doctor_count: doctorCount || 0
            };
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async create(specialtyData) {
        try {
            const specialtyId = await this.generateSpecialtyId();
            let specialtyCode = 'SPEC';
            try {
                const generatedCode = this.generateSpecialtyCode(specialtyData.specialty_name);
                if (generatedCode && generatedCode.trim() !== '') {
                    specialtyCode = generatedCode;
                }
            }
            catch (error) {
                specialtyCode = 'SPEC';
            }
            const newSpecialty = {
                specialty_id: specialtyId,
                specialty_name: specialtyData.specialty_name,
                specialty_code: specialtyCode,
                department_id: specialtyData.department_id,
                description: specialtyData.description,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const insertData = {
                ...newSpecialty,
                specialty_code: newSpecialty.specialty_code || 'SPEC'
            };
            const { data, error } = await database_config_1.supabaseAdmin
                .from('specialties')
                .insert(insertData)
                .select()
                .single();
            if (error) {
                throw new Error(`Failed to create specialty: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async update(specialtyId, updateData) {
        try {
            const updatedData = {
                updated_at: new Date().toISOString()
            };
            if (updateData.specialty_name)
                updatedData.specialty_name = updateData.specialty_name;
            if (updateData.department_id)
                updatedData.department_id = updateData.department_id;
            if (updateData.description !== undefined)
                updatedData.description = updateData.description;
            if (updateData.is_active !== undefined)
                updatedData.is_active = updateData.is_active;
            const { data, error } = await database_config_1.supabaseAdmin
                .from('specialties')
                .update(updatedData)
                .eq('specialty_id', specialtyId)
                .select()
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to update specialty: ${error.message}`);
            }
            return data;
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async delete(specialtyId) {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
                .from('specialties')
                .update({
                is_active: false,
                updated_at: new Date().toISOString()
            })
                .eq('specialty_id', specialtyId)
                .select()
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return false;
                }
                throw new Error(`Failed to delete specialty: ${error.message}`);
            }
            return true;
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getStats() {
        try {
            const { count: totalSpecialties } = await database_config_1.supabaseAdmin
                .from('specialties')
                .select('*', { count: 'exact', head: true });
            const { count: activeSpecialties } = await database_config_1.supabaseAdmin
                .from('specialties')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true);
            const { data: avgData } = await database_config_1.supabaseAdmin
                .from('specialties')
                .select('average_consultation_time')
                .eq('is_active', true);
            const avgConsultationTime = avgData && avgData.length > 0
                ? Math.round(avgData.reduce((sum, item) => sum + (item.average_consultation_time || 0), 0) / avgData.length)
                : 0;
            const { data: deptData } = await database_config_1.supabaseAdmin
                .from('specialties')
                .select('department_id')
                .eq('is_active', true);
            const departmentCounts = deptData?.reduce((acc, item) => {
                acc[item.department_id] = (acc[item.department_id] || 0) + 1;
                return acc;
            }, {}) || {};
            const departmentsWithSpecialties = Object.keys(departmentCounts).length;
            return {
                total_specialties: totalSpecialties || 0,
                active_specialties: activeSpecialties || 0,
                inactive_specialties: (totalSpecialties || 0) - (activeSpecialties || 0),
                average_consultation_time: avgConsultationTime,
                departments_with_specialties: departmentsWithSpecialties,
                specialties_per_department: departmentCounts
            };
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getByDepartment(departmentId) {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
                .from('specialties')
                .select('*')
                .eq('department_id', departmentId)
                .eq('is_active', true)
                .order('specialty_name', { ascending: true });
            if (error) {
                throw new Error(`Failed to fetch specialties by department: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getSpecialtyDoctors(specialtyId) {
        try {
            const { data: specialty } = await database_config_1.supabaseAdmin
                .from('specialties')
                .select('specialty_name')
                .eq('specialty_id', specialtyId)
                .single();
            if (!specialty) {
                return [];
            }
            const { data, error } = await database_config_1.supabaseAdmin
                .from('doctors')
                .select(`
          doctor_id,
          full_name,
          qualification,
          license_number,
          experience_years,
          consultation_fee,
          rating,
          is_active
        `)
                .eq('specialty', specialty.specialty_name)
                .eq('is_active', true);
            if (error) {
                throw new Error(`Failed to fetch specialty doctors: ${error.message}`);
            }
            return data || [];
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async generateSpecialtyId() {
        try {
            const { data, error } = await database_config_1.supabaseAdmin
                .from('specialties')
                .select('specialty_id')
                .like('specialty_id', 'SPEC%')
                .order('specialty_id', { ascending: false })
                .limit(1);
            if (error) {
                throw new Error(`Failed to generate specialty ID: ${error.message}`);
            }
            let nextNumber = 1;
            if (data && data.length > 0) {
                const lastId = data[0].specialty_id;
                const lastNumber = parseInt(lastId.replace('SPEC', ''));
                nextNumber = lastNumber + 1;
            }
            return `SPEC${nextNumber.toString().padStart(3, '0')}`;
        }
        catch (error) {
            throw new Error(`Repository error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    generateSpecialtyCode(specialtyName) {
        if (!specialtyName || specialtyName.trim() === '') {
            return 'SPEC';
        }
        const codeMap = {
            'tim mạch can thiệp': 'CARD-INT',
            'siêu âm tim': 'CARD-ECHO',
            'thần kinh cột sống': 'NEUR-SPINE',
            'nhi tim mạch': 'PEDI-CARD',
            'cấp cứu': 'EMER',
            'phẫu thuật': 'SURG',
            'nội khoa': 'INTER',
            'ngoại khoa': 'SURG-GEN',
            'test specialty': 'TEST',
            'automated': 'AUTO'
        };
        const lowerName = specialtyName.toLowerCase().trim();
        for (const [key, code] of Object.entries(codeMap)) {
            if (lowerName.includes(key)) {
                return code;
            }
        }
        const words = specialtyName.split(' ')
            .filter(word => word.length > 2)
            .slice(0, 3);
        if (words.length === 0) {
            return 'SPEC';
        }
        const code = words.map(word => word.charAt(0).toUpperCase()).join('');
        return code.length >= 2 ? code : 'SPEC';
    }
}
exports.SpecialtyRepository = SpecialtyRepository;
//# sourceMappingURL=specialty.repository.js.map