/**
 * Billing Event Consumer - Infrastructure Layer
 * 
 * DOMAIN-AGNOSTIC PRINCIPLE:
 * - ONLY consumes scheduling REQUEST events (suffix: .scheduled)
 * - DOES NOT consume domain events (.generated, .processed, .created, etc.)
 * - Billing Service MUST decide scheduling logic and publish .scheduled events
 * 
 * CORRECT Pattern:
 *   Billing Service → billing.payment.reminder.scheduled → Scheduler creates schedule
 * 
 * WRONG Pattern (REMOVED):
 *   Billing Service → billing.invoice.generated → Scheduler decides to create reminders
 * 
 * @author Hospital Management Team
 * @version 2.1.0 - Refactored to enforce domain-agnostic principle
 * @compliance Clean Architecture, Event-Driven Architecture, Domain-Agnostic Infrastructure
 */

import { ConsumeMessage } from 'amqplib';
import { Logger } from '../observability/Logger';
import { CreateScheduleUseCase } from '../../application/use-cases/CreateScheduleUseCase';
import { UpdateScheduleUseCase } from '../../application/use-cases/UpdateScheduleUseCase';
import { CancelScheduleUseCase } from '../../application/use-cases/CancelScheduleUseCase';
import { SupabaseScheduleRepository } from '../persistence/SupabaseScheduleRepository';
import { TenantId } from '../../domain/value-objects/TenantId';

export interface BillingEventConsumerConfig {
  rabbitmqUrl: string;
  queueName: string;
  exchangeName: string;
  routingKeys: string[];
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export interface BillingInvoiceGeneratedEventData {
  invoiceId: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  totalAmount: number;
  currency: string;
  dueDate: Date;
  generatedAt: Date;
  generatedBy: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  departmentId?: string;
  departmentName?: string;
}

export interface BillingPaymentProcessedEventData {
  paymentId: string;
  invoiceId: string;
  patientId: string;
  patientName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'completed' | 'pending' | 'failed' | 'refunded';
  processedAt: Date;
  processedBy: string;
  transactionId?: string;
}

export interface BillingInsuranceClaimProcessedEventData {
  claimId: string;
  invoiceId: string;
  patientId: string;
  patientName: string;
  insuranceProvider: string;
  claimAmount: number;
  approvedAmount?: number;
  claimStatus: 'submitted' | 'approved' | 'rejected' | 'pending';
  processedAt: Date;
  processedBy: string;
  rejectionReason?: string;
}

export interface BillingReportRequestedEventData {
  reportId: string;
  reportType: 'revenue' | 'expenses' | 'claims' | 'payments' | 'aging' | 'custom';
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
  requestedBy: string;
  requestedAt: Date;
  parameters?: {
    departmentId?: string;
    providerId?: string;
    insuranceProvider?: string;
    format?: 'pdf' | 'excel' | 'csv';
    includeDetails?: boolean;
  };
  recipients: string[];
}

export interface BillingPaymentReminderScheduledEventData {
  invoiceId: string;
  patientId: string;
  patientName: string;
  invoiceNumber: string;
  totalAmount: number;
  dueDate: Date;
  reminderDate: Date;
  reminderType: 'before-due' | 'on-due' | 'after-due';
  daysBeforeDue: number;
  scheduledAt: Date;
  scheduledBy: string;
}

/**
 * BillingEventConsumer - Handles billing events for financial automation
 */
export class BillingEventConsumer {
  private connection?: any;
  private channel?: any;
  private isConnected = false;
  private logger: Logger;

  constructor(
    private config: BillingEventConsumerConfig,
    private scheduleRepository: SupabaseScheduleRepository,
    private createScheduleUseCase: CreateScheduleUseCase,
    private updateScheduleUseCase: UpdateScheduleUseCase,
    private cancelScheduleUseCase: CancelScheduleUseCase,
  ) {
    this.logger = Logger.getInstance();
  }

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      this.logger.info('Connecting to RabbitMQ for Billing events', {
        queueName: this.config.queueName,
      });

      const amqp = require('amqplib');
      this.connection = await amqp.connect(this.config.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      if (!this.channel) {
        throw new Error('Failed to create RabbitMQ channel');
      }

      // Assert exchange
      await this.channel.assertExchange(this.config.exchangeName, 'topic', {
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
        this.logger.info('Queue bound to routing key', {
          queueName: this.config.queueName,
          routingKey,
        });
      }

      // Start consuming
      await this.channel.consume(
        this.config.queueName,
        this.handleMessage.bind(this),
        { noAck: false },
      );

      this.isConnected = true;
      this.logger.info('Billing event consumer connected successfully');

      // Handle connection errors
      this.connection.on('error', (error: Error) => {
        this.logger.error('RabbitMQ connection error', error);
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error instanceof Error ? error : undefined);
      throw error;
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

      this.logger.debug('Received billing event', {
        routingKey,
        eventId: event.eventId,
      });

      // Route to appropriate handler
      // ONLY handle scheduling request events (suffix: .scheduled)
      switch (routingKey) {
        case 'billing.payment.reminder.scheduled':
          await this.handleBillingPaymentReminderScheduled(event.payload as BillingPaymentReminderScheduledEventData);
          break;

        default:
          this.logger.warn('Unhandled routing key - Scheduler Service only consumes .scheduled events', { routingKey });
          break;
      }

      // Acknowledge message
      this.channel.ack(msg);

    } catch (error) {
      this.logger.error('Error processing billing event', error instanceof Error ? error : undefined, {
        routingKey: msg.fields.routingKey,
      });

      // Negative acknowledge (requeue)
      if (this.channel) {
        this.channel.nack(msg, false, true);
      }
    }
  }

  /**
   * Handle billing invoice generated event
   */
  private async handleBillingInvoiceGenerated(data: BillingInvoiceGeneratedEventData): Promise<void> {
    this.logger.info('Processing billing invoice generation', {
      invoiceId: data.invoiceId,
      patientId: data.patientId,
      totalAmount: data.totalAmount,
      dueDate: data.dueDate,
    });

    try {
      // Schedule payment reminders for the invoice
      const reminderScheduleId = `invoice-reminder-${data.invoiceId}`;
      
      // Calculate reminder dates (3 days before, 1 day before, and due date)
      const threeDaysBefore = new Date(data.dueDate.getTime() - (3 * 24 * 60 * 60 * 1000));
      const oneDayBefore = new Date(data.dueDate.getTime() - (1 * 24 * 60 * 60 * 1000));
      
      // Create multiple reminder schedules
      const reminderDates = [
        { date: threeDaysBefore, type: 'advance_reminder' },
        { date: oneDayBefore, type: 'urgent_reminder' },
        { date: data.dueDate, type: 'due_date_reminder' }
      ];

      for (const reminder of reminderDates) {
        if (reminder.date > new Date()) { // Only schedule future reminders
          const scheduleId = `${reminderScheduleId}-${reminder.type}`;
          
          await this.createScheduleUseCase.execute({
            tenantId: 'hospital-1',
            ownerService: 'billing-service',
            ownerResourceType: 'invoice',
            ownerResourceId: data.invoiceId,
            policyTag: `payment-reminder-${reminder.type}`,
            scheduleType: 'ONCE',
            timezone: 'Asia/Ho_Chi_Minh',
            startAtUtc: reminder.date.toISOString(),
        topicOrCommand: 'billing.invoice.reminder',
            payloadJson: {
            invoiceId: data.invoiceId,
            patientId: data.patientId,
            patientName: data.patientName,
            totalAmount: data.totalAmount,
            currency: data.currency,
            dueDate: data.dueDate.toISOString(),
            reminderType: reminder.type,
            generatedBy: data.generatedBy,
            departmentId: data.departmentId,
            departmentName: data.departmentName,
              eventType: 'invoice_payment_reminder',
              invoiceGeneratedAt: data.generatedAt.toISOString(),
            },
            dedupKey: `invoice:${data.invoiceId}:reminder:${reminder.type}`,
          });

          this.logger.info('Created invoice payment reminder', {
            invoiceId: data.invoiceId,
            scheduleId,
            reminderType: reminder.type,
            reminderDate: reminder.date,
          });
        }
      }

      // Schedule overdue follow-up if payment is not received by due date + 7 days
      const overdueDate = new Date(data.dueDate.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      await this.createScheduleUseCase.execute({
        tenantId: 'hospital-1',
        ownerService: 'billing-service',
        ownerResourceType: 'invoice',
        ownerResourceId: data.invoiceId,
        policyTag: 'overdue-followup',
        scheduleType: 'ONCE',
        timezone: 'Asia/Ho_Chi_Minh',
        startAtUtc: overdueDate.toISOString(),
        topicOrCommand: 'billing.invoice.overdue',
        payloadJson: {
          invoiceId: data.invoiceId,
          patientId: data.patientId,
          patientName: data.patientName,
          totalAmount: data.totalAmount,
          currency: data.currency,
          dueDate: data.dueDate.toISOString(),
          overdueDate: overdueDate.toISOString(),
          generatedBy: data.generatedBy,
          eventType: 'invoice_overdue_followup',
          overdueDays: 7,
          invoiceGeneratedAt: data.generatedAt.toISOString(),
        },
        dedupKey: `invoice:${data.invoiceId}:overdue`,
      });

      this.logger.info('Created invoice overdue follow-up', {
        invoiceId: data.invoiceId,
        overdueDate: overdueDate,
      });

    } catch (error) {
      this.logger.error('Failed to process billing invoice generation', error instanceof Error ? error : undefined, {
        invoiceId: data.invoiceId,
      });
      throw error;
    }
  }

  /**
   * Handle billing payment processed event
   */
  private async handleBillingPaymentProcessed(data: BillingPaymentProcessedEventData): Promise<void> {
    this.logger.info('Processing billing payment processing', {
      paymentId: data.paymentId,
      invoiceId: data.invoiceId,
      amount: data.amount,
      paymentStatus: data.paymentStatus,
    });

    try {
      // If payment is completed, cancel all reminder schedules for this invoice
      if (data.paymentStatus === 'completed' || data.paymentStatus === 'refunded') {
        const tenantId = TenantId.create('hospital-1');
        
        // Cancel payment reminder schedules
        await this.cancelScheduleUseCase.execute({
          tenantId: 'hospital-1',
          ownerService: 'billing-service',
          ownerResourceType: 'invoice',
          ownerResourceId: data.invoiceId,
          policyTag: 'payment-reminder',
          reason: `Payment ${data.paymentStatus}`,
        });

        // Cancel overdue follow-up
        await this.cancelScheduleUseCase.execute({
          tenantId: 'hospital-1',
          ownerService: 'billing-service',
          ownerResourceType: 'invoice',
          ownerResourceId: data.invoiceId,
          policyTag: 'overdue-followup',
          reason: `Payment ${data.paymentStatus}`,
        });

        this.logger.info('Cancelled invoice schedules', {
          invoiceId: data.invoiceId,
          paymentStatus: data.paymentStatus,
        });

        // Schedule payment confirmation receipt
        const receiptTime = new Date(data.processedAt.getTime() + (5 * 60 * 1000)); // 5 minutes after payment
        
        await this.createScheduleUseCase.execute({
          tenantId: 'hospital-1',
          ownerService: 'billing-service',
          ownerResourceType: 'payment',
          ownerResourceId: data.paymentId,
          policyTag: 'receipt-generation',
          scheduleType: 'ONCE',
          timezone: 'Asia/Ho_Chi_Minh',
          startAtUtc: receiptTime.toISOString(),
          topicOrCommand: 'billing.payment.receipt',
          payloadJson: {
            paymentId: data.paymentId,
            invoiceId: data.invoiceId,
            patientId: data.patientId,
            patientName: data.patientName,
            amount: data.amount,
            currency: data.currency,
            paymentMethod: data.paymentMethod,
            processedAt: data.processedAt.toISOString(),
            processedBy: data.processedBy,
            transactionId: data.transactionId,
            eventType: 'payment_receipt_generation',
            paymentStatus: data.paymentStatus,
          },
          dedupKey: `payment:${data.paymentId}:receipt`,
        });

        this.logger.info('Created payment receipt generation schedule', {
          paymentId: data.paymentId,
          receiptTime: receiptTime,
        });
      }

    } catch (error) {
      this.logger.error('Failed to process billing payment processing', error instanceof Error ? error : undefined, {
        paymentId: data.paymentId,
      });
      throw error;
    }
  }

  /**
   * Handle billing insurance claim processed event
   */
  private async handleBillingInsuranceClaimProcessed(data: BillingInsuranceClaimProcessedEventData): Promise<void> {
    this.logger.info('Processing billing insurance claim processing', {
      claimId: data.claimId,
      invoiceId: data.invoiceId,
      patientId: data.patientId,
      insuranceProvider: data.insuranceProvider,
      claimStatus: data.claimStatus,
    });

    try {
      // Schedule follow-up actions based on claim status
      if (data.claimStatus === 'submitted' || data.claimStatus === 'pending') {
        // Schedule follow-up reminder for pending claims
        const followUpDate = new Date(data.processedAt.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days later
        const followUpScheduleId = `claim-followup-${data.claimId}`;
        
        await this.createScheduleUseCase.execute({
          id: followUpScheduleId,
          name: `Insurance Claim Follow-up`,
          description: `Follow-up on pending insurance claim ${data.claimId}`,
          cronExpression: this.generateCronForOneTime(followUpDate),
          timezone: 'Asia/Ho_Chi_Minh',
          isActive: true,
          ownerService: 'scheduler-service',
          topicOrCommand: 'billing.claim.followup',
          payload: {
            claimId: data.claimId,
            invoiceId: data.invoiceId,
            patientId: data.patientId,
            patientName: data.patientName,
            insuranceProvider: data.insuranceProvider,
            claimAmount: data.claimAmount,
            claimStatus: data.claimStatus,
            processedAt: data.processedAt.toISOString(),
            processedBy: data.processedBy,
          },
          metadata: {
            eventType: 'insurance_claim_followup',
            followUpDays: 7,
          },
        });

        this.logger.info('Created insurance claim follow-up schedule', {
          claimId: data.claimId,
          scheduleId: followUpScheduleId,
          followUpDate: followUpDate,
        });

      } else if (data.claimStatus === 'approved') {
        // Schedule payment processing for approved claims
        const paymentScheduleId = `claim-payment-${data.claimId}`;
        const paymentTime = new Date(data.processedAt.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 days after approval
        
        await this.createScheduleUseCase.execute({
          id: paymentScheduleId,
          name: `Insurance Claim Payment Processing`,
          description: `Process payment for approved claim ${data.claimId}`,
          cronExpression: this.generateCronForOneTime(paymentTime),
          timezone: 'Asia/Ho_Chi_Minh',
          isActive: true,
          ownerService: 'scheduler-service',
          topicOrCommand: 'billing.claim.payment',
          payload: {
            claimId: data.claimId,
            invoiceId: data.invoiceId,
            patientId: data.patientId,
            patientName: data.patientName,
            insuranceProvider: data.insuranceProvider,
            claimAmount: data.claimAmount,
            approvedAmount: data.approvedAmount,
            processedAt: data.processedAt.toISOString(),
            processedBy: data.processedBy,
          },
          metadata: {
            eventType: 'insurance_claim_payment',
            paymentDelay: '2days',
          },
        });

        this.logger.info('Created insurance claim payment schedule', {
          claimId: data.claimId,
          scheduleId: paymentScheduleId,
          paymentTime: paymentTime,
          approvedAmount: data.approvedAmount,
        });

      } else if (data.claimStatus === 'rejected') {
        // Schedule rejection notification and appeal reminder
        const rejectionScheduleId = `claim-rejection-${data.claimId}`;
        const notificationTime = new Date(data.processedAt.getTime() + (1 * 60 * 60 * 1000)); // 1 hour after rejection
        
        await this.createScheduleUseCase.execute({
          id: rejectionScheduleId,
          name: `Insurance Claim Rejection Notification`,
          description: `Notify about rejected claim ${data.claimId}`,
          cronExpression: this.generateCronForOneTime(notificationTime),
          timezone: 'Asia/Ho_Chi_Minh',
          isActive: true,
          ownerService: 'scheduler-service',
          topicOrCommand: 'billing.claim.rejection',
          payload: {
            claimId: data.claimId,
            invoiceId: data.invoiceId,
            patientId: data.patientId,
            patientName: data.patientName,
            insuranceProvider: data.insuranceProvider,
            claimAmount: data.claimAmount,
            rejectionReason: data.rejectionReason,
            processedAt: data.processedAt.toISOString(),
            processedBy: data.processedBy,
          },
          metadata: {
            eventType: 'insurance_claim_rejection',
            notificationDelay: '1hour',
          },
        });

        this.logger.info('Created insurance claim rejection notification schedule', {
          claimId: data.claimId,
          scheduleId: rejectionScheduleId,
          rejectionReason: data.rejectionReason,
        });
      }

    } catch (error) {
      this.logger.error('Failed to process billing insurance claim processing', {
        claimId: data.claimId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle billing report requested event
   */
  private async handleBillingReportRequested(data: BillingReportRequestedEventData): Promise<void> {
    this.logger.info('Processing billing report scheduling', {
      reportId: data.reportId,
      reportType: data.reportType,
      reportPeriod: {
        startDate: data.reportPeriod.startDate,
        endDate: data.reportPeriod.endDate,
      },
      requestedBy: data.requestedBy,
    });

    try {
      const scheduleId = `billing-report-${data.reportId}`;
      
      // Generate cron expression based on report period
      const cronExpression = this.generateCronForReportPeriod(data.reportPeriod);
      
      await this.createScheduleUseCase.execute({
        id: scheduleId,
        name: `Billing Report Generation - ${data.reportType}`,
        description: `Automated ${data.reportType} report for ${data.reportPeriod.startDate} to ${data.reportPeriod.endDate}`,
        cronExpression,
        timezone: 'Asia/Ho_Chi_Minh',
        isActive: true,
        ownerService: 'scheduler-service',
        topicOrCommand: 'billing.report.generate',
        payload: {
          reportId: data.reportId,
          reportType: data.reportType,
          reportPeriod: {
            startDate: data.reportPeriod.startDate.toISOString(),
            endDate: data.reportPeriod.endDate.toISOString(),
          },
          requestedBy: data.requestedBy,
          parameters: data.parameters,
          recipients: data.recipients,
        },
        metadata: {
          eventType: 'billing_report_generation',
          requestedAt: data.requestedAt.toISOString(),
          isRecurring: this.isRecurringReport(data.reportPeriod),
        },
      });

      this.logger.info('Created billing report generation schedule', {
        reportId: data.reportId,
        scheduleId,
        reportType: data.reportType,
        reportPeriod: data.reportPeriod,
      });

    } catch (error) {
      this.logger.error('Failed to process billing report scheduling', {
        reportId: data.reportId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate cron expression for one-time event
   */
  private generateCronForOneTime(date: Date): string {
    return `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
  }

  /**
   * Generate cron expression for report period
   */
  private generateCronForReportPeriod(period: { startDate: Date; endDate: Date }): string {
    const daysDiff = Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Daily report
      return `${period.startDate.getMinutes()} ${period.startDate.getHours()} * * *`;
    } else if (daysDiff === 7) {
      // Weekly report
      return `${period.startDate.getMinutes()} ${period.startDate.getHours()} * * ${period.startDate.getDay()}`;
    } else if (daysDiff >= 28 && daysDiff <= 31) {
      // Monthly report
      return `${period.startDate.getMinutes()} ${period.startDate.getHours()} ${period.startDate.getDate()} * *`;
    } else {
      // Default to end of period
      return `${period.endDate.getMinutes()} ${period.endDate.getHours()} ${period.endDate.getDate()} ${period.endDate.getMonth() + 1} *`;
    }
  }

  /**
   * Check if report is recurring
   */
  private isRecurringReport(period: { startDate: Date; endDate: Date }): boolean {
    const daysDiff = Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff === 1 || daysDiff === 7 || (daysDiff >= 28 && daysDiff <= 31);
  }

  /**
   * Handle billing payment reminder scheduled event
   * Creates a ONCE schedule to trigger notification at reminder date
   */
  private async handleBillingPaymentReminderScheduled(data: BillingPaymentReminderScheduledEventData): Promise<void> {
    this.logger.info('Processing billing payment reminder scheduling', {
      invoiceId: data.invoiceId,
      patientId: data.patientId,
      reminderDate: data.reminderDate,
      reminderType: data.reminderType,
      daysBeforeDue: data.daysBeforeDue,
    });

    try {
      // Create schedule using CreateScheduleUseCase
      const scheduleId = await this.createScheduleUseCase.execute({
        tenantId: 'hospital-1', // Default tenant
        ownerService: 'billing-service',
        ownerResourceType: 'invoice',
        ownerResourceId: data.invoiceId,
        policyTag: `payment-reminder-${data.reminderType}`,
        scheduleType: 'ONCE',
        timezone: 'Asia/Ho_Chi_Minh',
        startAtUtc: new Date(data.reminderDate).toISOString(),
        topicOrCommand: 'billing.payment.reminder.due',
        payloadJson: {
          invoiceId: data.invoiceId,
          patientId: data.patientId,
          patientName: data.patientName,
          invoiceNumber: data.invoiceNumber,
          totalAmount: data.totalAmount,
          dueDate: new Date(data.dueDate).toISOString(),
          reminderType: data.reminderType,
          daysBeforeDue: data.daysBeforeDue,
          scheduledBy: data.scheduledBy,
        },
        dedupKey: `invoice:${data.invoiceId}:reminder:${data.reminderType}`,
        createdBy: data.scheduledBy,
      });

      this.logger.info('Created payment reminder schedule', {
        invoiceId: data.invoiceId,
        scheduleId: scheduleId.scheduleId,
        reminderType: data.reminderType,
        reminderDate: data.reminderDate,
        nextRunAt: scheduleId.nextRunAt,
      });

    } catch (error) {
      this.logger.error('Failed to process billing payment reminder scheduling', {
        invoiceId: data.invoiceId,
        reminderType: data.reminderType,
        error: error instanceof Error ? error.message : 'Unknown error',
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
        this.channel = undefined;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = undefined;
      }

      this.isConnected = false;
      this.logger.info('Billing event consumer disconnected successfully');

    } catch (error) {
      this.logger.error('Error disconnecting billing event consumer', {
        error: error instanceof Error ? error.message : 'Unknown error',
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
