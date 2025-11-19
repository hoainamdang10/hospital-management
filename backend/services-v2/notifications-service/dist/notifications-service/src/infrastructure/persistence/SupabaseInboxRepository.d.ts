import { SupabaseClient } from "@supabase/supabase-js";
import { IInboxRepository, ProcessEventIdempotentResult } from "../../domain/repositories/IInboxRepository";
import { InboxEvent } from "../../domain/aggregates/InboxEvent.aggregate";
export declare class SupabaseInboxRepository implements IInboxRepository {
    private readonly supabase;
    constructor(supabase: SupabaseClient);
    exists(idempotencyKey: string): Promise<boolean>;
    store(event: {
        idempotencyKey: string;
        eventType: string;
        payload: any;
        headers?: any;
        eventId?: string;
    }): Promise<string>;
    processEventIdempotent(idempotencyKey: string, eventType: string, payloadJson: any, headersJson?: any): Promise<ProcessEventIdempotentResult>;
    findByIdempotencyKey(idempotencyKey: string): Promise<InboxEvent | null>;
    findById(inboxId: string): Promise<InboxEvent | null>;
    findPending(limit?: number): Promise<InboxEvent[]>;
    findFailed(limit?: number): Promise<InboxEvent[]>;
    update(event: InboxEvent): Promise<void>;
    deleteOldCompleted(olderThanDays: number): Promise<number>;
    private toDomain;
    private toRow;
}
//# sourceMappingURL=SupabaseInboxRepository.d.ts.map