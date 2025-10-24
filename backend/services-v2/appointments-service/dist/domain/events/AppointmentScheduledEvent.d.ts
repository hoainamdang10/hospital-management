/**
 * Appointment Scheduled Event - Domain Layer
 * V2 Clean Architecture + DDD + Event-Driven Implementation
 * Vietnamese healthcare appointment scheduling event
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, Vietnamese Healthcare Standards
 */
import { DomainEvent } from '../../shared/domain/base/domain-event';
export declare enum AppointmentType {
    CONSULTATION = "consultation",
    FOLLOW_UP = "follow_up",
    EMERGENCY = "emergency",
    TELEMEDICINE = "telemedicine",
    SURGERY = "surgery",
    PROCEDURE = "procedure"
}
export declare enum AppointmentPriority {
    ROUTINE = "routine",
    URGENT = "urgent",
    EMERGENCY = "emergency",
    STAT = "stat"
}
export interface AppointmentScheduledEventData {
    appointmentId: string;
    patientId: string;
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    appointmentType: AppointmentType;
    priority: AppointmentPriority;
    roomId?: string;
    estimatedDuration: number;
    requiresPreparation: boolean;
    scheduledBy: string;
    scheduledAt: Date;
    urgencyLevel: 'routine' | 'urgent' | 'emergency';
    specialRequirements?: string[];
    interpreterRequired?: boolean;
    wheelchairAccessible?: boolean;
    integrationEvents: {
        providerScheduleUpdate: {
            providerId: string;
            timeSlotId: string;
            startTime: Date;
            endTime: Date;
            status: 'booked';
            appointmentId: string;
            patientId: string;
        };
        patientAppointmentHistory: {
            patientId: string;
            appointmentId: string;
            appointmentType: AppointmentType;
            providerId: string;
            department: string;
            scheduledAt: Date;
            status: 'scheduled';
        };
        notificationRequests: {
            patientNotification: {
                patientId: string;
                type: 'appointment_scheduled';
                channels: ('sms' | 'email' | 'push')[];
                templateData: {
                    appointmentId: string;
                    providerName: string;
                    department: string;
                    appointmentDate: string;
                    appointmentTime: string;
                    preparationInstructions?: string;
                };
                scheduledFor: Date;
                priority: 'normal' | 'high' | 'urgent';
            };
            providerNotification: {
                providerId: string;
                type: 'new_appointment';
                channels: ('email' | 'push')[];
                templateData: {
                    appointmentId: string;
                    patientName: string;
                    appointmentDate: string;
                    appointmentTime: string;
                    reason: string;
                    urgencyLevel: string;
                };
                scheduledFor: Date;
                priority: 'normal' | 'high';
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
        clinicalPreparation?: {
            patientId: string;
            providerId: string;
            appointmentId: string;
            appointmentType: AppointmentType;
            reason: string;
            prepareMedicalRecord: boolean;
            reviewPreviousRecords: boolean;
            specialInstructions?: string;
        };
    };
}
/**
 * Appointment Scheduled Domain Event
 * Triggered when a new appointment is successfully scheduled
 */
export declare class AppointmentScheduledEvent extends DomainEvent<AppointmentScheduledEventData> {
    constructor(appointmentId: string, patientId: string, providerId: string, startTime: Date, endTime: Date, reason: string, appointmentType: AppointmentType, priority: AppointmentPriority, scheduledBy: string, department?: string, roomId?: string, estimatedDuration?: number, requiresPreparation?: boolean, urgencyLevel?: 'routine' | 'urgent' | 'emergency', specialRequirements?: string[], interpreterRequired?: boolean, wheelchairAccessible?: boolean);
    /**
     * Get patient notification channels based on priority and urgency
     */
    private static getPatientNotificationChannels;
    /**
     * Get notification priority
     */
    private static getNotificationPriority;
    /**
     * Generate reminder schedule based on urgency
     */
    private static generateReminderSchedule;
    /**
     * Check if appointment type requires special handling
     */
    private static requiresSpecialHandling;
    /**
     * Check if appointment is within business hours
     */
    private static isWithinBusinessHours;
    /**
     * Check if clinical record preparation is needed
     */
    private static shouldPrepareClinicalRecord;
    /**
     * Get Vietnamese department display name
     */
    private static getDepartmentDisplayName;
    /**
     * Get Vietnamese urgency level display name
     */
    private static getUrgencyDisplayName;
    /**
     * Get integration events for specific service
     */
    getIntegrationEventsForService(serviceName: string): any;
}
//# sourceMappingURL=AppointmentScheduledEvent.d.ts.map