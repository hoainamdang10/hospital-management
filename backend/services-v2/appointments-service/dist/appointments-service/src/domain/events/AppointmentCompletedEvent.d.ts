/**
 * AppointmentCompletedEvent - Domain Event
 * Published when appointment is completed
 * Subscribers: Clinical EMR Service, Billing Service, Notification Service
 * Note: consultationFee is provided as reference for billing-service to create invoice
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface AppointmentCompletedEventData {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    completedAt: Date;
    duration: number;
    notes?: string;
    consultationFee?: number;
}
export declare class AppointmentCompletedEvent extends DomainEvent {
    readonly appointmentId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly completedAt: Date;
    readonly duration: number;
    readonly notes?: string | undefined;
    readonly consultationFee?: number | undefined;
    constructor(appointmentId: string, patientId: string, doctorId: string, completedAt: Date, duration: number, notes?: string | undefined, consultationFee?: number | undefined, correlationId?: string, causationId?: string, userId?: string);
    getEventData(): AppointmentCompletedEventData;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=AppointmentCompletedEvent.d.ts.map