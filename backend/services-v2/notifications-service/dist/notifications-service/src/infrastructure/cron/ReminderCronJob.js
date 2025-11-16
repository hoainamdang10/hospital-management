"use strict";
/**
 * ReminderCronJob - Infrastructure Layer
 * Periodically checks for due reminders and sends them
 *
 * @author Hospital Management Team
 * @version 1.0.0
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
            const dueRemindersResult = await this.reminderRepo.findDueReminders(this.config.batchSize);
            if (dueRemindersResult.isFailure) {
                console.error('[ReminderCronJob] Failed to fetch due reminders:', dueRemindersResult.getError());
                return;
            }
            const dueReminders = dueRemindersResult.getValue();
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
                    const processingResult = reminder.markAsProcessing();
                    if (processingResult.isFailure) {
                        console.error(`[ReminderCronJob] Cannot process reminder ${reminder.reminderId.toString()}: ${processingResult.getError()}`);
                        continue;
                    }
                    await this.reminderRepo.save(reminder);
                    // Send notification
                    const notificationData = {
                        recipientId: reminder.patientId,
                        recipientType: 'patient',
                        type: 'appointment_reminder',
                        title: this.getReminderTitle(reminder.reminderType.toString()),
                        content: this.getReminderContent(reminder),
                        channels: reminder.templateData.channels || ['SMS', 'EMAIL', 'IN_APP'],
                        priority: 'normal',
                        scheduledAt: new Date(),
                        metadata: {
                            appointmentId: reminder.appointmentId,
                            reminderId: reminder.reminderId.toString(),
                            reminderType: reminder.reminderType.toString(),
                            appointmentDate: reminder.appointmentDate,
                            appointmentTime: reminder.appointmentTime,
                        },
                        templateData: reminder.getTemplateVariables(),
                    };
                    const sendResult = await this.sendNotificationUseCase.execute(notificationData);
                    if (sendResult.isSuccess) {
                        // Mark as sent
                        const notificationId = sendResult.getValue()?.notificationId || 'UNKNOWN';
                        const sentResult = reminder.markAsSent(notificationId);
                        if (sentResult.isSuccess) {
                            await this.reminderRepo.save(reminder);
                            sentCount++;
                            console.log(`[ReminderCronJob] Successfully sent reminder ${reminder.reminderId.toString()} for appointment ${reminder.appointmentId}`);
                        }
                        else {
                            console.error(`[ReminderCronJob] Failed to mark reminder as sent: ${sentResult.getError()}`);
                        }
                    }
                    else {
                        // Mark as failed
                        const failureReason = sendResult.getError() || 'Unknown error';
                        const failedResult = reminder.markAsFailed(failureReason);
                        if (failedResult.isSuccess) {
                            await this.reminderRepo.save(reminder);
                            failedCount++;
                            console.error(`[ReminderCronJob] Failed to send reminder ${reminder.reminderId.toString()}: ${failureReason}`);
                            if (reminder.canRetry()) {
                                console.log(`[ReminderCronJob] Reminder will be retried at ${reminder.templateData.nextRetryAt}`);
                            }
                            else {
                                console.warn(`[ReminderCronJob] Reminder has exhausted all retries (${reminder.retryCount}/${reminder.maxRetries})`);
                            }
                        }
                        else {
                            console.error(`[ReminderCronJob] Failed to mark reminder as failed: ${failedResult.getError()}`);
                        }
                    }
                }
                catch (error) {
                    console.error(`[ReminderCronJob] Unexpected error processing reminder ${reminder.reminderId.toString()}:`, error);
                    failedCount++;
                }
            }
            const duration = Date.now() - startTime;
            console.log(`[ReminderCronJob] Completed run in ${duration}ms: ${sentCount} sent, ${failedCount} failed`);
            // 3. Process retryable reminders (failed reminders that can be retried)
            await this.processRetryableReminders();
            // 4. Expire old reminders
            await this.expireOldReminders();
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
            const retryableResult = await this.reminderRepo.findRetryableReminders(Math.min(this.config.batchSize, 50) // Limit retries to 50 per run
            );
            if (retryableResult.isFailure) {
                console.error('[ReminderCronJob] Failed to fetch retryable reminders:', retryableResult.getError());
                return;
            }
            const retryableReminders = retryableResult.getValue();
            if (retryableReminders.length === 0) {
                return;
            }
            console.log(`[ReminderCronJob] Found ${retryableReminders.length} retryable reminder(s)`);
            for (const reminder of retryableReminders) {
                // Check if it's time to retry
                const nextRetryAt = reminder.templateData.nextRetryAt;
                if (!nextRetryAt || new Date(nextRetryAt) > new Date()) {
                    continue; // Not yet time to retry
                }
                // Process the retry (same logic as due reminders)
                try {
                    const processingResult = reminder.markAsProcessing();
                    if (processingResult.isFailure) {
                        continue;
                    }
                    await this.reminderRepo.save(reminder);
                    const notificationData = {
                        recipientId: reminder.patientId,
                        recipientType: 'patient',
                        type: 'appointment_reminder',
                        title: this.getReminderTitle(reminder.reminderType.toString()),
                        content: this.getReminderContent(reminder),
                        channels: reminder.templateData.channels || ['SMS', 'EMAIL', 'IN_APP'],
                        priority: 'normal',
                        scheduledAt: new Date(),
                        metadata: {
                            appointmentId: reminder.appointmentId,
                            reminderId: reminder.reminderId.toString(),
                            reminderType: reminder.reminderType.toString(),
                            retryAttempt: reminder.retryCount,
                        },
                        templateData: reminder.getTemplateVariables(),
                    };
                    const sendResult = await this.sendNotificationUseCase.execute(notificationData);
                    if (sendResult.isSuccess) {
                        const notificationId = sendResult.getValue()?.notificationId || 'UNKNOWN';
                        reminder.markAsSent(notificationId);
                        await this.reminderRepo.save(reminder);
                        console.log(`[ReminderCronJob] Successfully sent retry reminder ${reminder.reminderId.toString()}`);
                    }
                    else {
                        const failureReason = sendResult.getError() || 'Unknown error';
                        reminder.markAsFailed(failureReason);
                        await this.reminderRepo.save(reminder);
                        console.error(`[ReminderCronJob] Failed to send retry reminder ${reminder.reminderId.toString()}: ${failureReason}`);
                    }
                }
                catch (error) {
                    console.error(`[ReminderCronJob] Error processing retry reminder ${reminder.reminderId.toString()}:`, error);
                }
            }
        }
        catch (error) {
            console.error('[ReminderCronJob] Error in processRetryableReminders:', error);
        }
    }
    /**
     * Expire old reminders (appointment date has passed)
     */
    async expireOldReminders() {
        try {
            const expireResult = await this.reminderRepo.expireOldReminders();
            if (expireResult.isSuccess) {
                const expiredCount = expireResult.getValue();
                if (expiredCount > 0) {
                    console.log(`[ReminderCronJob] Expired ${expiredCount} old reminder(s)`);
                }
            }
            else {
                console.error('[ReminderCronJob] Failed to expire old reminders:', expireResult.getError());
            }
        }
        catch (error) {
            console.error('[ReminderCronJob] Error expiring old reminders:', error);
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