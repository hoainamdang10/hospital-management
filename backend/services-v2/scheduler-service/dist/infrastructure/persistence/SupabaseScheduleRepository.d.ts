import { SupabaseClient } from '@supabase/supabase-js';
import { IScheduleRepository } from '../../domain/repositories/IScheduleRepository';
import { Schedule } from '../../domain/aggregates/Schedule.aggregate';
import { TenantId } from '../../domain/value-objects/TenantId';
import { DedupKey } from '../../domain/value-objects/DedupKey';
export declare class SupabaseScheduleRepository implements IScheduleRepository {
    private readonly supabase;
    constructor(supabase: SupabaseClient);
    save(schedule: Schedule): Promise<void>;
    findById(scheduleId: string): Promise<Schedule | null>;
    findByTenantAndDedupKey(tenantId: TenantId, dedupKey: DedupKey): Promise<Schedule | null>;
    findByOwner(tenantId: TenantId, ownerService: string, ownerResourceType?: string, ownerResourceId?: string, policyTag?: string): Promise<Schedule[]>;
    findByTenant(tenantId: TenantId, limit?: number, offset?: number): Promise<Schedule[]>;
    findActiveSchedules(limit?: number, offset?: number): Promise<Schedule[]>;
    update(schedule: Schedule): Promise<void>;
    delete(scheduleId: string): Promise<void>;
    private toDomain;
    private toRow;
}
//# sourceMappingURL=SupabaseScheduleRepository.d.ts.map