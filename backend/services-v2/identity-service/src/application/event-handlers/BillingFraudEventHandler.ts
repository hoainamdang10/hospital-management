/**
 * BillingFraudEventHandler - Handle events from Billing Service
 * 
 * Handles:
 * - payment.failed → Flag fraud risk if >= 3 failures in 30 days
 * - invoice.overdue → Suspend account if > 90 days overdue
 * - payment.processed → Remove restrictions if payment successful
 * - billing.dispute_filed → Flag account if >= 3 disputes in 30 days (PHASE 2)
 * - payment.refunded → Track refund patterns, flag if >= 5 refunds in 90 days (PHASE 3)
 * - insurance.claim_rejected → Flag if >= 3 rejections in 60 days (PHASE 3)
 * 
 * @author Hospital Management Team
 * @version 2.0.0 (PHASE 3)
 * @compliance Event-Driven Architecture, HIPAA, Fraud Detection
 */

import { ILogger } from '../services/ILogger';
import { LockAccountUseCase } from '../use-cases/LockAccountUseCase';
import { InboxService } from '../../infrastructure/inbox/InboxService';
import { SupabaseClient } from '@supabase/supabase-js';

export interface PaymentFailedEvent {
  eventId: string;
  invoiceId: string;
  patientId: string;
  amount: number;
  failureReason: string;
  attemptCount: number;
  occurredAt: Date;
}

export interface InvoiceOverdueEvent {
  eventId: string;
  invoiceId: string;
  patientId: string;
  totalAmount: number;
  dueDate: Date;
  daysOverdue: number;
  occurredAt: Date;
}

export interface PaymentProcessedEvent {
  eventId: string;
  invoiceId: string;
  patientId: string;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  occurredAt: Date;
}

export interface BillingDisputeFiledEvent {
  eventId: string;
  disputeId: string;
  invoiceId: string;
  patientId: string;
  disputeReason: string;
  disputeAmount: number;
  filedAt: Date;
  occurredAt: Date;
}

export interface PaymentRefundedEvent {
  eventId: string;
  refundId: string;
  invoiceId: string;
  patientId: string;
  refundAmount: number;
  refundReason: string;
  originalPaymentId: string;
  occurredAt: Date;
}

export interface InsuranceClaimRejectedEvent {
  eventId: string;
  claimId: string;
  patientId: string;
  insuranceProvider: string;
  rejectionReason: string;
  claimAmount: number;
  occurredAt: Date;
}

export class BillingFraudEventHandler {
  constructor(
    private lockAccountUseCase: LockAccountUseCase,
    private inboxService: InboxService,
    private supabaseClient: SupabaseClient,
    private logger: ILogger
  ) {}

  /**
   * Handle payment.failed event
   */
  async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
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
        eventType: 'PaymentFailedEvent',
        aggregateId: event.invoiceId,
        aggregateType: 'Invoice',
        payloadJson: event,
        sourceService: 'billing-service',
        routingKey: 'payment.failed',
        occurredAt: event.occurredAt
      });

      this.logger.info('Processing payment failed event', {
        eventId: event.eventId,
        patientId: event.patientId,
        invoiceId: event.invoiceId,
        attemptCount: event.attemptCount
      });

      // Get payment failure history (last 30 days)
      const failureCount = await this.getPaymentFailureCount(event.patientId, 30);

      this.logger.debug('Payment failure count', {
        patientId: event.patientId,
        failureCount,
        currentAttempt: event.attemptCount
      });

      // Flag account if >= 3 failures in 30 days
      if (failureCount >= 3) {
        await this.flagUserAccount(
          event.patientId,
          'PAYMENT_FRAUD_RISK',
          'HIGH',
          {
            invoiceId: event.invoiceId,
            failureCount,
            lastFailureReason: event.failureReason,
            attemptCount: event.attemptCount
          },
          event.eventId
        );

        // Apply restrictions
        await this.applyUserRestriction(
          event.patientId,
          'REQUIRE_DEPOSIT_FOR_BOOKING',
          { requireDeposit: true, depositAmount: 500000 }, // 500k VND
          event.eventId
        );

        await this.applyUserRestriction(
          event.patientId,
          'MAX_ADVANCE_BOOKING_DAYS',
          { maxDays: 7 },
          event.eventId
        );

        // Audit log
        await this.auditLog({
          action: 'USER_ACCOUNT_FLAGGED',
          userId: event.patientId,
          severity: 'HIGH',
          details: {
            flagType: 'PAYMENT_FRAUD_RISK',
            failureCount,
            eventId: event.eventId,
            sourceService: 'billing-service'
          }
        });

        this.logger.warn('User account flagged for payment fraud risk', {
          patientId: event.patientId,
          failureCount,
          restrictionsApplied: ['REQUIRE_DEPOSIT_FOR_BOOKING', 'MAX_ADVANCE_BOOKING_DAYS']
        });
      }

      // Mark as processed
      await this.inboxService.markProcessed(event.eventId);

    } catch (error) {
      this.logger.error('Error handling payment failed event', {
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
   * Handle invoice.overdue event
   */
  async handleInvoiceOverdue(event: InvoiceOverdueEvent): Promise<void> {
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
        eventType: 'InvoiceOverdueEvent',
        aggregateId: event.invoiceId,
        aggregateType: 'Invoice',
        payloadJson: event,
        sourceService: 'billing-service',
        routingKey: 'invoice.overdue',
        occurredAt: event.occurredAt
      });

      this.logger.info('Processing invoice overdue event', {
        eventId: event.eventId,
        patientId: event.patientId,
        invoiceId: event.invoiceId,
        daysOverdue: event.daysOverdue
      });

      // Suspend account if > 90 days overdue
      if (event.daysOverdue > 90) {
        await this.lockAccountUseCase.execute({
          userId: event.patientId,
          lockedBy: 'SYSTEM_AUTO',
          reason: `Invoice overdue ${event.daysOverdue} days (Invoice: ${event.invoiceId})`,
          terminateSessions: false // Don't terminate sessions for payment issues
        });

        // Flag account
        await this.flagUserAccount(
          event.patientId,
          'PAYMENT_OVERDUE',
          'CRITICAL',
          {
            invoiceId: event.invoiceId,
            daysOverdue: event.daysOverdue,
            totalAmount: event.totalAmount,
            dueDate: event.dueDate.toISOString()
          },
          event.eventId
        );

        // Audit log
        await this.auditLog({
          action: 'USER_ACCOUNT_SUSPENDED',
          userId: event.patientId,
          severity: 'CRITICAL',
          details: {
            reason: 'PAYMENT_OVERDUE_90_DAYS',
            invoiceId: event.invoiceId,
            daysOverdue: event.daysOverdue,
            amount: event.totalAmount,
            eventId: event.eventId
          }
        });

        this.logger.warn('User account suspended due to overdue payment', {
          patientId: event.patientId,
          daysOverdue: event.daysOverdue,
          invoiceId: event.invoiceId
        });
      }

      // Mark as processed
      await this.inboxService.markProcessed(event.eventId);

    } catch (error) {
      this.logger.error('Error handling invoice overdue event', {
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
   * Handle payment.processed event (remove restrictions)
   */
  async handlePaymentProcessed(event: PaymentProcessedEvent): Promise<void> {
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
        eventType: 'PaymentProcessedEvent',
        aggregateId: event.invoiceId,
        aggregateType: 'Invoice',
        payloadJson: event,
        sourceService: 'billing-service',
        routingKey: 'payment.processed',
        occurredAt: event.occurredAt
      });

      this.logger.info('Processing payment processed event', {
        eventId: event.eventId,
        patientId: event.patientId,
        invoiceId: event.invoiceId
      });

      // Remove payment-related restrictions
      await this.removeUserRestrictions(event.patientId, [
        'REQUIRE_DEPOSIT_FOR_BOOKING',
        'PAYMENT_REQUIRED'
      ]);

      // Resolve payment-related flags
      await this.resolveUserFlags(event.patientId, [
        'PAYMENT_FRAUD_RISK',
        'PAYMENT_OVERDUE'
      ]);

      this.logger.info('Payment restrictions removed', {
        patientId: event.patientId,
        invoiceId: event.invoiceId
      });

      // Mark as processed
      await this.inboxService.markProcessed(event.eventId);

    } catch (error) {
      this.logger.error('Error handling payment processed event', {
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
   * Get payment failure count in last N days
   */
  private async getPaymentFailureCount(userId: string, days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { count, error } = await this.supabaseClient
      .schema('auth_schema')
      .from('event_inbox')
      .select('*', { count: 'exact', head: true })
      .eq('aggregate_type', 'Invoice')
      .eq('event_type', 'PaymentFailedEvent')
      .contains('payload_json', { patientId: userId })
      .gte('occurred_at', cutoffDate.toISOString());

    if (error) {
      this.logger.error('Error getting payment failure count', { error: error.message });
      return 0;
    }

    return count || 0;
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
        source_service: 'billing-service'
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
        source_service: 'billing-service'
      });

    if (error) {
      throw new Error(`Failed to apply user restriction: ${error.message}`);
    }
  }

  /**
   * Remove user restrictions
   */
  private async removeUserRestrictions(userId: string, restrictionTypes: string[]): Promise<void> {
    const { error } = await this.supabaseClient
      .schema('auth_schema')
      .from('user_restrictions')
      .update({
        is_active: false,
        removed_at: new Date().toISOString(),
        removed_by: 'SYSTEM_AUTO',
        removal_reason: 'Payment processed successfully'
      })
      .eq('user_id', userId)
      .in('restriction_type', restrictionTypes)
      .eq('is_active', true);

    if (error) {
      this.logger.error('Error removing user restrictions', { error: error.message });
    }
  }

  /**
   * Resolve user flags
   */
  private async resolveUserFlags(userId: string, flagTypes: string[]): Promise<void> {
    const { error } = await this.supabaseClient
      .schema('auth_schema')
      .from('user_flags')
      .update({
        is_active: false,
        resolved_at: new Date().toISOString(),
        resolved_by: 'SYSTEM_AUTO',
        resolution_notes: 'Payment processed successfully'
      })
      .eq('user_id', userId)
      .in('flag_type', flagTypes)
      .eq('is_active', true);

    if (error) {
      this.logger.error('Error resolving user flags', { error: error.message });
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
   * Handle billing.dispute_filed event (PHASE 2)
   * Flag account if >= 3 disputes in 30 days
   */
  async handleBillingDisputeFiled(event: BillingDisputeFiledEvent): Promise<void> {
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
        eventType: 'BillingDisputeFiledEvent',
        aggregateId: event.disputeId,
        aggregateType: 'BillingDispute',
        payloadJson: event,
        sourceService: 'billing-service',
        routingKey: 'billing.dispute_filed',
        occurredAt: event.occurredAt
      });

      this.logger.info('Processing billing dispute filed event', {
        eventId: event.eventId,
        disputeId: event.disputeId,
        patientId: event.patientId,
        disputeAmount: event.disputeAmount
      });

      // Get dispute count in last 30 days
      const disputeCount = await this.getDisputeCount(event.patientId, 30);

      this.logger.debug('Billing dispute count', {
        patientId: event.patientId,
        disputeCount
      });

      // Flag account if >= 3 disputes in 30 days
      if (disputeCount >= 3) {
        await this.flagUserAccount(
          event.patientId,
          'BILLING_DISPUTE',
          'HIGH',
          {
            disputeId: event.disputeId,
            disputeCount,
            lastDisputeReason: event.disputeReason,
            totalDisputeAmount: event.disputeAmount
          },
          event.eventId
        );

        // Audit log
        await this.auditLog({
          action: 'USER_ACCOUNT_FLAGGED',
          userId: event.patientId,
          severity: 'HIGH',
          details: {
            flagType: 'BILLING_DISPUTE',
            disputeCount,
            disputeId: event.disputeId,
            disputeReason: event.disputeReason,
            eventId: event.eventId,
            sourceService: 'billing-service'
          }
        });

        this.logger.warn('User account flagged for excessive billing disputes', {
          patientId: event.patientId,
          disputeCount,
          disputeId: event.disputeId
        });
      }

      // Mark as processed
      await this.inboxService.markProcessed(event.eventId);

    } catch (error) {
      this.logger.error('Error handling billing dispute filed event', {
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
   * Get dispute count in last N days
   */
  private async getDisputeCount(userId: string, days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { count, error } = await this.supabaseClient
      .schema('auth_schema')
      .from('event_inbox')
      .select('*', { count: 'exact', head: true })
      .eq('aggregate_type', 'BillingDispute')
      .eq('event_type', 'BillingDisputeFiledEvent')
      .contains('payload_json', { patientId: userId })
      .gte('occurred_at', cutoffDate.toISOString());

    if (error) {
      this.logger.error('Error getting dispute count', { error: error.message });
      return 0;
    }

    return count || 0;
  }

  /**
   * Handle payment.refunded event (PHASE 3)
   * Track refund patterns, flag if >= 5 refunds in 90 days
   */
  async handlePaymentRefunded(event: PaymentRefundedEvent): Promise<void> {
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
        eventType: 'PaymentRefundedEvent',
        aggregateId: event.refundId,
        aggregateType: 'PaymentRefunded',
        payloadJson: event,
        sourceService: 'billing-service',
        routingKey: 'payment.refunded',
        occurredAt: event.occurredAt
      });

      this.logger.info('Processing payment.refunded event', {
        eventId: event.eventId,
        patientId: event.patientId,
        refundAmount: event.refundAmount
      });

      // Get refund count in last 90 days
      const refundCount = await this.getRefundCount(event.patientId, 90);

      this.logger.debug('Refund pattern analysis', {
        patientId: event.patientId,
        refundCount,
        threshold: 5
      });

      // Flag account if >= 5 refunds in 90 days
      if (refundCount >= 5) {
        this.logger.warn('Flagging account due to excessive refunds', {
          patientId: event.patientId,
          refundCount
        });

      await this.flagUserAccount(
        event.patientId,
        'EXCESSIVE_REFUNDS',
        'MEDIUM',
        {
          refundCount,
          period: '90_days',
          lastRefundAmount: event.refundAmount,
          lastRefundReason: event.refundReason
        },
        event.eventId
      );
    }

    await this.inboxService.markProcessed(event.eventId);

    this.logger.info('Successfully processed payment.refunded event', {
      eventId: event.eventId,
      patientId: event.patientId,
      actionTaken: refundCount >= 5 ? 'FLAGGED' : 'TRACKED'
    });

  } catch (error) {
    this.logger.error('Failed to process payment.refunded event', {
      eventId: event.eventId,
      patientId: event.patientId,
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
   * Handle insurance.claim_rejected event (PHASE 3)
   * Flag if >= 3 rejections in 60 days
   */
  async handleInsuranceClaimRejected(event: InsuranceClaimRejectedEvent): Promise<void> {
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
        eventType: 'InsuranceClaimRejectedEvent',
        aggregateId: event.claimId,
        aggregateType: 'InsuranceClaimRejected',
        payloadJson: event,
        sourceService: 'billing-service',
        routingKey: 'insurance.claim_rejected',
        occurredAt: event.occurredAt
      });

      this.logger.info('Processing insurance.claim_rejected event', {
        eventId: event.eventId,
        patientId: event.patientId,
        claimAmount: event.claimAmount
      });

      // Get rejection count in last 60 days
      const rejectionCount = await this.getClaimRejectionCount(event.patientId, 60);

      this.logger.debug('Insurance claim rejection analysis', {
        patientId: event.patientId,
        rejectionCount,
        threshold: 3
      });

      // Flag account if >= 3 rejections in 60 days
      if (rejectionCount >= 3) {
        this.logger.warn('Flagging account due to excessive claim rejections', {
          patientId: event.patientId,
          rejectionCount
        });

      await this.flagUserAccount(
        event.patientId,
        'INSURANCE_CLAIM_REJECTIONS',
        'MEDIUM',
        {
          rejectionCount,
          period: '60_days',
          lastRejectionReason: event.rejectionReason,
          insuranceProvider: event.insuranceProvider
        },
        event.eventId
      );
    }

    await this.inboxService.markProcessed(event.eventId);

    this.logger.info('Successfully processed insurance.claim_rejected event', {
      eventId: event.eventId,
      patientId: event.patientId,
      actionTaken: rejectionCount >= 3 ? 'FLAGGED' : 'TRACKED'
    });

  } catch (error) {
    this.logger.error('Failed to process insurance.claim_rejected event', {
      eventId: event.eventId,
      patientId: event.patientId,
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
   * Get refund count in last N days
   */
  private async getRefundCount(userId: string, days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { count, error } = await this.supabaseClient
      .schema('auth_schema')
      .from('event_inbox')
      .select('*', { count: 'exact', head: true })
      .eq('aggregate_type', 'PaymentRefunded')
      .eq('event_type', 'PaymentRefundedEvent')
      .contains('payload_json', { patientId: userId })
      .gte('occurred_at', cutoffDate.toISOString());

    if (error) {
      this.logger.error('Error getting refund count', { error: error.message });
      return 0;
    }

    return count || 0;
  }

  /**
   * Get insurance claim rejection count in last N days
   */
  private async getClaimRejectionCount(userId: string, days: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { count, error } = await this.supabaseClient
      .schema('auth_schema')
      .from('event_inbox')
      .select('*', { count: 'exact', head: true })
      .eq('aggregate_type', 'InsuranceClaimRejected')
      .eq('event_type', 'InsuranceClaimRejectedEvent')
      .contains('payload_json', { patientId: userId })
      .gte('occurred_at', cutoffDate.toISOString());

    if (error) {
      this.logger.error('Error getting claim rejection count', { error: error.message });
      return 0;
    }

    return count || 0;
  }
}
