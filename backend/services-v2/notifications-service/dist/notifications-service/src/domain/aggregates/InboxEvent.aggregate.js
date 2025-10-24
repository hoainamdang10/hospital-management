"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboxEvent = void 0;
class InboxEvent {
    constructor(props) {
        this.props = props;
    }
    static create(idempotencyKey, eventType, payloadJson, headersJson = {}) {
        const now = new Date();
        return new InboxEvent({
            inboxId: '', // Will be set by database
            idempotencyKey,
            eventType,
            payloadJson,
            headersJson,
            status: 'PENDING',
            receivedAtUtc: now,
            retryCount: 0,
            createdAtUtc: now,
            updatedAtUtc: now
        });
    }
    static reconstitute(props) {
        return new InboxEvent(props);
    }
    // Getters
    getInboxId() {
        return this.props.inboxId;
    }
    getIdempotencyKey() {
        return this.props.idempotencyKey;
    }
    getEventType() {
        return this.props.eventType;
    }
    getPayloadJson() {
        return this.props.payloadJson;
    }
    getHeadersJson() {
        return this.props.headersJson;
    }
    getStatus() {
        return this.props.status;
    }
    getReceivedAtUtc() {
        return this.props.receivedAtUtc;
    }
    getProcessedAtUtc() {
        return this.props.processedAtUtc;
    }
    getErrorMessage() {
        return this.props.errorMessage;
    }
    getRetryCount() {
        return this.props.retryCount;
    }
    getLastRetryAtUtc() {
        return this.props.lastRetryAtUtc;
    }
    getProps() {
        return { ...this.props };
    }
    // State transitions
    markAsProcessing() {
        this.props.status = 'PROCESSING';
        this.props.updatedAtUtc = new Date();
    }
    markAsCompleted() {
        this.props.status = 'COMPLETED';
        this.props.processedAtUtc = new Date();
        this.props.updatedAtUtc = new Date();
    }
    markAsFailed(errorMessage) {
        this.props.status = 'FAILED';
        this.props.errorMessage = errorMessage;
        this.props.retryCount += 1;
        this.props.lastRetryAtUtc = new Date();
        this.props.updatedAtUtc = new Date();
    }
    // Business logic
    canRetry(maxRetries = 3) {
        return this.props.retryCount < maxRetries;
    }
    isProcessed() {
        return this.props.status === 'COMPLETED';
    }
    isDuplicate() {
        return this.props.status !== 'PENDING';
    }
}
exports.InboxEvent = InboxEvent;
//# sourceMappingURL=InboxEvent.aggregate.js.map