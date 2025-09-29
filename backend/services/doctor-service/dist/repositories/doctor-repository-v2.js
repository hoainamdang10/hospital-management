"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorRepositoryV2 = void 0;
const base_repository_1 = require("@hospital/shared/dist/repositories/base-repository");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class DoctorRepositoryV2 extends base_repository_1.BaseRepository {
    constructor() {
        const config = {
            serviceName: 'doctor-service',
            schemaName: 'doctor_schema',
            enableFHIRValidation: true,
            enableAuditLogging: true,
            enablePerformanceMonitoring: true
        };
        super(config);
        logger_1.default.info('DoctorRepositoryV2 initialized with schema-aware configuration', {
            serviceName: config.serviceName,
            schemaName: config.schemaName,
            compliance: 'HIPAA+FHIR'
        });
    }
    async findById(doctorId) {
        return this.executeFHIRQuery('doctor_profiles', async (client) => {
            const { data, error } = await client
                .from('doctor_profiles')
                .select('*')
                .eq('doctor_id', doctorId)
                .eq('status', 'active')
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseDoctorToDoctor(data);
        }, {
            resourceType: 'Practitioner',
            providerId: doctorId,
            accessReason: 'Doctor profile lookup for healthcare operations'
        });
    }
    async findAll(limit = 50, offset = 0) {
        return this.executeQuery('doctor_profiles', async (client) => {
            const { data, error } = await client
                .from('doctor_profiles')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error)
                throw error;
            return data?.map(this.mapSupabaseDoctorToDoctor) || [];
        }, {
            operation: 'SELECT_ALL_DOCTORS',
            auditData: [`limit:${limit}`, `offset:${offset}`]
        });
    }
    async searchDoctors(filters, limit = 20, offset = 0) {
        return this.executeQuery('doctor_profiles', async (client) => {
            let query = client
                .from('doctor_profiles')
                .select('*', { count: 'exact' })
                .eq('status', 'active');
            if (filters.specialization) {
                query = query.eq('specialization', filters.specialization);
            }
            if (filters.department_id) {
                query = query.eq('department_id', filters.department_id);
            }
            if (filters.is_available !== undefined) {
                query = query.eq('is_available', filters.is_available);
            }
            if (filters.min_experience) {
                query = query.gte('years_of_experience', filters.min_experience);
            }
            if (filters.max_consultation_fee) {
                query = query.lte('consultation_fee', filters.max_consultation_fee);
            }
            if (filters.languages && filters.languages.length > 0) {
                query = query.overlaps('languages_spoken', filters.languages);
            }
            const { data, error, count } = await query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            if (error)
                throw error;
            return {
                doctors: data?.map(this.mapSupabaseDoctorToDoctor) || [],
                total: count || 0
            };
        }, {
            operation: 'SEARCH_DOCTORS',
            auditData: [
                `filters:${JSON.stringify(filters)}`,
                `limit:${limit}`,
                `offset:${offset}`
            ]
        });
    }
    async create(doctorData) {
        this.validateDoctorData(doctorData);
        return this.executeFHIRQuery('doctor_profiles', async (client) => {
            const doctorId = await this.generateDoctorId(doctorData.department_id);
            const doctorRecord = {
                doctor_id: doctorId,
                user_id: doctorData.user_id,
                full_name: doctorData.full_name,
                email: doctorData.email,
                phone_number: doctorData.phone_number,
                specialization: doctorData.specialization,
                license_number: doctorData.license_number,
                department_id: doctorData.department_id,
                years_of_experience: doctorData.years_of_experience || 0,
                education: doctorData.education || '',
                certifications: doctorData.certifications || [],
                languages_spoken: doctorData.languages_spoken || ['Vietnamese'],
                consultation_fee: doctorData.consultation_fee || 0,
                is_available: doctorData.is_available ?? true,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            const { data, error } = await client
                .from('doctor_profiles')
                .insert(doctorRecord)
                .select()
                .single();
            if (error)
                throw error;
            return this.mapSupabaseDoctorToDoctor(data);
        }, {
            resourceType: 'Practitioner',
            providerId: doctorData.user_id,
            accessReason: 'Creating new doctor profile for healthcare system'
        });
    }
    async update(doctorId, updateData) {
        return this.executeFHIRQuery('doctor_profiles', async (client) => {
            const updateRecord = {
                ...updateData,
                updated_at: new Date().toISOString()
            };
            delete updateRecord.doctor_id;
            delete updateRecord.created_at;
            const { data, error } = await client
                .from('doctor_profiles')
                .update(updateRecord)
                .eq('doctor_id', doctorId)
                .eq('status', 'active')
                .select()
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseDoctorToDoctor(data);
        }, {
            resourceType: 'Practitioner',
            providerId: doctorId,
            accessReason: 'Updating doctor profile information'
        });
    }
    async delete(doctorId) {
        return this.executeFHIRQuery('doctor_profiles', async (client) => {
            const { error } = await client
                .from('doctor_profiles')
                .update({
                status: 'inactive',
                updated_at: new Date().toISOString()
            })
                .eq('doctor_id', doctorId);
            if (error)
                throw error;
            return true;
        }, {
            resourceType: 'Practitioner',
            providerId: doctorId,
            accessReason: 'Deactivating doctor profile (soft delete)'
        });
    }
    async findByProfileId(profileId) {
        return this.executeQuery('doctor_profiles', async (client) => {
            const { data, error } = await client
                .from('doctor_profiles')
                .select('*')
                .eq('user_id', profileId)
                .eq('status', 'active')
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseDoctorToDoctor(data);
        }, {
            operation: 'FIND_BY_PROFILE_ID',
            recordId: profileId,
            auditData: ['cross_schema_lookup:auth_schema.profiles']
        });
    }
    async getDoctorAvailability(doctorId) {
        return this.executeQuery('doctor_profiles', async (client) => {
            const { data: doctor, error } = await client
                .from('doctor_profiles')
                .select('is_available')
                .eq('doctor_id', doctorId)
                .single();
            if (error)
                throw error;
            return {
                isAvailable: doctor.is_available,
                nextAvailableSlot: undefined,
                currentAppointments: 0
            };
        }, {
            operation: 'CHECK_AVAILABILITY',
            recordId: doctorId
        });
    }
    validateDoctorData(doctorData) {
        const required = ['user_id', 'full_name', 'email', 'specialization', 'license_number', 'department_id'];
        for (const field of required) {
            if (!doctorData[field]) {
                throw new Error(`Trường bắt buộc '${field}' không được để trống`);
            }
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (doctorData.email && !emailRegex.test(doctorData.email)) {
            throw new Error('Định dạng email không hợp lệ');
        }
        const phoneRegex = /^0[0-9]{9}$/;
        if (doctorData.phone_number && !phoneRegex.test(doctorData.phone_number)) {
            throw new Error('Số điện thoại phải có 10 chữ số và bắt đầu bằng 0');
        }
        const licenseRegex = /^VN-[A-Z]{2}-[0-9]{4}$/;
        if (doctorData.license_number && !licenseRegex.test(doctorData.license_number)) {
            throw new Error('Số giấy phép hành nghề phải có định dạng VN-XX-XXXX');
        }
    }
    async generateDoctorId(departmentId) {
        const now = new Date();
        const yearMonth = now.getFullYear().toString() + (now.getMonth() + 1).toString().padStart(2, '0');
        const deptCode = departmentId.substring(0, 4).toUpperCase();
        const sequence = await this.getNextDoctorSequence(deptCode, yearMonth);
        return `${deptCode}-DOC-${yearMonth}-${sequence.toString().padStart(3, '0')}`;
    }
    async getNextDoctorSequence(deptCode, yearMonth) {
        return this.executeQuery('doctor_profiles', async (client) => {
            const { data, error } = await client
                .from('doctor_profiles')
                .select('doctor_id')
                .like('doctor_id', `${deptCode}-DOC-${yearMonth}-%`)
                .order('doctor_id', { ascending: false })
                .limit(1);
            if (error)
                throw error;
            if (data && data.length > 0) {
                const lastId = data[0].doctor_id;
                const lastSequence = parseInt(lastId.split('-').pop() || '0');
                return lastSequence + 1;
            }
            return 1;
        }, {
            operation: 'GET_NEXT_SEQUENCE',
            auditData: [`deptCode:${deptCode}`, `yearMonth:${yearMonth}`]
        });
    }
    mapSupabaseDoctorToDoctor(data) {
        return {
            doctor_id: data.doctor_id,
            user_id: data.user_id,
            full_name: data.full_name,
            email: data.email,
            phone_number: data.phone_number,
            specialization: data.specialization,
            license_number: data.license_number,
            department_id: data.department_id,
            years_of_experience: data.years_of_experience,
            education: data.education,
            certifications: data.certifications || [],
            languages_spoken: data.languages_spoken || [],
            consultation_fee: data.consultation_fee,
            is_available: data.is_available,
            status: data.status,
            created_at: data.created_at,
            updated_at: data.updated_at
        };
    }
}
exports.DoctorRepositoryV2 = DoctorRepositoryV2;
exports.default = DoctorRepositoryV2;
//# sourceMappingURL=doctor-repository-v2.js.map