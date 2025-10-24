/**
 * Appointment Scheduler Integration Handler
 *
 * Handles integration with Scheduler Service for appointment reminders.
 * Triggered by AppointmentScheduled, AppointmentCancelled, AppointmentRescheduled events.
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { EventHandler } from '@shared/infrastructure/event-bus/EventBus';
import { DomainEvent } from '@shared/domain/base/domain-event';
import { RemoteSchedulerAdapter } from '@hospital/scheduler-client';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface ReminderWindow {
  window: string; // e.g., "24h", "2h", "30min", "7d"
  channels: string[];
  description?: string;
}

interface UrgencyPolicies {
  ROUTINE: ReminderWindow[];
  URGENT: ReminderWindow[];
  EMERGENCY: ReminderWindow[];
  description?: string;
}

interface ReminderPolicy {
  version: string;
  default: UrgencyPolicies;
  tenants?: Record<string, UrgencyPolicies>;
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
    allowedChannels: string[];
    blockedChannels: string[];
  };
  retryPolicy?: {
    maxAttempts: number;
    baseDelayMs: number;
    maxDelayMs: number;
    strategy: 'exp' | 'linear' | 'fixed';
  };
}

interface AppointmentScheduledEventData {
  appointmentId: string;
  patientId: string;
  providerId: string;
  startTime: Date;
  endTime: Date;
  reason: string;
  appointmentType: string;
  priority: string;
  department?: string;
  urgencyLevel?: 'routine' | 'urgent' | 'emergency';
  scheduledBy: string;
}

interface AppointmentCancelledEventData {
  appointmentId: string;
  patientId: string;
  providerId: string;
  cancelledBy: string;
  cancelledAt: Date;
  reason?: string;
}

interface AppointmentRescheduledEventData {
  appointmentId: string;
  patientId: string;
  providerId: string;
  oldStartTime: Date;
  newStartTime: Date;
  newEndTime: Date;
  rescheduledBy: string;
  reason?: string;
}

// ============================================================================
// Appointment Scheduled Handler
// ============================================================================

export class AppointmentScheduledSchedulerHandler implements EventHandler<DomainEvent> {
  private policy: ReminderPolicy;
  private tenantId: string;
  private outboxRepo: import('../../outbox/OutboxRepository').OutboxRepository;

  constructor(
    outboxRepo: import('../../outbox/OutboxRepository').OutboxRepository,
    tenantId: string = 'hospital-1'
  ) {
    this.outboxRepo = outboxRepo;
    this.tenantId = tenantId;
    this.policy = this.loadReminderPolicy();
  }

  /**
   * Load reminder policy from config file
   */
  private loadReminderPolicy(): ReminderPolicy {
    try {
      const policyPath = path.join(__dirname, '../../../config/reminder-policy.json');
      const policyContent = fs.readFileSync(policyPath, 'utf-8');
      return JSON.parse(policyContent) as ReminderPolicy;
    } catch (error) {
      console.warn('[SchedulerHandler] Failed to load reminder policy, using defaults', error);
      return this.getDefaultPolicy();
    }
  }

  /**
   * Get default reminder policy (fallback)
   */
  private getDefaultPolicy(): ReminderPolicy {
    return {
      version: '1.0.0',
      default: {
        ROUTINE: [
          { window: '24h', channels: ['EMAIL', 'PUSH'] },
          { window: '2h', channels: ['PUSH'] }
        ],
        URGENT: [
          { window: '2h', channels: ['SMS', 'PUSH'] },
          { window: '30min', channels: ['SMS', 'PUSH'] }
        ],
        EMERGENCY: []
      }
    };
  }

  /**
   * Get reminder windows for urgency level
   */
  private getReminderWindows(urgencyLevel: 'routine' | 'urgent' | 'emergency'): ReminderWindow[] {
    const urgencyKey = urgencyLevel.toUpperCase() as 'ROUTINE' | 'URGENT' | 'EMERGENCY';

    // Check tenant-specific policy first
    if (this.policy.tenants && this.policy.tenants[this.tenantId]) {
      const tenantPolicy = this.policy.tenants[this.tenantId][urgencyKey];
      if (tenantPolicy) {
        return tenantPolicy;
      }
    }

    // Fallback to default policy
    return this.policy.default[urgencyKey] || [];
  }

  /**
   * Parse time window to milliseconds
   */
  private parseTimeWindow(window: string): number {
    const match = window.match(/^(\d+)(min|h|d|w)$/);
    if (!match) {
      throw new Error(`Invalid time window format: ${window}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      'min': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000
    };

    return value * multipliers[unit];
  }

  /**
   * Calculate reminder time from appointment time
   */
  private calculateReminderTime(appointmentTime: Date, window: string): Date {
    const windowMs = this.parseTimeWindow(window);
    return new Date(appointmentTime.getTime() - windowMs);
  }

  /**
   * Enforce quiet hours: if reminderTime falls within [start, end) local window,
   * shift to the end of quiet hours + 5 minutes.
   * NOTE: For simplicity we use server local time. Replace with timezone-aware logic (e.g., Luxon) if needed.
   */
  private enforceQuietHours(reminderTime: Date): Date {
    const qh = this.policy.quietHours;
    if (!qh || !qh.enabled) return reminderTime;

    // Parse HH:mm
    const [startH, startM] = qh.start.split(':').map((s) => parseInt(s, 10));
    const [endH, endM] = qh.end.split(':').map((s) => parseInt(s, 10));

    const local = new Date(reminderTime);
    const start = new Date(local);
    start.setHours(startH, startM, 0, 0);
    const end = new Date(local);
    end.setHours(endH, endM, 0, 0);

    // Quiet hours may span midnight (e.g., 21:00 -> 06:00)
    const spansMidnight = end <= start;

    const inQuiet = spansMidnight
      ? (local >= start || local < end)
      : (local >= start && local < end);

    if (!inQuiet) return reminderTime;

    // Shift to quiet-end + 5 minutes
    const shifted = new Date(local);
    if (spansMidnight && local >= start) {
      // Move to next day end
      shifted.setDate(shifted.getDate() + 1);
    }
    shifted.setHours(endH, endM + 5, 0, 0);
    return shifted;
  }

  /**
   * Handle AppointmentScheduled event
   */
  async handle(event: DomainEvent): Promise<void> {
    try {
      const eventData = (event as any).eventData as AppointmentScheduledEventData;

      console.log(`[SchedulerHandler] Processing AppointmentScheduled: ${eventData.appointmentId}`);

      const urgencyLevel = eventData.urgencyLevel || 'routine';
      const reminderWindows = this.getReminderWindows(urgencyLevel);

      if (reminderWindows.length === 0) {
        console.log(`[SchedulerHandler] No reminders for urgency level: ${urgencyLevel}`);
        return;
      }

      const appointmentTime = new Date(eventData.startTime);
      const now = new Date();

      // Create reminder schedules
      for (const reminder of reminderWindows) {
        const baseReminderTime = this.calculateReminderTime(appointmentTime, reminder.window);
        const reminderTime = this.enforceQuietHours(baseReminderTime);

        // Skip if reminder time is in the past
        if (reminderTime <= now) {
          console.log(`[SchedulerHandler] Skipping past reminder: ${reminder.window} for ${eventData.appointmentId}`);
          continue;
        }

        const dedupKey = `${eventData.appointmentId}:reminder-${reminder.window}`;

        try {
          await this.outboxRepo.enqueue({
            eventType: 'SchedulerReminderCreate',
            aggregateType: 'Appointment',
            aggregateId: eventData.appointmentId,
            dedupKey,
            payload: {
              tenantId: this.tenantId,
              ownerService: 'appointments',
              ownerResourceType: 'appointment',
              ownerResourceId: eventData.appointmentId,
              scheduleType: 'ONCE',
              startAtUtc: reminderTime.toISOString(),
              topicOrCommand: `appointments.appointment.reminder.${reminder.window}`,
              payloadJson: {
                appointmentId: eventData.appointmentId,
                patientId: eventData.patientId,
                providerId: eventData.providerId,
                appointmentTime: appointmentTime.toISOString(),
                reminderType: reminder.window,
                channels: reminder.channels,
                urgencyLevel,
                reason: eventData.reason,
                department: eventData.department
              },
              dedupKey,
              retryPolicy: this.policy.retryPolicy ? {
                strategy: this.policy.retryPolicy.strategy,
                maxAttempts: this.policy.retryPolicy.maxAttempts,
                baseMs: this.policy.retryPolicy.baseDelayMs,
                maxDelayMs: this.policy.retryPolicy.maxDelayMs
              } : undefined
            }
          });

          console.log(`[SchedulerHandler] ✅ Enqueued reminder schedule: ${dedupKey} at ${reminderTime.toISOString()}`);
        } catch (error) {
          console.error(`[SchedulerHandler] ❌ Failed to enqueue reminder ${dedupKey}:`, error);
          // Continue with other reminders even if one fails
        }
      }

      console.log(`[SchedulerHandler] ✅ Completed scheduling ${reminderWindows.length} reminders for ${eventData.appointmentId}`);
    } catch (error) {
      console.error('[SchedulerHandler] Error handling AppointmentScheduled event:', error);
      throw error;
    }
  }
}

// ============================================================================
// Appointment Cancelled Handler
// ============================================================================

export class AppointmentCancelledSchedulerHandler implements EventHandler<DomainEvent> {
  private outboxRepo: import('../../outbox/OutboxRepository').OutboxRepository;
  private tenantId: string;

  constructor(
    outboxRepo: import('../../outbox/OutboxRepository').OutboxRepository,
    tenantId: string = 'hospital-1'
  ) {
    this.outboxRepo = outboxRepo;
    this.tenantId = tenantId;
  }

  /**
   * Handle AppointmentCancelled event
   * Enqueues cancellation to Outbox instead of calling Scheduler directly
   */
  async handle(event: DomainEvent): Promise<void> {
    try {
      const eventData = (event as any).eventData as AppointmentCancelledEventData;

      console.log(`[SchedulerHandler] Processing AppointmentCancelled: ${eventData.appointmentId}`);

      // Enqueue cancellation to Outbox
      await this.outboxRepo.enqueue({
        eventType: 'SchedulerReminderCancelByOwner',
        aggregateType: 'Appointment',
        aggregateId: eventData.appointmentId,
        dedupKey: `${eventData.appointmentId}:cancel-all`,
        payload: {
          tenantId: this.tenantId,
          ownerService: 'appointments',
          ownerResourceId: eventData.appointmentId
        }
      });

      console.log(`[SchedulerHandler] ✅ Enqueued cancellation for ${eventData.appointmentId}`);
    } catch (error) {
      console.error('[SchedulerHandler] Error handling AppointmentCancelled event:', error);
      throw error;
    }
  }
}

// ============================================================================
// Appointment Rescheduled Handler
// ============================================================================

export class AppointmentRescheduledSchedulerHandler implements EventHandler<DomainEvent> {
  private outboxRepo: import('../../outbox/OutboxRepository').OutboxRepository;
  private tenantId: string;

  constructor(
    outboxRepo: import('../../outbox/OutboxRepository').OutboxRepository,
    tenantId: string = 'hospital-1'
  ) {
    this.outboxRepo = outboxRepo;
    this.tenantId = tenantId;
  }

  /**
   * Handle AppointmentRescheduled event
   * Cancels old reminders and creates new ones via Outbox
   */
  async handle(event: DomainEvent): Promise<void> {
    try {
      const eventData = (event as any).eventData as AppointmentRescheduledEventData;

      console.log(`[SchedulerHandler] Processing AppointmentRescheduled: ${eventData.appointmentId}`);

      // Step 1: Cancel old reminders
      await this.outboxRepo.enqueue({
        eventType: 'SchedulerReminderCancelByOwner',
        aggregateType: 'Appointment',
        aggregateId: eventData.appointmentId,
        dedupKey: `${eventData.appointmentId}:reschedule-cancel`,
        payload: {
          tenantId: this.tenantId,
          ownerService: 'appointments',
          ownerResourceId: eventData.appointmentId
        }
      });

      // Step 2: Create new reminders (reuse logic from AppointmentScheduled)
      // For simplicity, we'll enqueue a single reminder creation event
      // In production, you'd want to apply the same policy-based reminder windows
      await this.outboxRepo.enqueue({
        eventType: 'SchedulerReminderCreate',
        aggregateType: 'Appointment',
        aggregateId: eventData.appointmentId,
        dedupKey: `${eventData.appointmentId}:reschedule-create`,
        payload: {
          tenantId: this.tenantId,
          ownerService: 'appointments',
          ownerResourceId: eventData.appointmentId,
          topicOrCommand: `appointments.appointment.reminder.rescheduled`,
          startAtUtc: eventData.newStartTime.toISOString(),
          payloadJson: {
            appointmentId: eventData.appointmentId,
            patientId: eventData.patientId,
            providerId: eventData.providerId,
            newStartTime: eventData.newStartTime.toISOString(),
            reason: eventData.reason || 'Appointment rescheduled'
          }
        }
      });

      console.log(`[SchedulerHandler] ✅ Enqueued reschedule (cancel + create) for ${eventData.appointmentId}`);
    } catch (error) {
      console.error('[SchedulerHandler] Error handling AppointmentRescheduled event:', error);
      throw error;
    }
  }
}
