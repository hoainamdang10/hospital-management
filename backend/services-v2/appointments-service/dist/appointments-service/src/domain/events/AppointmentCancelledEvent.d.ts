/**
 * Appointment Cancelled Event - Domain Layer
 * V2 Clean Architecture + DDD + Event-Driven Implementation
 * Vietnamese healthcare appointment cancellation event
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, Vietnamese Healthcare Standards
 */
import { DomainEvent } from "@shared/domain/base/domain-event";
export interface AppointmentCancelledEventData {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    originalStartTime: Date;
    originalEndTime: Date;
    cancellationReason: string;
    cancelledBy: string;
    cancelledAt: Date;
    hoursNotice: number;
    cancellationPolicy: {
        penaltyApplied: boolean;
        refundEligible: boolean;
        rescheduleAllowed: boolean;
        penaltyAmount?: number;
        refundPercentage?: number;
    };
    integrationEvents: {
        providerScheduleUpdate: {
            doctorId: string;
            timeSlotId: string;
            startTime: Date;
            endTime: Date;
            status: "available";
            releasedAppointmentId: string;
            releasedAt: Date;
        };
        patientAppointmentHistory: {
            patientId: string;
            appointmentId: string;
            status: "cancelled";
            cancellationReason: string;
            cancelledAt: Date;
            penaltyApplied: boolean;
        };
        notificationRequests: {
            patientNotification: {
                patientId: string;
                type: "appointment_cancelled";
                channels: ("sms" | "email" | "push")[];
                templateData: {
                    appointmentId: string;
                    originalDate: string;
                    originalTime: string;
                    cancellationReason: string;
                    penaltyInfo?: string;
                    rescheduleInfo?: string;
                };
                priority: "normal" | "high";
            };
            providerNotification: {
                doctorId: string;
                type: "appointment_cancelled";
                channels: ("email" | "push")[];
                templateData: {
                    appointmentId: string;
                    patientName: string;
                    originalDate: string;
                    originalTime: string;
                    cancellationReason: string;
                    hoursNotice: number;
                };
                priority: "normal";
            };
        };
        billingUpdate?: {
            patientId: string;
            appointmentId: string;
            action: "refund" | "penalty" | "no_action";
            amount?: number;
            reason: string;
            processedAt: Date;
        };
        clinicalUpdate?: {
            patientId: string;
            doctorId: string;
            appointmentId: string;
            updateMedicalRecord: boolean;
            cancellationNote: string;
        };
    };
}
/**
 * Appointment Cancelled Domain Event
 * Triggered when an appointment is cancelled
 */
export declare class AppointmentCancelledEvent extends DomainEvent {
    readonly appointmentId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly originalStartTime: Date;
    readonly cancellationReason: string;
    readonly cancelledBy: string;
    readonly originalEndTime?: Date | undefined;
    constructor(appointmentId: string, patientId: string, doctorId: string, // Changed from providerId to doctorId
    originalStartTime: Date, cancellationReason: string, cancelledBy: string, originalEndTime?: Date | undefined, correlationId?: string, causationId?: string, userId?: string);
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData(): AppointmentCancelledEventData;
    /**
     * Check if event contains PHI (required by DomainEvent base class)
     */
    containsPHI(): boolean;
    /**
     * Get patient ID (required for healthcare events)
     */
    getPatientId(): string | null;
    /**
     * Calculate Vietnamese healthcare cancellation policy
     */
    private static calculateCancellationPolicy;
    /**
     * Get patient notification channels based on notice time
     */
    private static getPatientNotificationChannels;
    /**
     * Get Vietnamese policy description
     */
    private static getPolicyDescription;
    /**
     * Get integration events for specific service
     */
    getIntegrationEventsForService(serviceName: string): any;
    /**
     * Helper methods to get integration event parts
     */
    private getProviderScheduleUpdate;
    private getPatientAppointmentHistory;
    private getNotificationRequests;
    private getBillingUpdate;
    private getClinicalUpdate;
    /**
     * Override getRoutingKey to determine routing key based on cancellation policy
     * - Early cancellation (refund eligible) → 'appointment.cancelled'
     * - Late cancellation (penalty applied) → 'appointment.cancelled_late'
     */
    getRoutingKey(): string;
}
//# sourceMappingURL=AppointmentCancelledEvent.d.ts.map