"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Outbox = void 0;
class Outbox {
    constructor(props) {
        this.props = props;
    }
    static create(aggregateId, eventType, payloadJson, headersJson, aggregateType = 'schedule_run') {
        return new Outbox({
            outboxId: 0,
            aggregateType,
            aggregateId,
            eventType,
            payloadJson,
            headersJson,
            occurredAtUtc: new Date(),
            publishAttempts: 0
        });
    }
    static reconstitute(props) {
        return new Outbox(props);
    }
    markAsPublished() {
        if (this.props.publishedAtUtc) {
            throw new Error('Outbox entry already published');
        }
        this.props.publishedAtUtc = new Date();
    }
    recordPublishAttempt(error) {
        this.props.publishAttempts += 1;
        if (error) {
            this.props.lastPublishError = error;
        }
    }
    isPublished() {
        return this.props.publishedAtUtc !== undefined;
    }
    shouldRetry(maxAttempts = 5) {
        return !this.isPublished() && this.props.publishAttempts < maxAttempts;
    }
    getOutboxId() {
        return this.props.outboxId;
    }
    getAggregateId() {
        return this.props.aggregateId;
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
    getProps() {
        return { ...this.props };
    }
}
exports.Outbox = Outbox;
//# sourceMappingURL=Outbox.entity.js.map