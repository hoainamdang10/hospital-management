/**
 * NotificationTriggerWorkflow - Automated Notification Trigger Workflows
 * Orchestrates automated notifications across healthcare workflows and events
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Vietnamese Healthcare Standards, Multi-channel Notifications, HIPAA
 */
export interface NotificationContext {
    recipientId: string;
    recipientType: 'PATIENT' | 'DOCTOR' | 'NURSE' | 'ADMIN' | 'FAMILY' | 'EMERGENCY_CONTACT';
    notificationType: 'APPOINTMENT' | 'MEDICATION' | 'EMERGENCY' | 'BILLING' | 'GENERAL' | 'SYSTEM';
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | 'CRITICAL';
    channels: Array<'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'VOICE' | 'WHATSAPP'>;
    templateId: string;
    templateData: any;
    scheduledTime?: Date;
    expiryTime?: Date;
    vietnameseContent: {
        subject: string;
        message: string;
        actionText?: string;
    };
    healthcareContext: {
        patientId?: string;
        doctorId?: string;
        appointmentId?: string;
        medicalRecordId?: string;
        invoiceId?: string;
        emergencyLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };
}
export interface ReminderContext {
    reminderId: string;
    reminderType: 'APPOINTMENT' | 'MEDICATION' | 'FOLLOW_UP' | 'PAYMENT' | 'INSURANCE';
    targetDateTime: Date;
    reminderSchedule: Array<{
        timeOffset: number;
        channels: string[];
        templateId: string;
    }>;
    recurrence?: {
        frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
        interval: number;
        endDate?: Date;
    };
}
export interface EmergencyNotificationContext {
    emergencyId: string;
    emergencyType: 'MEDICAL' | 'SYSTEM' | 'SECURITY' | 'NATURAL_DISASTER';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    affectedPatients: string[];
    emergencyContacts: Array<{
        contactId: string;
        relationship: string;
        phoneNumber: string;
        email?: string;
    }>;
    emergencyTeam: string[];
    escalationRules: Array<{
        level: number;
        timeoutMinutes: number;
        recipients: string[];
    }>;
}
export declare class NotificationTriggerWorkflow {
    private static instance;
    private orchestrator;
    private constructor();
    static getInstance(): NotificationTriggerWorkflow;
    /**
     * Register all notification trigger workflows
     */
    private registerNotificationTriggerWorkflows;
    /**
     * Appointment Notification Workflow
     */
    private registerAppointmentNotificationWorkflow;
    /**
     * Medication Reminder Workflow
     */
    private registerMedicationReminderWorkflow;
    /**
     * Emergency Notification Workflow
     */
    private registerEmergencyNotificationWorkflow;
    /**
     * Billing Notification Workflow
     */
    private registerBillingNotificationWorkflow;
    /**
     * System Notification Workflow
     */
    private registerSystemNotificationWorkflow;
    /**
     * Follow-up Reminder Workflow
     */
    private registerFollowUpReminderWorkflow;
    /**
     * Insurance Notification Workflow
     */
    private registerInsuranceNotificationWorkflow;
    /**
     * Multi-channel Notification Workflow
     */
    private registerMultiChannelNotificationWorkflow;
    /**
     * Execute appointment notification workflow
     */
    executeAppointmentNotification(notificationContext: NotificationContext): Promise<any>;
    /**
     * Execute medication reminder workflow
     */
    executeMedicationReminder(notificationContext: NotificationContext, reminderContext: ReminderContext): Promise<any>;
    /**
     * Execute emergency notification workflow
     */
    executeEmergencyNotification(emergencyContext: EmergencyNotificationContext): Promise<any>;
    /**
     * Execute multi-channel notification workflow
     */
    executeMultiChannelNotification(notificationContext: NotificationContext): Promise<any>;
    /**
     * Get notification trigger workflow status
     */
    getNotificationTriggerStatus(): any;
}
//# sourceMappingURL=NotificationTriggerWorkflow.d.ts.map