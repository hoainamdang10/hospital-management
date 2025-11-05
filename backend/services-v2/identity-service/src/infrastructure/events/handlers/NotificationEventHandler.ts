/**
 * NotificationEventHandler - Handle events from Notifications Service
 *
 * Handles:
 * - notification.delivery_failed → Lock account if >= 5 consecutive failures (PHASE 3)
 *
 * @author Hospital Management Team
 * @version 2.0.0 (PHASE 3)
 * @compliance Event-Driven Architecture, HIPAA
 */

import { ILogger } from "../../../application/services/ILogger";
import { LockAccountUseCase } from "../../../application/use-cases/LockAccountUseCase";
import { InboxService } from "../../inbox/InboxService";
import { SupabaseClient } from "@supabase/supabase-js";

export interface NotificationDeliveryFailedEvent {
  eventId: string;
  notificationId: string;
  userId: string;
  channel: string; // 'email' | 'sms' | 'push'
  failureReason: string;
  attemptCount: number;
  occurredAt: Date;
}

export class NotificationEventHandler {
  constructor(
    private lockAccountUseCase: LockAccountUseCase,
    private inboxService: InboxService,
    private supabaseClient: SupabaseClient,
    private logger: ILogger,
  ) {}

  /**
   * Handle notification.delivery_failed event
   * Lock account if >= 5 consecutive failures
   */
  async handleNotificationDeliveryFailed(
    event: NotificationDeliveryFailedEvent,
  ): Promise<void> {
    try {
      // Idempotency check
      const processed = await this.inboxService.checkProcessed(event.eventId);
      if (processed) {
        this.logger.debug("Event already processed", {
          eventId: event.eventId,
        });
        return;
      }

      // Store event in inbox
      await this.inboxService.storeEvent({
        eventId: event.eventId,
        eventType: "NotificationDeliveryFailedEvent",
        aggregateId: event.notificationId,
        aggregateType: "NotificationDeliveryFailed",
        payloadJson: event,
        sourceService: "notifications-service",
        routingKey: "notification.delivery_failed",
        occurredAt: event.occurredAt,
      });

      this.logger.info("Processing notification.delivery_failed event", {
        eventId: event.eventId,
        userId: event.userId,
        channel: event.channel,
        attemptCount: event.attemptCount,
      });

      // Get consecutive failure count
      const consecutiveFailures = await this.getConsecutiveFailureCount(
        event.userId,
      );

      this.logger.debug("Consecutive notification failures", {
        userId: event.userId,
        consecutiveFailures,
        threshold: 5,
      });

      // Lock account if >= 5 consecutive failures
      if (consecutiveFailures >= 5) {
        this.logger.warn(
          "Locking account due to consecutive notification failures",
          {
            userId: event.userId,
            consecutiveFailures,
          },
        );

        await this.lockAccountUseCase.execute({
          userId: event.userId,
          lockedBy: "SYSTEM_AUTO",
          reason: `Account locked due to ${consecutiveFailures} consecutive notification delivery failures`,
        });

        // Flag user account
        await this.flagUserAccount(
          event.userId,
          "NOTIFICATION_DELIVERY_FAILED",
          "HIGH",
          {
            consecutiveFailures,
            lastFailureChannel: event.channel,
            lastFailureReason: event.failureReason,
          },
          event.eventId,
        );

        // Audit log (HIGH severity)
        await this.auditLog({
          action: "ACCOUNT_LOCKED_NOTIFICATION_FAILURES",
          userId: event.userId,
          severity: "HIGH",
          details: {
            consecutiveFailures,
            channel: event.channel,
            failureReason: event.failureReason,
            eventId: event.eventId,
          },
        });
      }

      await this.inboxService.markProcessed(event.eventId);

      this.logger.info(
        "Successfully processed notification.delivery_failed event",
        {
          eventId: event.eventId,
          userId: event.userId,
          actionTaken: consecutiveFailures >= 5 ? "ACCOUNT_LOCKED" : "TRACKED",
        },
      );
    } catch (error) {
      this.logger.error(
        "Failed to process notification.delivery_failed event",
        {
          eventId: event.eventId,
          userId: event.userId,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      await this.inboxService.markFailed(
        event.eventId,
        error instanceof Error ? error.message : "Unknown error",
      );
      throw error;
    }
  }

  /**
   * Get consecutive notification failure count
   */
  private async getConsecutiveFailureCount(userId: string): Promise<number> {
    try {
      // Query event_inbox for consecutive notification failures
      const { data, error } = await this.supabaseClient
        .schema("auth_schema")
        .from("event_inbox")
        .select("*")
        .eq("aggregate_type", "NotificationDeliveryFailed")
        .eq("event_type", "NotificationDeliveryFailedEvent")
        .contains("payload_json", { userId })
        .order("occurred_at", { ascending: false })
        .limit(10); // Check last 10 events

      if (error) {
        this.logger.error("Failed to query consecutive failures", {
          error: error.message,
        });
        return 0;
      }

      if (!data || data.length === 0) {
        return 1; // Current event is the first failure
      }

      // Count consecutive failures (stop at first success or different event)
      let consecutiveCount = 1; // Current event
      for (const event of data) {
        // If we find a success event, stop counting
        if (event.event_type !== "NotificationDeliveryFailedEvent") {
          break;
        }
        consecutiveCount++;
      }

      return consecutiveCount;
    } catch (error) {
      this.logger.error("Error getting consecutive failure count", {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Flag user account in user_flags table
   */
  private async flagUserAccount(
    userId: string,
    flagType: string,
    severity: string,
    metadata: any,
    sourceEventId: string,
  ): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .schema("auth_schema")
        .from("user_flags")
        .insert({
          user_id: userId,
          flag_type: flagType,
          severity,
          metadata,
          source_event_id: sourceEventId,
          flagged_at: new Date().toISOString(),
          flagged_by: "SYSTEM_AUTO",
        });

      if (error) {
        this.logger.error("Failed to flag user account", {
          userId,
          flagType,
          error: error.message,
        });
      }
    } catch (error) {
      this.logger.error("Error flagging user account", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Audit log for HIPAA compliance
   */
  private async auditLog(log: {
    action: string;
    userId: string;
    severity: string;
    details: any;
  }): Promise<void> {
    try {
      const { error } = await this.supabaseClient
        .schema("auth_schema")
        .from("audit_logs")
        .insert({
          action: log.action,
          user_id: log.userId,
          severity: log.severity,
          details: log.details,
          created_at: new Date().toISOString(),
          created_by: "SYSTEM_AUTO",
        });

      if (error) {
        this.logger.error("Failed to create audit log", {
          action: log.action,
          error: error.message,
        });
      }
    } catch (error) {
      this.logger.error("Error creating audit log", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
