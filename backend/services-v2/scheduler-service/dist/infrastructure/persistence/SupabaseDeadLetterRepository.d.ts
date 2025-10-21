import { SupabaseClient } from '@supabase/supabase-js';
import { IDeadLetterRepository } from '../../domain/repositories/IDeadLetterRepository';
import { DeadLetter } from '../../domain/entities/DeadLetter.entity';
export declare class SupabaseDeadLetterRepository implements IDeadLetterRepository {
    private readonly supabase;
    constructor(supabase: SupabaseClient);
    save(deadLetter: DeadLetter): Promise<void>;
    findById(id: string): Promise<DeadLetter | null>;
    findByScheduleId(scheduleId: string, limit?: number): Promise<DeadLetter[]>;
    findByTenantId(tenantId: string, limit?: number): Promise<DeadLetter[]>;
    deleteOlderThan(daysOld: number): Promise<number>;
    delete(id: string): Promise<void>;
    private toDomain;
    private toRow;
}
//# sourceMappingURL=SupabaseDeadLetterRepository.d.ts.map