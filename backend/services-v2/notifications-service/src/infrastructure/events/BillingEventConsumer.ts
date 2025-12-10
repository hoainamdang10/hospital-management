/**
 * Billing Event Consumer - Infrastructure Layer
 * Consumes billing events from Billing Service
 * Handles billing notifications, payment reminders, insurance updates, and financial alerts
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { ConsumeMessage } from "amqplib";
import { IInboxRepository } from "../../domain/repositories/IInboxRepository";
import {
  SendNotificationCommand,
  SendNotificationUseCase,
} from "../../application/use-cases/SendNotificationUseCase";
import { GetNotificationPreferencesUseCase } from "../../application/use-cases/GetNotificationPreferencesUseCase";
import { normalizePriority } from "../../domain/services/priority-normalizer";

export interface BillingEventConsumerConfig {
  rabbitmqUrl: string;
  queueName: string;
  exchangeName: string;
  routingKeys: string[];
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export interface InsuranceCoverageVerifiedEventData {
  patientId: string;
  patientName: string;
  insuranceProvider: string;
  insuranceNumber: string;
  coverageType: string;
  coverageStatus: "verified" | "partial" | "rejected" | "pending";
  coverageAmount: number;
  deductible: number;
  coPayment: number;
  verifiedAt: Date;
  verifiedBy: string;
  validUntil: Date;
  notes?: string;
}

export interface PreAuthorizationRequestedEventData {
  preAuthId: string;
  patientId: string;
  patientName: string;
  physicianId: string;
  physicianName: string;
  procedureType: string;
  estimatedCost: number;
  urgencyLevel: "routine" | "urgent" | "emergency";
  requestedAt: Date;
  requestedBy: string;
  insuranceProvider: string;
  expectedResponseDate: Date;
}

export interface PreAuthorizationApprovedEventData {
  preAuthId: string;
  patientId: string;
  patientName: string;
  physicianId: string;
  physicianName: string;
  procedureType: string;
  approvedAmount: number;
  approvedAt: Date;
  approvedBy: string;
  validUntil: Date;
  conditions?: string[];
  notes?: string;
}

export interface PreAuthorizationDeniedEventData {
  preAuthId: string;
  patientId: string;
  patientName: string;
  physicianId: string;
  physicianName: string;
  procedureType: string;
  deniedAt: Date;
  deniedBy: string;
  denialReason: string;
  appealDeadline?: Date;
  alternativeOptions?: string[];
}

export interface RateUpdatedEventData {
  rateId: string;
  serviceType: string;
  procedureCode: string;
  oldRate: number;
  newRate: number;
  effectiveDate: Date;
  updatedBy: string;
  updatedAt: Date;
  affectedAppointments?: string[];
  patientNotifications?: {
    patientId: string;
    patientName: string;
    appointmentId: string;
    oldCost: number;
    newCost: number;
  }[];
}

export interface PaymentProcessedEventData {
  paymentId: string;
  patientId: string;
  invoiceId: string;
  patientName?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  method?: string;
  paymentStatus?:
    | "completed"
    | "failed"
    | "refunded"
    | "partial_refund"
    | string;
  status?: "completed" | "failed" | "refunded" | "partial_refund" | string;
  processedAt?: Date | string;
  processedBy?: string;
  appointmentId?: string; //  ADDED - link to appointment
  transactionId?: string; //  ADDED - payment gateway transaction ID
  dueAmount?: number;
  refundAmount?: number;
}

export interface InvoiceGeneratedEventData {
  invoiceId: string;
  patientId: string;
  patientName?: string;
  totalAmount?: number;
  dueDate?: Date | string;
  generatedAt?: Date | string;
  generatedBy?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  insuranceCoverage?: number;
  patientResponsibility?: number;
}

export interface PaymentReminderScheduledEventData {
  reminderId: string;
  patientId: string;
  patientName: string;
  invoiceId: string;
  amount: number;
  dueDate: Date;
  reminderType: "first_notice" | "second_notice" | "final_notice" | "overdue";
  scheduledFor: Date;
  message: string;
}

export interface PaymentReminderDueEventData {
  invoiceId: string;
  patientId: string;
  patientName: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: string;
  reminderType: "before-due" | "on-due" | "after-due";
  daysBeforeDue: number;
  scheduledBy: string;
}

export interface RefundProcessedEventData {
  refundId: string;
  patientId: string;
  patientName: string;
  originalPaymentId: string;
  refundAmount: number;
  refundReason: string;
  processedAt: Date;
  processedBy: string;
  refundMethod: string;
  processingTime?: number; // in days
}

/**
 * BillingEventConsumer - Handles billing events for notifications
 */
export class BillingEventConsumer {
  private connection?: any;
  private channel?: any;
  private isConnected = false;
  private reconnecting = false;

  constructor(
    private config: BillingEventConsumerConfig,
    private sendNotificationUseCase: SendNotificationUseCase,
    private getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase,
    private inboxRepo: IInboxRepository,
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    const maxAttempts = Math.max(1, this.config.retryAttempts || 3);
    const retryDelay = this.config.retryDelayMs || 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log("Connecting to RabbitMQ for Billing events", {
          queueName: this.config.queueName,
          attempt,
          maxAttempts,
        });

        const amqp = require("amqplib");
        this.connection = await amqp.connect(this.config.rabbitmqUrl);
        this.channel = await this.connection.createChannel();

        if (!this.channel) {
          throw new Error("Failed to create RabbitMQ channel");
        }

        this.setupConnectionListeners();

        // Assert exchange
        await this.channel.assertExchange(this.config.exchangeName, "topic", {
          durable: true,
        });

        // Assert queue
        await this.channel.assertQueue(this.config.queueName, {
          durable: true,
        });

        // Bind queue to routing keys
        for (const routingKey of this.config.routingKeys) {
          await this.channel.bindQueue(
            this.config.queueName,
            this.config.exchangeName,
            routingKey,
          );
          console.log("Queue bound to routing key", {
            queueName: this.config.queueName,
            routingKey,
          });
        }

        this.channel.prefetch(this.config.prefetchCount || 10);

        // Start consuming
        await this.channel.consume(
          this.config.queueName,
          this.handleMessage.bind(this),
          { noAck: false },
        );

        this.isConnected = true;
        console.log("Billing event consumer connected successfully");
        return;
      } catch (error) {
        console.error("Failed to connect to RabbitMQ", {
          attempt,
          maxAttempts,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        await this.closeConnectionSilently();

        if (attempt === maxAttempts) {
          throw error;
        }

        const delay = retryDelay * attempt;
        console.log(
          `Retrying billing consumer connection in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  private setupConnectionListeners(): void {
    if (!this.connection) {
      return;
    }

    this.connection.on("error", (error: Error) => {
      console.error("RabbitMQ connection error", {
        error: error.message,
      });
      this.isConnected = false;
    });

    this.connection.on("close", () => {
      console.warn("RabbitMQ connection closed");
      this.isConnected = false;
      this.triggerReconnect();
    });
  }

  private triggerReconnect(): void {
    if (this.reconnecting) {
      return;
    }

    this.reconnecting = true;
    const delay = this.config.retryDelayMs || 1000;

    setTimeout(() => {
      this.connect()
        .catch((error) => {
          console.error("Billing event consumer reconnect failed", error);
        })
        .finally(() => {
          this.reconnecting = false;
        });
    }, delay);
  }

  private async closeConnectionSilently(): Promise<void> {
    try {
      await this.disconnect();
    } catch {
      // Ignore cleanup failures during retries
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(msg: ConsumeMessage | null): Promise<void> {
    if (!msg || !this.channel) {
      return;
    }

    try {
      const content = msg.content.toString();
      const event = JSON.parse(content);
      const routingKey = msg.fields.routingKey;
      const payload = event.payload ?? event.data ?? event.eventData ?? event;

      // Idempotency check
      const eventId = event.eventId || event.id || event.metadata?.eventId;
      if (!eventId) {
        console.error(
          "[BillingEventConsumer] Missing eventId, cannot process:",
          event,
        );
        this.channel?.ack(msg);
        return;
      }

      if (routingKey.startsWith("billing.payment.")) {
        const isRefundEvent =
          routingKey.includes("refunded") ||
          routingKey.includes("refund_requested");
        const hasPaymentId =
          (payload as any)?.paymentId || event.eventData?.paymentId;
        if (!isRefundEvent && !hasPaymentId) {
          console.error("[BillingEventConsumer] Missing paymentId in payload", {
            eventId,
            routingKey,
            event,
          });
          this.channel?.ack(msg);
          return;
        }
      }

      if (await this.inboxRepo.exists(eventId)) {
        console.debug(
          `[BillingEventConsumer] Duplicate event ${eventId}, skipping`,
        );
        this.channel?.ack(msg);
        return;
      }

      console.log(
        `[BillingEventConsumer] Processing event: ${routingKey} (${eventId})`,
      );

      // Route to appropriate handler
      switch (routingKey) {
        case "billing.insurance.coverage.verified":
          await this.handleInsuranceCoverageVerified(
            event.payload as InsuranceCoverageVerifiedEventData,
          );
          break;

        case "billing.preauthorization.requested":
          await this.handlePreAuthorizationRequested(
            event.payload as PreAuthorizationRequestedEventData,
          );
          break;

        case "billing.preauthorization.approved":
          await this.handlePreAuthorizationApproved(
            event.payload as PreAuthorizationApprovedEventData,
          );
          break;

        case "billing.preauthorization.denied":
          await this.handlePreAuthorizationDenied(
            event.payload as PreAuthorizationDeniedEventData,
          );
          break;

        case "billing.rate.updated":
          await this.handleRateUpdated(payload as RateUpdatedEventData);
          break;

        case "billing.payment.completed":
        case "billing.payment.processed":
          await this.handlePaymentProcessed(
            payload as PaymentProcessedEventData,
          );
          break;

        case "billing.payment.refunded":
          await this.handlePaymentRefunded(payload as any);
          break;

        case "billing.invoice.generated":
          await this.handleInvoiceGenerated(
            payload as InvoiceGeneratedEventData,
          );
          break;

        case "billing.payment.reminder.scheduled":
          await this.handlePaymentReminderScheduled(
            payload as PaymentReminderScheduledEventData,
          );
          break;

        case "billing.payment.reminder.due":
          await this.handlePaymentReminderDue(
            payload as PaymentReminderDueEventData,
          );
          break;

        case "billing.refund.processed":
          await this.handleRefundProcessed(payload as RefundProcessedEventData);
          break;

        default:
          console.warn("Unhandled routing key", { routingKey });
          break;
      }

      // Store in inbox after successful processing
      await this.inboxRepo.store({
        idempotencyKey: eventId,
        eventType: routingKey,
        payload: event,
      });

      // Acknowledge message
      this.channel.ack(msg);
    } catch (error) {
      console.error("Error processing billing event", {
        error: error instanceof Error ? error.message : "Unknown error",
        routingKey: msg.fields.routingKey,
      });

      // Negative acknowledge (requeue)
      if (this.channel) {
        this.channel.nack(msg, false, true);
      }
    }
  }

  /**
   * Handle insurance coverage verified event
   */
  private async handleInsuranceCoverageVerified(
    data: InsuranceCoverageVerifiedEventData,
  ): Promise<void> {
    console.log(
      "Processing insurance coverage verification for notifications",
      {
        patientId: data.patientId,
        insuranceProvider: data.insuranceProvider,
        coverageStatus: data.coverageStatus,
        coverageAmount: data.coverageAmount,
      },
    );

    try {
      // Get patient notification preferences
      const patientPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.patientId,
          userType: "patient",
        });

      // Send insurance verification notification to patient
      await this.sendInsuranceVerificationNotification(
        data,
        patientPreferences,
      );

      // Send special notification for partial or rejected coverage
      if (
        data.coverageStatus === "partial" ||
        data.coverageStatus === "rejected"
      ) {
        await this.sendCoverageIssueNotification(data, patientPreferences);
      }

      // Send notification to billing department for review
      if (
        data.coverageStatus === "rejected" ||
        data.coverageStatus === "pending"
      ) {
        await this.sendBillingReviewNotification(data);
      }
    } catch (error) {
      console.error("Failed to process insurance coverage verification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle pre-authorization requested event
   */
  private async handlePreAuthorizationRequested(
    data: PreAuthorizationRequestedEventData,
  ): Promise<void> {
    console.log("Processing pre-authorization request for notifications", {
      preAuthId: data.preAuthId,
      patientId: data.patientId,
      procedureType: data.procedureType,
      estimatedCost: data.estimatedCost,
      urgencyLevel: data.urgencyLevel,
    });

    try {
      // Get patient notification preferences
      const patientPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.patientId,
          userType: "patient",
        });

      // Send pre-authorization request notification to patient
      await this.sendPreAuthRequestNotification(data, patientPreferences);

      // Send urgent pre-auth notification to physician
      if (data.urgencyLevel === "urgent" || data.urgencyLevel === "emergency") {
        const physicianPreferences =
          await this.getNotificationPreferencesUseCase.execute({
            userId: data.physicianId,
            userType: "staff",
          });

        await this.sendUrgentPreAuthNotification(data, physicianPreferences);
      }

      // Schedule follow-up reminder for expected response date
      await this.schedulePreAuthFollowUp(data, patientPreferences);
    } catch (error) {
      console.error("Failed to process pre-authorization request", {
        preAuthId: data.preAuthId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle pre-authorization approved event
   */
  private async handlePreAuthorizationApproved(
    data: PreAuthorizationApprovedEventData,
  ): Promise<void> {
    console.log("Processing pre-authorization approval for notifications", {
      preAuthId: data.preAuthId,
      patientId: data.patientId,
      procedureType: data.procedureType,
      approvedAmount: data.approvedAmount,
    });

    try {
      // Get patient notification preferences
      const patientPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.patientId,
          userType: "patient",
        });

      // Send pre-authorization approval notification to patient
      await this.sendPreAuthApprovalNotification(data, patientPreferences);

      // Send approval notification to physician
      const physicianPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.physicianId,
          userType: "staff",
        });

      await this.sendPreAuthPhysicianApprovalNotification(
        data,
        physicianPreferences,
      );

      // Send notification to billing department
      await this.sendPreAuthBillingNotification(data);
    } catch (error) {
      console.error("Failed to process pre-authorization approval", {
        preAuthId: data.preAuthId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle pre-authorization denied event
   */
  private async handlePreAuthorizationDenied(
    data: PreAuthorizationDeniedEventData,
  ): Promise<void> {
    console.log("Processing pre-authorization denial for notifications", {
      preAuthId: data.preAuthId,
      patientId: data.patientId,
      procedureType: data.procedureType,
      denialReason: data.denialReason,
    });

    try {
      // Get patient notification preferences
      const patientPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.patientId,
          userType: "patient",
        });

      // Send pre-authorization denial notification to patient
      await this.sendPreAuthDenialNotification(data, patientPreferences);

      // Send denial notification to physician
      const physicianPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.physicianId,
          userType: "staff",
        });

      await this.sendPreAuthPhysicianDenialNotification(
        data,
        physicianPreferences,
      );

      // Send appeal deadline reminder if applicable
      if (data.appealDeadline) {
        await this.scheduleAppealReminder(data, patientPreferences);
      }
    } catch (error) {
      console.error("Failed to process pre-authorization denial", {
        preAuthId: data.preAuthId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle rate updated event
   */
  private async handleRateUpdated(data: RateUpdatedEventData): Promise<void> {
    console.log("Processing rate update for notifications", {
      rateId: data.rateId,
      serviceType: data.serviceType,
      procedureCode: data.procedureCode,
      oldRate: data.oldRate,
      newRate: data.newRate,
      effectiveDate: data.effectiveDate,
    });

    try {
      // Send rate update notification to billing department
      await this.sendRateUpdateNotification(data);

      // Send notifications to affected patients
      if (data.patientNotifications && data.patientNotifications.length > 0) {
        await this.sendPatientRateChangeNotifications(data);
      }

      // Send notification to affected physicians
      if (data.affectedAppointments && data.affectedAppointments.length > 0) {
        await this.sendPhysicianRateChangeNotifications(data);
      }
    } catch (error) {
      console.error("Failed to process rate update", {
        rateId: data.rateId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle payment processed event
   *
   *  REFACTORED FOR MVP:
   * - Send payment receipt when status = 'completed'
   * - Use new template: PAYMENT_COMPLETED
   * - Skip failed/refunded in MVP (future work)
   */
  private async handlePaymentProcessed(
    data: PaymentProcessedEventData,
  ): Promise<void> {
    const resolvedAmount =
      typeof data.amount === "number"
        ? data.amount
        : Number((data as any).totalAmount ?? 0);
    const resolvedMethod =
      data.paymentMethod || data.method || "online_payment";
    const resolvedStatus = (
      data.paymentStatus ||
      data.status ||
      "completed"
    ).toString() as "completed" | string;
    const resolvedProcessedAt = data.processedAt
      ? new Date(data.processedAt)
      : new Date();
    const resolvedPatientName = data.patientName || "Bệnh nhân";

    console.log(
      "[BillingEventConsumer] Processing payment processed for notifications",
      {
        paymentId: data.paymentId,
        patientId: data.patientId,
        amount: resolvedAmount,
        paymentStatus: resolvedStatus,
        paymentMethod: resolvedMethod,
      },
    );

    try {
      // ===== GUARD: Only process completed payments in MVP =====
      if (resolvedStatus !== "completed") {
        console.log(
          "[BillingEventConsumer] Ignoring non-completed payment (MVP scope)",
          {
            paymentId: data.paymentId,
            paymentStatus: resolvedStatus,
          },
        );
        return;
      }

      // Get patient notification preferences
      const patientPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.patientId,
          userType: "patient",
        });

      // ===== Send payment receipt notification =====
      await this.dispatchNotification({
        recipientId: data.patientId,
        recipientType: "PATIENT",
        recipientName: resolvedPatientName,
        recipientEmail: patientPreferences?.preferences?.email,
        recipientPhone: patientPreferences?.preferences?.phoneNumber,
        templateType: "PAYMENT_COMPLETED", //  NEW template
        channels: ["EMAIL"],
        priority: "NORMAL",
        data: {
          patientName: resolvedPatientName,
          paymentId: data.paymentId,
          appointmentId: data.appointmentId || "N/A",
          amount: resolvedAmount,
          paymentMethod: resolvedMethod,
          transactionId: data.transactionId || data.paymentId,
          completedAt: resolvedProcessedAt,
          statusMessage:
            "Thanh toán thành công. Lịch hẹn của bạn đã được xác nhận.",
        },
        scheduledAt: new Date(),
        metadata: {
          paymentId: data.paymentId,
          invoiceId: data.invoiceId,
          flow: "prepaid_payment_receipt",
        },
      });

      console.log("[BillingEventConsumer] Payment receipt sent", {
        paymentId: data.paymentId,
        patientId: data.patientId,
        templateUsed: "PAYMENT_COMPLETED",
      });

      // ===== FUTURE WORK: Payment failures/refunds =====
      // if (data.paymentStatus === 'failed') {
      //   await this.sendPaymentFailureNotification(data, patientPreferences);
      // }
      // if (data.paymentStatus === 'refunded') {
      //   await this.sendRefundNotification(data, patientPreferences);
      // }
    } catch (error) {
      console.error("[BillingEventConsumer] Failed to process payment", {
        paymentId: data.paymentId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle payment refunded event
   */
  private async handlePaymentRefunded(data: any): Promise<void> {
    try {
      const refundData: RefundProcessedEventData = {
        refundId:
          data.refundId || data.refundPaymentId || data.paymentId || "unknown",
        patientId: data.patientId,
        patientName: data.patientName || "",
        originalPaymentId: data.originalPaymentId || data.paymentId || "",
        refundAmount: Number(data.refundAmount || 0),
        refundReason: data.reason || data.refundReason || "Hoàn tiền",
        processedAt: data.refundedAt ? new Date(data.refundedAt) : new Date(),
        processedBy: data.refundedBy || "system",
        refundMethod: data.gatewayRefundId ? "online" : "offline",
      };

      if (!refundData.patientId) {
        console.warn(
          "[BillingEventConsumer] Missing patientId in refund event, skipping",
          { refundId: refundData.refundId },
        );
        return;
      }

      const preferences = await this.getNotificationPreferencesUseCase.execute({
        userId: refundData.patientId,
        userType: "patient",
      });

      await this.sendRefundProcessedNotification(refundData, preferences);
      await this.sendRefundDepartmentNotification(refundData);
    } catch (error) {
      console.error("Failed to process payment refunded event", {
        error: error instanceof Error ? error.message : "Unknown error",
        data,
      });
    }
  }

  /**
   * Handle invoice generated event
   */
  private async handleInvoiceGenerated(
    data: InvoiceGeneratedEventData,
  ): Promise<void> {
    const normalizedData = this.normalizeInvoiceData(data);
    const invoiceTotal = normalizedData.totalAmount ?? 0;
    const patientResponsibility =
      typeof normalizedData.patientResponsibility === "number"
        ? normalizedData.patientResponsibility
        : Math.max(0, invoiceTotal - (normalizedData.insuranceCoverage ?? 0));
    const enrichedData = {
      ...normalizedData,
      totalAmount: invoiceTotal,
      patientResponsibility,
    };
    console.log("Processing invoice generation for notifications", {
      invoiceId: enrichedData.invoiceId,
      patientId: enrichedData.patientId,
      totalAmount: invoiceTotal,
      dueDate: enrichedData.dueDate,
      patientResponsibility,
    });

    try {
      // Get patient notification preferences
      const patientPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: enrichedData.patientId,
          userType: "patient",
        });

      // Send invoice notification to patient
      await this.sendInvoiceNotification(enrichedData, patientPreferences);

      // Send high-value invoice notification to billing department
      if (invoiceTotal > 5000000) {
        // 5 million VND
        await this.sendHighValueInvoiceNotification(enrichedData);
      }

      // Schedule payment reminders
      await this.schedulePaymentReminders(enrichedData, patientPreferences);
    } catch (error) {
      console.error("Failed to process invoice generation", {
        invoiceId: enrichedData.invoiceId,
        patientId: enrichedData.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle payment reminder scheduled event
   */
  private async handlePaymentReminderScheduled(
    data: PaymentReminderScheduledEventData,
  ): Promise<void> {
    console.log("Processing payment reminder scheduling for notifications", {
      reminderId: data.reminderId,
      patientId: data.patientId,
      invoiceId: data.invoiceId,
      reminderType: data.reminderType,
      scheduledFor: data.scheduledFor,
    });

    try {
      // Get patient notification preferences
      const patientPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.patientId,
          userType: "patient",
        });

      // Send payment reminder notification
      await this.sendPaymentReminderNotification(data, patientPreferences);

      // Send final notice to billing department
      if (
        data.reminderType === "final_notice" ||
        data.reminderType === "overdue"
      ) {
        await this.sendOverdueAccountNotification(data);
      }
    } catch (error) {
      console.error("Failed to process payment reminder scheduling", {
        reminderId: data.reminderId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle payment reminder due event (triggered by Scheduler Service)
   */
  private async handlePaymentReminderDue(
    data: PaymentReminderDueEventData,
  ): Promise<void> {
    console.log("Processing payment reminder due for notifications", {
      invoiceId: data.invoiceId,
      patientId: data.patientId,
      reminderType: data.reminderType,
      daysBeforeDue: data.daysBeforeDue,
      totalAmount: data.totalAmount,
    });

    try {
      // Get patient notification preferences
      const patientPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.patientId,
          userType: "patient",
        });

      // Determine notification priority and message based on reminder type
      let priority: "low" | "normal" | "high" | "urgent" = "normal";
      let title = "Nhắc nhở thanh toán";
      let message = "";

      switch (data.reminderType) {
        case "before-due":
          priority = "normal";
          title = `Nhắc nhở thanh toán - Còn ${data.daysBeforeDue} ngày`;
          message = `Kính gửi ${data.patientName},\n\nHóa đơn #${data.invoiceNumber} của quý khách sẽ đến hạn thanh toán trong ${data.daysBeforeDue} ngày.\n\nSố tiền: ${data.totalAmount.toLocaleString("vi-VN")} VNĐ\nHạn thanh toán: ${new Date(data.dueDate).toLocaleDateString("vi-VN")}\n\nVui lòng thanh toán trước hạn để tránh phát sinh phí trễ hạn.\n\nTrân trọng,\nBệnh viện`;
          break;

        case "on-due":
          priority = "high";
          title = "Nhắc nhở thanh toán - Hôm nay là hạn cuối";
          message = `Kính gửi ${data.patientName},\n\nHôm nay là hạn cuối thanh toán hóa đơn #${data.invoiceNumber}.\n\nSố tiền: ${data.totalAmount.toLocaleString("vi-VN")} VNĐ\nHạn thanh toán: ${new Date(data.dueDate).toLocaleDateString("vi-VN")}\n\nVui lòng thanh toán ngay hôm nay để tránh phát sinh phí trễ hạn.\n\nTrân trọng,\nBệnh viện`;
          break;

        case "after-due":
          priority = "urgent";
          title = "Thông báo quá hạn thanh toán";
          message = `Kính gửi ${data.patientName},\n\nHóa đơn #${data.invoiceNumber} của quý khách đã quá hạn thanh toán.\n\nSố tiền: ${data.totalAmount.toLocaleString("vi-VN")} VNĐ\nHạn thanh toán: ${new Date(data.dueDate).toLocaleDateString("vi-VN")}\n\nVui lòng liên hệ phòng kế toán để thanh toán và tránh ảnh hưởng đến các dịch vụ y tế tiếp theo.\n\nTrân trọng,\nBệnh viện`;
          break;
      }

      // Send notification to patient
      await this.dispatchNotification({
        recipientId: data.patientId,
        recipientType: "patient",
        type: "payment_reminder",
        title,
        content: message,
        channels: this.getEnabledChannels(patientPreferences, [
          "email",
          "sms",
          "in_app",
        ]),
        priority,
        scheduledAt: new Date(),
        metadata: {
          invoiceId: data.invoiceId,
          invoiceNumber: data.invoiceNumber,
          totalAmount: data.totalAmount,
          dueDate: data.dueDate,
          reminderType: data.reminderType,
          daysBeforeDue: data.daysBeforeDue,
          source: "scheduler-service",
          healthcareContext: {
            contextType: "billing",
            relatedEntityType: "invoice",
            relatedEntityId: data.invoiceId,
          },
        },
      });

      console.log("Payment reminder notification sent successfully", {
        invoiceId: data.invoiceId,
        patientId: data.patientId,
        reminderType: data.reminderType,
      });
    } catch (error) {
      console.error("Failed to process payment reminder due", {
        invoiceId: data.invoiceId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle refund processed event
   */
  private async handleRefundProcessed(
    data: RefundProcessedEventData,
  ): Promise<void> {
    console.log("Processing refund processing for notifications", {
      refundId: data.refundId,
      patientId: data.patientId,
      refundAmount: data.refundAmount,
      refundReason: data.refundReason,
      refundMethod: data.refundMethod,
    });

    try {
      // Get patient notification preferences
      const patientPreferences =
        await this.getNotificationPreferencesUseCase.execute({
          userId: data.patientId,
          userType: "patient",
        });

      // Send refund notification to patient
      await this.sendRefundProcessedNotification(data, patientPreferences);

      // Send refund notification to billing department
      await this.sendRefundDepartmentNotification(data);
    } catch (error) {
      console.error("Failed to process refund processing", {
        refundId: data.refundId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Send insurance verification notification to patient
   */
  private async sendInsuranceVerificationNotification(
    data: InsuranceCoverageVerifiedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const statusText =
        {
          verified: "đã xác nhận",
          partial: "xác nhận một phần",
          rejected: "bị từ chối",
          pending: "đang chờ xử lý",
        }[data.coverageStatus] || data.coverageStatus;

      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "insurance_verified",
        title: "Xác nhận bảo hiểm y tế",
        content: `Bảo hiểm y tế của bạn với ${data.insuranceProvider} đã được xác nhận. Trạng thái: ${statusText}. Mức độ chi trả: ${data.coverageAmount.toLocaleString("vi-VN")} VNĐ. Hiệu lực đến: ${this.formatDate(data.validUntil)}.`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: data.coverageStatus === "rejected" ? "high" : "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          insuranceProvider: data.insuranceProvider,
          coverageStatus: data.coverageStatus,
          coverageAmount: data.coverageAmount,
          validUntil: data.validUntil,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent insurance verification notification to patient", {
        patientId: data.patientId,
        coverageStatus: data.coverageStatus,
      });
    } catch (error) {
      console.error("Failed to send insurance verification notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send coverage issue notification
   */
  private async sendCoverageIssueNotification(
    data: InsuranceCoverageVerifiedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      let issueText = "";
      if (data.coverageStatus === "partial") {
        issueText = `Bảo hiểm chỉ chi trả một phần. Bạn cần thanh toán thêm: ${data.coPayment.toLocaleString("vi-VN")} VNĐ.`;
      } else if (data.coverageStatus === "rejected") {
        issueText =
          "Bảo hiểm đã bị từ chối. Vui lòng liên hệ phòng kế toán để biết chi tiết.";
      }

      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "coverage_issue",
        title: "Vấn đề bảo hiểm y tế",
        content: issueText + (data.notes ? ` Ghi chú: ${data.notes}` : ""),
        channels: this.getEnabledChannels(preferences, ["email", "sms"]),
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          coverageStatus: data.coverageStatus,
          coPayment: data.coPayment,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send coverage issue notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send billing review notification
   */
  private async sendBillingReviewNotification(
    data: InsuranceCoverageVerifiedEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: "billing_department",
        recipientType: "department",
        type: "billing_review_required",
        title: "Cần xem xét bảo hiểm",
        content: `Bảo hiểm của bệnh nhân ${data.patientName} (${data.insuranceProvider}) có trạng thái ${data.coverageStatus}. Cần xem xét thủ tục thanh toán.`,
        channels: ["in_app", "email"],
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          insuranceProvider: data.insuranceProvider,
          coverageStatus: data.coverageStatus,
          verifiedAt: data.verifiedAt,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send billing review notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send pre-authorization request notification to patient
   */
  private async sendPreAuthRequestNotification(
    data: PreAuthorizationRequestedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const urgencyText =
        {
          routine: "thường quy",
          urgent: "khẩn",
          emergency: "cấp cứu",
        }[data.urgencyLevel] || data.urgencyLevel;

      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "preauth_requested",
        title: "Yêu cầu duyệt trước bảo hiểm",
        content: `Yêu cầu duyệt trước bảo hiểm đã được gửi cho thủ tục ${data.procedureType}. Chi phí ước tính: ${data.estimatedCost.toLocaleString("vi-VN")} VNĐ. Mức độ: ${urgencyText}. Dự kiến phản hồi: ${this.formatDate(data.expectedResponseDate)}.`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: data.urgencyLevel === "emergency" ? "urgent" : "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          preAuthId: data.preAuthId,
          procedureType: data.procedureType,
          urgencyLevel: data.urgencyLevel,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent pre-authorization request notification to patient", {
        patientId: data.patientId,
        preAuthId: data.preAuthId,
      });
    } catch (error) {
      console.error("Failed to send pre-authorization request notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send urgent pre-authorization notification to physician
   */
  private async sendUrgentPreAuthNotification(
    data: PreAuthorizationRequestedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.physicianId,
        recipientType: "staff",
        type: "urgent_preauth",
        title: "Yêu cầu duyệt trước khẩn cấp",
        content: `Yêu cầu duyệt trước khẩn cấp cho bệnh nhân ${data.patientName}, thủ tục ${data.procedureType}. Chi phí: ${data.estimatedCost.toLocaleString("vi-VN")} VNĐ.`,
        channels: this.getEnabledChannels(preferences, [
          "in_app",
          "email",
          "sms",
        ]),
        priority: "urgent",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          preAuthId: data.preAuthId,
          procedureType: data.procedureType,
          urgencyLevel: data.urgencyLevel,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send urgent pre-authorization notification", {
        physicianId: data.physicianId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Schedule pre-authorization follow-up
   */
  private async schedulePreAuthFollowUp(
    data: PreAuthorizationRequestedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const followUpDate = new Date(
        data.expectedResponseDate.getTime() + 24 * 60 * 60 * 1000,
      ); // 1 day after expected response

      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "preauth_followup",
        title: "Theo dõi yêu cầu duyệt trước",
        content: `Yêu cầu duyệt trước cho thủ tục ${data.procedureType} đang được xử lý. Vui lòng liên hệ phòng kế toán nếu cần thông tin thêm.`,
        channels: this.getEnabledChannels(preferences, ["email", "in_app"]),
        priority: "normal",
        scheduledAt: followUpDate,
        metadata: {
          patientId: data.patientId,
          preAuthId: data.preAuthId,
          procedureType: data.procedureType,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to schedule pre-authorization follow-up", {
        preAuthId: data.preAuthId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send pre-authorization approval notification to patient
   */
  private async sendPreAuthApprovalNotification(
    data: PreAuthorizationApprovedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "preauth_approved",
        title: "Duyệt trước bảo hiểm đã được chấp thuận",
        content: `Yêu cầu duyệt trước cho thủ tục ${data.procedureType} đã được chấp thuận. Số tiền được duyệt: ${data.approvedAmount.toLocaleString("vi-VN")} VNĐ. Hiệu lực đến: ${this.formatDate(data.validUntil)}.`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          preAuthId: data.preAuthId,
          approvedAmount: data.approvedAmount,
          validUntil: data.validUntil,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent pre-authorization approval notification to patient", {
        patientId: data.patientId,
        preAuthId: data.preAuthId,
      });
    } catch (error) {
      console.error("Failed to send pre-authorization approval notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send pre-authorization approval notification to physician
   */
  private async sendPreAuthPhysicianApprovalNotification(
    data: PreAuthorizationApprovedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.physicianId,
        recipientType: "staff",
        type: "preauth_approved",
        title: "Duyệt trước bảo hiểm đã được chấp thuận",
        content: `Yêu cầu duyệt trước cho bệnh nhân ${data.patientName}, thủ tục ${data.procedureType} đã được chấp thuận với số tiền ${data.approvedAmount.toLocaleString("vi-VN")} VNĐ.`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          preAuthId: data.preAuthId,
          approvedAmount: data.approvedAmount,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error(
        "Failed to send pre-authorization physician approval notification",
        {
          physicianId: data.physicianId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
    }
  }

  /**
   * Send pre-authorization billing notification
   */
  private async sendPreAuthBillingNotification(
    data: PreAuthorizationApprovedEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: "billing_department",
        recipientType: "department",
        type: "preauth_approved_billing",
        title: "Duyệt trước bảo hiểm - Cập nhật kế toán",
        content: `Yêu cầu duyệt trước cho bệnh nhân ${data.patientName} đã được chấp thuận. Số tiền: ${data.approvedAmount.toLocaleString("vi-VN")} VNĐ. Vui lòng cập nhật hệ thống kế toán.`,
        channels: ["in_app", "email"],
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          preAuthId: data.preAuthId,
          approvedAmount: data.approvedAmount,
          validUntil: data.validUntil,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send pre-authorization billing notification", {
        preAuthId: data.preAuthId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send pre-authorization denial notification to patient
   */
  private async sendPreAuthDenialNotification(
    data: PreAuthorizationDeniedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      let appealText = "";
      if (data.appealDeadline) {
        appealText = ` Hạn chờ khiếu nại: ${this.formatDate(data.appealDeadline)}.`;
      }

      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "preauth_denied",
        title: "Duyệt trước bảo hiểm đã bị từ chối",
        content: `Yêu cầu duyệt trước cho thủ tục ${data.procedureType} đã bị từ chối. Lý do: ${data.denialReason}.${appealText}`,
        channels: this.getEnabledChannels(preferences, ["email", "sms"]),
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          preAuthId: data.preAuthId,
          denialReason: data.denialReason,
          appealDeadline: data.appealDeadline,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent pre-authorization denial notification to patient", {
        patientId: data.patientId,
        preAuthId: data.preAuthId,
      });
    } catch (error) {
      console.error("Failed to send pre-authorization denial notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send pre-authorization denial notification to physician
   */
  private async sendPreAuthPhysicianDenialNotification(
    data: PreAuthorizationDeniedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.physicianId,
        recipientType: "staff",
        type: "preauth_denied",
        title: "Duyệt trước bảo hiểm đã bị từ chối",
        content: `Yêu cầu duyệt trước cho bệnh nhân ${data.patientName}, thủ tục ${data.procedureType} đã bị từ chối. Lý do: ${data.denialReason}.`,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          preAuthId: data.preAuthId,
          denialReason: data.denialReason,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error(
        "Failed to send pre-authorization physician denial notification",
        {
          physicianId: data.physicianId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
    }
  }

  /**
   * Schedule appeal reminder
   */
  private async scheduleAppealReminder(
    data: PreAuthorizationDeniedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      if (!data.appealDeadline) return;

      const reminderDate = new Date(
        data.appealDeadline.getTime() - 3 * 24 * 60 * 60 * 1000,
      ); // 3 days before deadline

      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "appeal_reminder",
        title: "Nhắc nhở khiếu nại bảo hiểm",
        content: `Hạn chờ khiếu nại cho yêu cầu duyệt trước thủ tục ${data.procedureType} là ${this.formatDate(data.appealDeadline)}. Vui lòng liên hệ phòng kế toán để được hỗ trợ.`,
        channels: this.getEnabledChannels(preferences, ["email", "sms"]),
        priority: "high",
        scheduledAt: reminderDate,
        metadata: {
          patientId: data.patientId,
          preAuthId: data.preAuthId,
          appealDeadline: data.appealDeadline,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to schedule appeal reminder", {
        preAuthId: data.preAuthId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send rate update notification
   */
  private async sendRateUpdateNotification(
    data: RateUpdatedEventData,
  ): Promise<void> {
    try {
      const changeAmount = data.newRate - data.oldRate;
      const changeText =
        changeAmount > 0
          ? `tăng ${changeAmount.toLocaleString("vi-VN")} VNĐ`
          : `giảm ${Math.abs(changeAmount).toLocaleString("vi-VN")} VNĐ`;

      const notificationData = {
        recipientId: "billing_department",
        recipientType: "department",
        type: "rate_update",
        title: "Cập nhật giá dịch vụ",
        content: `Giá dịch vụ ${data.serviceType} (${data.procedureCode}) đã được cập nhật. Hiệu lực từ ${this.formatDate(data.effectiveDate)}: ${changeText}.`,
        channels: ["in_app", "email"],
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          rateId: data.rateId,
          serviceType: data.serviceType,
          oldRate: data.oldRate,
          newRate: data.newRate,
          effectiveDate: data.effectiveDate,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send rate update notification", {
        rateId: data.rateId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send patient rate change notifications
   */
  private async sendPatientRateChangeNotifications(
    data: RateUpdatedEventData,
  ): Promise<void> {
    try {
      if (!data.patientNotifications) return;

      for (const patientNotif of data.patientNotifications) {
        const changeAmount = patientNotif.newCost - patientNotif.oldCost;
        const changeText =
          changeAmount > 0
            ? `tăng ${changeAmount.toLocaleString("vi-VN")} VNĐ`
            : `giảm ${Math.abs(changeAmount).toLocaleString("vi-VN")} VNĐ`;

        const notificationData = {
          recipientId: patientNotif.patientId,
          recipientType: "patient",
          type: "rate_change",
          title: "Thay đổi giá dịch vụ",
          content: `Giá dịch vụ cho lịch hẹn của bạn đã thay đổi: ${changeText}. Chi phí mới: ${patientNotif.newCost.toLocaleString("vi-VN")} VNĐ. Hiệu lực từ ${this.formatDate(data.effectiveDate)}.`,
          channels: ["in_app", "email"],
          priority: Math.abs(changeAmount) > 1000000 ? "high" : "normal", // High if change > 1M VND
          scheduledAt: new Date(),
          metadata: {
            patientId: patientNotif.patientId,
            appointmentId: patientNotif.appointmentId,
            oldCost: patientNotif.oldCost,
            newCost: patientNotif.newCost,
          },
        };

        await this.dispatchNotification(notificationData);
      }
    } catch (error) {
      console.error("Failed to send patient rate change notifications", {
        rateId: data.rateId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send physician rate change notifications
   */
  private async sendPhysicianRateChangeNotifications(
    data: RateUpdatedEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: "medical_staff",
        recipientType: "department",
        type: "physician_rate_change",
        title: "Cập nhật giá dịch vụ y khoa",
        content: `Giá dịch vụ ${data.serviceType} đã được cập nhật và ảnh hưởng đến các lịch hẹn hiện có. Vui lòng thông báo cho bệnh nhân khi cần thiết.`,
        channels: ["in_app", "email"],
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          rateId: data.rateId,
          serviceType: data.serviceType,
          effectiveDate: data.effectiveDate,
          affectedAppointments: data.affectedAppointments,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send physician rate change notifications", {
        rateId: data.rateId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send payment notification to patient
   */
  private async sendPaymentNotification(
    data: PaymentProcessedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const statusKey = (data.paymentStatus || "completed") as
        | "completed"
        | "failed"
        | "refunded"
        | "partial_refund";
      const statusText =
        {
          completed: "hoàn thành",
          failed: "thất bại",
          refunded: "đã hoàn tiền",
          partial_refund: "hoàn tiền một phần",
        }[statusKey] || statusKey;
      const amount =
        typeof data.amount === "number"
          ? data.amount
          : Number((data as any)?.totalAmount ?? 0);
      const method = data.paymentMethod || data.method || "online_payment";

      let content = `Thanh toán ${amount.toLocaleString(
        "vi-VN",
      )} VNĐ bằng ${method} đã ${statusText}.`;

      if (data.dueAmount && data.dueAmount > 0) {
        content += ` Số tiền còn lại: ${data.dueAmount.toLocaleString("vi-VN")} VNĐ.`;
      }

      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "payment_processed",
        title: "Xác nhận thanh toán",
        content,
        channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
        priority: statusKey === "failed" ? "high" : "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          paymentId: data.paymentId,
          paymentStatus: statusKey,
          amount,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent payment notification to patient", {
        patientId: data.patientId,
        paymentId: data.paymentId,
        paymentStatus: data.paymentStatus,
      });
    } catch (error) {
      console.error("Failed to send payment notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send payment failure notification
   */
  private async sendPaymentFailureNotification(
    data: PaymentProcessedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const amount =
        typeof data.amount === "number"
          ? data.amount
          : Number((data as any)?.totalAmount ?? 0);
      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "payment_failed",
        title: "Thanh toán thất bại",
        content: `Thanh toán ${amount.toLocaleString(
          "vi-VN",
        )} VNĐ đã thất bại. Vui lòng kiểm tra thông tin thanh toán và thử lại hoặc liên hệ phòng kế toán.`,
        channels: this.getEnabledChannels(preferences, ["email", "sms"]),
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          paymentId: data.paymentId,
          amount,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send payment failure notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send refund notification
   */
  private async sendRefundNotification(
    data: PaymentProcessedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const refundAmount =
        typeof data.refundAmount === "number" ? data.refundAmount : 0;
      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "refund_processed",
        title: "Hoàn tiền đã được xử lý",
        content: `Hoàn tiền ${refundAmount.toLocaleString(
          "vi-VN",
        )} VNĐ đã được xử lý cho thanh toán #${data.paymentId}.`,
        channels: this.getEnabledChannels(preferences, ["email", "in_app"]),
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          paymentId: data.paymentId,
          refundAmount,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send refund notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send invoice notification to patient
   */
  private async sendInvoiceNotification(
    data: InvoiceGeneratedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const totalAmount =
        typeof data.totalAmount === "number"
          ? data.totalAmount
          : Number((data as any).amount ?? 0);
      const patientResponsibility =
        typeof data.patientResponsibility === "number"
          ? data.patientResponsibility
          : Math.max(0, totalAmount - (data.insuranceCoverage ?? 0));
      const dueDateRaw = data.dueDate ?? data.generatedAt;
      const dueDate =
        dueDateRaw instanceof Date
          ? dueDateRaw
          : new Date(dueDateRaw || Date.now());
      const safeDueDate = Number.isNaN(dueDate.getTime())
        ? new Date()
        : dueDate;

      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "invoice_generated",
        title: "Hóa đơn mới",
        content: `Hóa đơn #${data.invoiceId} đã được tạo. Tổng cộng: ${totalAmount.toLocaleString(
          "vi-VN",
        )} VNĐ. Số tiền bạn cần thanh toán: ${patientResponsibility.toLocaleString(
          "vi-VN",
        )} VNĐ. Hạn thanh toán: ${this.formatDate(safeDueDate)}.`,
        channels: this.getEnabledChannels(preferences, ["email", "in_app"]),
        priority: patientResponsibility > 10000000 ? "high" : "normal", // High if > 10M VND
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          invoiceId: data.invoiceId,
          totalAmount,
          dueDate: safeDueDate,
          patientResponsibility,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent invoice notification to patient", {
        patientId: data.patientId,
        invoiceId: data.invoiceId,
      });
    } catch (error) {
      console.error("Failed to send invoice notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send high-value invoice notification
   */
  private async sendHighValueInvoiceNotification(
    data: InvoiceGeneratedEventData,
  ): Promise<void> {
    try {
      const totalAmount =
        typeof data.totalAmount === "number" ? data.totalAmount : 0;
      const notificationData = {
        recipientId: "billing_department",
        recipientType: "department",
        type: "high_value_invoice",
        title: "Hóa đơn giá trị cao",
        content: `Hóa đơn giá trị cao đã được tạo cho bệnh nhân ${data.patientName || "Bệnh nhân"}: ${totalAmount.toLocaleString(
          "vi-VN",
        )} VNĐ. Cần xem xét phương thức thanh toán.`,
        channels: ["in_app", "email"],
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          invoiceId: data.invoiceId,
          totalAmount,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send high-value invoice notification", {
        invoiceId: data.invoiceId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Schedule payment reminders
   */
  private async schedulePaymentReminders(
    data: InvoiceGeneratedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const dueDateRaw = data.dueDate ?? data.generatedAt ?? new Date();
      const dueDate =
        dueDateRaw instanceof Date ? dueDateRaw : new Date(dueDateRaw);
      if (Number.isNaN(dueDate.getTime())) {
        console.warn("Skipping reminder scheduling due to invalid due date", {
          invoiceId: data.invoiceId,
          patientId: data.patientId,
          dueDate: data.dueDate,
        });
        return;
      }
      const patientResponsibility =
        typeof data.patientResponsibility === "number"
          ? data.patientResponsibility
          : Math.max(0, Number(data.totalAmount ?? 0));

      const reminderSchedule = [
        { type: "first_notice", daysBefore: 7 },
        { type: "second_notice", daysBefore: 3 },
        { type: "final_notice", daysBefore: 1 },
      ];

      for (const reminder of reminderSchedule) {
        const reminderDate = new Date(
          dueDate.getTime() - reminder.daysBefore * 24 * 60 * 60 * 1000,
        );

        if (reminderDate > new Date()) {
          const message = this.getReminderMessage(
            reminder.type,
            dueDate,
            patientResponsibility,
          );

          const notificationData = {
            recipientId: data.patientId,
            recipientType: "patient",
            type: "payment_reminder",
            title: "Nhắc nhở thanh toán",
            content: message,
            channels: this.getEnabledChannels(preferences, [
              "email",
              "sms",
              "in_app",
            ]),
            priority: reminder.type === "final_notice" ? "high" : "normal",
            scheduledAt: reminderDate,
            metadata: {
              patientId: data.patientId,
              invoiceId: data.invoiceId,
              reminderType: reminder.type,
              dueDate,
            },
          };

          await this.dispatchNotification(notificationData);
        }
      }

      console.log("Scheduled payment reminders", {
        invoiceId: data.invoiceId,
        patientId: data.patientId,
        remindersCount: reminderSchedule.length,
      });
    } catch (error) {
      console.error("Failed to schedule payment reminders", {
        invoiceId: data.invoiceId,
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send payment reminder notification
   */
  private async sendPaymentReminderNotification(
    data: PaymentReminderScheduledEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "payment_reminder",
        title: "Nhắc nhở thanh toán",
        content: data.message,
        channels: this.getEnabledChannels(preferences, [
          "email",
          "sms",
          "in_app",
        ]),
        priority:
          data.reminderType === "final_notice" ||
          data.reminderType === "overdue"
            ? "high"
            : "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          invoiceId: data.invoiceId,
          reminderType: data.reminderType,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent payment reminder notification", {
        patientId: data.patientId,
        invoiceId: data.invoiceId,
        reminderType: data.reminderType,
      });
    } catch (error) {
      console.error("Failed to send payment reminder notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send overdue account notification
   */
  private async sendOverdueAccountNotification(
    data: PaymentReminderScheduledEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: "billing_department",
        recipientType: "department",
        type: "overdue_account",
        title: "Tài khoản quá hạn",
        content: `Tài khoản của bệnh nhân ${data.patientName} (Hóa đơn #${data.invoiceId}) đã quá hạn. Số tiền: ${data.amount.toLocaleString("vi-VN")} VNĐ.`,
        channels: ["in_app", "email"],
        priority: "high",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          invoiceId: data.invoiceId,
          reminderType: data.reminderType,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send overdue account notification", {
        invoiceId: data.invoiceId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send refund processed notification
   */
  private async sendRefundProcessedNotification(
    data: RefundProcessedEventData,
    preferences: any,
  ): Promise<void> {
    try {
      const processingTimeText = data.processingTime
        ? ` (thời gian xử lý: ${data.processingTime} ngày)`
        : "";

      const notificationData = {
        recipientId: data.patientId,
        recipientType: "patient",
        type: "refund_processed",
        title: "Hoàn tiền đã được xử lý",
        content: `Hoàn tiền ${data.refundAmount.toLocaleString("vi-VN")} VNĐ đã được xử lý qua ${data.refundMethod}. Lý do: ${data.refundReason}.${processingTimeText}`,
        channels: this.getEnabledChannels(preferences, ["email", "in_app"]),
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          refundId: data.refundId,
          refundAmount: data.refundAmount,
          refundMethod: data.refundMethod,
        },
      };

      await this.dispatchNotification(notificationData);
      console.log("Sent refund processed notification to patient", {
        patientId: data.patientId,
        refundId: data.refundId,
      });
    } catch (error) {
      console.error("Failed to send refund processed notification", {
        patientId: data.patientId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Send refund department notification
   */
  private async sendRefundDepartmentNotification(
    data: RefundProcessedEventData,
  ): Promise<void> {
    try {
      const notificationData = {
        recipientId: "billing_department",
        recipientType: "department",
        type: "refund_processed_department",
        title: "Hoàn tiền đã được xử lý",
        content: `Hoàn tiền ${data.refundAmount.toLocaleString("vi-VN")} VNĐ cho bệnh nhân ${data.patientName} đã được xử lý qua ${data.refundMethod}. Lý do: ${data.refundReason}.`,
        channels: ["in_app", "email"],
        priority: "normal",
        scheduledAt: new Date(),
        metadata: {
          patientId: data.patientId,
          refundId: data.refundId,
          refundAmount: data.refundAmount,
          refundMethod: data.refundMethod,
        },
      };

      await this.dispatchNotification(notificationData);
    } catch (error) {
      console.error("Failed to send refund department notification", {
        refundId: data.refundId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Helper methods
   */
  private getEnabledChannels(
    preferences: any,
    defaultChannels: string[],
  ): string[] {
    if (!preferences || !preferences.channels) {
      return defaultChannels;
    }

    return defaultChannels.filter(
      (channel) => preferences.channels[channel] !== false,
    );
  }

  private getReminderMessage(
    type: string,
    dueDate: Date,
    amount: number,
  ): string {
    const dueDateStr = this.formatDate(dueDate);
    const amountStr = amount.toLocaleString("vi-VN");

    const messages = {
      first_notice: `Nhắc nhở: Hóa đơn của bạn sẽ đến hạn vào ${dueDateStr}. Số tiền cần thanh toán: ${amountStr} VNĐ.`,
      second_notice: `Nhắc nhở quan trọng: Hóa đơn của bạn sẽ đến hạn vào ${dueDateStr}. Số tiền cần thanh toán: ${amountStr} VNĐ.`,
      final_notice: `CẢNH BÁO: Hóa đơn của bạn sẽ đến hạn vào ${dueDateStr}. Số tiền cần thanh toán: ${amountStr} VNĐ. Vui lòng thanh toán ngay để tránh phí trễ hạn.`,
    };

    return messages[type as keyof typeof messages] || messages["first_notice"];
  }

  private normalizeInvoiceData(
    data: InvoiceGeneratedEventData,
  ): InvoiceGeneratedEventData {
    const totalAmount =
      typeof data.totalAmount === "number"
        ? data.totalAmount
        : typeof (data as any).amount === "number"
          ? (data as any).amount
          : 0;

    const dueSource =
      data.dueDate ||
      (data as any).invoiceDate ||
      (data as any).issuedAt ||
      (data as any).generatedAt ||
      new Date();
    const dueDate = dueSource instanceof Date ? dueSource : new Date(dueSource);

    const patientResponsibility =
      typeof data.patientResponsibility === "number"
        ? data.patientResponsibility
        : Math.max(0, totalAmount - (data.insuranceCoverage ?? 0));

    return {
      ...data,
      totalAmount,
      patientResponsibility,
      dueDate,
    };
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  private async dispatchNotification(
    payload: SendNotificationCommand,
  ): Promise<void> {
    await this.sendNotificationUseCase.execute({
      ...payload,
      priority: normalizePriority(payload.priority),
    });
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = undefined;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = undefined;
      }

      this.isConnected = false;
      console.log("Billing event consumer disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting billing event consumer", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Check if consumer is connected
   */
  isConsumerConnected(): boolean {
    return this.isConnected;
  }
}
