/**
 * ReminderCronJob - Infrastructure Layer
 * Periodically checks for due reminders and sends them
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Cron Job Pattern
 */

import * as cron from 'node-cron';
import { IAppointmentReminderRepository } from '../../domain/repositories/IAppointmentReminderRepository';
import { SendNotificationUseCase } from '../../application/use-cases/SendNotificationUseCase';

export interface ReminderCronJobConfig {
  cronExpression: string; // Default: '*/5 * * * *' (every 5 minutes)
  batchSize: number; // How many reminders to process per run
  enabled: boolean;
}

/**
 * ReminderCronJob - Sends due appointment reminders
 *
 * Workflow:
 * 1. Query database for reminders where status=PENDING and scheduled_send_time <= now
 * 2. For each reminder, send notification via SendNotificationUseCase
 * 3. Update reminder status to SENT or FAILED based on result
 * 4. Implement retry logic for failed reminders
 */
export class ReminderCronJob {
  private task?: cron.ScheduledTask;
  private isRunning = false;

  constructor(
    private config: ReminderCronJobConfig,
    private reminderRepo: IAppointmentReminderRepository,
    private sendNotificationUseCase: SendNotificationUseCase,
  ) {}

  /**
   * Start the cron job
   */
  public start(): void {
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
  public stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = undefined;
      console.log('[ReminderCronJob] Stopped successfully');
    }
  }

  /**
   * Run the job manually (useful for testing)
   */
  public async run(): Promise<void> {
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
            recipientType: 'patient' as const,
            recipientName: reminder.patientName || 'Quý khách',
            recipientEmail: reminder.patientEmail,
            recipientPhone: reminder.patientPhone,
            type: 'appointment_reminder',
            title: this.getReminderTitle(reminder.reminderType.toString()),
            content: this.getReminderContent(reminder),
            channels: ['SMS', 'EMAIL', 'IN_APP'],
            priority: 'normal' as const,
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

          const sendResult = await this.sendNotificationUseCase.execute(notificationData);

          if (sendResult.success) {
            // Mark as sent
            const notificationId = sendResult.notificationId || 'UNKNOWN';
            reminder.markAsSent(notificationId);
            await this.reminderRepo.save(reminder);
            sentCount++;
            console.log(`[ReminderCronJob] Successfully sent reminder ${reminder.reminderId} for appointment ${reminder.appointmentId}`);
          } else {
            // Mark as failed
            const failureReason = sendResult.message || 'Unknown error';
            reminder.markAsFailed(failureReason);
            await this.reminderRepo.save(reminder);
            failedCount++;
            console.error(`[ReminderCronJob] Failed to send reminder ${reminder.reminderId}: ${failureReason}`);

            if (reminder.canRetry()) {
              console.log(`[ReminderCronJob] Reminder will be retried`);
            } else {
              console.warn(`[ReminderCronJob] Reminder has exhausted all retries (${reminder.retryCount}/${reminder.maxRetries})`);
            }
          }
        } catch (error: any) {
          console.error(`[ReminderCronJob] Unexpected error processing reminder ${reminder.reminderId}:`, error);
          failedCount++;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[ReminderCronJob] Completed run in ${duration}ms: ${sentCount} sent, ${failedCount} failed`);

      // 3. Process retryable reminders
      await this.processRetryableReminders();

    } catch (error) {
      console.error('[ReminderCronJob] Unexpected error in run:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process retryable reminders (failed reminders with retry count < max)
   */
  private async processRetryableReminders(): Promise<void> {
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
            recipientType: 'patient' as const,
            recipientName: reminder.patientName || 'Quý khách',
            recipientEmail: reminder.patientEmail,
            recipientPhone: reminder.patientPhone,
            type: 'appointment_reminder',
            title: this.getReminderTitle(reminder.reminderType.toString()),
            content: this.getReminderContent(reminder),
            channels: ['SMS', 'EMAIL', 'IN_APP'],
            priority: 'normal' as const,
            scheduledAt: new Date(),
            data: {
              appointmentId: reminder.appointmentId,
              reminderId: reminder.reminderId,
              reminderType: reminder.reminderType.toString(),
              retryAttempt: reminder.retryCount,
            },
            templateData: reminder.getTemplateVariables(),
          };

          const sendResult = await this.sendNotificationUseCase.execute(notificationData);

          if (sendResult.success) {
            const notificationId = sendResult.notificationId || 'UNKNOWN';
            reminder.markAsSent(notificationId);
            await this.reminderRepo.save(reminder);
            console.log(`[ReminderCronJob] Successfully sent retry reminder ${reminder.reminderId}`);
          } else {
            const failureReason = sendResult.message || 'Unknown error';
            reminder.markAsFailed(failureReason);
            await this.reminderRepo.save(reminder);
            console.error(`[ReminderCronJob] Failed to send retry reminder ${reminder.reminderId}: ${failureReason}`);
          }
        } catch (error: any) {
          console.error(`[ReminderCronJob] Error processing retry reminder ${reminder.reminderId}:`, error);
        }
      }
    } catch (error) {
      console.error('[ReminderCronJob] Error in processRetryableReminders:', error);
    }
  }

  /**
   * Get reminder title based on type
   */
  private getReminderTitle(reminderType: string): string {
    const titles: Record<string, string> = {
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
  private getReminderContent(reminder: any): string {
    const timeText: Record<string, string> = {
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
  private formatDate(date: Date): string {
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
  public isJobRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Check if cron job is started
   */
  public isJobStarted(): boolean {
    return !!this.task;
  }
}
