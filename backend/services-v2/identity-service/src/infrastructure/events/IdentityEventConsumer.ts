/**
 * IdentityEventConsumer - RabbitMQ Event Consumer for Identity Service
 *
 * Subscribes to events from other services:
 * - Provider Staff Service: staff.*, provider.*
 * - Billing Service: payment.*, invoice.*, billing.*, insurance.*
 * - Appointments Service: appointment.*
 * - Clinical EMR Service: medical-record.*, prescription.*
 * - Notifications Service: notification.*
 * - Patient Registry Service: patient.*
 *
 * @author Hospital Management Team
 * @version 2.0.0 (PHASE 4 - FINAL: Added 4 new routing keys)
 * @compliance Event-Driven Architecture, Retry Logic, DLQ
 */

import * as amqp from "amqplib";
import { ILogger } from "../../application/services/ILogger";
import { prometheusMetrics } from "../monitoring/PrometheusMetrics";
import { StaffCredentialEventHandler } from "./handlers/StaffCredentialEventHandler";
import { BillingFraudEventHandler } from "./handlers/BillingFraudEventHandler";
import { AppointmentAbuseEventHandler } from "./handlers/AppointmentAbuseEventHandler";
import { ClinicalComplianceEventHandler } from "./handlers/ClinicalComplianceEventHandler";
import { StaffLifecycleEventHandler } from "./handlers/StaffLifecycleEventHandler";
import { NotificationEventHandler } from "./handlers/NotificationEventHandler";
import { PatientLifecycleEventHandler } from "./handlers/PatientLifecycleEventHandler";

export interface IdentityEventConsumerConfig {
  rabbitmqUrl: string;
  exchange: string;
  queueName: string;
  routingKeys: string[];
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

interface ParsedIdentityEvent {
  eventId?: string;
  eventType: string;
  aggregateId?: string;
  occurredAt?: string;
  payload: Record<string, unknown>;
  raw: unknown;
}

/**
 * IdentityEventConsumer - Consumes events from other services
 */
export class IdentityEventConsumer {
  private connection: any;
  private channel: any;
  private isConnected: boolean = false;

  constructor(
    private config: IdentityEventConsumerConfig,
    private logger: ILogger,
    private staffCredentialHandler: StaffCredentialEventHandler,
    private billingFraudHandler: BillingFraudEventHandler,
    private appointmentAbuseHandler: AppointmentAbuseEventHandler,
    private clinicalComplianceHandler: ClinicalComplianceEventHandler,
    private staffLifecycleHandler: StaffLifecycleEventHandler,
    private notificationHandler: NotificationEventHandler,
    private patientLifecycleHandler: PatientLifecycleEventHandler,
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      this.logger.info(
        "Connecting to RabbitMQ for Identity Service event consumption",
        {
          url: this.config.rabbitmqUrl.replace(/\/\/.*@/, "//***@"),
          exchange: this.config.exchange,
          queueName: this.config.queueName,
        },
      );

      // Create connection
      this.connection = await amqp.connect(this.config.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Set prefetch count for fair dispatch
      await this.channel.prefetch(this.config.prefetchCount || 1);

      // Assert exchange (should already exist)
      await this.channel.assertExchange(this.config.exchange, "topic", {
        durable: true,
      });

      // Assert Dead Letter Exchange
      await this.channel.assertExchange(
        `${this.config.exchange}.dlx`,
        "topic",
        {
          durable: true,
        },
      );

      // Assert Dead Letter Queue
      await this.channel.assertQueue(`${this.config.queueName}.dlq`, {
        durable: true,
      });

      // Bind DLQ to DLX
      await this.channel.bindQueue(
        `${this.config.queueName}.dlq`,
        `${this.config.exchange}.dlx`,
        "#",
      );

      // Assert main queue with DLX configuration
      await this.channel.assertQueue(this.config.queueName, {
        durable: true,
        arguments: {
          "x-message-ttl": 86400000, // 24 hours
          "x-max-length": 10000,
          "x-dead-letter-exchange": `${this.config.exchange}.dlx`,
          "x-dead-letter-routing-key": "dead-letter",
        },
      });

      // Bind queue to exchange with routing keys
      for (const routingKey of this.config.routingKeys) {
        await this.channel.bindQueue(
          this.config.queueName,
          this.config.exchange,
          routingKey,
        );
        this.logger.info("Queue bound to routing key", {
          queue: this.config.queueName,
          exchange: this.config.exchange,
          routingKey,
        });
      }

      // Start consuming
      await this.channel.consume(
        this.config.queueName,
        async (msg: any) => {
          if (!msg) return;

          try {
            await this.handleMessage(msg);
            this.channel!.ack(msg);
          } catch (error) {
            this.logger.error("Error processing message", {
              error: error instanceof Error ? error.message : "Unknown error",
              messageId: msg.properties.messageId,
              routingKey: msg.fields.routingKey,
            });

            // Retry logic with exponential backoff
            const retryCount = (msg.properties.headers?.["x-retry-count"] ||
              0) as number;
            const maxRetries = this.config.retryAttempts || 3;

            if (retryCount < maxRetries) {
              // Increment retry count
              const headers = msg.properties.headers || {};
              headers["x-retry-count"] = retryCount + 1;

              // Calculate exponential backoff delay
              const delay = Math.min(
                (this.config.retryDelayMs || 1000) * Math.pow(2, retryCount),
                30000, // Max 30 seconds
              );

              this.logger.info("Retrying message", {
                messageId: msg.properties.messageId,
                retryCount: retryCount + 1,
                maxRetries,
                delayMs: delay,
              });

              // Requeue with delay
              setTimeout(() => {
                if (this.channel) {
                  this.channel.nack(msg, false, true);
                }
              }, delay);
            } else {
              // Send to dead letter queue
              this.logger.error("Max retries exceeded, sending to DLQ", {
                messageId: msg.properties.messageId,
                retryCount,
              });
              this.channel!.nack(msg, false, false);
            }
          }
        },
        { noAck: false },
      );

      this.isConnected = true;
      this.logger.info(
        "Successfully connected to RabbitMQ and started consuming events",
        {
          queueName: this.config.queueName,
          routingKeys: this.config.routingKeys,
        },
      );

      // Handle connection errors
      this.connection.on("error", (err: Error) => {
        this.logger.error("RabbitMQ connection error", { error: err.message });
        this.isConnected = false;
      });

      this.connection.on("close", () => {
        this.logger.warn("RabbitMQ connection closed");
        this.isConnected = false;
        // Attempt reconnection after delay
        setTimeout(() => this.connect(), 5000);
      });
    } catch (error) {
      this.logger.error("Failed to connect to RabbitMQ", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(msg: amqp.ConsumeMessage): Promise<void> {
    const content = msg.content.toString();
    const routingKey = msg.fields.routingKey;
    const startTime = Date.now();

    this.logger.debug("Received event", {
      routingKey,
      messageId: msg.properties.messageId,
    });

    let parsedEvent: ParsedIdentityEvent | null = null;

    try {
      parsedEvent = this.parseEventMessage(content, routingKey);
      const eventType = parsedEvent.eventType;
      const sourceService = this.extractSourceService(routingKey);
      const payload = parsedEvent.payload as Record<string, any>;

      // Record event consumption
      prometheusMetrics.recordEventConsumed(eventType, sourceService);

      // Route to appropriate handler based on routing key
      switch (routingKey) {
        // Provider Staff Service events
        case "staff.credential_verified":
          await this.staffCredentialHandler.handleStaffCredentialVerified({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            staffId: payload?.staffId || parsedEvent?.aggregateId,
            credentialNumber: payload?.credentialNumber,
            credentialType: payload?.credentialType,
            issuingAuthority: payload?.issuingAuthority,
            verifiedAt: new Date(
              parsedEvent?.occurredAt || payload?.verifiedAt,
            ),
          });
          break;

        case "staff.status_changed":
          await this.staffCredentialHandler.handleStaffStatusChanged({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            staffId: payload?.staffId || parsedEvent?.aggregateId,
            oldStatus: payload?.oldStatus,
            newStatus: payload?.newStatus,
            reason: payload?.reason,
            changedBy: payload?.changedBy || "SYSTEM",
          });
          break;

        // PHASE 2: Staff credential events
        case "staff.credential_expired":
          await this.staffCredentialHandler.handleStaffCredentialExpired({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            staffId: payload?.staffId || parsedEvent?.aggregateId,
            credentialNumber: payload?.credentialNumber,
            credentialType: payload?.credentialType,
            expirationDate: new Date(payload?.expirationDate),
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        case "staff.license_revoked":
          await this.staffCredentialHandler.handleStaffLicenseRevoked({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            staffId: payload?.staffId || parsedEvent?.aggregateId,
            licenseNumber: payload?.licenseNumber,
            revocationReason: payload?.revocationReason,
            revokedBy: payload?.revokedBy,
            revocationDate: new Date(payload?.revocationDate),
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        // PHASE 2: Staff lifecycle events
        case "staff.registered":
          await this.staffLifecycleHandler.handleStaffRegistered({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            staffId: payload?.staffId || parsedEvent?.aggregateId,
            userId: payload?.userId,
            staffType: payload?.staffType,
            licenseNumber: payload?.licenseNumber,
            employmentType: payload?.employmentType,
            hireDate: new Date(payload?.hireDate),
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        // PHASE 3: Staff performance events
        case "staff.performance_flagged":
          await this.staffCredentialHandler.handleStaffPerformanceFlagged({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            staffId: payload?.staffId || parsedEvent?.aggregateId,
            flagReason: payload?.flagReason,
            severity: payload?.severity || "MEDIUM",
            performanceMetrics: payload?.performanceMetrics,
            flaggedBy: payload?.flaggedBy,
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        // Billing Service events
        case "payment.failed":
          await this.billingFraudHandler.handlePaymentFailed({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            invoiceId: payload?.invoiceId || parsedEvent?.aggregateId,
            patientId: payload?.patientId,
            amount: payload?.amount,
            failureReason: payload?.failureReason,
            attemptCount: payload?.attemptCount || 1,
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        case "invoice.overdue":
          await this.billingFraudHandler.handleInvoiceOverdue({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            invoiceId: payload?.invoiceId || parsedEvent?.aggregateId,
            patientId: payload?.patientId,
            totalAmount: payload?.totalAmount,
            dueDate: new Date(payload?.dueDate),
            daysOverdue: payload?.daysOverdue,
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        case "payment.processed":
          await this.billingFraudHandler.handlePaymentProcessed({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            invoiceId: payload?.invoiceId || parsedEvent?.aggregateId,
            patientId: payload?.patientId,
            amount: payload?.amount,
            paymentMethod: payload?.paymentMethod,
            transactionId: payload?.transactionId,
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        // PHASE 2: Billing dispute events
        case "billing.dispute_filed":
          await this.billingFraudHandler.handleBillingDisputeFiled({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            disputeId: payload?.disputeId || parsedEvent?.aggregateId,
            invoiceId: payload?.invoiceId,
            patientId: payload?.patientId,
            disputeReason: payload?.disputeReason,
            disputeAmount: payload?.disputeAmount,
            filedAt: new Date(payload?.filedAt),
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        // PHASE 3: Billing refund and insurance events
        case "payment.refunded":
          await this.billingFraudHandler.handlePaymentRefunded({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            refundId: payload?.refundId || parsedEvent?.aggregateId,
            invoiceId: payload?.invoiceId,
            patientId: payload?.patientId,
            refundAmount: payload?.refundAmount,
            refundReason: payload?.refundReason,
            originalPaymentId: payload?.originalPaymentId,
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        case "insurance.claim_rejected":
          await this.billingFraudHandler.handleInsuranceClaimRejected({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            claimId: payload?.claimId || parsedEvent?.aggregateId,
            patientId: payload?.patientId,
            insuranceProvider: payload?.insuranceProvider,
            rejectionReason: payload?.rejectionReason,
            claimAmount: payload?.claimAmount,
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        // Appointments Service events
        case "appointment.no_show":
          await this.appointmentAbuseHandler.handleAppointmentNoShow({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            appointmentId: payload?.appointmentId || parsedEvent?.aggregateId,
            patientId: payload?.patientId,
            doctorId: payload?.doctorId,
            scheduledDate: new Date(payload?.scheduledDate),
            noShowDetails: payload?.noShowDetails,
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        case "appointment.cancelled":
          await this.appointmentAbuseHandler.handleAppointmentCancelled({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            appointmentId: payload?.appointmentId || parsedEvent?.aggregateId,
            patientId: payload?.patientId,
            cancelledBy: payload?.cancelledBy,
            cancellationType: payload?.cancellationType,
            reason: payload?.reason,
            hoursNotice: payload?.hoursNotice || 0,
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        // PHASE 3: Appointment reschedule and late arrival events
        case "appointment.rescheduled":
          await this.appointmentAbuseHandler.handleAppointmentRescheduled({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            appointmentId: payload?.appointmentId || parsedEvent?.aggregateId,
            patientId: payload?.patientId,
            oldScheduledDate: new Date(payload?.oldScheduledDate),
            newScheduledDate: new Date(payload?.newScheduledDate),
            rescheduledBy: payload?.rescheduledBy,
            reason: payload?.reason,
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        case "appointment.late_arrival":
          await this.appointmentAbuseHandler.handleAppointmentLateArrival({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            appointmentId: payload?.appointmentId || parsedEvent?.aggregateId,
            patientId: payload?.patientId,
            scheduledTime: new Date(payload?.scheduledTime),
            actualArrivalTime: new Date(payload?.actualArrivalTime),
            minutesLate: payload?.minutesLate,
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        // PHASE 2: Clinical compliance events
        case "medical-record.flagged":
          await this.clinicalComplianceHandler.handleMedicalRecordFlagged({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            recordId: payload?.recordId || parsedEvent?.aggregateId,
            patientId: payload?.patientId,
            providerId: payload?.providerId,
            flagReason: payload?.flagReason,
            severity: payload?.severity || "MEDIUM",
            suspiciousActivity: payload?.suspiciousActivity,
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        case "prescription.abuse_detected":
          await this.clinicalComplianceHandler.handlePrescriptionAbuseDetected({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            prescriptionId: payload?.prescriptionId || parsedEvent?.aggregateId,
            patientId: payload?.patientId,
            providerId: payload?.providerId,
            drugName: payload?.drugName,
            drugClass: payload?.drugClass,
            abusePattern: payload?.abusePattern,
            severity: payload?.severity || "CRITICAL",
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        // PHASE 3: Notification events
        case "notification.delivery_failed":
          await this.notificationHandler.handleNotificationDeliveryFailed({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            notificationId: payload?.notificationId || parsedEvent?.aggregateId,
            userId: payload?.userId,
            channel: payload?.channel,
            failureReason: payload?.failureReason,
            attemptCount: payload?.attemptCount,
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        // PHASE 4: Staff metadata events
        case "staff.department_changed":
          await this.staffCredentialHandler.handleStaffDepartmentChanged({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            staffId: payload?.staffId || parsedEvent?.aggregateId,
            userId: payload?.userId,
            oldDepartmentId: payload?.oldDepartmentId,
            newDepartmentId: payload?.newDepartmentId,
            oldDepartmentName: payload?.oldDepartmentName,
            newDepartmentName: payload?.newDepartmentName,
            effectiveDate: new Date(payload?.effectiveDate),
            changedBy: payload?.changedBy,
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        case "staff.schedule_updated":
          await this.staffCredentialHandler.handleStaffScheduleUpdated({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            staffId: payload?.staffId || parsedEvent?.aggregateId,
            userId: payload?.userId,
            scheduleType: payload?.scheduleType,
            workingDays: payload?.workingDays || [],
            workingHours: payload?.workingHours || {
              start: "08:00",
              end: "17:00",
            },
            isAvailable: payload?.isAvailable !== false,
            updatedBy: payload?.updatedBy,
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        // PHASE 4: Appointment completion events
        case "appointment.completed":
          await this.appointmentAbuseHandler.handleAppointmentCompleted({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            appointmentId: payload?.appointmentId || parsedEvent?.aggregateId,
            patientId: payload?.patientId,
            doctorId: payload?.doctorId,
            completedAt: new Date(payload?.completedAt),
            wasOnTime: payload?.wasOnTime !== false,
            hadNoIssues: payload?.hadNoIssues !== false,
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        // PHASE 4: Patient lifecycle events
        case "patient.deceased":
          await this.patientLifecycleHandler.handlePatientDeceased({
            eventId: parsedEvent?.eventId || msg.properties.messageId,
            patientId: payload?.patientId || parsedEvent?.aggregateId,
            userId: payload?.userId,
            dateOfDeath: new Date(payload?.dateOfDeath),
            deathCertificateNumber: payload?.deathCertificateNumber,
            reportedBy: payload?.reportedBy,
            occurredAt: new Date(
              parsedEvent?.occurredAt || payload?.occurredAt,
            ),
          });
          break;

        default:
          this.logger.warn("Unknown routing key", {
            routingKey,
            eventType,
          });
      }

      // Record successful event processing
      const duration = Date.now() - startTime;
      const durationSeconds = duration / 1000;
      prometheusMetrics.recordEventProcessingDuration(
        eventType,
        "success",
        durationSeconds,
      );
    } catch (error) {
      // Record failed event processing
      const duration = Date.now() - startTime;
      const durationSeconds = duration / 1000;
      const eventType = parsedEvent?.eventType || routingKey;
      const errorType =
        error instanceof Error ? error.constructor.name : "UnknownError";

      prometheusMetrics.recordEventProcessingDuration(
        eventType,
        "failed",
        durationSeconds,
      );
      prometheusMetrics.recordEventFailed(eventType, errorType);

      this.logger.error("Error parsing or handling message", {
        error: error instanceof Error ? error.message : "Unknown error",
        routingKey,
        messageId: msg.properties.messageId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  private parseEventMessage(
    content: string,
    routingKey: string,
  ): ParsedIdentityEvent {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Unable to parse JSON payload: ${message}`);
    }

    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("Event payload must be a JSON object");
    }

    const eventObject = parsed as Record<string, unknown>;
    const payloadCandidate = eventObject.payload;
    const payload =
      typeof payloadCandidate === "object" && payloadCandidate !== null
        ? (payloadCandidate as Record<string, unknown>)
        : {};

    const eventType =
      typeof eventObject.eventType === "string" &&
      eventObject.eventType.trim().length > 0
        ? (eventObject.eventType as string)
        : routingKey;

    return {
      eventId:
        typeof eventObject.eventId === "string"
          ? (eventObject.eventId as string)
          : undefined,
      eventType,
      aggregateId:
        typeof eventObject.aggregateId === "string"
          ? (eventObject.aggregateId as string)
          : undefined,
      occurredAt:
        typeof eventObject.occurredAt === "string"
          ? (eventObject.occurredAt as string)
          : undefined,
      payload,
      raw: parsed,
    };
  }

  /**
   * Disconnect from RabbitMQ
   */
  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      this.isConnected = false;
      this.logger.info("Disconnected from RabbitMQ");
    } catch (error) {
      this.logger.error("Error disconnecting from RabbitMQ", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  /**
   * Check if connected
   */
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Extract source service from routing key
   * Examples:
   * - staff.credential_verified → provider-staff-service
   * - payment.failed → billing-service
   * - appointment.no_show → appointments-service
   */
  private extractSourceService(routingKey: string): string {
    const prefix = routingKey.split(".")[0];

    const serviceMap: Record<string, string> = {
      staff: "provider-staff-service",
      provider: "provider-staff-service",
      payment: "billing-service",
      invoice: "billing-service",
      billing: "billing-service",
      insurance: "billing-service",
      appointment: "appointments-service",
      clinical: "clinical-emr-service",
      "medical-record": "clinical-emr-service",
      prescription: "clinical-emr-service",
      notification: "notifications-service",
      patient: "patient-registry-service",
    };

    return serviceMap[prefix] || "unknown-service";
  }
}
