/**
 * Staff Event Consumer - Infrastructure Layer
 * Consumes staff events from Provider Staff Service
 * Handles staff notifications for schedules, assignments, availability, and updates
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { IInboxRepository } from '../../domain/repositories/IInboxRepository';
import { SendNotificationUseCase } from '../../application/use-cases/SendNotificationUseCase';
import { GetNotificationPreferencesUseCase } from '../../application/use-cases/GetNotificationPreferencesUseCase';
export interface StaffEventConsumerConfig {
    rabbitmqUrl: string;
    queueName: string;
    exchangeName: string;
    routingKeys: string[];
    prefetchCount?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
}
export interface StaffAvailabilityChangedEventData {
    staffId: string;
    staffName: string;
    staffType: string;
    departmentId: string;
    departmentName: string;
    availabilityStatus: 'available' | 'unavailable' | 'on_leave' | 'sick' | 'emergency';
    reason?: string;
    startTime?: Date;
    endTime?: Date;
    updatedBy: string;
    updatedAt: Date;
    affectedAppointments?: string[];
}
export interface StaffShiftAssignedEventData {
    staffId: string;
    staffName: string;
    staffType: string;
    departmentId: string;
    departmentName: string;
    shiftId: string;
    shiftType: string;
    startTime: Date;
    endTime: Date;
    isRecurring: boolean;
    recurringPattern?: {
        frequency: 'daily' | 'weekly' | 'monthly';
        daysOfWeek?: number[];
        endDate?: Date;
    };
    assignedBy: string;
    assignedAt: Date;
    notes?: string;
}
export interface StaffShiftCancelledEventData {
    staffId: string;
    staffName: string;
    staffType: string;
    departmentId: string;
    departmentName: string;
    shiftId: string;
    shiftType: string;
    originalStartTime: Date;
    originalEndTime: Date;
    cancelledBy: string;
    cancelledAt: Date;
    cancellationReason: string;
    affectedAppointments?: string[];
}
export interface StaffScheduleUpdatedEventData {
    staffId: string;
    staffName: string;
    staffType: string;
    departmentId: string;
    departmentName: string;
    updateType: 'vacation' | 'sick_leave' | 'emergency' | 'availability_change' | 'schedule_pattern';
    oldSchedule?: {
        startDate: Date;
        endDate: Date;
        pattern: string;
    };
    newSchedule?: {
        startDate: Date;
        endDate: Date;
        pattern: string;
    };
    updatedBy: string;
    updatedAt: Date;
    reason?: string;
    affectedAppointments?: string[];
}
export interface StaffDepartmentAssignedEventData {
    staffId: string;
    staffName: string;
    staffType: string;
    oldDepartmentId?: string;
    oldDepartmentName?: string;
    newDepartmentId: string;
    newDepartmentName: string;
    assignedBy: string;
    assignedAt: Date;
    effectiveDate: Date;
    role?: string;
    permissions?: string[];
}
export interface StaffOnCallAssignedEventData {
    staffId: string;
    staffName: string;
    staffType: string;
    departmentId: string;
    departmentName: string;
    onCallType: 'primary' | 'secondary' | 'backup';
    startTime: Date;
    endTime: Date;
    assignedBy: string;
    assignedAt: Date;
    contactNumber?: string;
    escalationContact?: string;
}
export interface StaffPerformanceReviewEventData {
    staffId: string;
    staffName: string;
    staffType: string;
    departmentId: string;
    departmentName: string;
    reviewType: 'monthly' | 'quarterly' | 'annual' | 'special';
    reviewPeriod: {
        startDate: Date;
        endDate: Date;
    };
    overallRating: number;
    categories: {
        clinical: number;
        communication: number;
        teamwork: number;
        professionalism: number;
    };
    strengths: string[];
    areasForImprovement: string[];
    reviewedBy: string;
    reviewedAt: Date;
    nextReviewDate: Date;
}
/**
 * StaffEventConsumer - Handles staff events for notifications
 */
export declare class StaffEventConsumer {
    private config;
    private sendNotificationUseCase;
    private getNotificationPreferencesUseCase;
    private inboxRepo;
    private connection?;
    private channel?;
    private isConnected;
    constructor(config: StaffEventConsumerConfig, sendNotificationUseCase: SendNotificationUseCase, getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase, inboxRepo: IInboxRepository);
    /**
     * Connect to RabbitMQ and start consuming
     */
    connect(): Promise<void>;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Handle staff availability changed event
     */
    private handleStaffAvailabilityChanged;
    /**
     * Handle staff shift assigned event
     */
    private handleStaffShiftAssigned;
    /**
     * Handle staff shift cancelled event
     */
    private handleStaffShiftCancelled;
    /**
     * Handle staff schedule updated event
     */
    private handleStaffScheduleUpdated;
    /**
     * Handle staff department assigned event
     */
    private handleStaffDepartmentAssigned;
    /**
     * Handle staff on-call assigned event
     */
    private handleStaffOnCallAssigned;
    /**
     * Handle staff performance review event
     */
    private handleStaffPerformanceReview;
    /**
     * Send availability change notification to staff
     */
    private sendAvailabilityChangeNotification;
    /**
     * Send critical availability notification to department manager
     */
    private sendCriticalAvailabilityNotification;
    /**
     * Send notification to affected patients
     */
    private sendAffectedPatientsNotification;
    /**
     * Send shift assignment notification to staff
     */
    private sendShiftAssignmentNotification;
    /**
     * Send critical shift notification to department manager
     */
    private sendCriticalShiftNotification;
    /**
     * Send calendar invitation
     */
    private sendCalendarInvitation;
    /**
     * Send shift cancellation notification to staff
     */
    private sendShiftCancellationNotification;
    /**
     * Send shift cancellation notification to department manager
     */
    private sendShiftCancellationManagerNotification;
    /**
     * Send shift cancellation notification to affected patients
     */
    private sendShiftCancellationPatientsNotification;
    /**
     * Send schedule update notification to staff
     */
    private sendScheduleUpdateNotification;
    /**
     * Send emergency schedule notification
     */
    private sendEmergencyScheduleNotification;
    /**
     * Send schedule update notification to affected patients
     */
    private sendScheduleUpdatePatientsNotification;
    /**
     * Send department assignment notification to staff
     */
    private sendDepartmentAssignmentNotification;
    /**
     * Send department welcome notification
     */
    private sendDepartmentWelcomeNotification;
    /**
     * Send department transfer notification
     */
    private sendDepartmentTransferNotification;
    /**
     * Send on-call assignment notification to staff
     */
    private sendOnCallAssignmentNotification;
    /**
     * Send primary on-call notification
     */
    private sendPrimaryOnCallNotification;
    /**
     * Send on-call schedule notification
     */
    private sendOnCallScheduleNotification;
    /**
     * Send performance review notification to staff
     */
    private sendPerformanceReviewNotification;
    /**
     * Send performance review notification to manager
     */
    private sendPerformanceReviewManagerNotification;
    /**
     * Schedule improvement follow-up
     */
    private scheduleImprovementFollowUp;
    /**
     * Get enabled channels based on preferences
     */
    private getEnabledChannels;
    /**
     * Get rating text
     */
    private getRatingText;
    /**
     * Format date for Vietnamese locale
     */
    private formatDate;
    /**
     * Format date and time for Vietnamese locale
     */
    private formatDateTime;
    /**
     * Disconnect from RabbitMQ
     */
    disconnect(): Promise<void>;
    /**
     * Check if consumer is connected
     */
    isConsumerConnected(): boolean;
}
//# sourceMappingURL=StaffEventConsumer.d.ts.map