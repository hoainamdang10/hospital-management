/**
 * AppointmentNoShowEvent - Domain Event
 * Published when a patient doesn't show up for their appointment
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
/**
 * Appointment No-Show Event
 * Triggered when a patient doesn't show up for their scheduled appointment
 *
 * Subscribers:
 * - Notification Service (send no-show notification)
 * - Billing Service (apply no-show fee if applicable)
 * - Identity Service (track patient reliability)
 */
export declare class AppointmentNoShowEvent extends DomainEvent {
    readonly appointmentId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly scheduledDate: Date;
    readonly scheduledTime: string;
    readonly markedAt: Date;
    constructor(appointmentId: string, patientId: string, doctorId: string, scheduledDate: Date, scheduledTime: string, markedAt: Date);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=AppointmentNoShowEvent.d.ts.map