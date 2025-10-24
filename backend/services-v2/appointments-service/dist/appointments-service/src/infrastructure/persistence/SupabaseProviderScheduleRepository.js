"use strict";
/**
 * SupabaseProviderScheduleRepository
 * Supabase implementation of IProviderScheduleRepository
 *
 * Bounded Context: Appointments Service
 * - Manages cached provider work schedules
 * - Updated via StaffScheduleUpdatedEvent from Provider Staff Service
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseProviderScheduleRepository = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const ProviderSchedule_vo_1 = require("../../domain/value-objects/ProviderSchedule.vo");
class SupabaseProviderScheduleRepository {
    constructor(supabaseUrl, supabaseKey) {
        this.schema = 'appointments_schema';
        this.tableName = 'provider_work_schedules';
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
            db: {
                schema: 'appointments_schema',
            },
            global: {
                headers: {
                    'X-Client-Info': 'appointments-service',
                },
            },
        });
    }
    /**
     * Find schedule by provider ID
     */
    async findByProviderId(providerId) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('provider_id', providerId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    // Not found
                    return null;
                }
                throw new Error(`Failed to find provider schedule: ${error.message}`);
            }
            return data ? ProviderSchedule_vo_1.ProviderSchedule.fromPersistence(data) : null;
        }
        catch (error) {
            console.error('Error finding provider schedule:', error);
            throw error;
        }
    }
    /**
     * Find schedules by multiple provider IDs
     */
    async findByProviderIds(providerIds) {
        try {
            if (providerIds.length === 0) {
                return [];
            }
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .in('provider_id', providerIds);
            if (error) {
                throw new Error(`Failed to find provider schedules: ${error.message}`);
            }
            return (data || []).map(row => ProviderSchedule_vo_1.ProviderSchedule.fromPersistence(row));
        }
        catch (error) {
            console.error('Error finding provider schedules:', error);
            throw error;
        }
    }
    /**
     * Upsert (insert or update) provider schedule
     * Used by StaffScheduleUpdatedEvent handler
     */
    async upsert(schedule) {
        try {
            const data = schedule.toPersistence();
            const { error } = await this.supabase
                .from(this.tableName)
                .upsert(data, {
                onConflict: 'provider_id',
                ignoreDuplicates: false
            });
            if (error) {
                throw new Error(`Failed to upsert provider schedule: ${error.message}`);
            }
            console.log(`Provider schedule upserted successfully for provider: ${schedule.providerId}`);
        }
        catch (error) {
            console.error('Error upserting provider schedule:', error);
            throw error;
        }
    }
    /**
     * Delete schedule by provider ID
     */
    async delete(providerId) {
        try {
            const { error } = await this.supabase
                .from(this.tableName)
                .delete()
                .eq('provider_id', providerId);
            if (error) {
                throw new Error(`Failed to delete provider schedule: ${error.message}`);
            }
            console.log(`Provider schedule deleted successfully for provider: ${providerId}`);
        }
        catch (error) {
            console.error('Error deleting provider schedule:', error);
            throw error;
        }
    }
    /**
     * Check if schedule exists for provider
     */
    async exists(providerId) {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('provider_id')
                .eq('provider_id', providerId)
                .single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return false;
                }
                throw new Error(`Failed to check provider schedule existence: ${error.message}`);
            }
            return !!data;
        }
        catch (error) {
            console.error('Error checking provider schedule existence:', error);
            return false;
        }
    }
    /**
     * Get all schedules (for admin/reporting)
     */
    async findAll() {
        try {
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .order('updated_at', { ascending: false });
            if (error) {
                throw new Error(`Failed to find all provider schedules: ${error.message}`);
            }
            return (data || []).map(row => ProviderSchedule_vo_1.ProviderSchedule.fromPersistence(row));
        }
        catch (error) {
            console.error('Error finding all provider schedules:', error);
            throw error;
        }
    }
    /**
     * Count total schedules
     */
    async count() {
        try {
            const { count, error } = await this.supabase
                .from(this.tableName)
                .select('*', { count: 'exact', head: true });
            if (error) {
                console.error('Supabase count error:', error);
                throw new Error(`Failed to count provider schedules: ${error.message || JSON.stringify(error)}`);
            }
            return count || 0;
        }
        catch (error) {
            console.error('Error counting provider schedules:', error);
            throw error;
        }
    }
}
exports.SupabaseProviderScheduleRepository = SupabaseProviderScheduleRepository;
//# sourceMappingURL=SupabaseProviderScheduleRepository.js.map