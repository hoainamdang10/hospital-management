/**
 * Notification Failed Event
 * Emitted when a notification fails to send
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface NotificationFailedEventData {
    notificationId: string;
    recipientId: string;
    channel: string;
    errorCode: string;
    errorMessage: string;
    attemptCount: number;
    timestamp: Date;
}
export declare class NotificationFailedEvent extends DomainEvent {
    readonly eventData: NotificationFailedEventData;
    constructor(eventData: NotificationFailedEventData, aggregateId: string);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=NotificationFailedEvent.d.ts.map