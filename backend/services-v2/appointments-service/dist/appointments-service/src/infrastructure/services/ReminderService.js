"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
const IReminderService_1 = require("../../application/services/IReminderService");
/**
 * Default Reminder Policy
 */
const DEFAULT_POLICY = {
    ROUTINE: [
        { window: '24h', channels: [IReminderService_1.ReminderChannel.EMAIL, IReminderService_1.ReminderChannel.PUSH] },
        { window: '2h', channels: [IReminderService_1.ReminderChannel.PUSH] },
    ],
    NORMAL: [
        { window: '24h', channels: [IReminderService_1.ReminderChannel.EMAIL, IReminderService_1.ReminderChannel.PUSH] },
        { window: '2h', channels: [IReminderService_1.ReminderChannel.SMS, IReminderService_1.ReminderChannel.PUSH] },
    ],
    URGENT: [
        { window: '2h', channels: [IReminderService_1.ReminderChannel.SMS, IReminderService_1.ReminderChannel.PUSH] },
        { window: '30min', channels: [IReminderService_1.ReminderChannel.SMS, IReminderService_1.ReminderChannel.PUSH] },
    ],
    EMERGENCY: [], // No reminders for emergency appointments
};
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
class ReminderService {
    constructor(schedulerAdapter, customPolicy) {
        this.schedulerAdapter = schedulerAdapter;
        this.policy = customPolicy || DEFAULT_POLICY;
    }
    /**
     * Schedule reminders for an appointment
     * Integrates with scheduler-service to actually schedule the tasks
     *
     * @param customWindows - Optional custom reminder windows (overrides default policy)
     */
    async scheduleReminders(appointmentId, patientId, appointmentDateTime, priority = 'NORMAL', customWindows) {
        const schedules = [];
        // Use custom windows if provided, otherwise use policy
        const policyRules = customWindows
            ? customWindows
            : (this.policy[priority.toUpperCase()] || this.policy.NORMAL);
        for (const rule of policyRules) {
            const scheduledFor = this.calculateReminderTime(appointmentDateTime, rule.window);
            // Skip if reminder time is in the past
            if (scheduledFor <= new Date()) {
                console.warn(`[ReminderService] Skipping ${rule.window} reminder - time is in the past`);
                continue;
            }
            const reminderType = this.windowToReminderType(rule.window);
            // Schedule in scheduler-service
            try {
                const result = await this.schedulerAdapter.scheduleReminder({
                    appointmentId,
                    patientId,
                    reminderType,
                    scheduledFor,
                    channels: rule.channels,
                });
                if (result.success) {
                    schedules.push({
                        appointmentId,
                        patientId,
                        reminderType,
                        channels: rule.channels,
                        scheduledFor,
                        status: IReminderService_1.ReminderStatus.SCHEDULED,
                        window: rule.window,
                    });
                    console.log(`[ReminderService] Scheduled ${reminderType} reminder (${rule.window}) via scheduler-service`);
                }
                else {
                    console.error(`[ReminderService] Failed to schedule ${reminderType} reminder:`, result.error);
                }
            }
            catch (error) {
                console.error(`[ReminderService] Error scheduling ${reminderType} reminder:`, error);
            }
        }
        console.log(`[ReminderService] Successfully scheduled ${schedules.length} reminders for appointment ${appointmentId}`);
        return schedules;
    }
    /**
     * Send a reminder through specified channel
     *
     * NOTE: This method is deprecated and should not be called directly.
     * Reminders are automatically sent by scheduler-service → notifications-service.
     * This method exists only for interface compatibility.
     */
    async sendReminder(request) {
        console.warn('[ReminderService] sendReminder() called directly - this should not happen!');
        console.warn('[ReminderService] Reminders are handled by scheduler-service → notifications-service');
        return {
            success: false,
            channel: request.channel,
            error: 'Direct reminder sending not supported. Use scheduleReminders() instead.',
        };
    }
    /**
     * Cancel all reminders for an appointment
     * Calls scheduler-service to cancel scheduled tasks
     */
    async cancelReminders(appointmentId) {
        console.log(`[ReminderService] Cancelling all reminders for appointment ${appointmentId}`);
        try {
            const result = await this.schedulerAdapter.cancelReminders(appointmentId);
            if (result.success) {
                console.log(`[ReminderService] Successfully cancelled reminders for ${appointmentId}`);
            }
            else {
                console.error(`[ReminderService] Failed to cancel reminders:`, result.error);
            }
        }
        catch (error) {
            console.error(`[ReminderService] Error cancelling reminders:`, error);
            throw error;
        }
    }
    /**
     * Get pending reminders for processing
     */
    async getPendingReminders(fromTime, toTime) {
        // Implementation: Query database for pending reminders
        // This would typically call a repository method
        console.log(`[ReminderService] Getting pending reminders from ${fromTime} to ${toTime}`);
        return [];
    }
    /**
     * Mark reminder as sent
     */
    async markReminderAsSent(appointmentId, reminderType, channel) {
        console.log(`[ReminderService] Marking reminder as sent: ${appointmentId} - ${reminderType} - ${channel}`);
        // Implementation: Update reminder status in database
    }
    /**
     * Mark reminder as failed
     */
    async markReminderAsFailed(appointmentId, reminderType, channel, error) {
        console.error(`[ReminderService] Marking reminder as failed: ${appointmentId} - ${reminderType} - ${channel} - ${error}`);
        // Implementation: Update reminder status and log error
    }
    // ==================== Private Helper Methods ====================
    /**
     * Calculate reminder time based on window
     */
    calculateReminderTime(appointmentDateTime, window) {
        const match = window.match(/^(\d+)(min|h|d)$/);
        if (!match) {
            throw new Error(`Invalid window format: ${window}`);
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        const reminderTime = new Date(appointmentDateTime);
        switch (unit) {
            case 'min':
                reminderTime.setMinutes(reminderTime.getMinutes() - value);
                break;
            case 'h':
                reminderTime.setHours(reminderTime.getHours() - value);
                break;
            case 'd':
                reminderTime.setDate(reminderTime.getDate() - value);
                break;
        }
        return reminderTime;
    }
    /**
     * Convert window string to ReminderType
     */
    windowToReminderType(window) {
        switch (window) {
            case '24h':
                return IReminderService_1.ReminderType.BEFORE_24H;
            case '2h':
                return IReminderService_1.ReminderType.BEFORE_2H;
            case '30min':
                return IReminderService_1.ReminderType.BEFORE_30MIN;
            default:
                return IReminderService_1.ReminderType.BEFORE_2H;
        }
    }
    /**
     * Reschedule reminders for a rescheduled appointment
     * Cancels old reminders and schedules new ones
     */
    async rescheduleReminders(appointmentId, patientId, newAppointmentDateTime, priority = 'NORMAL', customWindows) {
        try {
            // Cancel old reminders
            await this.cancelReminders(appointmentId);
            // Schedule new reminders
            const newSchedules = await this.scheduleReminders(appointmentId, patientId, newAppointmentDateTime, priority, customWindows);
            return {
                success: true,
                newSchedules
            };
        }
        catch (error) {
            console.error('[ReminderService] Error rescheduling reminders:', error);
            return { success: false };
        }
    }
    /**
     * Check scheduler service health
     */
    async checkSchedulerHealth() {
        try {
            const isAvailable = await this.schedulerAdapter.isAvailable();
            return {
                healthy: isAvailable,
                message: isAvailable ? 'Scheduler service available' : 'Scheduler service unavailable'
            };
        }
        catch (error) {
            return {
                healthy: false,
                message: `Scheduler service error: ${error}`
            };
        }
    }
    /**
     * Preview reminders without actually scheduling them
     * Useful for showing users what reminders will be sent
     */
    async previewReminders(appointmentDateTime, priority = 'NORMAL', customWindows) {
        const policyRules = customWindows
            ? customWindows
            : (this.policy[priority.toUpperCase()] || this.policy.NORMAL);
        const previews = [];
        for (const rule of policyRules) {
            const scheduledFor = this.calculateReminderTime(appointmentDateTime, rule.window);
            if (scheduledFor > new Date()) {
                previews.push({
                    window: rule.window,
                    scheduledFor,
                    channels: rule.channels
                });
            }
        }
        return previews;
    }
    // ==================== MISSING METHODS FROM COMPILE ERRORS ====================
    /**
     * Send reschedule notification
     * Used by event consumers when appointments are rescheduled
     */
    async sendRescheduleNotification(appointmentId, patientId, newDateTime, reason) {
        try {
            console.log(`Sending reschedule notification for appointment ${appointmentId}`);
            // Schedule immediate reschedule notification via scheduler
            await this.schedulerAdapter.scheduleReminder({
                appointmentId,
                patientId,
                reminderType: 'reschedule',
                scheduledFor: new Date(),
                channels: ['email', 'sms']
            });
            console.log(` Reschedule notification scheduled for appointment ${appointmentId}`);
        }
        catch (error) {
            console.error('Failed to send reschedule notification:', error);
            throw error;
        }
    }
    /**
     * Send conflict notification
     * Used by event consumers when appointment conflicts are detected
     */
    async sendConflictNotification(appointmentId, patientId, conflictDetails) {
        try {
            console.log(`Sending conflict notification for appointment ${appointmentId}`);
            // Schedule immediate conflict notification via scheduler
            await this.schedulerAdapter.scheduleReminder({
                appointmentId,
                patientId,
                reminderType: 'conflict',
                scheduledFor: new Date(),
                channels: ['email', 'sms']
            });
            console.log(` Conflict notification scheduled for appointment ${appointmentId}`);
        }
        catch (error) {
            console.error('Failed to send conflict notification:', error);
            throw error;
        }
    }
    /**
     * Send appointment scheduled notification
     * Used by event consumers when new appointments are created
     */
    async sendAppointmentScheduledNotification(patientId, appointmentDateTime) {
        try {
            console.log(`Sending appointment scheduled notification to patient ${patientId}`);
            // Schedule immediate confirmation notification via scheduler
            await this.schedulerAdapter.scheduleReminder({
                appointmentId: 'new-appointment',
                patientId,
                reminderType: 'confirmation',
                scheduledFor: new Date(),
                channels: ['email', 'sms']
            });
            console.log(` Appointment scheduled notification sent to patient ${patientId}`);
        }
        catch (error) {
            console.error('Failed to send appointment scheduled notification:', error);
            throw error;
        }
    }
    /**
     * Send staff assignment notification
     * Used by event consumers when staff are assigned to appointments
     */
    async sendStaffAssignmentNotification(appointmentId, staffId, assignmentDetails) {
        try {
            console.log(`Sending staff assignment notification for appointment ${appointmentId}`);
            // Schedule notification to staff member via scheduler
            await this.schedulerAdapter.scheduleReminder({
                appointmentId,
                patientId: staffId, // Using patientId field for staff notification
                reminderType: 'staff_assignment',
                scheduledFor: new Date(),
                channels: ['email', 'internal']
            });
            console.log(` Staff assignment notification sent for appointment ${appointmentId}`);
        }
        catch (error) {
            console.error('Failed to send staff assignment notification:', error);
            throw error;
        }
    }
    /**
     * Send operating hours change notification
     * Used by event consumers when operating hours change
     */
    async sendOperatingHoursChangeNotification(departmentId, newHours) {
        try {
            console.log(`Sending operating hours change notification for department ${departmentId}`);
            // Schedule notification to affected patients/staff via scheduler
            await this.schedulerAdapter.scheduleReminder({
                appointmentId: 'operating-hours-change',
                patientId: departmentId, // Using patientId field for department notification
                reminderType: 'operating_hours_change',
                scheduledFor: new Date(),
                channels: ['email', 'sms']
            });
            console.log(` Operating hours change notification sent for department ${departmentId}`);
        }
        catch (error) {
            console.error('Failed to send operating hours change notification:', error);
            throw error;
        }
    }
    // ==================== CLINICAL NOTIFICATION METHODS (APPOINTMENT SERVICE CONTEXT) ====================
    /**
     * Notify physician about appointment results
     * Physicians need notification about appointment results
     */
    async notifyPhysicianAboutResults(data) {
        try {
            console.log(`Notifying physician ${data.physicianId} about ${data.resultType} results for appointment ${data.appointmentId}`);
            // Schedule physician notification via scheduler
            await this.schedulerAdapter.scheduleReminder({
                appointmentId: data.appointmentId,
                patientId: data.physicianId, // Using patientId field for physician notification
                reminderType: 'physician_results',
                scheduledFor: new Date(),
                channels: data.urgency === 'urgent' ? ['email', 'sms'] : ['email']
            });
            console.log(` Physician notification sent for appointment ${data.appointmentId}`);
        }
        catch (error) {
            console.error('Failed to notify physician about results:', error);
            throw error;
        }
    }
    /**
     * Notify physician about appointment-related documents
     * Document notifications for appointment-related docs
     */
    async notifyPhysicianAboutDocument(data) {
        try {
            console.log(`Notifying physician ${data.physicianId} about document ${data.documentType} for appointment ${data.appointmentId}`);
            // Schedule physician document notification via scheduler
            await this.schedulerAdapter.scheduleReminder({
                appointmentId: data.appointmentId,
                patientId: data.physicianId, // Using patientId field for physician notification
                reminderType: 'physician_document',
                scheduledFor: new Date(),
                channels: ['email']
            });
            console.log(` Physician document notification sent for appointment ${data.appointmentId}`);
        }
        catch (error) {
            console.error('Failed to notify physician about document:', error);
            throw error;
        }
    }
    /**
     * Send urgent appointment notification
     * Urgent appointment notifications are appointment service responsibility
     */
    async sendUrgentAppointmentNotification(data) {
        try {
            console.log(`Sending urgent appointment notification to patient ${data.patientId} for appointment ${data.appointmentId}`);
            // Schedule urgent appointment notification via scheduler
            await this.schedulerAdapter.scheduleReminder({
                appointmentId: data.appointmentId,
                patientId: data.patientId,
                reminderType: 'urgent_appointment',
                scheduledFor: new Date(),
                channels: data.urgency === 'emergency' ? ['email', 'sms', 'phone'] : ['email', 'sms']
            });
            console.log(` Urgent appointment notification sent for appointment ${data.appointmentId}`);
        }
        catch (error) {
            console.error('Failed to send urgent appointment notification:', error);
            throw error;
        }
    }
    /**
     * Notify clinical staff about urgent case
     * Clinical staff notification for urgent appointments
     */
    async notifyClinicalStaffAboutUrgentCase(data) {
        try {
            console.log(`Notifying clinical staff about urgent case ${data.caseType} for appointment ${data.appointmentId}`);
            // Schedule clinical staff notifications via scheduler
            for (const staffId of data.requiredStaff) {
                await this.schedulerAdapter.scheduleReminder({
                    appointmentId: data.appointmentId,
                    patientId: staffId, // Using patientId field for staff notification
                    reminderType: 'clinical_urgent_case',
                    scheduledFor: new Date(),
                    channels: data.urgency === 'emergency' ? ['email', 'sms', 'phone'] : ['email', 'sms']
                });
            }
            console.log(` Clinical staff notifications sent for appointment ${data.appointmentId}`);
        }
        catch (error) {
            console.error('Failed to notify clinical staff about urgent case:', error);
            throw error;
        }
    }
    /**
     * Offer priority appointment slot
     * Priority slot management for appointments
     */
    async offerPriorityAppointmentSlot(data) {
        try {
            console.log(`Offering priority appointment slot to patient ${data.patientId} for original appointment ${data.originalAppointmentId}`);
            // Schedule priority slot offer notification via scheduler
            await this.schedulerAdapter.scheduleReminder({
                appointmentId: data.originalAppointmentId,
                patientId: data.patientId,
                reminderType: 'priority_slot_offer',
                scheduledFor: new Date(),
                channels: ['email', 'sms']
            });
            console.log(` Priority slot offer sent to patient ${data.patientId}`);
        }
        catch (error) {
            console.error('Failed to offer priority appointment slot:', error);
            throw error;
        }
    }
    // ==================== MISSING METHODS FROM INTERFACE ====================
    /**
     * Send pre-authorization approval notification
     * Notifies patient about insurance pre-authorization approval
     */
    async sendPreAuthApprovalNotification(data) {
        try {
            console.log(`Sending pre-auth approval notification to patient ${data.patientId} for appointment ${data.appointmentId}`);
            // TODO: Implement actual notification logic (email, SMS, etc.)
            // For now, just log the notification
            console.log('Pre-Auth Approval Notification:', {
                type: 'pre_auth_approval',
                patientId: data.patientId,
                appointmentId: data.appointmentId,
                procedureName: data.procedureName,
                approvedAt: data.approvedAt,
                message: `Your pre-authorization for ${data.procedureName} has been approved!`
            });
        }
        catch (error) {
            console.error('Failed to send pre-auth approval notification:', error);
            throw error;
        }
    }
    /**
     * Send pre-authorization denial notification
     * Notifies patient about insurance pre-authorization denial
     */
    async sendPreAuthDenialNotification(data) {
        try {
            console.log(`Sending pre-auth denial notification to patient ${data.patientId} for appointment ${data.appointmentId}`);
            // TODO: Implement actual notification logic (email, SMS, etc.)
            // For now, just log the notification
            console.log('Pre-Auth Denial Notification:', {
                type: 'pre_auth_denial',
                patientId: data.patientId,
                appointmentId: data.appointmentId,
                procedureName: data.procedureName,
                message: `Your pre-authorization for ${data.procedureName} requires additional review.`
            });
        }
        catch (error) {
            console.error('Failed to send pre-auth denial notification:', error);
            throw error;
        }
    }
    /**
     * Notify billing department
     * Sends billing-related notifications to billing department
     */
    async notifyBillingDepartment(data) {
        try {
            console.log(`Notifying billing department about pre-auth request ${data.authorizationId}`);
            // TODO: Implement actual billing department notification logic
            // For now, just log the notification
            console.log('Billing Department Notification:', {
                type: 'billing_notification',
                authorizationId: data.authorizationId,
                patientId: data.patientId,
                patientName: data.patientName,
                procedureCode: data.procedureCode,
                procedureName: data.procedureName,
                urgencyLevel: data.urgencyLevel,
                estimatedCost: data.estimatedCost,
                requestedBy: data.requestedBy,
                requestedAt: data.requestedAt,
                appointmentId: data.appointmentId,
                message: `New pre-authorization request for ${data.procedureName} - ${data.urgencyLevel} priority`
            });
        }
        catch (error) {
            console.error('Failed to notify billing department:', error);
            throw error;
        }
    }
    /**
     * Send appointment confirmation notification
     * Notifies patient about appointment confirmation after payment
     */
    async sendAppointmentConfirmationNotification(data) {
        try {
            console.log(`Sending appointment confirmation to patient ${data.patientId} for appointment ${data.appointmentId}`);
            // TODO: Implement actual notification logic (email, SMS, etc.)
            // For now, just log the notification
            console.log('Appointment Confirmation Notification:', {
                type: 'appointment_confirmation',
                patientId: data.patientId,
                patientName: data.patientName,
                appointmentId: data.appointmentId,
                appointmentDate: data.appointmentDate,
                appointmentTime: data.appointmentTime,
                department: data.department,
                confirmedAt: data.confirmedAt,
                message: `Your appointment on ${data.appointmentDate} at ${data.appointmentTime} has been confirmed!`
            });
        }
        catch (error) {
            console.error('Failed to send appointment confirmation notification:', error);
            throw error;
        }
    }
    /**
     * Send alternative procedure suggestions
     * Notifies patient about alternative procedures when original is denied
     */
    async sendAlternativeProcedureSuggestions(data) {
        try {
            console.log(`Sending alternative procedure suggestions to patient ${data.patientId} for appointment ${data.appointmentId}`);
            // TODO: Implement actual notification logic (email, SMS, etc.)
            // For now, just log the notification
            console.log('Alternative Procedure Suggestions:', {
                type: 'alternative_procedures',
                patientId: data.patientId,
                appointmentId: data.appointmentId,
                originalProcedure: data.originalProcedure,
                alternativeProcedures: data.alternativeProcedures,
                costDifferences: data.costDifferences,
                reasons: data.reasons,
                message: `Alternative procedure options are available for your consideration.`
            });
        }
        catch (error) {
            console.error('Failed to send alternative procedure suggestions:', error);
            throw error;
        }
    }
    /**
     * Send rate change notification
     * Notifies relevant parties about billing rate changes
     */
    async sendRateChangeNotification(data) {
        try {
            console.log(`Sending rate change notification for ${data.serviceType}`);
            // TODO: Implement actual notification logic (email, SMS, etc.)
            // For now, just log the notification
            console.log('Rate Change Notification:', {
                type: 'rate_change',
                serviceType: data.serviceType,
                oldRate: data.oldRate,
                newRate: data.newRate,
                effectiveDate: data.effectiveDate,
                affectedAppointments: data.affectedAppointments,
                message: `Billing rate for ${data.serviceType} will change from $${data.oldRate} to $${data.newRate} effective ${data.effectiveDate.toISOString()}`
            });
        }
        catch (error) {
            console.error('Failed to send rate change notification:', error);
            throw error;
        }
    }
    /**
     * Send rate increase notification
     * Notifies patients about billing rate increases
     */
    async sendRateIncreaseNotification(data) {
        try {
            console.log(`Sending rate increase notification for ${data.serviceType}`);
            // TODO: Implement actual notification logic (email, SMS, etc.)
            // For now, just log the notification
            console.log('Rate Increase Notification:', {
                type: 'rate_increase',
                serviceType: data.serviceType,
                oldRate: data.oldRate,
                newRate: data.newRate,
                increasePercentage: data.increasePercentage,
                effectiveDate: data.effectiveDate,
                reason: data.reason,
                message: `Billing rate for ${data.serviceType} will increase by ${data.increasePercentage}% effective ${data.effectiveDate.toISOString()}. Reason: ${data.reason}`
            });
        }
        catch (error) {
            console.error('Failed to send rate increase notification:', error);
            throw error;
        }
    }
}
exports.ReminderService = ReminderService;
//# sourceMappingURL=ReminderService.js.map