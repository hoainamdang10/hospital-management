"use strict";
/**
 * ReminderCronJob - Infrastructure Layer
 * Periodically checks for due reminders and sends them
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Cron Job Pattern
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderCronJob = void 0;
const cron = __importStar(require("node-cron"));
/**
 * ReminderCronJob - Sends due appointment reminders
 *
 * Workflow:
 * 1. Query database for reminders where status=PENDING and scheduled_send_time <= now
 * 2. For each reminder, send notification via SendNotificationUseCase
 * 3. Update reminder status to SENT or FAILED based on result
 * 4. Implement retry logic for failed reminders
 */
class ReminderCronJob {
    constructor(config, reminderRepo, sendNotificationUseCase) {
        this.config = config;
        this.reminderRepo = reminderRepo;
        this.sendNotificationUseCase = sendNotificationUseCase;
        this.isRunning = false;
    }
    /**
     * Start the cron job
     */
    start() {
        if (!this.config.enabled) {
            console.log('[ReminderCronJob] Disabled via config, not starting');
            return;
        }
        if (this.task) {
            console.warn('[ReminderCronJob] Already started, ignoring start() call');
            return;
        }
        console.log(`[ReminderCronJob] Starting with schedule: ${this.config.cronExpression}`);
        this.task = cron.schedule(this.config.cronExpression, async () => {
            if (this.isRunning) {
                console.log('[ReminderCronJob] Previous run still in progress, skipping this run');
                return;
            }
            await this.run();
        });
        console.log('[ReminderCronJob] Started successfully');
    }
    /**
     * Stop the cron job
     */
    stop() {
        if (this.task) {
            this.task.stop();
            this.task = undefined;
            console.log('[ReminderCronJob] Stopped successfully');
        }
    }
    /**
     * Run the job manually (useful for testing)
     */
    async run() {
        if (this.isRunning) {
            console.log('[ReminderCronJob] Already running, skipping');
            return;
        }
        this.isRunning = true;
        const startTime = Date.now();
        try {
            console.log('[ReminderCronJob] Starting reminder processing run');
            // 1. Query due reminders
            const dueReminders = await this.reminderRepo.findDueReminders(new Date());
            if (dueReminders.length === 0) {
                console.log('[ReminderCronJob] No due reminders found');
                return;
            }
            console.log(`[ReminderCronJob] Found ${dueReminders.length} due reminder(s)`);
            // 2. Process each reminder
            let sentCount = 0;
            let failedCount = 0;
            for (const reminder of dueReminders) {
                try {
                    // Mark as processing
                    reminder.markAsProcessing();
                    await this.reminderRepo.save(reminder);
                    // Send notification
                    const notificationData = {
                        recipientId: reminder.patientId,
                        recipientType: 'patient',
                        recipientName: reminder.patientName || 'Quý khách',
                        recipientEmail: reminder.patientEmail,
                        recipientPhone: reminder.patientPhone,
                        type: 'appointment_reminder',
                        title: this.getReminderTitle(reminder.reminderType.toString()),
                        content: this.getReminderContent(reminder),
                        channels: ['SMS', 'EMAIL', 'IN_APP'],
                        priority: 'normal',
                        scheduledAt: new Date(),
                        data: {
                            appointmentId: reminder.appointmentId,
                            reminderId: reminder.reminderId,
                            reminderType: reminder.reminderType.toString(),
                            appointmentDate: reminder.appointmentDate.toISOString(),
                            appointmentTime: reminder.appointmentTime,
                        },
                        templateData: reminder.getTemplateVariables(),
                    };
                    const sendResults = await this.sendNotificationUseCase.execute(notificationData);
                    // Check if any channel succeeded
                    const hasSuccess = sendResults.some(r => r.success);
                    const notificationId = sendResults.find(r => r.success)?.notificationId || 'UNKNOWN';
                    if (hasSuccess) {
                        // Mark as sent
                        reminder.markAsSent(notificationId);
                        await this.reminderRepo.save(reminder);
                        sentCount++;
                        console.log(`[ReminderCronJob] Successfully sent reminder ${reminder.reminderId} for appointment ${reminder.appointmentId}`);
                    }
                    else {
                        // Mark as failed
                        const failureReason = sendResults.map(r => r.failureReason || 'Unknown error').join('; ');
                        reminder.markAsFailed(failureReason);
                        await this.reminderRepo.save(reminder);
                        failedCount++;
                        console.error(`[ReminderCronJob] Failed to send reminder ${reminder.reminderId}: ${failureReason}`);
                        if (reminder.canRetry()) {
                            console.log(`[ReminderCronJob] Reminder will be retried`);
                        }
                        else {
                            console.warn(`[ReminderCronJob] Reminder has exhausted all retries (${reminder.retryCount}/${reminder.maxRetries})`);
                        }
                    }
                }
                catch (error) {
                    console.error(`[ReminderCronJob] Unexpected error processing reminder ${reminder.reminderId}:`, error);
                    failedCount++;
                }
            }
            const duration = Date.now() - startTime;
            console.log(`[ReminderCronJob] Completed run in ${duration}ms: ${sentCount} sent, ${failedCount} failed`);
            // 3. Process retryable reminders
            await this.processRetryableReminders();
        }
        catch (error) {
            console.error('[ReminderCronJob] Unexpected error in run:', error);
        }
        finally {
            this.isRunning = false;
        }
    }
    /**
     * Process retryable reminders (failed reminders with retry count < max)
     */
    async processRetryableReminders() {
        try {
            const retryableReminders = await this.reminderRepo.findRetriableReminders();
            if (retryableReminders.length === 0) {
                return;
            }
            console.log(`[ReminderCronJob] Found ${retryableReminders.length} retryable reminder(s)`);
            for (const reminder of retryableReminders) {
                try {
                    reminder.markAsProcessing();
                    await this.reminderRepo.save(reminder);
                    const notificationData = {
                        recipientId: reminder.patientId,
                        recipientType: 'patient',
                        recipientName: reminder.patientName || 'Quý khách',
                        recipientEmail: reminder.patientEmail,
                        recipientPhone: reminder.patientPhone,
                        type: 'appointment_reminder',
                        title: this.getReminderTitle(reminder.reminderType.toString()),
                        content: this.getReminderContent(reminder),
                        channels: ['SMS', 'EMAIL', 'IN_APP'],
                        priority: 'normal',
                        scheduledAt: new Date(),
                        data: {
                            appointmentId: reminder.appointmentId,
                            reminderId: reminder.reminderId,
                            reminderType: reminder.reminderType.toString(),
                            retryAttempt: reminder.retryCount,
                        },
                        templateData: reminder.getTemplateVariables(),
                    };
                    const sendResults = await this.sendNotificationUseCase.execute(notificationData);
                    const hasSuccess = sendResults.some(r => r.success);
                    const notificationId = sendResults.find(r => r.success)?.notificationId || 'UNKNOWN';
                    if (hasSuccess) {
                        reminder.markAsSent(notificationId);
                        await this.reminderRepo.save(reminder);
                        console.log(`[ReminderCronJob] Successfully sent retry reminder ${reminder.reminderId}`);
                    }
                    else {
                        const failureReason = sendResults.map(r => r.failureReason || 'Unknown error').join('; ');
                        reminder.markAsFailed(failureReason);
                        await this.reminderRepo.save(reminder);
                        console.error(`[ReminderCronJob] Failed to send retry reminder ${reminder.reminderId}: ${failureReason}`);
                    }
                }
                catch (error) {
                    console.error(`[ReminderCronJob] Error processing retry reminder ${reminder.reminderId}:`, error);
                }
            }
        }
        catch (error) {
            console.error('[ReminderCronJob] Error in processRetryableReminders:', error);
        }
    }
    /**
     * Get reminder title based on type
     */
    getReminderTitle(reminderType) {
        const titles = {
            '24H_BEFORE': 'Nhắc nhở lịch hẹn - 24 giờ trước',
            '2H_BEFORE': 'Nhắc nhở lịch hẹn - 2 giờ trước',
            '30M_BEFORE': 'Nhắc nhở lịch hẹn - 30 phút trước',
            'CUSTOM': 'Nhắc nhở lịch hẹn',
        };
        return titles[reminderType] || 'Nhắc nhở lịch hẹn';
    }
    /**
     * Generate reminder content
     */
    getReminderContent(reminder) {
        const timeText = {
            '24H_BEFORE': 'ngày mai',
            '2H_BEFORE': 'sau 2 giờ',
            '30M_BEFORE': 'sau 30 phút',
        };
        const whenText = timeText[reminder.reminderType.toString()] || 'sắp tới';
        return `
Kính gửi ${reminder.patientName || 'Quý khách'},

Nhắc nhở: Bạn có lịch hẹn khám ${whenText}

- Bác sĩ: ${reminder.doctorName}
- Thời gian: ${this.formatDate(reminder.appointmentDate)} lúc ${reminder.appointmentTime}

Vui lòng đến đúng giờ để tránh bị trễ.

Trân trọng,
Bệnh viện
    `.trim();
    }
    /**
     * Format date for Vietnamese locale
     */
    formatDate(date) {
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }
    /**
     * Check if cron job is running
     */
    isJobRunning() {
        return this.isRunning;
    }
    /**
     * Check if cron job is started
     */
    isJobStarted() {
        return !!this.task;
    }
}
exports.ReminderCronJob = ReminderCronJob;
//# sourceMappingURL=ReminderCronJob.js.map