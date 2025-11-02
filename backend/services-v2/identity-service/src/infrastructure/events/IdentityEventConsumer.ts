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

import * as amqp from 'amqplib';
import { ILogger } from '../../application/services/ILogger';
import { prometheusMetrics } from '../monitoring/PrometheusMetrics';
import { StaffCredentialEventHandler } from '../../application/event-handlers/StaffCredentialEventHandler';
import { BillingFraudEventHandler } from '../../application/event-handlers/BillingFraudEventHandler';
import { AppointmentAbuseEventHandler } from '../../application/event-handlers/AppointmentAbuseEventHandler';
import { ClinicalComplianceEventHandler } from '../../application/event-handlers/ClinicalComplianceEventHandler';
import { StaffLifecycleEventHandler } from '../../application/event-handlers/StaffLifecycleEventHandler';
import { NotificationEventHandler } from '../../application/event-handlers/NotificationEventHandler';
import { PatientLifecycleEventHandler } from '../../application/event-handlers/PatientLifecycleEventHandler';

export interface IdentityEventConsumerConfig {
  rabbitmqUrl: string;
  exchange: string;
  queueName: string;
  routingKeys: string[];
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
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
    private patientLifecycleHandler: PatientLifecycleEventHandler
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      this.logger.info('Connecting to RabbitMQ for Identity Service event consumption', {
        url: this.config.rabbitmqUrl.replace(/\/\/.*@/, '//***@'),
        exchange: this.config.exchange,
        queueName: this.config.queueName
      });

      // Create connection
      this.connection = await amqp.connect(this.config.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Set prefetch count for fair dispatch
      await this.channel.prefetch(this.config.prefetchCount || 1);

      // Assert exchange (should already exist)
      await this.channel.assertExchange(this.config.exchange, 'topic', {
        durable: true
      });

      // Assert Dead Letter Exchange
      await this.channel.assertExchange(`${this.config.exchange}.dlx`, 'topic', {
        durable: true
      });

      // Assert Dead Letter Queue
      await this.channel.assertQueue(`${this.config.queueName}.dlq`, {
        durable: true
      });

      // Bind DLQ to DLX
      await this.channel.bindQueue(
        `${this.config.queueName}.dlq`,
        `${this.config.exchange}.dlx`,
        '#'
      );

      // Assert main queue with DLX configuration
      await this.channel.assertQueue(this.config.queueName, {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
          'x-max-length': 10000,
          'x-dead-letter-exchange': `${this.config.exchange}.dlx`,
          'x-dead-letter-routing-key': 'dead-letter'
        }
      });

      // Bind queue to exchange with routing keys
      for (const routingKey of this.config.routingKeys) {
        await this.channel.bindQueue(
          this.config.queueName,
          this.config.exchange,
          routingKey
        );
        this.logger.info('Queue bound to routing key', {
          queue: this.config.queueName,
          exchange: this.config.exchange,
          routingKey
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
            this.logger.error('Error processing message', {
              error: error instanceof Error ? error.message : 'Unknown error',
              messageId: msg.properties.messageId,
              routingKey: msg.fields.routingKey
            });

            // Retry logic with exponential backoff
            const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) as number;
            const maxRetries = this.config.retryAttempts || 3;

            if (retryCount < maxRetries) {
              // Increment retry count
              const headers = msg.properties.headers || {};
              headers['x-retry-count'] = retryCount + 1;

              // Calculate exponential backoff delay
              const delay = Math.min(
                (this.config.retryDelayMs || 1000) * Math.pow(2, retryCount),
                30000 // Max 30 seconds
              );

              this.logger.info('Retrying message', {
                messageId: msg.properties.messageId,
                retryCount: retryCount + 1,
                maxRetries,
                delayMs: delay
              });

              // Requeue with delay
              setTimeout(() => {
                if (this.channel) {
                  this.channel.nack(msg, false, true);
                }
              }, delay);
            } else {
              // Send to dead letter queue
              this.logger.error('Max retries exceeded, sending to DLQ', {
                messageId: msg.properties.messageId,
                retryCount
              });
              this.channel!.nack(msg, false, false);
            }
          }
        },
        { noAck: false }
      );

      this.isConnected = true;
      this.logger.info('Successfully connected to RabbitMQ and started consuming events', {
        queueName: this.config.queueName,
        routingKeys: this.config.routingKeys
      });

      // Handle connection errors
      this.connection.on('error', (err: Error) => {
        this.logger.error('RabbitMQ connection error', { error: err.message });
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
        // Attempt reconnection after delay
        setTimeout(() => this.connect(), 5000);
      });

    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', {
        error: error instanceof Error ? error.message : 'Unknown error'
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

    this.logger.debug('Received event', {
      routingKey,
      messageId: msg.properties.messageId
    });

    try {
      const event = JSON.parse(content);
      const eventType = event.eventType || routingKey;
      const sourceService = this.extractSourceService(routingKey);

      // Record event consumption
      prometheusMetrics.recordEventConsumed(eventType, sourceService);

      // Route to appropriate handler based on routing key
      switch (routingKey) {
        // Provider Staff Service events
        case 'staff.credential_verified':
          await this.staffCredentialHandler.handleStaffCredentialVerified({
            eventId: event.eventId || msg.properties.messageId,
            staffId: event.payload?.staffId || event.aggregateId,
            credentialNumber: event.payload?.credentialNumber,
            credentialType: event.payload?.credentialType,
            issuingAuthority: event.payload?.issuingAuthority,
            verifiedAt: new Date(event.occurredAt || event.payload?.verifiedAt)
          });
          break;

        case 'staff.status_changed':
          await this.staffCredentialHandler.handleStaffStatusChanged({
            eventId: event.eventId || msg.properties.messageId,
            staffId: event.payload?.staffId || event.aggregateId,
            oldStatus: event.payload?.oldStatus,
            newStatus: event.payload?.newStatus,
            reason: event.payload?.reason,
            changedBy: event.payload?.changedBy || 'SYSTEM'
          });
          break;

        // PHASE 2: Staff credential events
        case 'staff.credential_expired':
          await this.staffCredentialHandler.handleStaffCredentialExpired({
            eventId: event.eventId || msg.properties.messageId,
            staffId: event.payload?.staffId || event.aggregateId,
            credentialNumber: event.payload?.credentialNumber,
            credentialType: event.payload?.credentialType,
            expirationDate: new Date(event.payload?.expirationDate),
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        case 'staff.license_revoked':
          await this.staffCredentialHandler.handleStaffLicenseRevoked({
            eventId: event.eventId || msg.properties.messageId,
            staffId: event.payload?.staffId || event.aggregateId,
            licenseNumber: event.payload?.licenseNumber,
            revocationReason: event.payload?.revocationReason,
            revokedBy: event.payload?.revokedBy,
            revocationDate: new Date(event.payload?.revocationDate),
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        // PHASE 2: Staff lifecycle events
        case 'staff.registered':
          await this.staffLifecycleHandler.handleStaffRegistered({
            eventId: event.eventId || msg.properties.messageId,
            staffId: event.payload?.staffId || event.aggregateId,
            userId: event.payload?.userId,
            staffType: event.payload?.staffType,
            licenseNumber: event.payload?.licenseNumber,
            employmentType: event.payload?.employmentType,
            hireDate: new Date(event.payload?.hireDate),
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        // PHASE 3: Staff performance events
        case 'staff.performance_flagged':
          await this.staffCredentialHandler.handleStaffPerformanceFlagged({
            eventId: event.eventId || msg.properties.messageId,
            staffId: event.payload?.staffId || event.aggregateId,
            flagReason: event.payload?.flagReason,
            severity: event.payload?.severity || 'MEDIUM',
            performanceMetrics: event.payload?.performanceMetrics,
            flaggedBy: event.payload?.flaggedBy,
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        // Billing Service events
        case 'payment.failed':
          await this.billingFraudHandler.handlePaymentFailed({
            eventId: event.eventId || msg.properties.messageId,
            invoiceId: event.payload?.invoiceId || event.aggregateId,
            patientId: event.payload?.patientId,
            amount: event.payload?.amount,
            failureReason: event.payload?.failureReason,
            attemptCount: event.payload?.attemptCount || 1,
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        case 'invoice.overdue':
          await this.billingFraudHandler.handleInvoiceOverdue({
            eventId: event.eventId || msg.properties.messageId,
            invoiceId: event.payload?.invoiceId || event.aggregateId,
            patientId: event.payload?.patientId,
            totalAmount: event.payload?.totalAmount,
            dueDate: new Date(event.payload?.dueDate),
            daysOverdue: event.payload?.daysOverdue,
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        case 'payment.processed':
          await this.billingFraudHandler.handlePaymentProcessed({
            eventId: event.eventId || msg.properties.messageId,
            invoiceId: event.payload?.invoiceId || event.aggregateId,
            patientId: event.payload?.patientId,
            amount: event.payload?.amount,
            paymentMethod: event.payload?.paymentMethod,
            transactionId: event.payload?.transactionId,
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        // PHASE 2: Billing dispute events
        case 'billing.dispute_filed':
          await this.billingFraudHandler.handleBillingDisputeFiled({
            eventId: event.eventId || msg.properties.messageId,
            disputeId: event.payload?.disputeId || event.aggregateId,
            invoiceId: event.payload?.invoiceId,
            patientId: event.payload?.patientId,
            disputeReason: event.payload?.disputeReason,
            disputeAmount: event.payload?.disputeAmount,
            filedAt: new Date(event.payload?.filedAt),
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        // PHASE 3: Billing refund and insurance events
        case 'payment.refunded':
          await this.billingFraudHandler.handlePaymentRefunded({
            eventId: event.eventId || msg.properties.messageId,
            refundId: event.payload?.refundId || event.aggregateId,
            invoiceId: event.payload?.invoiceId,
            patientId: event.payload?.patientId,
            refundAmount: event.payload?.refundAmount,
            refundReason: event.payload?.refundReason,
            originalPaymentId: event.payload?.originalPaymentId,
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        case 'insurance.claim_rejected':
          await this.billingFraudHandler.handleInsuranceClaimRejected({
            eventId: event.eventId || msg.properties.messageId,
            claimId: event.payload?.claimId || event.aggregateId,
            patientId: event.payload?.patientId,
            insuranceProvider: event.payload?.insuranceProvider,
            rejectionReason: event.payload?.rejectionReason,
            claimAmount: event.payload?.claimAmount,
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        // Appointments Service events
        case 'appointment.no_show':
          await this.appointmentAbuseHandler.handleAppointmentNoShow({
            eventId: event.eventId || msg.properties.messageId,
            appointmentId: event.payload?.appointmentId || event.aggregateId,
            patientId: event.payload?.patientId,
            doctorId: event.payload?.doctorId,
            scheduledDate: new Date(event.payload?.scheduledDate),
            noShowDetails: event.payload?.noShowDetails,
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        case 'appointment.cancelled':
          await this.appointmentAbuseHandler.handleAppointmentCancelled({
            eventId: event.eventId || msg.properties.messageId,
            appointmentId: event.payload?.appointmentId || event.aggregateId,
            patientId: event.payload?.patientId,
            cancelledBy: event.payload?.cancelledBy,
            cancellationType: event.payload?.cancellationType,
            reason: event.payload?.reason,
            hoursNotice: event.payload?.hoursNotice || 0,
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        // PHASE 3: Appointment reschedule and late arrival events
        case 'appointment.rescheduled':
          await this.appointmentAbuseHandler.handleAppointmentRescheduled({
            eventId: event.eventId || msg.properties.messageId,
            appointmentId: event.payload?.appointmentId || event.aggregateId,
            patientId: event.payload?.patientId,
            oldScheduledDate: new Date(event.payload?.oldScheduledDate),
            newScheduledDate: new Date(event.payload?.newScheduledDate),
            rescheduledBy: event.payload?.rescheduledBy,
            reason: event.payload?.reason,
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        case 'appointment.late_arrival':
          await this.appointmentAbuseHandler.handleAppointmentLateArrival({
            eventId: event.eventId || msg.properties.messageId,
            appointmentId: event.payload?.appointmentId || event.aggregateId,
            patientId: event.payload?.patientId,
            scheduledTime: new Date(event.payload?.scheduledTime),
            actualArrivalTime: new Date(event.payload?.actualArrivalTime),
            minutesLate: event.payload?.minutesLate,
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        // PHASE 2: Clinical compliance events
        case 'medical-record.flagged':
          await this.clinicalComplianceHandler.handleMedicalRecordFlagged({
            eventId: event.eventId || msg.properties.messageId,
            recordId: event.payload?.recordId || event.aggregateId,
            patientId: event.payload?.patientId,
            providerId: event.payload?.providerId,
            flagReason: event.payload?.flagReason,
            severity: event.payload?.severity || 'MEDIUM',
            suspiciousActivity: event.payload?.suspiciousActivity,
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        case 'prescription.abuse_detected':
          await this.clinicalComplianceHandler.handlePrescriptionAbuseDetected({
            eventId: event.eventId || msg.properties.messageId,
            prescriptionId: event.payload?.prescriptionId || event.aggregateId,
            patientId: event.payload?.patientId,
            providerId: event.payload?.providerId,
            drugName: event.payload?.drugName,
            drugClass: event.payload?.drugClass,
            abusePattern: event.payload?.abusePattern,
            severity: event.payload?.severity || 'CRITICAL',
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        // PHASE 3: Notification events
        case 'notification.delivery_failed':
          await this.notificationHandler.handleNotificationDeliveryFailed({
            eventId: event.eventId || msg.properties.messageId,
            notificationId: event.payload?.notificationId || event.aggregateId,
            userId: event.payload?.userId,
            channel: event.payload?.channel,
            failureReason: event.payload?.failureReason,
            attemptCount: event.payload?.attemptCount,
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        // PHASE 4: Staff metadata events
        case 'staff.department_changed':
          await this.staffCredentialHandler.handleStaffDepartmentChanged({
            eventId: event.eventId || msg.properties.messageId,
            staffId: event.payload?.staffId || event.aggregateId,
            userId: event.payload?.userId,
            oldDepartmentId: event.payload?.oldDepartmentId,
            newDepartmentId: event.payload?.newDepartmentId,
            oldDepartmentName: event.payload?.oldDepartmentName,
            newDepartmentName: event.payload?.newDepartmentName,
            effectiveDate: new Date(event.payload?.effectiveDate),
            changedBy: event.payload?.changedBy,
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        case 'staff.schedule_updated':
          await this.staffCredentialHandler.handleStaffScheduleUpdated({
            eventId: event.eventId || msg.properties.messageId,
            staffId: event.payload?.staffId || event.aggregateId,
            userId: event.payload?.userId,
            scheduleType: event.payload?.scheduleType,
            workingDays: event.payload?.workingDays || [],
            workingHours: event.payload?.workingHours || { start: '08:00', end: '17:00' },
            isAvailable: event.payload?.isAvailable !== false,
            updatedBy: event.payload?.updatedBy,
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        // PHASE 4: Appointment completion events
        case 'appointment.completed':
          await this.appointmentAbuseHandler.handleAppointmentCompleted({
            eventId: event.eventId || msg.properties.messageId,
            appointmentId: event.payload?.appointmentId || event.aggregateId,
            patientId: event.payload?.patientId,
            doctorId: event.payload?.doctorId,
            completedAt: new Date(event.payload?.completedAt),
            wasOnTime: event.payload?.wasOnTime !== false,
            hadNoIssues: event.payload?.hadNoIssues !== false,
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        // PHASE 4: Patient lifecycle events
        case 'patient.deceased':
          await this.patientLifecycleHandler.handlePatientDeceased({
            eventId: event.eventId || msg.properties.messageId,
            patientId: event.payload?.patientId || event.aggregateId,
            userId: event.payload?.userId,
            dateOfDeath: new Date(event.payload?.dateOfDeath),
            deathCertificateNumber: event.payload?.deathCertificateNumber,
            reportedBy: event.payload?.reportedBy,
            occurredAt: new Date(event.occurredAt || event.payload?.occurredAt)
          });
          break;

        default:
          this.logger.warn('Unknown routing key', {
            routingKey,
            eventType: event.eventType
          });
      }

      // Record successful event processing
      const duration = Date.now() - startTime;
      const durationSeconds = duration / 1000;
      prometheusMetrics.recordEventProcessingDuration(eventType, 'success', durationSeconds);

    } catch (error) {
      // Record failed event processing
      const duration = Date.now() - startTime;
      const durationSeconds = duration / 1000;
      const event = JSON.parse(content);
      const eventType = event.eventType || routingKey;
      const errorType = error instanceof Error ? error.constructor.name : 'UnknownError';

      prometheusMetrics.recordEventProcessingDuration(eventType, 'failed', durationSeconds);
      prometheusMetrics.recordEventFailed(eventType, errorType);

      this.logger.error('Error parsing or handling message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        routingKey,
        messageId: msg.properties.messageId,
        duration: `${duration}ms`
      });
      throw error;
    }
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
      this.logger.info('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', {
        error: error instanceof Error ? error.message : 'Unknown error'
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
    const prefix = routingKey.split('.')[0];
    
    const serviceMap: Record<string, string> = {
      'staff': 'provider-staff-service',
      'provider': 'provider-staff-service',
      'payment': 'billing-service',
      'invoice': 'billing-service',
      'billing': 'billing-service',
      'insurance': 'billing-service',
      'appointment': 'appointments-service',
      'clinical': 'clinical-emr-service',
      'medical-record': 'clinical-emr-service',
      'prescription': 'clinical-emr-service',
      'notification': 'notifications-service',
      'patient': 'patient-registry-service'
    };

    return serviceMap[prefix] || 'unknown-service';
  }
}
