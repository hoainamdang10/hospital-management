/**
 * Reminder Scheduler - Infrastructure Layer
 * Manages appointment reminder scheduling using cron jobs
 * Replaces Scheduler Service with local cron implementation
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import * as cron from 'node-cron';
import { ILogger } from '@shared/application/services/logger.interface';
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IEventPublisher } from '@shared/application/services/IEventPublisher';
import { AppointmentReminderScheduledEvent } from '../../domain/events/AppointmentReminderScheduledEvent';

/**
 * Reminder window configuration
 */
export interface ReminderWindow {
  name: string;
  hoursBeforeAppointment: number;
  cronExpression: string; // Run frequency
}

/**
 * Default reminder windows
 */
const DEFAULT_REMINDER_WINDOWS: ReminderWindow[] = [
  {
    name: 'reminder-24h',
    hoursBeforeAppointment: 24,
    cronExpression: '0 */2 * * *', // Every 2 hours
  },
  {
    name: 'reminder-2h',
    hoursBeforeAppointment: 2,
    cronExpression: '*/15 * * * *', // Every 15 minutes
  },
  {
    name: 'reminder-30min',
    hoursBeforeAppointment: 0.5,
    cronExpression: '*/5 * * * *', // Every 5 minutes
  },
];

/**
 * Reminder Scheduler
 * Runs cron jobs to find appointments that need reminders and publish events
 */
export class ReminderScheduler {
  private jobs: cron.ScheduledTask[] = [];
  private isRunning = false;

  constructor(
    private logger: ILogger,
    private appointmentRepository: IAppointmentRepository,
    private eventPublisher: IEventPublisher,
    private reminderWindows: ReminderWindow[] = DEFAULT_REMINDER_WINDOWS
  ) {}

  /**
   * Start all reminder cron jobs
   */
  async start(): Promise<void> {
    try {
      this.logger.info('Starting Reminder Scheduler', {
        windowsCount: this.reminderWindows.length,
      });

      for (const window of this.reminderWindows) {
        const job = cron.schedule(window.cronExpression, async () => {
          await this.processReminders(window);
        });

        this.jobs.push(job);

        this.logger.info('Scheduled reminder job', {
          name: window.name,
          hoursBeforeAppointment: window.hoursBeforeAppointment,
          cronExpression: window.cronExpression,
        });
      }

      this.isRunning = true;
      this.logger.info('Reminder Scheduler started successfully');
    } catch (error) {
      this.logger.error('Failed to start Reminder Scheduler', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Stop all reminder cron jobs
   */
  async stop(): Promise<void> {
    try {
      this.logger.info('Stopping Reminder Scheduler');

      for (const job of this.jobs) {
        job.stop();
      }

      this.jobs = [];
      this.isRunning = false;

      this.logger.info('Reminder Scheduler stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop Reminder Scheduler', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Process reminders for a specific window
   * Finds appointments that need reminders and publishes events
   */
  private async processReminders(window: ReminderWindow): Promise<void> {
    try {
      const now = new Date();
      const reminderTime = new Date(
        now.getTime() + window.hoursBeforeAppointment * 60 * 60 * 1000
      );

      // Find appointments scheduled around the reminder time
      // We use a 5-minute window to avoid duplicate reminders
      const windowStart = new Date(reminderTime.getTime() - 5 * 60 * 1000);
      const windowEnd = new Date(reminderTime.getTime() + 5 * 60 * 1000);

      const appointments = await this.appointmentRepository.findByScheduledTimeRange(
        windowStart,
        windowEnd
      );

      if (appointments.length === 0) {
        return;
      }

      this.logger.debug('Found appointments for reminder', {
        reminderWindow: window.name,
        appointmentCount: appointments.length,
        windowStart,
        windowEnd,
      });

      // Publish reminder events for each appointment
      for (const appointment of appointments) {
        try {
          // Check if reminder was already sent (idempotency)
          const reminderKey = `${appointment.id}:${window.name}`;
          const alreadySent = await this.isReminderAlreadySent(reminderKey);

          if (alreadySent) {
            this.logger.debug('Reminder already sent, skipping', {
              appointmentId: appointment.id,
              reminderWindow: window.name,
            });
            continue;
          }

          // Publish reminder event
          const event = new AppointmentReminderScheduledEvent(
            appointment.id,
            appointment.patientId,
            appointment.staffId,
            appointment.departmentId,
            appointment.scheduledAt,
            window.name,
            window.hoursBeforeAppointment
          );

          await this.eventPublisher.publish(event);

          // Mark reminder as sent
          await this.markReminderAsSent(reminderKey);

          this.logger.info('Reminder event published', {
            appointmentId: appointment.id,
            patientId: appointment.patientId,
            reminderWindow: window.name,
          });
        } catch (error) {
          this.logger.error('Failed to process reminder for appointment', {
            appointmentId: appointment.id,
            reminderWindow: window.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          // Continue with next appointment
        }
      }
    } catch (error) {
      this.logger.error('Failed to process reminders', {
        reminderWindow: window.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if reminder was already sent (idempotency)
   * Uses in-memory cache for now, can be replaced with Redis
   */
  private sentReminders = new Map<string, Date>();

  private async isReminderAlreadySent(reminderKey: string): Promise<boolean> {
    const sentAt = this.sentReminders.get(reminderKey);
    if (!sentAt) {
      return false;
    }

    // Consider reminder as "already sent" if sent within last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return sentAt > fiveMinutesAgo;
  }

  /**
   * Mark reminder as sent
   */
  private async markReminderAsSent(reminderKey: string): Promise<void> {
    this.sentReminders.set(reminderKey, new Date());

    // Clean up old entries (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [key, sentAt] of this.sentReminders.entries()) {
      if (sentAt < oneHourAgo) {
        this.sentReminders.delete(key);
      }
    }
  }

  /**
   * Check if scheduler is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}
