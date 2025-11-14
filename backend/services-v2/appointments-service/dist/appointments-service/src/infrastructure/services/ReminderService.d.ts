/**
 * Reminder Service Implementation - Infrastructure Layer
 * Manages appointment reminder SCHEDULING only
 *
 * BOUNDED CONTEXT: This service only schedules reminders via scheduler-service.
 * Actual notification delivery (email/SMS/push) is handled by notifications-service.
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
import { IReminderService, ReminderType, ReminderChannel, ReminderSchedule, SendReminderRequest, SendReminderResponse } from '../../application/services/IReminderService';
import { ISchedulerAdapter } from '../adapters/ISchedulerAdapter';
/**
 * Reminder Policy Configuration
 * Defines which channels to use for different reminder types and priorities
 */
interface ReminderPolicy {
    [priority: string]: {
        window: string;
        channels: ReminderChannel[];
    }[];
}
/**
 * Reminder Service Implementation
 *
 * Responsibilities:
 * - Schedule reminder tasks via scheduler-service
 * - Cancel reminder tasks via scheduler-service
 *
 * NOT Responsible for:
 * - Sending actual notifications (notifications-service does this)
 * - Managing notification templates (notifications-service does this)
 * - Tracking delivery status (notifications-service does this)
 */
export declare class ReminderService implements IReminderService {
    private policy;
    private schedulerAdapter;
    constructor(schedulerAdapter: ISchedulerAdapter, customPolicy?: ReminderPolicy);
    /**
     * Schedule reminders for an appointment
     * Integrates with scheduler-service to actually schedule the tasks
     *
     * @param customWindows - Optional custom reminder windows (overrides default policy)
     */
    scheduleReminders(appointmentId: string, patientId: string, appointmentDateTime: Date, priority?: string, customWindows?: Array<{
        window: string;
        channels: ReminderChannel[];
    }>): Promise<ReminderSchedule[]>;
    /**
     * Send a reminder through specified channel
     *
     * NOTE: This method is deprecated and should not be called directly.
     * Reminders are automatically sent by scheduler-service → notifications-service.
     * This method exists only for interface compatibility.
     */
    sendReminder(request: SendReminderRequest): Promise<SendReminderResponse>;
    /**
     * Cancel all reminders for an appointment
     * Calls scheduler-service to cancel scheduled tasks
     */
    cancelReminders(appointmentId: string): Promise<void>;
    /**
     * Get pending reminders for processing
     */
    getPendingReminders(fromTime: Date, toTime: Date): Promise<ReminderSchedule[]>;
    /**
     * Mark reminder as sent
     */
    markReminderAsSent(appointmentId: string, reminderType: ReminderType, channel: ReminderChannel): Promise<void>;
    /**
     * Mark reminder as failed
     */
    markReminderAsFailed(appointmentId: string, reminderType: ReminderType, channel: ReminderChannel, error: string): Promise<void>;
    /**
     * Calculate reminder time based on window
     */
    private calculateReminderTime;
    /**
     * Convert window string to ReminderType
     */
    private windowToReminderType;
    /**
     * Reschedule reminders for a rescheduled appointment
     * Cancels old reminders and schedules new ones
     */
    rescheduleReminders(appointmentId: string, patientId: string, newAppointmentDateTime: Date, priority?: string, customWindows?: Array<{
        window: string;
        channels: ReminderChannel[];
    }>): Promise<{
        success: boolean;
        newSchedules?: ReminderSchedule[];
    }>;
    /**
     * Check scheduler service health
     */
    checkSchedulerHealth(): Promise<{
        healthy: boolean;
        message?: string;
    }>;
    /**
     * Preview reminders without actually scheduling them
     * Useful for showing users what reminders will be sent
     */
    previewReminders(appointmentDateTime: Date, priority?: string, customWindows?: Array<{
        window: string;
        channels: ReminderChannel[];
    }>): Promise<Array<{
        window: string;
        scheduledFor: Date;
        channels: ReminderChannel[];
    }>>;
    /**
     * Send reschedule notification
     * Used by event consumers when appointments are rescheduled
     */
    sendRescheduleNotification(appointmentId: string, patientId: string, newDateTime: Date, reason?: string): Promise<void>;
    /**
     * Send conflict notification
     * Used by event consumers when appointment conflicts are detected
     */
    sendConflictNotification(appointmentId: string, patientId: string, conflictDetails: any): Promise<void>;
    /**
     * Send appointment scheduled notification
     * Used by event consumers when new appointments are created
     */
    sendAppointmentScheduledNotification(patientId: string, appointmentDateTime: string): Promise<void>;
    /**
     * Send staff assignment notification
     * Used by event consumers when staff are assigned to appointments
     */
    sendStaffAssignmentNotification(appointmentId: string, staffId: string, assignmentDetails: any): Promise<void>;
    /**
     * Send operating hours change notification
     * Used by event consumers when operating hours change
     */
    sendOperatingHoursChangeNotification(departmentId: string, newHours: any): Promise<void>;
    /**
     * Notify physician about appointment results
     * Physicians need notification about appointment results
     */
    notifyPhysicianAboutResults(data: {
        appointmentId: string;
        physicianId: string;
        patientId: string;
        resultType: 'lab' | 'imaging' | 'consultation';
        results: any;
        urgency: 'normal' | 'urgent';
    }): Promise<void>;
    /**
     * Notify physician about appointment-related documents
     * Document notifications for appointment-related docs
     */
    notifyPhysicianAboutDocument(data: {
        appointmentId: string;
        physicianId: string;
        patientId: string;
        documentType: string;
        documentUrl: string;
        uploadedAt: Date;
    }): Promise<void>;
    /**
     * Send urgent appointment notification
     * Urgent appointment notifications are appointment service responsibility
     */
    sendUrgentAppointmentNotification(data: {
        appointmentId: string;
        patientId: string;
        patientName: string;
        urgency: 'urgent' | 'emergency';
        appointmentTime: Date;
        department: string;
    }): Promise<void>;
    /**
     * Notify clinical staff about urgent case
     * Clinical staff notification for urgent appointments
     */
    notifyClinicalStaffAboutUrgentCase(data: {
        appointmentId: string;
        caseType: string;
        urgency: 'urgent' | 'emergency';
        department: string;
        requiredStaff: string[];
        patientInfo: {
            id: string;
            name: string;
            age: number;
        };
    }): Promise<void>;
    /**
     * Offer priority appointment slot
     * Priority slot management for appointments
     */
    offerPriorityAppointmentSlot(data: {
        patientId: string;
        patientName: string;
        originalAppointmentId: string;
        prioritySlot: {
            startTime: Date;
            endTime: Date;
            department: string;
        };
        reason: string;
        expiresAt: Date;
    }): Promise<void>;
    /**
     * Send pre-authorization approval notification
     * Notifies patient about insurance pre-authorization approval
     */
    sendPreAuthApprovalNotification(data: {
        appointmentId: string;
        patientId: string;
        procedureName: string;
        approvedAt: Date;
    }): Promise<void>;
    /**
     * Send pre-authorization denial notification
     * Notifies patient about insurance pre-authorization denial
     */
    sendPreAuthDenialNotification(data: {
        appointmentId: string;
        patientId: string;
        procedureName: string;
    }): Promise<void>;
    /**
     * Notify billing department
     * Sends billing-related notifications to billing department
     */
    notifyBillingDepartment(data: {
        authorizationId: string;
        patientId: string;
        patientName: string;
        procedureCode: string;
        procedureName: string;
        urgencyLevel: string;
        estimatedCost: number;
        requestedBy: string;
        requestedAt: Date;
        appointmentId?: string;
    }): Promise<void>;
    /**
     * Send appointment confirmation notification
     * Notifies patient about appointment confirmation after payment
     */
    sendAppointmentConfirmationNotification(data: {
        appointmentId: string;
        patientId: string;
        patientName: string;
        appointmentDate: string;
        appointmentTime: string;
        department: string;
        confirmedAt: Date;
    }): Promise<void>;
    /**
     * Send alternative procedure suggestions
     * Notifies patient about alternative procedures when original is denied
     */
    sendAlternativeProcedureSuggestions(data: {
        appointmentId: string;
        patientId: string;
        originalProcedure: string;
        alternativeProcedures: string[];
        costDifferences: number[];
        reasons: string[];
    }): Promise<void>;
    /**
     * Send rate change notification
     * Notifies relevant parties about billing rate changes
     */
    sendRateChangeNotification(data: {
        serviceType: string;
        oldRate: number;
        newRate: number;
        effectiveDate: Date;
        affectedAppointments: string[];
    }): Promise<void>;
    /**
     * Send rate increase notification
     * Notifies patients about billing rate increases
     */
    sendRateIncreaseNotification(data: {
        serviceType: string;
        oldRate: number;
        newRate: number;
        increasePercentage: number;
        effectiveDate: Date;
        reason: string;
    }): Promise<void>;
}
export {};
//# sourceMappingURL=ReminderService.d.ts.map