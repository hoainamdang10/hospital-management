/**
 * Appointment Checked-In Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface AppointmentCheckedInEventData {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    checkedInAt: Date;
    priority: string;
}
/**
 * Appointment Checked-In Event
 * Emitted when patient checks in for appointment
 */
export declare class AppointmentCheckedInEvent extends DomainEvent {
    readonly appointmentId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly checkedInAt: Date;
    readonly priority: string;
    constructor(appointmentId: string, patientId: string, doctorId: string, checkedInAt: Date, priority: string, correlationId?: string, causationId?: string, userId?: string);
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData(): AppointmentCheckedInEventData;
    /**
     * Check if event contains PHI (required by DomainEvent base class)
     */
    containsPHI(): boolean;
    /**
     * Get patient ID (required for healthcare events)
     */
    getPatientId(): string | null;
    /**
     * Get payload for event publishing
     */
    getPayload(): AppointmentCheckedInEventData;
}
//# sourceMappingURL=AppointmentCheckedInEvent.d.ts.map