/**
 * AppointmentAbuseEventHandler - Handle events from Appointments Service
 * 
 * Handles:
 * - appointment.no_show → Flag abuse if >= 3 no-shows in 30 days
 * - appointment.cancelled → Track last-minute cancellation patterns
 * - appointment.rescheduled → Restrict booking if >= 3 reschedules in 30 days (PHASE 3)
 * - appointment.late_arrival → Flag if >= 3 late arrivals (>15 min) in 30 days (PHASE 3)
 * - appointment.completed → Reset restrictions if good behavior (PHASE 4)
 * 
 * @author Hospital Management Team
 * @version 2.0.0 (PHASE 4 - FINAL)
 * @compliance Event-Driven Architecture, HIPAA, Abuse Prevention
 */

import { ILogger } from '../services/ILogger';
import { InboxService } from '../../infrastructure/inbox/InboxService';
import { SupabaseClient } from '@supabase/supabase-js';

export interface AppointmentNoShowEvent {
  eventId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  scheduledDate: Date;
  noShowDetails?: any;
  occurredAt: Date;
}

export interface AppointmentCancelledEvent {
  eventId: string;
  appointmentId: string;
  patientId: string;
  cancelledBy: string;
  cancellationType: string;
  reason?: string;
  hoursNotice: number;
  occurredAt: Date;
}

export interface AppointmentRescheduledEvent {
  eventId: string;
  appointmentId: string;
  patientId: string;
  oldScheduledDate: Date;
  newScheduledDate: Date;
  rescheduledBy: string;
  reason?: string;
  occurredAt: Date;
}

export interface AppointmentLateArrivalEvent {
  eventId: string;
  appointmentId: string;
  patientId: string;
  scheduledTime: Date;
  actualArrivalTime: Date;
  minutesLate: number;
  occurredAt: Date;
}

export interface AppointmentCompletedEvent {
  eventId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  completedAt: Date;
  wasOnTime: boolean; // Arrived on time
  hadNoIssues: boolean; // No behavioral issues
  occurredAt: Date;
}

export class AppointmentAbuseEventHandler {
  constructor(
    private inboxService: InboxService,
    private supabaseClient: SupabaseClient,
    private logger: ILogger
  ) {}

  /**
   * Handle appointment.no_show event
   */
  async handleAppointmentNoShow(event: AppointmentNoShowEvent): Promise<void> {
    try {
      // Idempotency check
      const processed = await this.inboxService.checkProcessed(event.eventId);
      if (processed) {
        this.logger.debug('Event already processed', { eventId: event.eventId });
        return;
      }

      // Store event in inbox
      await this.inboxService.storeEvent({
        eventId: event.eventId,
        eventType: 'AppointmentNoShowEvent',
        aggregateId: event.appointmentId,
        aggregateType: 'Appointment',
        payloadJson: event,
        sourceService: 'appointments-service',
        routingKey: 'appointment.no_show',
        occurredAt: event.occurredAt
      });

      this.logger.info('Processing appointment no-show event', {
        eventId: event.eventId,
        patientId: event.patientId,
        appointmentId: event.appointmentId
      });

      // Get no-show history (last 30 days)
      const noShowCount = await this.getNoShowCount(event.patientId, 30);

      this.logger.debug('No-show count', {
        patientId: event.patientId,
        noShowCount
      });

      // Flag account if >= 3 no-shows in 30 days
      if (noShowCount >= 3) {
        await this.flagUserAccount(
          event.patientId,
          'FREQUENT_NO_SHOW',
          'MEDIUM',
          {
            noShowCount,
            lastNoShowDate: event.scheduledDate.toISOString(),
            appointmentId: event.appointmentId
          },
          event.eventId
        );

        // Apply restrictions
        await this.applyUserRestriction(
          event.patientId,
          'REQUIRE_DEPOSIT_FOR_BOOKING',
          { requireDeposit: true, depositAmount: 200000 }, // 200k VND
          event.eventId
        );

        await this.applyUserRestriction(
          event.patientId,
          'MAX_ADVANCE_BOOKING_DAYS',
          { maxDays: 7 },
          event.eventId
        );

        await this.applyUserRestriction(
          event.patientId,
          'MAX_CONCURRENT_BOOKINGS',
          { maxBookings: 1 },
          event.eventId
        );

        // Audit log
        await this.auditLog({
          action: 'USER_ACCOUNT_FLAGGED',
          userId: event.patientId,
          severity: 'MEDIUM',
          details: {
            flagType: 'FREQUENT_NO_SHOW',
            noShowCount,
            eventId: event.eventId,
            sourceService: 'appointments-service'
          }
        });

        this.logger.warn('User account flagged for frequent no-shows', {
          patientId: event.patientId,
          noShowCount,
          restrictionsApplied: [
            'REQUIRE_DEPOSIT_FOR_BOOKING',
            'MAX_ADVANCE_BOOKING_DAYS',
            'MAX_CONCURRENT_BOOKINGS'
          ]
        });
      }

      // Mark as processed
      await this.inboxService.markProcessed(event.eventId);

    } catch (error) {
      this.logger.error('Error handling appointment no-show event', {
        eventId: event.eventId,
        error: error instanceof Error ? error.message : String(error)
      });
      await this.inboxService.markFailed(
        event.eventId,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Handle appointment.cancelled event
   */
  async handleAppointmentCancelled(event: AppointmentCancelledEvent): Promise<void> {
    try {
      // Idempotency check
      const processed = await this.inboxService.checkProcessed(event.eventId);
      if (processed) {
        this.logger.debug('Event already processed', { eventId: event.eventId });
        return;
      }

      // Store event in inbox
      await this.inboxService.storeEvent({
        eventId: event.eventId,
        eventType: 'AppointmentCancelledEvent',
        aggregateId: event.appointmentId,
        aggregateType: 'Appointment',
        payloadJson: event,
        sourceService: 'appointments-service',
        routingKey: 'appointment.cancelled',
        occurredAt: event.occurredAt
      });

      this.logger.info('Processing appointment cancelled event', {
        eventId: event.eventId,
        patientId: event.patientId,
        appointmentId: event.appointmentId,
        hoursNotice: event.hoursNotice
      });

      // Track last-minute cancellations (< 24 hours notice)
      if (event.hoursNotice < 24) {
        const lastMinuteCancellations = await this.getLastMinuteCancellationCount(
          event.patientId,
          30
        );

        this.logger.debug('Last-minute cancellation count', {
          patientId: event.patientId,
          count: lastMinuteCancellations
        });

        // Warn user if pattern detected (>= 3 last-minute cancellations)
        if (lastMinuteCancellations >= 3) {
          await this.flagUserAccount(
            event.patientId,
            'ACCOUNT_REVIEW_REQUIRED',
            'LOW',
            {
              reason: 'FREQUENT_LAST_MINUTE_CANCELLATIONS',
              count: lastMinuteCancellations,
              lastCancellationHours: event.hoursNotice
            },
            event.eventId
          );

          this.logger.info('User flagged for review due to cancellation pattern', {
            patientId: event.patientId,
            lastMinuteCancellations
          });
        }
      }

      // Mark as processed
      await this.inboxService.markProcessed(event.eventId);

    } catch (error) {
      this.logger.error('Error handling appointment cancelled event', {
        eventId: event.eventId,
        error: error instanceof Error ? error.message : String(error)
      });
      await this.inboxService.markFailed(
        event.eventId,
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Get no-show count in last N days
   */
  private async getNoShowCount(userId: string, days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { count, error } = await this.supabaseClient
      .schema('auth_schema')
      .from('event_inbox')
      .select('*', { count: 'exact', head: true })
      .eq('aggregate_type', 'Appointment')
      .eq('event_type', 'AppointmentNoShowEvent')
      .contains('payload_json', { patientId: userId })
      .gte('occurred_at', cutoffDate.toISOString());

    if (error) {
      this.logger.error('Error getting no-show count', { error: error.message });
      return 0;
    }

    return count || 0;
  }

  /**
   * Get last-minute cancellation count in last N days
   */
  private async getLastMinuteCancellationCount(userId: string, days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Query for cancelled appointments with < 24 hours notice
    const { data, error } = await this.supabaseClient
      .schema('auth_schema')
      .from('event_inbox')
      .select('payload_json')
      .eq('aggregate_type', 'Appointment')
      .eq('event_type', 'AppointmentCancelledEvent')
      .contains('payload_json', { patientId: userId })
      .gte('occurred_at', cutoffDate.toISOString());

    if (error) {
      this.logger.error('Error getting cancellation count', { error: error.message });
      return 0;
    }

    // Filter for last-minute cancellations (< 24 hours)
    const lastMinuteCancellations = (data || []).filter(
      (row: any) => row.payload_json.hoursNotice < 24
    );

    return lastMinuteCancellations.length;
  }

  /**
   * Flag user account
   */
  private async flagUserAccount(
    userId: string,
    flagType: string,
    severity: string,
    metadata: any,
    sourceEventId: string
  ): Promise<void> {
    const { error } = await this.supabaseClient
      .schema('auth_schema')
      .from('user_flags')
      .insert({
        user_id: userId,
        flag_type: flagType,
        severity,
        is_active: true,
        flagged_by: 'SYSTEM_AUTO',
        metadata,
        source_event_id: sourceEventId,
        source_service: 'appointments-service'
      });

    if (error) {
      throw new Error(`Failed to flag user account: ${error.message}`);
    }
  }

  /**
   * Apply user restriction
   */
  private async applyUserRestriction(
    userId: string,
    restrictionType: string,
    restrictionValue: any,
    sourceEventId: string
  ): Promise<void> {
    const { error } = await this.supabaseClient
      .schema('auth_schema')
      .from('user_restrictions')
      .insert({
        user_id: userId,
        restriction_type: restrictionType,
        restriction_value: restrictionValue,
        is_active: true,
        applied_by: 'SYSTEM_AUTO',
        source_event_id: sourceEventId,
        source_service: 'appointments-service'
      });

    if (error) {
      throw new Error(`Failed to apply user restriction: ${error.message}`);
    }
  }

  /**
   * Audit log
   */
  private async auditLog(log: {
    action: string;
    userId: string;
    severity: string;
    details: any;
  }): Promise<void> {
    const { error } = await this.supabaseClient
      .schema('auth_schema')
      .from('audit_logs')
      .insert({
        actor_id: log.userId,
        action: log.action,
        resource_type: 'USER_ACCOUNT',
        resource_id: log.userId,
        details: log.details,
        severity: log.severity.toLowerCase(),
        success: true
      });

    if (error) {
      this.logger.error('Error writing audit log', { error: error.message });
    }
  }

  /**
   * Handle appointment.rescheduled event (PHASE 3)
   * Restrict booking if >= 3 reschedules in 30 days
   */
  async handleAppointmentRescheduled(event: AppointmentRescheduledEvent): Promise<void> {
    try {
      // Idempotency check
      const processed = await this.inboxService.checkProcessed(event.eventId);
      if (processed) {
        this.logger.debug('Event already processed', { eventId: event.eventId });
        return;
      }

      // Store event in inbox
      await this.inboxService.storeEvent({
        eventId: event.eventId,
        eventType: 'AppointmentRescheduledEvent',
        aggregateId: event.appointmentId,
        aggregateType: 'AppointmentRescheduled',
        payloadJson: event,
        sourceService: 'appointments-service',
        routingKey: 'appointment.rescheduled',
        occurredAt: event.occurredAt
      });

      this.logger.info('Processing appointment.rescheduled event', {
        eventId: event.eventId,
        patientId: event.patientId,
        appointmentId: event.appointmentId
      });

      // Get reschedule count in last 30 days
      const rescheduleCount = await this.getRescheduleCount(event.patientId, 30);

      this.logger.debug('Reschedule pattern analysis', {
        patientId: event.patientId,
        rescheduleCount,
        threshold: 3
      });

      // Restrict booking if >= 3 reschedules in 30 days
      if (rescheduleCount >= 3) {
        this.logger.warn('Restricting booking due to excessive reschedules', {
          patientId: event.patientId,
          rescheduleCount
        });

        // Add booking restriction (require deposit)
        await this.addBookingRestriction(
          event.patientId,
          'EXCESSIVE_RESCHEDULES',
          {
            rescheduleCount,
            period: '30_days',
            requireDeposit: true,
            depositAmount: 100000 // 100k VND
          },
          event.eventId
        );

        // Flag user account
        await this.flagUserAccount(
          event.patientId,
          'EXCESSIVE_RESCHEDULES',
          'MEDIUM',
          {
            rescheduleCount,
            period: '30_days'
          },
          event.eventId
        );
      }

      this.logger.info('Successfully processed appointment.rescheduled event', {
        eventId: event.eventId,
        patientId: event.patientId,
        actionTaken: rescheduleCount >= 3 ? 'RESTRICTED' : 'TRACKED'
      });

    } catch (error) {
      this.logger.error('Failed to process appointment.rescheduled event', {
        eventId: event.eventId,
        patientId: event.patientId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Handle appointment.late_arrival event (PHASE 3)
   * Flag if >= 3 late arrivals (>15 min) in 30 days
   */
  async handleAppointmentLateArrival(event: AppointmentLateArrivalEvent): Promise<void> {
    try {
      // Idempotency check
      const processed = await this.inboxService.checkProcessed(event.eventId);
      if (processed) {
        this.logger.debug('Event already processed', { eventId: event.eventId });
        return;
      }

      // Store event in inbox
      await this.inboxService.storeEvent({
        eventId: event.eventId,
        eventType: 'AppointmentLateArrivalEvent',
        aggregateId: event.appointmentId,
        aggregateType: 'AppointmentLateArrival',
        payloadJson: event,
        sourceService: 'appointments-service',
        routingKey: 'appointment.late_arrival',
        occurredAt: event.occurredAt
      });

      this.logger.info('Processing appointment.late_arrival event', {
        eventId: event.eventId,
        patientId: event.patientId,
        minutesLate: event.minutesLate
      });

      // Only track if late > 15 minutes
      if (event.minutesLate <= 15) {
        this.logger.debug('Late arrival within acceptable threshold', {
          patientId: event.patientId,
          minutesLate: event.minutesLate
        });

        // Event stored in inbox already, just return
        return;
      }

      // Get late arrival count in last 30 days (>15 min)
      const lateArrivalCount = await this.getLateArrivalCount(event.patientId, 30);

      this.logger.debug('Late arrival pattern analysis', {
        patientId: event.patientId,
        lateArrivalCount,
        threshold: 3
      });

      // Flag account if >= 3 late arrivals in 30 days
      if (lateArrivalCount >= 3) {
        this.logger.warn('Flagging account due to excessive late arrivals', {
          patientId: event.patientId,
          lateArrivalCount
        });

        await this.flagUserAccount(
          event.patientId,
          'EXCESSIVE_LATE_ARRIVALS',
          'LOW',
          {
            lateArrivalCount,
            period: '30_days',
            lastMinutesLate: event.minutesLate
          },
          event.eventId
        );
      }

      this.logger.info('Successfully processed appointment.late_arrival event', {
        eventId: event.eventId,
        patientId: event.patientId,
        actionTaken: lateArrivalCount >= 3 ? 'FLAGGED' : 'TRACKED'
      });

    } catch (error) {
      this.logger.error('Failed to process appointment.late_arrival event', {
        eventId: event.eventId,
        patientId: event.patientId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get reschedule count in last N days
   */
  private async getRescheduleCount(userId: string, days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { count, error } = await this.supabaseClient
      .schema('auth_schema')
      .from('event_inbox')
      .select('*', { count: 'exact', head: true })
      .eq('aggregate_type', 'AppointmentRescheduled')
      .eq('event_type', 'AppointmentRescheduledEvent')
      .contains('payload_json', { patientId: userId })
      .gte('occurred_at', cutoffDate.toISOString());

    if (error) {
      this.logger.error('Error getting reschedule count', { error: error.message });
      return 0;
    }

    return count || 0;
  }

  /**
   * Get late arrival count in last N days (>15 min)
   */
  private async getLateArrivalCount(userId: string, days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { count, error } = await this.supabaseClient
      .schema('auth_schema')
      .from('event_inbox')
      .select('*', { count: 'exact', head: true })
      .eq('aggregate_type', 'AppointmentLateArrival')
      .eq('event_type', 'AppointmentLateArrivalEvent')
      .contains('payload_json', { patientId: userId })
      .gte('occurred_at', cutoffDate.toISOString());

    if (error) {
      this.logger.error('Error getting late arrival count', { error: error.message });
      return 0;
    }

    return count || 0;
  }

  /**
   * Add booking restriction to user_restrictions table
   */
  private async addBookingRestriction(
    userId: string,
    restrictionType: string,
    metadata: any,
    sourceEventId: string
  ): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .schema('auth_schema')
        .from('user_restrictions')
        .insert({
          user_id: userId,
          restriction_type: restrictionType,
          metadata,
          source_event_id: sourceEventId,
          applied_at: new Date().toISOString(),
          applied_by: 'SYSTEM_AUTO',
          is_active: true
        });

      if (error) {
        this.logger.error('Failed to add booking restriction', {
          userId,
          restrictionType,
          error: error.message
        });
      }
    } catch (error) {
      this.logger.error('Error adding booking restriction', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Handle appointment.completed event (PHASE 4)
   * Reset booking restrictions if patient shows good behavior
   * Good behavior = completed appointment on time with no issues
   */
  async handleAppointmentCompleted(event: AppointmentCompletedEvent): Promise<void> {
    try {
      // Idempotency check
      const processed = await this.inboxService.checkProcessed(event.eventId);
      if (processed) {
        this.logger.debug('Event already processed', { eventId: event.eventId });
        return;
      }

      // Store event in inbox
      await this.inboxService.storeEvent({
        eventId: event.eventId,
        eventType: 'AppointmentCompletedEvent',
        aggregateId: event.appointmentId,
        aggregateType: 'AppointmentCompleted',
        payloadJson: event,
        sourceService: 'appointments-service',
        routingKey: 'appointment.completed',
        occurredAt: event.occurredAt
      });

      this.logger.info('Processing appointment.completed event', {
        eventId: event.eventId,
        patientId: event.patientId,
        wasOnTime: event.wasOnTime,
        hadNoIssues: event.hadNoIssues
      });

      // Only reset restrictions if patient showed good behavior
      if (event.wasOnTime && event.hadNoIssues) {
        // Check if patient has active restrictions
        const hasRestrictions = await this.hasActiveRestrictions(event.patientId);

        if (hasRestrictions) {
          // Get count of recent completed appointments with good behavior
          const goodBehaviorCount = await this.getGoodBehaviorCount(event.patientId, 30);

          // Reset restrictions if >= 3 consecutive good appointments
          if (goodBehaviorCount >= 3) {
            await this.resetBookingRestrictions(event.patientId, event.eventId);

            this.logger.info('Booking restrictions reset due to good behavior', {
              patientId: event.patientId,
              goodBehaviorCount,
              eventId: event.eventId
            });
          } else {
            this.logger.debug('Good behavior tracked, but not enough to reset restrictions', {
              patientId: event.patientId,
              goodBehaviorCount,
              requiredCount: 3
            });
          }
        }
      }

      this.logger.info('Successfully processed appointment.completed event', {
        eventId: event.eventId,
        patientId: event.patientId,
        wasOnTime: event.wasOnTime,
        hadNoIssues: event.hadNoIssues
      });

    } catch (error) {
      this.logger.error('Failed to process appointment.completed event', {
        eventId: event.eventId,
        patientId: event.patientId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Check if user has active booking restrictions
   */
  private async hasActiveRestrictions(userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseClient
        .schema('auth_schema')
        .from('user_restrictions')
        .select('restriction_id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1);

      if (error) {
        this.logger.error('Error checking active restrictions', {
          userId,
          error: error.message
        });
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      this.logger.error('Error checking active restrictions', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Get count of completed appointments with good behavior in last N days
   */
  private async getGoodBehaviorCount(userId: string, days: number): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await this.supabaseClient
        .schema('auth_schema')
        .from('event_inbox')
        .select('event_id')
        .eq('aggregate_type', 'AppointmentCompleted')
        .eq('event_type', 'AppointmentCompletedEvent')
        .gte('occurred_at', cutoffDate.toISOString())
        .contains('payload_json', { patientId: userId, wasOnTime: true, hadNoIssues: true });

      if (error) {
        this.logger.error('Error getting good behavior count', {
          userId,
          error: error.message
        });
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      this.logger.error('Error getting good behavior count', {
        error: error instanceof Error ? error.message : String(error)
      });
      return 0;
    }
  }

  /**
   * Reset all active booking restrictions for user
   */
  private async resetBookingRestrictions(
    userId: string,
    sourceEventId: string
  ): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .schema('auth_schema')
        .from('user_restrictions')
        .update({
          is_active: false,
          removed_at: new Date().toISOString(),
          removed_by: 'SYSTEM_AUTO',
          removal_reason: `Reset due to good behavior (3+ completed appointments on time)`,
          source_event_id: sourceEventId
        })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) {
        this.logger.error('Failed to reset booking restrictions', {
          userId,
          error: error.message
        });
      }
    } catch (error) {
      this.logger.error('Error resetting booking restrictions', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
