import { TenantId } from '../value-objects/TenantId';
export type DeadLetterFailureType = 'run_failed' | 'unroutable_message' | 'publish_failed';
export interface DeadLetterProps {
    id: string;
    runId?: string;
    scheduleId?: string;
    tenantId?: TenantId;
    errorMessage: string;
    errorStack?: string;
    attemptCount?: number;
    lastAttemptAtUtc?: Date;
    storedAtUtc: Date;
    messageId?: string;
    routingKey?: string;
    exchange?: string;
    payload?: Record<string, any>;
    headers?: Record<string, any>;
    failureType: DeadLetterFailureType;
}
export declare class DeadLetter {
    private readonly props;
    private constructor();
    /**
     * Create DeadLetter for failed run
     */
    static createForFailedRun(runId: string, scheduleId: string, tenantId: TenantId, errorMessage: string, errorStack: string | undefined, attemptCount: number, lastAttemptAtUtc: Date): DeadLetter;
    /**
     * Create DeadLetter for unroutable message
     */
    static createForUnroutableMessage(messageId: string, routingKey: string, exchange: string, payload: Record<string, any>, headers: Record<string, any>, errorMessage: string): DeadLetter;
    /**
     * Backward compatibility - use createForFailedRun instead
     * @deprecated Use createForFailedRun instead
     */
    static create(runId: string, scheduleId: string, tenantId: TenantId, errorMessage: string, errorStack: string | undefined, attemptCount: number, lastAttemptAtUtc: Date): DeadLetter;
    static reconstitute(props: DeadLetterProps): DeadLetter;
    getId(): string;
    getRunId(): string | undefined;
    getScheduleId(): string | undefined;
    getTenantId(): TenantId | undefined;
    getErrorMessage(): string;
    getErrorStack(): string | undefined;
    getAttemptCount(): number | undefined;
    getLastAttemptAtUtc(): Date | undefined;
    getStoredAtUtc(): Date;
    getMessageId(): string | undefined;
    getRoutingKey(): string | undefined;
    getExchange(): string | undefined;
    getPayload(): Record<string, any> | undefined;
    getHeaders(): Record<string, any> | undefined;
    getFailureType(): DeadLetterFailureType;
    getProps(): DeadLetterProps;
}
//# sourceMappingURL=DeadLetter.entity.d.ts.map