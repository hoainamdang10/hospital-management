export type OutboxStatus = 'PENDING' | 'RESERVED' | 'SENT' | 'FAILED';
export interface OutboxEventRecord {
    id: string;
    event_type: string;
    aggregate_type: string;
    aggregate_id: string;
    payload_json: any;
    dedup_key?: string | null;
    status: OutboxStatus;
    attempts: number;
    next_retry_at: string;
    last_error?: string | null;
    created_at: string;
    updated_at: string;
}
export interface EnqueueParams {
    eventType: string;
    aggregateType: string;
    aggregateId: string;
    payload: any;
    dedupKey?: string;
}
export declare class OutboxRepository {
    private supabaseUrl;
    private supabaseKey;
    private supabase;
    private readonly table;
    constructor(supabaseUrl: string, supabaseKey: string);
    enqueue(params: EnqueueParams): Promise<void>;
    claimBatch(limit: number): Promise<OutboxEventRecord[]>;
    markSent(id: string): Promise<void>;
    markFailed(id: string, lastError: string, nextRetryAt: Date, attempts: number): Promise<void>;
}
//# sourceMappingURL=OutboxRepository.d.ts.map