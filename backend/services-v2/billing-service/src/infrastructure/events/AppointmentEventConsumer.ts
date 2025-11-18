/**
 * AppointmentEventConsumer - Consumes appointment events from Appointments Service
 * Phase 1 (Prepaid Model): Handles invoice generation when appointment is scheduled
 * 
 * Flow:
 * 1. appointment.scheduled → Create invoice (PENDING) + PayOS payment link
 * 2. appointment.cancelled_late → Cancel invoice (if not paid yet)
 * 3. appointment.no_show → (Future: apply no-show fee)
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */

import { ConsumeMessage } from 'amqplib';
import { logger } from '@infrastructure/logging/logger';
import { BillingService } from '@application/services/BillingService';
import { IInvoiceRepository } from '@domain/repositories/IInvoiceRepository';
import { IPatientRepository } from '@domain/entities/Patient';
import { CreatePayOSPaymentLinkUseCase } from '@application/use-cases/CreatePayOSPaymentLinkUseCase';
import { PaymentLinkCreatedEvent } from '@domain/events/PaymentLinkCreatedEvent';
import { IEventBus } from '@shared/application/services/event-bus.interface';

export interface AppointmentEventConsumerConfig {
  rabbitmqUrl: string;
  queueName: string;
  exchangeName: string;
  routingKeys: string[];
  prefetchCount?: number;
  retryAttempts?: number;
  retryDelayMs?: number;
}

export interface AppointmentScheduledEventData {
  appointmentId: string;
  patientId: string;
  staffId: string;
  departmentId: string;
  scheduledAt: Date;
  duration: number;
  status: 'pending_payment';
  serviceType: 'consultation' | 'procedure' | 'follow_up';
  notes?: string;
}

export interface AppointmentCancelledLateEventData {
  appointmentId: string;
  patientId: string;
  staffId: string;
  departmentId: string;
  scheduledAt: Date;
  cancelledAt: Date;
  reason: string;
  cancellationType: 'late' | 'no_show' | 'same_day';
  lateFeeApplied: boolean;
  lateFeeAmount: number;
}

export interface AppointmentNoShowEventData {
  appointmentId: string;
  patientId: string;
  staffId: string;
  departmentId: string;
  scheduledAt: Date;
  noShowFeeApplied: boolean;
  noShowFeeAmount: number;
  noShowCount: number;
}

/**
 * AppointmentEventConsumer - Handles appointment lifecycle events for billing
 */
export class AppointmentEventConsumer {
  private connection?: any;
  private channel?: any;
  private isConnected = false;

  constructor(
    private config: AppointmentEventConsumerConfig,
    private loggerInstance: typeof logger,
    private billingService: BillingService,
    private invoiceRepository: IInvoiceRepository,
    private patientRepository: IPatientRepository,
    private createPayOSPaymentLinkUseCase: CreatePayOSPaymentLinkUseCase,
    private eventBus: IEventBus,
  ) {}

  /**
   * Connect to RabbitMQ and start consuming
   */
  async connect(): Promise<void> {
    try {
      this.loggerInstance.info('Connecting to RabbitMQ for Appointment events', {
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
        this.loggerInstance.info('Queue bound to routing key', {
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
      this.loggerInstance.info('Appointment event consumer connected successfully');

      // Handle connection errors
      this.connection.on('error', (error: Error) => {
        this.loggerInstance.error('RabbitMQ connection error', {
          error: error.message,
        });
        this.isConnected = false;
      });

      this.connection.on('close', () => {
        this.loggerInstance.warn('RabbitMQ connection closed');
        this.isConnected = false;
      });

    } catch (error) {
      this.loggerInstance.error('Failed to connect to RabbitMQ', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
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

      this.loggerInstance.debug('Received appointment event', {
        routingKey,
        eventId: event.eventId,
      });

      // FIX: After deserialization, event data is spread into root level of event object
      // Access properties directly instead of using event.payload
      const eventAny = event as any;

      // Route to appropriate handler
      switch (routingKey) {
        case 'appointment.scheduled':
          await this.handleAppointmentScheduled({
            appointmentId: eventAny.appointmentId,
            patientId: eventAny.patientId,
            staffId: eventAny.staffId,
            departmentId: eventAny.departmentId,
            scheduledAt: eventAny.scheduledAt,
            duration: eventAny.duration,
            status: eventAny.status,
            serviceType: eventAny.serviceType,
            notes: eventAny.notes
          } as AppointmentScheduledEventData);
          break;

        case 'appointment.cancelled_late':
          await this.handleAppointmentCancelledLate({
            appointmentId: eventAny.appointmentId,
            patientId: eventAny.patientId,
            staffId: eventAny.staffId,
            departmentId: eventAny.departmentId,
            scheduledAt: eventAny.scheduledAt,
            cancelledAt: eventAny.cancelledAt,
            reason: eventAny.reason,
            cancellationType: eventAny.cancellationType,
            lateFeeApplied: eventAny.lateFeeApplied,
            lateFeeAmount: eventAny.lateFeeAmount
          } as AppointmentCancelledLateEventData);
          break;

        case 'appointment.no_show':
          await this.handleAppointmentNoShow({
            appointmentId: eventAny.appointmentId,
            patientId: eventAny.patientId,
            staffId: eventAny.staffId,
            departmentId: eventAny.departmentId,
            scheduledAt: eventAny.scheduledAt,
            noShowFeeApplied: eventAny.noShowFeeApplied,
            noShowFeeAmount: eventAny.noShowFeeAmount,
            noShowCount: eventAny.noShowCount
          } as AppointmentNoShowEventData);
          break;

        default:
          this.loggerInstance.warn('Unhandled routing key', { routingKey });
          break;
      }

      // Acknowledge message
      this.channel.ack(msg);

    } catch (error) {
      this.loggerInstance.error('Error processing appointment event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        routingKey: msg.fields.routingKey,
      });

      // Negative acknowledge (requeue)
      if (this.channel) {
        this.channel.nack(msg, false, true);
      }
    }
  }

  /**
   * Handle appointment scheduled event (Prepaid Model)
   * Creates invoice with PENDING status and generates PayOS payment link
   */
  private async handleAppointmentScheduled(data: AppointmentScheduledEventData): Promise<void> {
    this.loggerInstance.info('Processing appointment scheduled for billing (Prepaid Model)', {
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      staffId: data.staffId,
      serviceType: data.serviceType,
    });

    try {
      // Get patient billing information
      const patient = await this.patientRepository.findById(data.patientId);
      if (!patient) {
        this.loggerInstance.error('Patient not found for billing', {
          patientId: data.patientId,
          appointmentId: data.appointmentId,
        });
        return;
      }

      // Generate invoice based on service type
      // Invoice status will be PENDING (waiting for payment)
      const invoice = await this.billingService.generateAppointmentInvoice({
        appointmentId: data.appointmentId,
        patientId: data.patientId,
        staffId: data.staffId,
        departmentId: data.departmentId,
        serviceType: data.serviceType,
        scheduledAt: data.scheduledAt,
        duration: data.duration,
        insuranceInfo: patient.insuranceInfo,
      });

      this.loggerInstance.info('Invoice created for scheduled appointment (Prepaid)', {
        appointmentId: data.appointmentId,
        invoiceId: invoice.id,
        amount: invoice.totalAmount,
        status: invoice.status,
      });

      // Automatically create PayOS payment link for prepaid flow
      try {
        const paymentLinkResult = await this.createPayOSPaymentLinkUseCase.execute({
          invoiceId: invoice.id,
          buyerName: patient.fullName,
          buyerEmail: patient.email,
          buyerPhone: patient.phone,
        });

        if (paymentLinkResult.success) {
          this.loggerInstance.info('PayOS payment link created automatically', {
            appointmentId: data.appointmentId,
            invoiceId: invoice.id,
            checkoutUrl: paymentLinkResult.checkoutUrl,
            qrCode: paymentLinkResult.qrCode,
            orderCode: paymentLinkResult.orderCode,
          });

          // Emit PaymentLinkCreatedEvent for Notifications Service to send to patient
          const paymentLinkEvent = new PaymentLinkCreatedEvent(
            invoice.id,
            data.patientId,
            paymentLinkResult.orderCode,
            paymentLinkResult.checkoutUrl,
            paymentLinkResult.qrCode,
            invoice.totalAmount.amount,
            invoice.totalAmount.currency,
            `Payment for appointment ${data.appointmentId}`,
            data.appointmentId, // correlationId
            data.appointmentId  // causationId
          );

          await this.eventBus.publish(paymentLinkEvent);

          this.loggerInstance.info('PaymentLinkCreatedEvent published', {
            appointmentId: data.appointmentId,
            invoiceId: invoice.id,
            eventType: 'billing.payment_link.created',
          });
        } else {
          this.loggerInstance.error('Failed to create PayOS payment link', {
            appointmentId: data.appointmentId,
            invoiceId: invoice.id,
          });
        }
      } catch (payosError) {
        // Log error but don't fail the entire flow - invoice is already created
        this.loggerInstance.error('Exception creating PayOS payment link', {
          appointmentId: data.appointmentId,
          invoiceId: invoice.id,
          error: payosError instanceof Error ? payosError.message : 'Unknown error',
        });
      }

    } catch (error) {
      this.loggerInstance.error('Failed to generate invoice for scheduled appointment', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle appointment cancelled late event
   */
  private async handleAppointmentCancelledLate(data: AppointmentCancelledLateEventData): Promise<void> {
    this.loggerInstance.info('Processing late cancellation fee', {
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      lateFeeAmount: data.lateFeeAmount,
    });

    try {
      if (data.lateFeeApplied && data.lateFeeAmount > 0) {
        // Generate late cancellation fee invoice
        const feeInvoice = await this.billingService.generateLateCancellationFee({
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          cancelledAt: data.cancelledAt,
          reason: data.reason,
          feeAmount: data.lateFeeAmount,
        });

        this.loggerInstance.info('Late cancellation fee invoice generated', {
          appointmentId: data.appointmentId,
          invoiceId: feeInvoice.id,
          feeAmount: data.lateFeeAmount,
        });
      }

    } catch (error) {
      this.loggerInstance.error('Failed to generate late cancellation fee', {
        appointmentId: data.appointmentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Handle appointment no-show event
   */
  private async handleAppointmentNoShow(data: AppointmentNoShowEventData): Promise<void> {
    this.loggerInstance.info('Processing no-show fee', {
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      noShowCount: data.noShowCount,
      noShowFeeAmount: data.noShowFeeAmount,
    });

    try {
      if (data.noShowFeeApplied && data.noShowFeeAmount > 0) {
        // Generate no-show fee invoice
        const feeInvoice = await this.billingService.generateNoShowFee({
          appointmentId: data.appointmentId,
          patientId: data.patientId,
          scheduledAt: data.scheduledAt,
          noShowCount: data.noShowCount,
          feeAmount: data.noShowFeeAmount,
        });

        this.loggerInstance.info('No-show fee invoice generated', {
          appointmentId: data.appointmentId,
          invoiceId: feeInvoice.id,
          feeAmount: data.noShowFeeAmount,
        });
      }

    } catch (error) {
      this.loggerInstance.error('Failed to generate no-show fee', {
        appointmentId: data.appointmentId,
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
      this.loggerInstance.info('Appointment event consumer disconnected successfully');

    } catch (error) {
      this.loggerInstance.error('Error disconnecting appointment event consumer', {
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
