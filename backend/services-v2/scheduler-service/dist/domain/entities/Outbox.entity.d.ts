export interface OutboxProps {
    outboxId: number;
    aggregateType: string;
    aggregateId: string;
    eventType: string;
    payloadJson: any;
    headersJson: any;
    occurredAtUtc: Date;
    publishedAtUtc?: Date;
    publishAttempts: number;
    lastPublishError?: string;
}
export declare class Outbox {
    private props;
    private constructor();
    static create(aggregateId: string, eventType: string, payloadJson: any, headersJson: any, aggregateType?: string): Outbox;
    static reconstitute(props: OutboxProps): Outbox;
    markAsPublished(): void;
    recordPublishAttempt(error?: string): void;
    isPublished(): boolean;
    shouldRetry(maxAttempts?: number): boolean;
    getOutboxId(): number;
    getAggregateId(): string;
    getEventType(): string;
    getPayloadJson(): any;
    getHeadersJson(): any;
    getProps(): Readonly<OutboxProps>;
}
//# sourceMappingURL=Outbox.entity.d.ts.map