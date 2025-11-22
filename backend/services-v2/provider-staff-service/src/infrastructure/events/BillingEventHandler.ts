/**
 * BillingEventHandler - Handle Billing Service Events
 * Provider/Staff Service V2
 *
 * Handles billing-related events from Billing Service
 * Stub implementation for forward compatibility
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import {
  PaymentProcessedEvent,
  InvoiceGeneratedEvent,
  ConsultationFeeUpdatedEvent,
  PaymentRefundedEvent,
} from "@shared/domain/events/billing.events";
import { ILogger } from "../../application/interfaces/ILogger";
import { IAuditService } from "../../application/interfaces/IAuditService";

/**
 * Handler for Billing Service Events
 * Currently stub implementation - will be enhanced when Billing Service is deployed
 */
export class BillingEventHandler {
  // Idempotency tracking
  private processedEvents: Set<string> = new Set();
  private readonly maxProcessedEvents = 10000;

  constructor(
    private logger: ILogger,
    private auditService: IAuditService,
  ) {}

  /**
   * Handle PaymentProcessed event
   * TODO: Implement consultation statistics tracking when needed
   */
  async handlePaymentProcessed(event: PaymentProcessedEvent): Promise<void> {
    try {
      // Idempotency check
      if (this.isEventProcessed(event.eventId)) {
        this.logger.info("PaymentProcessed event already processed, skipping", {
          eventId: event.eventId,
          staffId: event.staffId,
        });
        return;
      }

      this.logger.info("Handling PaymentProcessed event from Billing Service", {
        paymentId: event.data.paymentId,
        invoiceId: event.data.invoiceId,
        staffId: event.staffId,
        amount: event.amount,
        consultationFee: event.consultationFee,
        eventId: event.eventId,
      });

      // TODO: Future implementation
      // - Track consultation revenue per staff
      // - Update staff performance metrics
      // - Calculate commission/bonuses

      // Mark as processed
      this.markEventProcessed(event.eventId);

      // Audit log
      await this.auditService.logDataModification({
        action: "PAYMENT_RECEIVED",
        resourceType: "STAFF_BILLING",
        resourceId: event.staffId,
        userId: event.data.patientId,
        timestamp: new Date(),
        details: {
          eventType: "PAYMENT_PROCESSED",
          paymentId: event.data.paymentId,
          invoiceId: event.data.invoiceId,
          amount: event.amount,
          consultationFee: event.consultationFee,
          paymentMethod: event.data.paymentMethod,
        },
      });

      this.logger.info("PaymentProcessed event logged successfully", {
        staffId: event.staffId,
        paymentId: event.data.paymentId,
        eventId: event.eventId,
      });
    } catch (error) {
      this.logger.error("Failed to handle PaymentProcessed event", {
        eventId: event.eventId,
        staffId: event.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Graceful degradation: log error but don't throw
      // Billing Service should continue working even if Provider Staff Service fails
    }
  }

  /**
   * Handle InvoiceGenerated event
   * TODO: Implement invoice tracking when needed
   */
  async handleInvoiceGenerated(event: InvoiceGeneratedEvent): Promise<void> {
    try {
      // Idempotency check
      if (this.isEventProcessed(event.eventId)) {
        this.logger.info("InvoiceGenerated event already processed, skipping", {
          eventId: event.eventId,
          staffId: event.staffId,
        });
        return;
      }

      this.logger.info("Handling InvoiceGenerated event from Billing Service", {
        invoiceId: event.invoiceId,
        staffId: event.staffId,
        totalAmount: event.totalAmount,
        consultationFee: event.consultationFee,
        eventId: event.eventId,
      });

      // TODO: Future implementation
      // - Track pending invoices per staff
      // - Monitor payment collection rates
      // - Generate staff revenue reports

      // Mark as processed
      this.markEventProcessed(event.eventId);

      // Audit log
      await this.auditService.logDataModification({
        action: "INVOICE_CREATED",
        resourceType: "STAFF_BILLING",
        resourceId: event.staffId,
        userId: event.data.patientId,
        timestamp: new Date(),
        details: {
          eventType: "INVOICE_GENERATED",
          invoiceId: event.invoiceId,
          appointmentId: event.data.appointmentId,
          totalAmount: event.totalAmount,
          consultationFee: event.consultationFee,
          additionalCharges: event.data.additionalCharges,
        },
      });

      this.logger.info("InvoiceGenerated event logged successfully", {
        staffId: event.staffId,
        invoiceId: event.invoiceId,
        eventId: event.eventId,
      });
    } catch (error) {
      this.logger.error("Failed to handle InvoiceGenerated event", {
        eventId: event.eventId,
        staffId: event.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Graceful degradation
    }
  }

  /**
   * Handle ConsultationFeeUpdated event
   * TODO: Consider if this should update ProviderStaff aggregate or stay in Billing Service
   */
  async handleConsultationFeeUpdated(
    event: ConsultationFeeUpdatedEvent,
  ): Promise<void> {
    try {
      // Idempotency check
      if (this.isEventProcessed(event.eventId)) {
        this.logger.info(
          "ConsultationFeeUpdated event already processed, skipping",
          {
            eventId: event.eventId,
            staffId: event.staffId,
          },
        );
        return;
      }

      this.logger.info(
        "Handling ConsultationFeeUpdated event from Billing Service",
        {
          staffId: event.staffId,
          oldFee: event.oldFee,
          newFee: event.newFee,
          effectiveDate: event.effectiveDate,
          eventId: event.eventId,
        },
      );

      // TODO: Decision needed
      // Option 1: Update ProviderStaff.consultationFee (if fee is staff attribute)
      // Option 2: Keep in Billing Service only (if fee is pricing concern)
      // Current: Just log the event

      // Mark as processed
      this.markEventProcessed(event.eventId);

      // Audit log
      await this.auditService.logDataModification({
        action: "FEE_CHANGED",
        resourceType: "STAFF_BILLING",
        resourceId: event.staffId,
        userId: event.data.updatedBy,
        timestamp: new Date(),
        details: {
          eventType: "CONSULTATION_FEE_UPDATED",
          oldFee: event.oldFee,
          newFee: event.newFee,
          effectiveDate: event.effectiveDate.toISOString(),
          reason: event.data.reason,
        },
      });

      this.logger.info("ConsultationFeeUpdated event logged successfully", {
        staffId: event.staffId,
        oldFee: event.oldFee,
        newFee: event.newFee,
        eventId: event.eventId,
      });
    } catch (error) {
      this.logger.error("Failed to handle ConsultationFeeUpdated event", {
        eventId: event.eventId,
        staffId: event.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Graceful degradation
    }
  }

  /**
   * Handle PaymentRefunded event
   * TODO: Implement refund tracking when needed
   */
  async handlePaymentRefunded(event: PaymentRefundedEvent): Promise<void> {
    try {
      // Idempotency check
      if (this.isEventProcessed(event.eventId)) {
        this.logger.info("PaymentRefunded event already processed, skipping", {
          eventId: event.eventId,
          staffId: event.staffId,
        });
        return;
      }

      this.logger.info("Handling PaymentRefunded event from Billing Service", {
        refundId: event.refundId,
        originalPaymentId: event.data.originalPaymentId,
        staffId: event.staffId,
        refundAmount: event.refundAmount,
        reason: event.data.reason,
        eventId: event.eventId,
        gatewayRefundId: event.data.gatewayRefundId,
      });

      // TODO: Future implementation
      // - Track refund rates per staff
      // - Adjust revenue metrics
      // - Monitor quality issues (high refund rate = quality problem)

      // Mark as processed
      this.markEventProcessed(event.eventId);

      // Audit log
      await this.auditService.logDataModification({
        action: "REFUND_PROCESSED",
        resourceType: "STAFF_BILLING",
        resourceId: event.staffId,
        userId: event.data.refundedBy,
        timestamp: new Date(),
        details: {
          eventType: "PAYMENT_REFUNDED",
          refundId: event.refundId,
          originalPaymentId: event.data.originalPaymentId,
          invoiceId: event.data.invoiceId,
          refundAmount: event.refundAmount,
          reason: event.data.reason,
          gatewayRefundId: event.data.gatewayRefundId,
        },
      });

      this.logger.info("PaymentRefunded event logged successfully", {
        staffId: event.staffId,
        refundId: event.refundId,
        originalPaymentId: event.data.originalPaymentId,
        eventId: event.eventId,
      });
    } catch (error) {
      this.logger.error("Failed to handle PaymentRefunded event", {
        eventId: event.eventId,
        staffId: event.staffId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      // Graceful degradation
    }
  }

  /**
   * Idempotency: Check if event already processed
   */
  private isEventProcessed(eventId: string): boolean {
    return this.processedEvents.has(eventId);
  }

  /**
   * Idempotency: Mark event as processed
   */
  private markEventProcessed(eventId: string): void {
    this.processedEvents.add(eventId);

    // Prevent memory leak
    if (this.processedEvents.size > this.maxProcessedEvents) {
      const iterator = this.processedEvents.values();
      const firstValue = iterator.next().value;
      if (firstValue) {
        this.processedEvents.delete(firstValue);
      }
    }
  }

  /**
   * Get handler name for logging
   */
  getHandlerName(): string {
    return "BillingEventHandler";
  }
}
