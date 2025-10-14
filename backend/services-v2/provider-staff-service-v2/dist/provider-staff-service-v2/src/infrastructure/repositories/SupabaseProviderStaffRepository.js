"use strict";
/**
 * Supabase Provider Staff Repository Implementation
 * Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseProviderStaffRepository = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const ProviderStaff_1 = require("../../domain/aggregates/ProviderStaff");
const PersonalInfo_1 = require("../../domain/value-objects/PersonalInfo");
const ProfessionalInfo_1 = require("../../domain/value-objects/ProfessionalInfo");
class SupabaseProviderStaffRepository {
    constructor(supabaseUrl, supabaseKey) {
        this.tableName = 'provider_staff';
        this.schemaName = 'provider_schema';
        this.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
            db: {
                schema: this.schemaName,
            },
            global: {
                headers: {
                    'X-Client-Info': 'provider-staff-service',
                },
            },
        });
    }
    /**
     * Find staff by ID
     */
    async findById(staffId) {
        try {
            const { data, error } = await this.supabaseClient
                .from(this.tableName)
                .select('*')
                .eq('id', staffId.value)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // Not found
                }
                throw new Error(`Error finding staff: ${error.message}`);
            }
            if (!data) {
                return null;
            }
            return this.toDomain(data);
        }
        catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }
    /**
     * Save new staff member
     */
    async save(staff) {
        try {
            const persistenceData = staff.toPersistence();
            const { error } = await this.supabaseClient
                .from(this.tableName)
                .insert(persistenceData);
            if (error) {
                throw new Error(`Error saving staff: ${error.message}`);
            }
        }
        catch (error) {
            console.error('Error in save:', error);
            throw error;
        }
    }
    /**
     * Update existing staff member
     */
    async update(staff) {
        try {
            const persistenceData = staff.toPersistence();
            const { error } = await this.supabaseClient
                .from(this.tableName)
                .update(persistenceData)
                .eq('id', staff.id);
            if (error) {
                throw new Error(`Error updating staff: ${error.message}`);
            }
        }
        catch (error) {
            console.error('Error in update:', error);
            throw error;
        }
    }
    /**
     * Delete staff member
     */
    async delete(staffId) {
        try {
            const { error } = await this.supabaseClient
                .from(this.tableName)
                .delete()
                .eq('id', staffId.value);
            if (error) {
                throw new Error(`Error deleting staff: ${error.message}`);
            }
        }
        catch (error) {
            console.error('Error in delete:', error);
            throw error;
        }
    }
    /**
     * Find all staff members
     */
    async findAll() {
        try {
            const { data, error } = await this.supabaseClient
                .from(this.tableName)
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                throw new Error(`Error finding all staff: ${error.message}`);
            }
            if (!data || data.length === 0) {
                return [];
            }
            return data.map(item => this.toDomain(item));
        }
        catch (error) {
            console.error('Error in findAll:', error);
            throw error;
        }
    }
    /**
     * Find staff by type
     */
    async findByType(staffType) {
        try {
            const { data, error } = await this.supabaseClient
                .from(this.tableName)
                .select('*')
                .eq('staff_type', staffType)
                .order('created_at', { ascending: false });
            if (error) {
                throw new Error(`Error finding staff by type: ${error.message}`);
            }
            if (!data || data.length === 0) {
                return [];
            }
            return data.map(item => this.toDomain(item));
        }
        catch (error) {
            console.error('Error in findByType:', error);
            throw error;
        }
    }
    /**
     * Check if staff exists
     */
    async exists(staffId) {
        try {
            const staff = await this.findById(staffId);
            return staff !== null;
        }
        catch (error) {
            console.error('Error in exists:', error);
            return false;
        }
    }
    /**
     * Convert persistence data to domain model
     */
    toDomain(data) {
        const personalInfo = PersonalInfo_1.PersonalInfo.create({
            fullName: data.full_name,
            citizenId: data.citizen_id,
            dateOfBirth: data.date_of_birth ? new Date(data.date_of_birth) : undefined,
            gender: data.gender,
            phoneNumber: data.phone_number,
            email: data.email,
            address: data.address
        });
        const professionalInfo = ProfessionalInfo_1.ProfessionalInfo.create({
            licenseNumber: data.license_number,
            specialization: data.specialization,
            yearsOfExperience: data.years_of_experience,
            qualifications: data.qualifications,
            certifications: data.certifications
        });
        return ProviderStaff_1.ProviderStaff.reconstitute(data.id, personalInfo, professionalInfo, data.staff_type, data.is_active, new Date(data.created_at), new Date(data.updated_at));
    }
}
exports.SupabaseProviderStaffRepository = SupabaseProviderStaffRepository;
//# sourceMappingURL=SupabaseProviderStaffRepository.js.map