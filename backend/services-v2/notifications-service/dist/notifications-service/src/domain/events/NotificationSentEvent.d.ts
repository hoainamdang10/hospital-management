/**
 * NotificationSentEvent - Domain Event
 * Fired when a notification is successfully sent
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from "../../../../shared/domain/base/domain-event";
export interface NotificationSentEventData {
    notificationId: string;
    recipientId: string;
    channels: string[];
    sentAt: Date;
    patientId?: string;
}
export declare class NotificationSentEvent extends DomainEvent {
    readonly notificationId: string;
    readonly recipientId: string;
    readonly channels: string[];
    readonly patientId?: string | undefined;
    constructor(notificationId: string, recipientId: string, channels: string[], patientId?: string | undefined, correlationId?: string, userId?: string);
    getEventData(): NotificationSentEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=NotificationSentEvent.d.ts.map