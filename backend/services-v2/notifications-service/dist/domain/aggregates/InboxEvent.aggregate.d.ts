export type InboxEventStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export interface InboxEventProps {
    inboxId: string;
    idempotencyKey: string;
    eventType: string;
    payloadJson: any;
    headersJson: any;
    status: InboxEventStatus;
    receivedAtUtc: Date;
    processedAtUtc?: Date;
    errorMessage?: string;
    retryCount: number;
    lastRetryAtUtc?: Date;
    createdAtUtc: Date;
    updatedAtUtc: Date;
}
export declare class InboxEvent {
    private readonly props;
    private constructor();
    static create(idempotencyKey: string, eventType: string, payloadJson: any, headersJson?: any): InboxEvent;
    static reconstitute(props: InboxEventProps): InboxEvent;
    getInboxId(): string;
    getIdempotencyKey(): string;
    getEventType(): string;
    getPayloadJson(): any;
    getHeadersJson(): any;
    getStatus(): InboxEventStatus;
    getReceivedAtUtc(): Date;
    getProcessedAtUtc(): Date | undefined;
    getErrorMessage(): string | undefined;
    getRetryCount(): number;
    getLastRetryAtUtc(): Date | undefined;
    getProps(): InboxEventProps;
    markAsProcessing(): void;
    markAsCompleted(): void;
    markAsFailed(errorMessage: string): void;
    canRetry(maxRetries?: number): boolean;
    isProcessed(): boolean;
    isDuplicate(): boolean;
}
//# sourceMappingURL=InboxEvent.aggregate.d.ts.map