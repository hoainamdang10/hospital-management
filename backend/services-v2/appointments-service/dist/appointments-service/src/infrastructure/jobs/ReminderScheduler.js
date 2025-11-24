"use strict";
/**
 * Reminder Scheduler - Infrastructure Layer
 * Manages appointment reminder scheduling using cron jobs
 * Replaces Scheduler Service with local cron implementation
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 *
 * TODO: Fix imports and implement findByScheduledTimeRange in repository
 * Currently disabled for MVP build
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
exports.ReminderScheduler = void 0;
const cron = __importStar(require("node-cron"));
// import { IEventPublisher } from '@shared/application/services/IEventPublisher'; // TODO: Fix import path
const AppointmentReminderScheduledEvent_1 = require("../../domain/events/AppointmentReminderScheduledEvent");
/**
 * Default reminder windows
 */
const DEFAULT_REMINDER_WINDOWS = [
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
class ReminderScheduler {
    constructor(logger, appointmentRepository, eventPublisher, reminderWindows = DEFAULT_REMINDER_WINDOWS) {
        this.logger = logger;
        this.appointmentRepository = appointmentRepository;
        this.eventPublisher = eventPublisher;
        this.reminderWindows = reminderWindows;
        this.jobs = [];
        this.isRunning = false;
        /**
         * Check if reminder was already sent (idempotency)
         * Uses in-memory cache for now, can be replaced with Redis
         */
        this.sentReminders = new Map();
    }
    /**
     * Start all reminder cron jobs
     */
    async start() {
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
        }
        catch (error) {
            this.logger.error('Failed to start Reminder Scheduler', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    /**
     * Stop all reminder cron jobs
     */
    async stop() {
        try {
            this.logger.info('Stopping Reminder Scheduler');
            for (const job of this.jobs) {
                job.stop();
            }
            this.jobs = [];
            this.isRunning = false;
            this.logger.info('Reminder Scheduler stopped successfully');
        }
        catch (error) {
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
    async processReminders(window) {
        try {
            const now = new Date();
            const reminderTime = new Date(now.getTime() + window.hoursBeforeAppointment * 60 * 60 * 1000);
            // Find appointments scheduled around the reminder time
            // We use a 5-minute window to avoid duplicate reminders
            const windowStart = new Date(reminderTime.getTime() - 5 * 60 * 1000);
            const windowEnd = new Date(reminderTime.getTime() + 5 * 60 * 1000);
            // TODO: Implement findByScheduledTimeRange in repository
            // const appointments = await this.appointmentRepository.findByScheduledTimeRange(
            //   windowStart,
            //   windowEnd
            // );
            const appointments = []; // Temporary stub
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
                    const event = new AppointmentReminderScheduledEvent_1.AppointmentReminderScheduledEvent(appointment.id, appointment.patientId, appointment.staffId, appointment.departmentId, appointment.scheduledAt, window.name, window.hoursBeforeAppointment);
                    await this.eventPublisher.publish(event);
                    // Mark reminder as sent
                    await this.markReminderAsSent(reminderKey);
                    this.logger.info('Reminder event published', {
                        appointmentId: appointment.id,
                        patientId: appointment.patientId,
                        reminderWindow: window.name,
                    });
                }
                catch (error) {
                    this.logger.error('Failed to process reminder for appointment', {
                        appointmentId: appointment.id,
                        reminderWindow: window.name,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                    // Continue with next appointment
                }
            }
        }
        catch (error) {
            this.logger.error('Failed to process reminders', {
                reminderWindow: window.name,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async isReminderAlreadySent(reminderKey) {
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
    async markReminderAsSent(reminderKey) {
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
    isActive() {
        return this.isRunning;
    }
}
exports.ReminderScheduler = ReminderScheduler;
//# sourceMappingURL=ReminderScheduler.js.map