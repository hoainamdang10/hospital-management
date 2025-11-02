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
}
exports.ReminderService = ReminderService;
//# sourceMappingURL=ReminderService.js.map