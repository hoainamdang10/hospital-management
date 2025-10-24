/**
 * IProviderScheduleRepository Interface
 * Repository for managing cached provider work schedules
 *
 * Bounded Context: Appointments Service
 * - Caches work schedule templates from Provider Staff Service
 * - Used for runtime availability calculation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { ProviderSchedule } from '../value-objects/ProviderSchedule.vo';
export interface IProviderScheduleRepository {
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
//# sourceMappingURL=IProviderScheduleRepository.d.ts.map