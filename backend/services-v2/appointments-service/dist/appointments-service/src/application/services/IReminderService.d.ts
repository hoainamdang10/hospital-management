/**
 * Reminder Service Interface - Application Layer
 * Manages appointment reminders across multiple channels
 *
 * @author Hospital Management Team
 * @version 3.0.0
 */
export declare enum ReminderType {
    BEFORE_24H = "24h",
    BEFORE_2H = "2h",
    BEFORE_30MIN = "30min"
}
export declare enum ReminderChannel {
    EMAIL = "email",
    SMS = "sms",
    PUSH = "push",
    IN_APP = "in_app"
}
export declare enum ReminderStatus {
    SCHEDULED = "scheduled",
    SENT = "sent",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export interface ReminderSchedule {
    appointmentId: string;
    patientId: string;
    reminderType: ReminderType;
    channels: ReminderChannel[];
    scheduledFor: Date;
    status: ReminderStatus;
    window: string;
}
export interface SendReminderRequest {
    appointmentId: string;
    patientId: string;
    patientName: string;
    patientEmail?: string;
    patientPhone?: string;
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
    channel: ReminderChannel;
    reminderType: ReminderType;
}
export interface SendReminderResponse {
    success: boolean;
    channel: ReminderChannel;
    sentAt?: Date;
    error?: string;
}
/**
 * Custom reminder window configuration
 */
export interface CustomReminderWindow {
    window: string;
    channels: ReminderChannel[];
}
/**
 * Reminder Service Interface
 * Handles scheduling and sending appointment reminders
 */
export interface IReminderService {
    /**
     * Schedule reminders for an appointment
     * Creates reminder tasks for 24h, 2h, and 30min before appointment (default)
     * or uses custom windows if provided
     *
     * @param appointmentId - Appointment ID
     * @param patientId - Patient ID
     * @param appointmentDateTime - Appointment date and time
     * @param priority - Appointment priority
     * @param customWindows - Optional custom reminder windows (overrides default policy)
     */
    scheduleReminders(appointmentId: string, patientId: string, appointmentDateTime: Date, priority: string, customWindows?: CustomReminderWindow[]): Promise<ReminderSchedule[]>;
    /**
     * Send a reminder through specified channel
     */
    sendReminder(request: SendReminderRequest): Promise<SendReminderResponse>;
    /**
     * Cancel all reminders for an appointment
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
     * Used by event consumers when new appointments are scheduled
     */
    sendAppointmentScheduledNotification(appointmentId: string, patientId: string, appointmentDateTime: Date): Promise<void>;
    /**
     * Send staff assignment notification
     * Used by event consumers when staff assignments change
     */
    sendStaffAssignmentNotification(appointmentId: string, staffId: string, assignmentType: string): Promise<void>;
    /**
     * Send operating hours change notification
     * Used by event consumers when operating hours change
     */
    sendOperatingHoursChangeNotification(departmentId: string, newHours: any, affectedPatients: string[]): Promise<void>;
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
     * Used by BillingEventConsumer for pre-auth approvals
     */
    sendPreAuthApprovalNotification(data: {
        appointmentId: string;
        patientId: string;
        procedureName: string;
        approvedAt: Date;
    }): Promise<void>;
    /**
     * Send pre-authorization denial notification
     * Used by BillingEventConsumer for pre-auth denials
     */
    sendPreAuthDenialNotification(data: {
        appointmentId: string;
        patientId: string;
        procedureName: string;
    }): Promise<void>;
    /**
     * Notify billing department
     * Used by BillingEventConsumer for billing notifications
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
     * Used by BillingEventConsumer for payment confirmations
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
     * Used by BillingEventConsumer for procedure alternatives
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
     * Used by BillingEventConsumer for rate changes
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
     * Used by BillingEventConsumer for rate increases
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
//# sourceMappingURL=IReminderService.d.ts.map