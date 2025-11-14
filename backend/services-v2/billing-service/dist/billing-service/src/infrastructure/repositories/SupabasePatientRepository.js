"use strict";
/**
 * SupabasePatientRepository - Patient repository implementation for Billing Service
 * Provides patient data access for billing operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabasePatientRepository = void 0;
exports.createSupabasePatientRepository = createSupabasePatientRepository;
/**
 * SupabasePatientRepository - Implementation for Supabase database
 */
class SupabasePatientRepository {
    constructor(supabase, loggerInstance) {
        this.supabase = supabase;
        this.loggerInstance = loggerInstance;
    }
    /**
     * Find patient by ID
     */
    async findById(id) {
        try {
            this.loggerInstance.debug('Finding patient by ID', { patientId: id });
            const { data, error } = await this.supabase.getRawClient()
                .from('patients')
                .select('*')
                .eq('id', id)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned
                    return null;
                }
                throw error;
            }
            if (!data) {
                return null;
            }
            return this.mapToPatient(data);
        }
        catch (error) {
            this.loggerInstance.error('Failed to find patient by ID', {
                patientId: id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Find patient by user ID
     */
    async findByUserId(userId) {
        try {
            this.loggerInstance.debug('Finding patient by user ID', { userId });
            const { data, error } = await this.supabase.getRawClient()
                .from('patients')
                .select('*')
                .eq('user_id', userId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned
                    return null;
                }
                throw error;
            }
            if (!data) {
                return null;
            }
            return this.mapToPatient(data);
        }
        catch (error) {
            this.loggerInstance.error('Failed to find patient by user ID', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Find patient by national ID
     */
    async findByNationalId(nationalId) {
        try {
            this.loggerInstance.debug('Finding patient by national ID', { nationalId });
            const { data, error } = await this.supabase.getRawClient()
                .from('patients')
                .select('*')
                .eq('national_id', nationalId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    // No rows returned
                    return null;
                }
                throw error;
            }
            if (!data) {
                return null;
            }
            return this.mapToPatient(data);
        }
        catch (error) {
            this.loggerInstance.error('Failed to find patient by national ID', {
                nationalId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Check if patient exists
     */
    async exists(id) {
        try {
            this.loggerInstance.debug('Checking if patient exists', { patientId: id });
            const { data, error } = await this.supabase.getRawClient()
                .from('patients')
                .select('id')
                .eq('id', id)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return false;
                }
                throw error;
            }
            return data !== null;
        }
        catch (error) {
            this.loggerInstance.error('Failed to check patient existence', {
                patientId: id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Get patient insurance information
     */
    async getInsuranceInfo(patientId) {
        try {
            this.loggerInstance.debug('Getting patient insurance info', { patientId });
            const { data, error } = await this.supabase.getRawClient()
                .from('patients')
                .select('insurance_info')
                .eq('id', patientId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw error;
            }
            return data?.insurance_info || null;
        }
        catch (error) {
            this.loggerInstance.error('Failed to get patient insurance info', {
                patientId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Update patient insurance information
     */
    async updateInsuranceInfo(patientId, insuranceInfo) {
        try {
            this.loggerInstance.debug('Updating patient insurance info', { patientId });
            const { error } = await this.supabase.getRawClient()
                .from('patients')
                .update({
                insurance_info: insuranceInfo,
                updated_at: new Date().toISOString(),
            })
                .eq('id', patientId);
            if (error) {
                throw error;
            }
            this.loggerInstance.info('Patient insurance info updated', { patientId });
        }
        catch (error) {
            this.loggerInstance.error('Failed to update patient insurance info', {
                patientId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Map database record to Patient entity
     */
    mapToPatient(data) {
        return {
            id: data.id,
            userId: data.user_id,
            fullName: data.full_name,
            dateOfBirth: new Date(data.date_of_birth),
            gender: data.gender,
            nationalId: data.national_id,
            phone: data.phone,
            email: data.email,
            address: data.address,
            insuranceInfo: data.insurance_info,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            isActive: data.is_active,
        };
    }
}
exports.SupabasePatientRepository = SupabasePatientRepository;
// Default constructor for dependency injection
function createSupabasePatientRepository(supabase, loggerInstance) {
    return new SupabasePatientRepository(supabase, loggerInstance);
}
//# sourceMappingURL=SupabasePatientRepository.js.map