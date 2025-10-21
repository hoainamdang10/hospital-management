import { SupabaseClient } from '@supabase/supabase-js';
import { IOutboxRepository } from '../../domain/repositories/IOutboxRepository';
import { Outbox } from '../../domain/entities/Outbox.entity';
export declare class SupabaseOutboxRepository implements IOutboxRepository {
    private readonly supabase;
    constructor(supabase: SupabaseClient);
    save(outbox: Outbox): Promise<void>;
    findUnpublished(limit?: number): Promise<Outbox[]>;
    update(outbox: Outbox): Promise<void>;
    deletePublished(olderThan: Date): Promise<number>;
    private toDomain;
    private toRow;
}
//# sourceMappingURL=SupabaseOutboxRepository.d.ts.map