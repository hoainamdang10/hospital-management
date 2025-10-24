/**
 * Notification Aggregate - Simplified for Scheduler Integration
 * V2 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Scheduler Integration
 */
import { HealthcareAggregateRoot } from "@shared/domain/base/aggregate-root";
import { DomainEvent } from "@shared/domain/base/domain-event";
import { NotificationId } from "../value-objects/NotificationId";
import { RecipientInfo } from "../value-objects/RecipientInfo";
import { NotificationContent } from "../value-objects/NotificationContent";
import { NotificationChannel } from "../value-objects/NotificationChannel";
import { DeliveryResult } from "../services/IDeliveryService";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export interface NotificationMetadata {
    correlationId?: string;
    userId?: string;
    sessionId?: string;
    source: string;
    healthcareContext?: {
        patientId?: string;
        doctorId?: string;
        appointmentId?: string;
        medicalRecordId?: string;
    };
}
export interface NotificationProps {
    notificationId: NotificationId;
    recipient: RecipientInfo;
    templateType: string;
    content: NotificationContent;
    channels: NotificationChannel[];
    status: NotificationStatus;
    priority: NotificationPriority;
    sentAt?: Date;
    deliveryResults?: DeliveryResult[];
    metadata: NotificationMetadata;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Notification Aggregate Root
 * Simplified version - chỉ handle sending, không có scheduling logic
 */
export declare class Notification extends HealthcareAggregateRoot<NotificationProps> {
    private constructor();
    get id(): string;
    get notificationId(): NotificationId;
    get recipient(): RecipientInfo;
    get templateType(): string;
    get content(): NotificationContent;
    get channels(): NotificationChannel[];
    get status(): NotificationStatus;
    get priority(): NotificationPriority;
    get sentAt(): Date | undefined;
    get deliveryResults(): DeliveryResult[] | undefined;
    get metadata(): NotificationMetadata;
    get createdAt(): Date;
    get updatedAt(): Date;
    getPatientId(): string | null;
    protected validateBusinessInvariants(): void;
    protected applyEvent(event: DomainEvent): void;
    static create(data: {
        recipient: RecipientInfo;
        templateType: string;
        content: NotificationContent;
        channels: NotificationChannel[];
        priority?: NotificationPriority;
        metadata?: Partial<NotificationMetadata>;
    }): Notification;
    markAsSent(deliveryResults: DeliveryResult[]): void;
    markAsFailed(channelFailures: Array<{
        channel: string;
        reason: string;
        errorMessage: string;
        retryable: boolean;
    }>): void;
    isPending(): boolean;
    isSent(): boolean;
    isFailed(): boolean;
    isUrgent(): boolean;
    /**
     * Validate entity state (required by Entity base class)
     */
    validate(): void;
    /**
     * Convert to persistence format (required by Entity base class)
     * Note: This is a minimal stub. Use NotificationMapper.toPersistence() for actual persistence.
     */
    toPersistence(): {
        id: string;
        notification_id: string;
    };
}
//# sourceMappingURL=Notification.d.ts.map