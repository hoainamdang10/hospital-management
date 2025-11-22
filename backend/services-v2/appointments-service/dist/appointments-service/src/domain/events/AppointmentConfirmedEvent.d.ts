/**
 * Appointment Confirmed Event - Domain Layer
 * V3 Clean Architecture + DDD Implementation
 *
 * @author Hospital Management Team
 * @version 3.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, HIPAA
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface AppointmentConfirmedEventData {
    appointmentId: string;
    patientId: string;
    patientName?: string;
    doctorId: string;
    doctorName?: string;
    departmentId?: string;
    departmentName?: string;
    appointmentDate: string;
    appointmentTime: string;
    durationMinutes?: number;
    consultationFee?: number;
    confirmedAt: Date;
    confirmedBy: string;
    confirmationMethod?: 'sms' | 'email' | 'phone' | 'manual' | 'payment_completed';
}
/**
 * Appointment Confirmed Event
 * Emitted when patient confirms attendance for scheduled appointment
 */
export declare class AppointmentConfirmedEvent extends DomainEvent {
    readonly appointmentId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly appointmentDate: string;
    readonly appointmentTime: string;
    readonly confirmedBy: string;
    readonly confirmationMethod?: "sms" | "email" | "phone" | "manual" | "payment_completed" | undefined;
    readonly patientName?: string | undefined;
    readonly doctorName?: string | undefined;
    readonly departmentId?: string | undefined;
    readonly departmentName?: string | undefined;
    readonly durationMinutes?: number | undefined;
    readonly consultationFee?: number | undefined;
    constructor(appointmentId: string, patientId: string, doctorId: string, appointmentDate: string, appointmentTime: string, confirmedBy: string, confirmationMethod?: "sms" | "email" | "phone" | "manual" | "payment_completed" | undefined, patientName?: string | undefined, doctorName?: string | undefined, departmentId?: string | undefined, departmentName?: string | undefined, durationMinutes?: number | undefined, consultationFee?: number | undefined, correlationId?: string, causationId?: string, userId?: string);
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData(): AppointmentConfirmedEventData;
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
    getPayload(): AppointmentConfirmedEventData;
}
//# sourceMappingURL=AppointmentConfirmedEvent.d.ts.map