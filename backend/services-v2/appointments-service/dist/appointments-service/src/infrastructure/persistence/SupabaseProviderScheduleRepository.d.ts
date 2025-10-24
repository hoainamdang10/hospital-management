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
import { IProviderScheduleRepository } from '../../domain/repositories/IProviderScheduleRepository';
import { ProviderSchedule } from '../../domain/value-objects/ProviderSchedule.vo';
export declare class SupabaseProviderScheduleRepository implements IProviderScheduleRepository {
    private readonly supabase;
    private readonly schema;
    private readonly tableName;
    constructor(supabaseUrl: string, supabaseKey: string);
    /**
     * Find schedule by provider ID
     */
    findByProviderId(providerId: string): Promise<ProviderSchedule | null>;
    /**
     * Find schedules by multiple provider IDs
     */
    findByProviderIds(providerIds: string[]): Promise<ProviderSchedule[]>;
    /**
     * Upsert (insert or update) provider schedule
     * Used by StaffScheduleUpdatedEvent handler
     */
    upsert(schedule: ProviderSchedule): Promise<void>;
    /**
     * Delete schedule by provider ID
     */
    delete(providerId: string): Promise<void>;
    /**
     * Check if schedule exists for provider
     */
    exists(providerId: string): Promise<boolean>;
    /**
     * Get all schedules (for admin/reporting)
     */
    findAll(): Promise<ProviderSchedule[]>;
    /**
     * Count total schedules
     */
    count(): Promise<number>;
}
//# sourceMappingURL=SupabaseProviderScheduleRepository.d.ts.map