"use strict";
/**
 * Notification Aggregate - Simplified for Scheduler Integration
 * V2 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Scheduler Integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
const aggregate_root_1 = require("@shared/domain/base/aggregate-root");
const NotificationSentEvent_1 = require("../events/NotificationSentEvent");
const NotificationFailedEvent_1 = require("../events/NotificationFailedEvent");
const NotificationId_1 = require("../value-objects/NotificationId");
/**
 * Notification Aggregate Root
 * Simplified version - chỉ handle sending, không có scheduling logic
 */
class Notification extends aggregate_root_1.HealthcareAggregateRoot {
    constructor(props, id) {
        super(props, id);
    }
    // ==================== Getters ====================
    get id() {
        return this.props.notificationId.value;
    }
    get notificationId() {
        return this.props.notificationId;
    }
    getId() {
        return this.props.notificationId;
    }
    get recipient() {
        return this.props.recipient;
    }
    getRecipient() {
        return this.props.recipient;
    }
    get templateType() {
        return this.props.templateType;
    }
    get content() {
        return this.props.content;
    }
    getContent() {
        return this.props.content;
    }
    get channels() {
        return this.props.channels;
    }
    getChannels() {
        return this.props.channels;
    }
    get status() {
        return this.props.status;
    }
    getStatus() {
        return this.props.status;
    }
    get priority() {
        return this.props.priority;
    }
    getPriority() {
        return this.props.priority;
    }
    get sentAt() {
        return this.props.sentAt;
    }
    getSentAt() {
        return this.props.sentAt;
    }
    get deliveryResults() {
        return this.props.deliveryResults;
    }
    get metadata() {
        return this.props.metadata;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    get deliveredAt() {
        return this.props.deliveredAt;
    }
    getDeliveredAt() {
        return this.props.deliveredAt;
    }
    get readAt() {
        return this.props.readAt;
    }
    getReadAt() {
        return this.props.readAt;
    }
    getHealthcareContext() {
        return this.props.metadata.healthcareContext;
    }
    getCreatedAt() {
        return this.props.createdAt;
    }
    // ==================== Abstract Methods Implementation ====================
    getPatientId() {
        return this.props.metadata.healthcareContext?.patientId || null;
    }
    validateBusinessInvariants() {
        if (!this.props.recipient) {
            throw new Error("Recipient không được để trống");
        }
        if (!this.props.content) {
            throw new Error("Content không được để trống");
        }
        if (!this.props.channels || this.props.channels.length === 0) {
            throw new Error("Phải có ít nhất một channel");
        }
    }
    applyEvent(event) {
        switch (event.eventType) {
            case "NotificationSent":
                this.props.status = "SENT";
                this.props.sentAt = new Date();
                this.props.updatedAt = new Date();
                break;
            case "NotificationFailed":
                this.props.status = "FAILED";
                this.props.updatedAt = new Date();
                break;
            default:
                break;
        }
    }
    // ==================== Factory Method ====================
    static create(data) {
        const notificationId = NotificationId_1.NotificationId.create();
        const priority = data.priority || "NORMAL";
        const metadata = {
            source: data.metadata?.source || "notifications-service",
            correlationId: data.metadata?.correlationId,
            userId: data.metadata?.userId,
            sessionId: data.metadata?.sessionId,
            healthcareContext: data.metadata?.healthcareContext,
        };
        const props = {
            notificationId,
            recipient: data.recipient,
            templateType: data.templateType,
            content: data.content,
            channels: data.channels,
            status: "PENDING",
            priority,
            sentAt: undefined,
            deliveredAt: undefined,
            readAt: undefined,
            deliveryResults: undefined,
            metadata,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const notification = new Notification(props, notificationId.value);
        notification.validateInvariants();
        return notification;
    }
    // ==================== Business Methods ====================
    markAsSent(deliveryResults) {
        if (this.props.status !== "PENDING") {
            throw new Error("Chỉ có thể mark as sent cho notification PENDING");
        }
        this.props.status = "SENT";
        this.props.sentAt = new Date();
        this.props.deliveryResults = deliveryResults;
        this.props.updatedAt = new Date();
        // Raise domain event
        const channels = deliveryResults.map(r => r.channel);
        const event = new NotificationSentEvent_1.NotificationSentEvent(this.props.notificationId.value, this.props.recipient.getRecipientId(), channels, this.props.metadata.healthcareContext?.patientId, this.props.metadata.correlationId, this.props.metadata.userId);
        this.addDomainEvent(event);
    }
    markAsFailed(channelFailures) {
        if (this.props.status !== "PENDING") {
            throw new Error("Chỉ có thể mark as failed cho notification PENDING");
        }
        this.props.status = "FAILED";
        this.props.updatedAt = new Date();
        // Raise domain event
        const failureReason = channelFailures.map(f => `${f.channel}: ${f.errorMessage}`).join('; ');
        const event = new NotificationFailedEvent_1.NotificationFailedEvent({
            notificationId: this.props.notificationId.value,
            recipientId: this.props.recipient.getRecipientId(),
            channel: channelFailures.length > 0 ? channelFailures[0].channel : 'UNKNOWN',
            errorCode: 'DELIVERY_FAILED',
            errorMessage: failureReason,
            attemptCount: 1,
            timestamp: new Date()
        }, this.props.notificationId.value);
        this.addDomainEvent(event);
    }
    // ==================== Queries ====================
    isPending() {
        return this.props.status === "PENDING";
    }
    isSent() {
        return this.props.status === "SENT";
    }
    isFailed() {
        return this.props.status === "FAILED";
    }
    isUrgent() {
        return this.props.priority === "URGENT";
    }
    isRead() {
        return this.props.readAt !== undefined && this.props.readAt !== null;
    }
    isUnread() {
        return !this.isRead();
    }
    // ==================== Required Abstract Methods ====================
    /**
     * Validate entity state (required by Entity base class)
     */
    validate() {
        this.validateInvariants();
    }
    /**
     * Convert to persistence format (required by Entity base class)
     * Note: This is a minimal stub. Use NotificationMapper.toPersistence() for actual persistence.
     */
    toPersistence() {
        return {
            id: this.id,
            notification_id: this.props.notificationId.value
        };
    }
}
exports.Notification = Notification;
//# sourceMappingURL=Notification.js.map