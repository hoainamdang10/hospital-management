import { Schedule } from '../aggregates/Schedule.aggregate';
import { TenantId } from '../value-objects/TenantId';
import { DedupKey } from '../value-objects/DedupKey';
export interface IScheduleRepository {
    save(schedule: Schedule): Promise<void>;
    findById(scheduleId: string): Promise<Schedule | null>;
    findByTenantAndDedupKey(tenantId: TenantId, dedupKey: DedupKey): Promise<Schedule | null>;
    findByOwner(tenantId: TenantId, ownerService: string, ownerResourceType?: string, ownerResourceId?: string, policyTag?: string): Promise<Schedule[]>;
    findActiveSchedules(limit?: number, offset?: number): Promise<Schedule[]>;
    update(schedule: Schedule): Promise<void>;
    delete(scheduleId: string): Promise<void>;
}
//# sourceMappingURL=IScheduleRepository.d.ts.map