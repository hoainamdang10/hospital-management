/**
 * Appointment Event Consumer - Infrastructure Layer
 * Consumes appointment events from Appointments Service
 * Handles appointment notifications, reminders, confirmations, and status updates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { IInboxRepository } from "../../domain/repositories/IInboxRepository";
import { SendNotificationUseCase } from "../../application/use-cases/SendNotificationUseCase";
import { GetNotificationPreferencesUseCase } from "../../application/use-cases/GetNotificationPreferencesUseCase";
import { CreateAppointmentRemindersUseCase } from "../../application/use-cases/CreateAppointmentRemindersUseCase";
import { IAppointmentReminderRepository } from "../../domain/repositories/IAppointmentReminderRepository";
export interface AppointmentEventConsumerConfig {
    rabbitmqUrl: string;
    queueName: string;
    exchangeName: string;
    routingKeys: string[];
    prefetchCount?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
}
export interface AppointmentScheduledEventData {
    appointmentId: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    departmentId: string;
    departmentName: string;
    appointmentDate: Date;
    appointmentTime: string;
    durationMinutes: number;
    type: string;
    priority: string;
    status: string;
    consultationFee: number;
    createdBy: string;
    scheduledAt: Date;
    notes?: string;
}
export interface AppointmentConfirmedEventData {
    appointmentId: string;
    patientId: string;
    patientName?: string;
    doctorId: string;
    doctorName?: string;
    departmentId?: string;
    departmentName?: string;
    appointmentDate: Date;
    appointmentTime: string;
    durationMinutes?: number;
    consultationFee?: number;
    confirmedBy: string;
    confirmedAt: Date;
    previousStatus: string;
}
export interface AppointmentCancelledEventData {
    appointmentId: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    appointmentDate: Date;
    appointmentTime: string;
    cancelledBy: string;
    cancelledAt: Date;
    cancellationReason: string;
    refundAmount?: number;
    cancellationFee?: number;
}
export interface AppointmentCompletedEventData {
    appointmentId: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    appointmentDate: Date;
    appointmentTime: string;
    completedBy: string;
    completedAt: Date;
    outcome: string;
    followUpRequired: boolean;
    followUpDate?: Date;
    notes?: string;
    prescriptionProvided: boolean;
    labTestsOrdered: boolean;
}
export interface AppointmentRescheduledEventData {
    appointmentId: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    oldDate: Date;
    oldTime: string;
    newDate: Date;
    newTime: string;
    rescheduledBy: string;
    rescheduledAt: Date;
    reason: string;
}
export interface AppointmentReminderEventData {
    appointmentId: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    appointmentDate: Date;
    appointmentTime: string;
    reminderType: "24_hours" | "2_hours" | "30_minutes";
    reminderSentAt: Date;
    departmentName: string;
    address?: string;
    specialInstructions?: string[];
}
export interface AppointmentNoShowEventData {
    appointmentId: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    appointmentDate: Date;
    appointmentTime: string;
    markedBy: string;
    markedAt: Date;
    noShowFee?: number;
    rescheduleOffered: boolean;
}
/**
 * AppointmentEventConsumer - Handles appointment events for notifications
 */
export declare class AppointmentEventConsumer {
    private config;
    private sendNotificationUseCase;
    private getNotificationPreferencesUseCase;
    private createAppointmentRemindersUseCase;
    private appointmentReminderRepo;
    private inboxRepo;
    private connection?;
    private channel?;
    private isConnected;
    private reconnecting;
    constructor(config: AppointmentEventConsumerConfig, sendNotificationUseCase: SendNotificationUseCase, getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase, createAppointmentRemindersUseCase: CreateAppointmentRemindersUseCase, appointmentReminderRepo: IAppointmentReminderRepository, inboxRepo: IInboxRepository);
    /**
     * Connect to RabbitMQ and start consuming
     */
    connect(): Promise<void>;
    private setupConnectionListeners;
    private triggerReconnect;
    private closeConnectionSilently;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Handle appointment scheduled event
     *
     * ⚠️ REFACTORED FOR MVP:
     * - Send "yêu cầu đã nhận, vui lòng thanh toán" notification
     * - DO NOT create reminders yet (waiting for payment confirmation)
     * - Use new template: APPOINTMENT_SCHEDULED
     */
    private handleAppointmentScheduled;
    /**
     * Handle appointment confirmed event (after payment completed)
     *
     * ✅ REFACTORED FOR MVP:
     * - Send "lịch hẹn đã được xác nhận" notification
     * - Create appointment reminders (24H, 2H, 30M)
     * - Notify both patient AND doctor
     * - Use new template: APPOINTMENT_CONFIRMED
     */
    private handleAppointmentConfirmed;
    /**
     * Handle appointment cancelled event
     *
     * ✅ REFACTORED FOR MVP:
     * - Send cancellation notification (payment timeout or user cancellation)
     * - Cancel all pending reminders
     * - Notify both patient AND doctor
     * - Use new template: APPOINTMENT_CANCELLED
     */
    private handleAppointmentCancelled;
    /**
     * Handle appointment completed event
     */
    private handleAppointmentCompleted;
    /**
     * Handle appointment rescheduled event
     */
    private handleAppointmentRescheduled;
    /**
     * Handle appointment reminder event
     */
    private handleAppointmentReminder;
    /**
     * Handle appointment no-show event
     */
    private handleAppointmentNoShow;
    /**
     * Send appointment confirmation to patient
     */
    private sendAppointmentConfirmationToPatient;
    /**
     * Send appointment notification to doctor
     */
    private sendAppointmentNotificationToDoctor;
    /**
     * Send urgent appointment notification
     */
    private sendUrgentAppointmentNotification;
    /**
     * Schedule appointment reminders (creates reminder records in database)
     */
    private scheduleAppointmentReminders;
    /**
     * Generate appointment confirmation content
     */
    private generateAppointmentConfirmationContent;
    /**
     * Generate doctor appointment content
     */
    private generateDoctorAppointmentContent;
    /**
     * Generate reminder content
     */
    private generateReminderContent;
    /**
     * Get enabled channels based on preferences
     */
    private getEnabledChannels;
    /**
     * Map priority from appointment system to notification system
     */
    private mapPriority;
    /**
     * Format date for Vietnamese locale
     */
    private formatDate;
    private formatTime;
    /**
     * Send appointment confirmed notification
     */
    private sendAppointmentConfirmedNotification;
    /**
     * Send doctor appointment confirmed notification
     */
    private sendDoctorAppointmentConfirmedNotification;
    /**
     * Send appointment cancelled notification
     */
    private sendAppointmentCancelledNotification;
    /**
     * Send doctor appointment cancelled notification
     */
    private sendDoctorAppointmentCancelledNotification;
    /**
     * Send refund notification
     */
    private sendRefundNotification;
    /**
     * Send appointment completed notification
     */
    private sendAppointmentCompletedNotification;
    /**
     * Send follow-up notification
     */
    private sendFollowUpNotification;
    /**
     * Send prescription notification
     */
    private sendPrescriptionNotification;
    /**
     * Send lab test notification
     */
    private sendLabTestNotification;
    /**
     * Send appointment rescheduled notification
     */
    private sendAppointmentRescheduledNotification;
    /**
     * Send doctor appointment rescheduled notification
     */
    private sendDoctorAppointmentRescheduledNotification;
    /**
     * Update reminder schedules (cancel old reminders and create new ones for rescheduled appointment)
     */
    private updateReminderSchedules;
    /**
     * Send appointment reminder notification
     */
    private sendAppointmentReminderNotification;
    /**
     * Send doctor reminder notification
     */
    private sendDoctorReminderNotification;
    /**
     * Send no-show notification
     */
    private sendNoShowNotification;
    /**
     * Send doctor no-show notification
     */
    private sendDoctorNoShowNotification;
    /**
     * Send reschedule offer
     */
    private sendRescheduleOffer;
    /**
     * Disconnect from RabbitMQ
     */
    disconnect(): Promise<void>;
    /**
     * Check if consumer is connected
     */
    isConsumerConnected(): boolean;
}
//# sourceMappingURL=AppointmentEventConsumer.d.ts.map