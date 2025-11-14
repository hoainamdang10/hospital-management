/**
 * NotificationFailedEvent - Domain Event
 * Fired when a notification fails to send
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from "../../../../shared/domain/base/domain-event";
export interface NotificationFailedEventData {
    notificationId: string;
    recipientId: string;
    failureReason: string;
    failedAt: Date;
    patientId?: string;
}
export declare class NotificationFailedEvent extends DomainEvent {
    readonly notificationId: string;
    readonly recipientId: string;
    readonly failureReason: string;
    readonly patientId?: string | undefined;
    constructor(notificationId: string, recipientId: string, failureReason: string, patientId?: string | undefined, correlationId?: string, userId?: string);
    getEventData(): NotificationFailedEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=NotificationFailedEvent.d.ts.map