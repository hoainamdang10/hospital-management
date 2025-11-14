import { InboxEvent, InboxEventStatus } from '../aggregates/InboxEvent.aggregate';

export interface ProcessEventIdempotentResult {
  isNew: boolean;
  inboxId: string;
  status: InboxEventStatus;
}

export interface IInboxRepository {
  /**
   * Check if event exists by idempotency key
   */
  exists(idempotencyKey: string): Promise<boolean>;

  /**
   * Store event in inbox
   */
  store(event: {
    idempotencyKey: string;
    eventType: string;
    payload: any;
    headers?: any;
  }): Promise<string>;

  /**
   * Atomically insert event or detect duplicate
   * 
   * Uses INSERT ... ON CONFLICT DO NOTHING for race-free operation.
   * Returns is_new=true if event is new, is_new=false if duplicate.
   * 
   * @param idempotencyKey - Unique key for deduplication
   * @param eventType - Type of event
   * @param payloadJson - Event payload
   * @param headersJson - Event headers
   * @returns Result with is_new flag, inbox_id, and status
   */
  processEventIdempotent(
    idempotencyKey: string,
    eventType: string,
    payloadJson: any,
    headersJson?: any
  ): Promise<ProcessEventIdempotentResult>;

  /**
   * Find event by idempotency key
   */
  findByIdempotencyKey(idempotencyKey: string): Promise<InboxEvent | null>;

  /**
   * Find event by inbox ID
   */
  findById(inboxId: string): Promise<InboxEvent | null>;

  /**
   * Find pending events (for processing)
   */
  findPending(limit?: number): Promise<InboxEvent[]>;

  /**
   * Find failed events (for retry)
   */
  findFailed(limit?: number): Promise<InboxEvent[]>;

  /**
   * Update event status
   */
  update(event: InboxEvent): Promise<void>;

  /**
   * Delete old completed events (cleanup)
   * 
   * @param olderThanDays - Delete events older than N days
   * @returns Number of deleted events
   */
  deleteOldCompleted(olderThanDays: number): Promise<number>;
}
