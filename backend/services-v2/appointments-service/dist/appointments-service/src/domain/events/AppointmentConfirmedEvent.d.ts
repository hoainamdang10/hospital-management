/**
 * AppointmentConfirmedEvent - Domain Event
 * Published when appointment is confirmed
 * Subscribers: Notification Service, Doctor Service
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
import { DomainEvent } from '../../../../shared/domain/base/domain-event';
export interface AppointmentConfirmedEventData {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    confirmedAt: Date;
    confirmationMethod: string;
}
export declare class AppointmentConfirmedEvent extends DomainEvent {
    readonly appointmentId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly confirmedAt: Date;
    readonly confirmationMethod: string;
    constructor(appointmentId: string, patientId: string, doctorId: string, confirmedAt: Date, confirmationMethod: string, correlationId?: string, causationId?: string, userId?: string);
    getEventData(): AppointmentConfirmedEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=AppointmentConfirmedEvent.d.ts.map