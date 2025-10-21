"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeadLetter = void 0;
class DeadLetter {
    constructor(props) {
        this.props = props;
    }
    /**
     * Create DeadLetter for failed run
     */
    static createForFailedRun(runId, scheduleId, tenantId, errorMessage, errorStack, attemptCount, lastAttemptAtUtc) {
        return new DeadLetter({
            id: '', // Will be set by database
            runId,
            scheduleId,
            tenantId,
            errorMessage,
            errorStack,
            attemptCount,
            lastAttemptAtUtc,
            storedAtUtc: new Date(),
            failureType: 'run_failed'
        });
    }
    /**
     * Create DeadLetter for unroutable message
     */
    static createForUnroutableMessage(messageId, routingKey, exchange, payload, headers, errorMessage) {
        return new DeadLetter({
            id: '', // Will be set by database
            messageId,
            routingKey,
            exchange,
            payload,
            headers,
            errorMessage,
            storedAtUtc: new Date(),
            failureType: 'unroutable_message'
        });
    }
    /**
     * Backward compatibility - use createForFailedRun instead
     * @deprecated Use createForFailedRun instead
     */
    static create(runId, scheduleId, tenantId, errorMessage, errorStack, attemptCount, lastAttemptAtUtc) {
        return DeadLetter.createForFailedRun(runId, scheduleId, tenantId, errorMessage, errorStack, attemptCount, lastAttemptAtUtc);
    }
    static reconstitute(props) {
        return new DeadLetter(props);
    }
    getId() {
        return this.props.id;
    }
    getRunId() {
        return this.props.runId;
    }
    getScheduleId() {
        return this.props.scheduleId;
    }
    getTenantId() {
        return this.props.tenantId;
    }
    getErrorMessage() {
        return this.props.errorMessage;
    }
    getErrorStack() {
        return this.props.errorStack;
    }
    getAttemptCount() {
        return this.props.attemptCount;
    }
    getLastAttemptAtUtc() {
        return this.props.lastAttemptAtUtc;
    }
    getStoredAtUtc() {
        return this.props.storedAtUtc;
    }
    getMessageId() {
        return this.props.messageId;
    }
    getRoutingKey() {
        return this.props.routingKey;
    }
    getExchange() {
        return this.props.exchange;
    }
    getPayload() {
        return this.props.payload;
    }
    getHeaders() {
        return this.props.headers;
    }
    getFailureType() {
        return this.props.failureType;
    }
    getProps() {
        return { ...this.props };
    }
}
exports.DeadLetter = DeadLetter;
//# sourceMappingURL=DeadLetter.entity.js.map