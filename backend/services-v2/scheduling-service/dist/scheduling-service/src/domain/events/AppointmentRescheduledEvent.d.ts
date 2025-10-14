/**
 * Appointment Rescheduled Event - Domain Layer
 * V2 Clean Architecture + DDD + Event-Driven Implementation
 * Vietnamese healthcare appointment rescheduling event
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, Vietnamese Healthcare Standards
 */
import { DomainEvent } from '@shared/domain/base/domain-event';
export interface AppointmentRescheduledEventData {
    appointmentId: string;
    patientId: string;
    providerId: string;
    originalStartTime: Date;
    originalEndTime: Date;
    newStartTime: Date;
    newEndTime: Date;
    rescheduleReason: string;
    rescheduledBy: string;
    rescheduledAt: Date;
    hoursNotice: number;
    reschedulePolicy: {
        feeApplied: boolean;
        freeRescheduleUsed: boolean;
        remainingFreeReschedules: number;
        rescheduleAmount?: number;
    };
    integrationEvents: {
        providerScheduleUpdate: {
            providerId: string;
            releaseTimeSlot: {
                timeSlotId: string;
                startTime: Date;
                endTime: Date;
                status: 'available';
            };
            bookTimeSlot: {
                timeSlotId: string;
                startTime: Date;
                endTime: Date;
                status: 'booked';
                appointmentId: string;
            };
            updatedAt: Date;
        };
        patientAppointmentHistory: {
            patientId: string;
            appointmentId: string;
            status: 'rescheduled';
            originalDate: Date;
            newDate: Date;
            rescheduleReason: string;
            rescheduledAt: Date;
            feeApplied: boolean;
        };
        notificationRequests: {
            patientNotification: {
                patientId: string;
                type: 'appointment_rescheduled';
                channels: ('sms' | 'email' | 'push')[];
                templateData: {
                    appointmentId: string;
                    originalDate: string;
                    originalTime: string;
                    newDate: string;
                    newTime: string;
                    rescheduleReason: string;
                    feeInfo?: string;
                    preparationInstructions?: string;
                };
                priority: 'normal' | 'high';
            };
            providerNotification: {
                providerId: string;
                type: 'appointment_rescheduled';
                channels: ('email' | 'push')[];
                templateData: {
                    appointmentId: string;
                    patientName: string;
                    originalDate: string;
                    originalTime: string;
                    newDate: string;
                    newTime: string;
                    rescheduleReason: string;
                    hoursNotice: number;
                };
                priority: 'normal';
            };
            reminderNotifications: {
                patientId: string;
                appointmentId: string;
                reminders: {
                    type: '24h' | '2h' | '30min';
                    scheduledFor: Date;
                    channels: ('sms' | 'email' | 'push')[];
                }[];
            };
        };
        billingUpdate?: {
            patientId: string;
            appointmentId: string;
            action: 'reschedule_fee' | 'no_charge';
            amount?: number;
            reason: string;
            processedAt: Date;
        };
        clinicalUpdate?: {
            patientId: string;
            providerId: string;
            appointmentId: string;
            updateMedicalRecord: boolean;
            rescheduleNote: string;
            newAppointmentTime: Date;
        };
    };
}
/**
 * Appointment Rescheduled Domain Event
 * Triggered when an appointment is rescheduled to a new time
 */
export declare class AppointmentRescheduledEvent extends DomainEvent {
    readonly appointmentId: string;
    readonly patientId: string;
    readonly providerId: string;
    readonly originalStartTime: Date;
    readonly originalEndTime: Date;
    readonly newStartTime: Date;
    readonly newEndTime: Date;
    readonly rescheduleReason: string;
    readonly rescheduledBy: string;
    constructor(appointmentId: string, patientId: string, providerId: string, originalStartTime: Date, originalEndTime: Date, newStartTime: Date, newEndTime: Date, rescheduleReason: string, rescheduledBy: string, correlationId?: string, causationId?: string, userId?: string);
    /**
     * Get event data payload (required by DomainEvent base class)
     */
    getEventData(): AppointmentRescheduledEventData;
    /**
     * Check if event contains PHI (required by DomainEvent base class)
     */
    containsPHI(): boolean;
    /**
     * Get patient ID (required for healthcare events)
     */
    getPatientId(): string | null;
    /**
     * Calculate Vietnamese healthcare reschedule policy
     */
    private static calculateReschedulePolicy;
    /**
     * Get patient notification channels based on notice time
     */
    private static getPatientNotificationChannels;
    /**
     * Generate reminder schedule for new appointment time
     */
    private static generateReminderSchedule;
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
}
//# sourceMappingURL=AppointmentRescheduledEvent.d.ts.map