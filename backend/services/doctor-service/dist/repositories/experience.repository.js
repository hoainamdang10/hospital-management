"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExperienceRepository = void 0;
const database_config_1 = require("../config/database.config");
const logger_1 = __importDefault(require("@hospital/shared/dist/utils/logger"));
class ExperienceRepository {
    constructor() {
        this.supabase = (0, database_config_1.getSupabase)();
    }
    async findByDoctorId(doctor_id) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_experiences')
                .select('*')
                .eq('doctor_id', doctor_id)
                .order('start_date', { ascending: false });
            if (error)
                throw error;
            return data?.map(this.mapSupabaseExperienceToExperience) || [];
        }
        catch (error) {
            logger_1.default.error('Error finding experiences by doctor ID', { error, doctor_id });
            throw error;
        }
    }
    async findById(experienceId) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_experiences')
                .select('*')
                .eq('experience_id', experienceId)
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseExperienceToExperience(data);
        }
        catch (error) {
            logger_1.default.error('Error finding experience by ID', { error, experienceId });
            throw error;
        }
    }
    async findByType(doctor_id, experienceType) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_experiences')
                .select('*')
                .eq('doctor_id', doctor_id)
                .eq('experience_type', experienceType)
                .order('start_date', { ascending: false });
            if (error)
                throw error;
            return data?.map(this.mapSupabaseExperienceToExperience) || [];
        }
        catch (error) {
            logger_1.default.error('Error finding experiences by type', { error, doctor_id, experienceType });
            throw error;
        }
    }
    async findCurrent(doctor_id) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_experiences')
                .select('*')
                .eq('doctor_id', doctor_id)
                .eq('is_current', true)
                .order('start_date', { ascending: false });
            if (error)
                throw error;
            return data?.map(this.mapSupabaseExperienceToExperience) || [];
        }
        catch (error) {
            logger_1.default.error('Error finding current experiences', { error, doctor_id });
            throw error;
        }
    }
    async create(experienceData) {
        try {
            if (experienceData.is_current) {
                await this.updateCurrentStatus(experienceData.doctor_id, experienceData.experience_type, false);
            }
            const { data, error } = await this.supabase
                .from('doctor_experiences')
                .insert([{
                    doctor_id: experienceData.doctor_id,
                    institution_name: experienceData.institution_name,
                    position: experienceData.position,
                    start_date: experienceData.start_date.toISOString().split('T')[0],
                    end_date: experienceData.end_date?.toISOString().split('T')[0],
                    is_current: experienceData.is_current || false,
                    description: experienceData.description,
                    experience_type: experienceData.experience_type
                }])
                .select()
                .single();
            if (error)
                throw error;
            return this.mapSupabaseExperienceToExperience(data);
        }
        catch (error) {
            logger_1.default.error('Error creating experience', { error, experienceData });
            throw error;
        }
    }
    async update(experienceId, experienceData) {
        try {
            const updateData = { ...experienceData };
            if (experienceData.start_date) {
                updateData.start_date = experienceData.start_date.toISOString().split('T')[0];
            }
            if (experienceData.end_date) {
                updateData.end_date = experienceData.end_date.toISOString().split('T')[0];
            }
            if (experienceData.is_current && experienceData.doctor_id && experienceData.experience_type) {
                await this.updateCurrentStatus(experienceData.doctor_id, experienceData.experience_type, false, experienceId);
            }
            const { data, error } = await this.supabase
                .from('doctor_experiences')
                .update(updateData)
                .eq('experience_id', experienceId)
                .select()
                .single();
            if (error) {
                if (error.code === 'PGRST116')
                    return null;
                throw error;
            }
            return this.mapSupabaseExperienceToExperience(data);
        }
        catch (error) {
            logger_1.default.error('Error updating experience', { error, experienceId, experienceData });
            throw error;
        }
    }
    async delete(experienceId) {
        try {
            const { error } = await this.supabase
                .from('doctor_experiences')
                .delete()
                .eq('experience_id', experienceId);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            logger_1.default.error('Error deleting experience', { error, experienceId });
            throw error;
        }
    }
    async getWorkExperience(doctor_id) {
        return this.findByType(doctor_id, 'work');
    }
    async getEducation(doctor_id) {
        return this.findByType(doctor_id, 'education');
    }
    async getCertifications(doctor_id) {
        return this.findByType(doctor_id, 'certification');
    }
    async getResearch(doctor_id) {
        return this.findByType(doctor_id, 'research');
    }
    async calculateTotalExperience(doctor_id) {
        try {
            const experiences = await this.findByDoctorId(doctor_id);
            const currentDate = new Date();
            let totalYears = 0;
            let workYears = 0;
            let educationYears = 0;
            const currentPositions = experiences.filter(exp => exp.is_current);
            experiences.forEach(exp => {
                const startDate = new Date(exp.start_date);
                const endDate = exp.end_date ? new Date(exp.end_date) : currentDate;
                const yearsDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                if (exp.experience_type === 'work') {
                    workYears += yearsDiff;
                    totalYears += yearsDiff;
                }
                else if (exp.experience_type === 'education') {
                    educationYears += yearsDiff;
                }
            });
            return {
                total_years: Math.round(totalYears * 10) / 10,
                work_years: Math.round(workYears * 10) / 10,
                education_years: Math.round(educationYears * 10) / 10,
                current_positions: currentPositions
            };
        }
        catch (error) {
            logger_1.default.error('Error calculating total experience', { error, doctor_id });
            throw error;
        }
    }
    async getExperienceTimeline(doctor_id) {
        try {
            const experiences = await this.findByDoctorId(doctor_id);
            return experiences.sort((a, b) => {
                const dateA = new Date(a.start_date);
                const dateB = new Date(b.start_date);
                return dateB.getTime() - dateA.getTime();
            });
        }
        catch (error) {
            logger_1.default.error('Error getting experience timeline', { error, doctor_id });
            throw error;
        }
    }
    async searchExperiences(doctor_id, searchTerm) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_experiences')
                .select('*')
                .eq('doctor_id', doctor_id)
                .or(`institution_name.ilike.%${searchTerm}%,position.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
                .order('start_date', { ascending: false });
            if (error)
                throw error;
            return data?.map(this.mapSupabaseExperienceToExperience) || [];
        }
        catch (error) {
            logger_1.default.error('Error searching experiences', { error, doctor_id, searchTerm });
            throw error;
        }
    }
    async getExperiencesByDateRange(doctor_id, startDate, endDate) {
        try {
            const { data, error } = await this.supabase
                .from('doctor_experiences')
                .select('*')
                .eq('doctor_id', doctor_id)
                .gte('start_date', startDate.toISOString().split('T')[0])
                .lte('start_date', endDate.toISOString().split('T')[0])
                .order('start_date', { ascending: false });
            if (error)
                throw error;
            return data?.map(this.mapSupabaseExperienceToExperience) || [];
        }
        catch (error) {
            logger_1.default.error('Error getting experiences by date range', { error, doctor_id, startDate, endDate });
            throw error;
        }
    }
    async updateCurrentStatus(doctor_id, experienceType, isCurrent, excludeId) {
        try {
            let query = this.supabase
                .from('doctor_experiences')
                .update({ is_current: isCurrent })
                .eq('doctor_id', doctor_id)
                .eq('experience_type', experienceType);
            if (excludeId) {
                query = query.neq('experience_id', excludeId);
            }
            const { error } = await query;
            if (error)
                throw error;
        }
        catch (error) {
            logger_1.default.error('Error updating current status', { error, doctor_id, experienceType, isCurrent });
            throw error;
        }
    }
    mapSupabaseExperienceToExperience(supabaseExperience) {
        return {
            experience_id: supabaseExperience.experience_id,
            doctor_id: supabaseExperience.doctor_id,
            institution_name: supabaseExperience.institution_name,
            position: supabaseExperience.position,
            start_date: new Date(supabaseExperience.start_date),
            end_date: supabaseExperience.end_date ? new Date(supabaseExperience.end_date) : undefined,
            is_current: supabaseExperience.is_current,
            description: supabaseExperience.description,
            experience_type: supabaseExperience.experience_type,
            created_at: new Date(supabaseExperience.created_at),
            updated_at: new Date(supabaseExperience.updated_at)
        };
    }
}
exports.ExperienceRepository = ExperienceRepository;
//# sourceMappingURL=experience.repository.js.map