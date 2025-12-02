/**
 * Billing Event Consumer - Infrastructure Layer
 * Consumes billing events from Billing Service
 * Handles billing requirements, insurance constraints, and financial aspects for appointments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */

import { ConsumeMessage } from "amqplib";
import { InboxRepository } from "../inbox/InboxRepository";
import { IAppointmentRepository } from "../../domain/repositories/IAppointmentRepository";
import { IQueueRepository } from "../../domain/repositories/IQueueRepository";
import { IConflictResolutionService } from "../../application/services/IConflictResolutionService";
import { IReminderService } from "../../application/services/IReminderService";
import {
  PaymentCompletedHandler,
  PaymentCompletedEventData,
} from "./handlers/PaymentCompletedHandler";

export interface BillingEventConsumerConfig {
  rabbitmqUrl: string;
  queueName: string;
  exchangeName: string;
  routingKey: string;
  routingKeys?: string[]; // Support multiple routing keys
}

/**
 * Event data interfaces for type safety
 */
interface PreAuthorizationRequestedEventData {
  authorizationId: string;
  patientId: string;
  appointmentId?: string;
  procedureCode: string;
  procedureName: string;
  urgencyLevel: string;
  estimatedCost: number;
  requestedAt: Date;
}

interface PreAuthorizationApprovedEventData {
  authorizationId: string;
  appointmentId?: string;
  patientId: string;
  approvedAt: Date;
  approvedBy?: string;
  validUntil?: Date;
}

interface PreAuthorizationDeniedEventData {
  authorizationId: string;
  appointmentId?: string;
  patientId: string;
  deniedAt: Date;
  denialReason?: string;
}

interface BillingRateUpdatedEventData {
  rateId: string;
  serviceType: string;
  oldRate: number;
  newRate: number;
  effectiveDate: Date;
  updatedBy: string;
  updatedAt: Date;
}

interface InsuranceCoverageVerifiedEventData {
  patientId: string;
  insuranceProvider: string;
  policyNumber: string;
  coverageType: string;
  validFrom: Date;
  validUntil: Date;
}

/**
 * Billing Event Consumer
 * Handles events from Billing Service and updates appointment state accordingly
 */
export class BillingEventConsumer {
  private isConnected = false;
  private channel: any;
  private connection: any;

  constructor(
    private readonly config: BillingEventConsumerConfig,
    private readonly appointmentRepository: IAppointmentRepository,
    private readonly queueRepository: IQueueRepository,
    private readonly reminderService: IReminderService,
    private readonly conflictResolutionService: IConflictResolutionService,
    private readonly inboxRepository: InboxRepository,
    private readonly paymentCompletedHandler: PaymentCompletedHandler,
  ) {}

  /**
   * Connect to RabbitMQ and start consuming events
   */
  async connect(): Promise<void> {
    try {
      const amqp = await import("amqplib");
      this.connection = await amqp.connect(this.config.rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Declare exchange and queue
      await this.channel.assertExchange(this.config.exchangeName, "topic", {
        durable: true,
      });
      const queue = await this.channel.assertQueue(this.config.queueName, {
        durable: true,
      });

      // Bind queue to routing keys (support multiple keys)
      const routingKeys = this.config.routingKeys || [this.config.routingKey];
      for (const key of routingKeys) {
        await this.channel.bindQueue(
          queue.queue,
          this.config.exchangeName,
          key,
        );
        console.log(`Bound queue to routing key: ${key}`);
      }

      // Start consuming
      await this.channel.consume(queue.queue, (msg: ConsumeMessage | null) => {
        if (msg) {
          this.handleMessage(msg).catch((err) => {
            console.error("Error handling billing event:", err);
            this.channel.nack(msg, false, true); // Requeue on error
          });
        }
      });

      this.isConnected = true;
      console.log("Billing event consumer connected");
    } catch (error) {
      console.error("Failed to connect billing event consumer:", error);
      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(msg: ConsumeMessage): Promise<void> {
    try {
      const content = msg.content.toString();
      const event = JSON.parse(content);

      // FIX: EventBus serializes events using toJSON() which returns { eventType, eventData, ... }
      // Other services sometimes emit { type, payload } or rely on routing keys only.
      const routingKey = msg.fields?.routingKey;
      const eventType =
        event.eventType ||
        event.type ||
        event.event_type ||
        event.metadata?.eventType ||
        routingKey ||
        "unknown";
      const eventData =
        event.eventData ||
        event.data ||
        event.payload ||
        event.body ||
        event.message ||
        event;

      // Normalize common billing payload shapes (snake_case -> camelCase)
      if (eventData) {
        // appointment_id -> appointmentId
        if (!eventData.appointmentId && eventData.appointment_id) {
          eventData.appointmentId = eventData.appointment_id;
        }
        // invoice_id -> invoiceId
        if (!eventData.invoiceId && eventData.invoice_id) {
          eventData.invoiceId = eventData.invoice_id;
        }
        // payment_id -> paymentId
        if (!eventData.paymentId && eventData.payment_id) {
          eventData.paymentId = eventData.payment_id;
        }
      }

      // Inbox pattern for idempotency
      const eventId = event.eventId || event.id || `${eventType}-${Date.now()}`;
      const exists = await this.inboxRepository.exists(eventId);
      if (exists) {
        console.log("Event already processed (idempotent)", {
          eventId,
          eventType,
        });
        this.channel.ack(msg);
        return;
      }

      // Route to appropriate handler
      switch (eventType) {
        case "PaymentCompleted":
        case "billing.payment.completed":
          await this.paymentCompletedHandler.handle(
            eventData as PaymentCompletedEventData,
          );
          break;
        case "PreAuthorizationRequested":
          await this.handlePreAuthorizationRequested(eventData);
          break;
        case "PreAuthorizationApproved":
          await this.handlePreAuthorizationApproved(eventData);
          break;
        case "PreAuthorizationDenied":
          await this.handlePreAuthorizationDenied(eventData);
          break;
        case "BillingRateUpdated":
          await this.handleBillingRateUpdated(eventData);
          break;
        case "InsuranceCoverageVerified":
          await this.handleInsuranceCoverageVerified(eventData);
          break;
        default:
          console.warn(`Unknown event type: ${eventType}`, {
            routingKey,
          });
      }

      // Save to inbox after successful processing
      await this.inboxRepository.save({
        eventId,
        eventType,
        sourceService: "billing-service",
        payloadJson: eventData,
        processedAt: new Date(),
      });
      this.channel.ack(msg);
    } catch (error) {
      console.error("Error processing billing event:", error);
      throw error;
    }
  }

  /**
   * Handle pre-authorization requested event
   */
  private async handlePreAuthorizationRequested(
    data: PreAuthorizationRequestedEventData,
  ): Promise<void> {
    try {
      console.log("Processing pre-authorization request", {
        authorizationId: data.authorizationId,
        patientId: data.patientId,
        appointmentId: data.appointmentId,
      });

      // If appointment-specific, update its status
      if (data.appointmentId) {
        const appointment = await this.appointmentRepository.findByIdString(
          data.appointmentId,
        );
        if (appointment) {
          // TODO: Add domain method for pre-auth status
          await this.appointmentRepository.save(appointment);
        }
      }

      // Add to pre-auth tracking queue
      await this.queueRepository.addToPreAuthTrackingQueue({
        authorizationId: data.authorizationId,
        patientId: data.patientId,
        appointmentId: data.appointmentId,
        procedureCode: data.procedureCode,
        urgencyLevel: data.urgencyLevel,
        requestedAt: data.requestedAt,
        status: "pending",
      });
    } catch (error) {
      console.error("Failed to handle pre-authorization request:", error);
      throw error;
    }
  }

  /**
   * Handle pre-authorization approved event
   */
  private async handlePreAuthorizationApproved(
    data: PreAuthorizationApprovedEventData,
  ): Promise<void> {
    try {
      console.log("Processing pre-authorization approval", {
        authorizationId: data.authorizationId,
        appointmentId: data.appointmentId,
      });

      // Update appointment if specified
      if (data.appointmentId) {
        const appointment = await this.appointmentRepository.findByIdString(
          data.appointmentId,
        );
        if (appointment) {
          // TODO: Add domain method for pre-auth approval
          await this.appointmentRepository.save(appointment);
        }
      }

      // Update tracking queue
      await this.queueRepository.updatePreAuthTracking({
        authorizationId: data.authorizationId,
        status: "approved",
        approvedAt: data.approvedAt,
        approvedBy: data.approvedBy,
        validUntil: data.validUntil,
      });
    } catch (error) {
      console.error("Failed to handle pre-authorization approval:", error);
      throw error;
    }
  }

  /**
   * Handle pre-authorization denied event
   */
  private async handlePreAuthorizationDenied(
    data: PreAuthorizationDeniedEventData,
  ): Promise<void> {
    try {
      console.log("Processing pre-authorization denial", {
        authorizationId: data.authorizationId,
        appointmentId: data.appointmentId,
      });

      // Update appointment if specified
      if (data.appointmentId) {
        const appointment = await this.appointmentRepository.findByIdString(
          data.appointmentId,
        );
        if (appointment) {
          // TODO: Add domain method for pre-auth denial
          await this.appointmentRepository.save(appointment);
        }
      }

      // Update tracking queue
      await this.queueRepository.updatePreAuthTracking({
        authorizationId: data.authorizationId,
        status: "denied",
        deniedAt: data.deniedAt,
        denialReason: data.denialReason,
      });
    } catch (error) {
      console.error("Failed to handle pre-authorization denial:", error);
      throw error;
    }
  }

  /**
   * Handle billing rate updated event
   */
  private async handleBillingRateUpdated(
    data: BillingRateUpdatedEventData,
  ): Promise<void> {
    try {
      console.log("Processing billing rate update", {
        rateId: data.rateId,
        serviceType: data.serviceType,
        newRate: data.newRate,
      });

      // Update billing rates for appointments of this service type
      await this.appointmentRepository.updateBillingRates({
        serviceType: data.serviceType,
        newRate: data.newRate,
        effectiveDate: data.effectiveDate,
      });

      console.log(`Successfully updated billing rates for ${data.serviceType}`);
    } catch (error) {
      console.error("Failed to handle billing rate update:", error);
      throw error;
    }
  }

  /**
   * Handle insurance coverage verified event
   */
  private async handleInsuranceCoverageVerified(
    data: InsuranceCoverageVerifiedEventData,
  ): Promise<void> {
    try {
      console.log("Processing insurance coverage verification", {
        patientId: data.patientId,
        insuranceProvider: data.insuranceProvider,
      });

      // Update patient insurance coverage
      await this.appointmentRepository.updatePatientInsuranceCoverage({
        patientId: data.patientId,
        insuranceProvider: data.insuranceProvider,
        policyNumber: data.policyNumber,
        coverageType: data.coverageType,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
      });

      console.log(
        `Successfully updated insurance coverage for patient ${data.patientId}`,
      );
    } catch (error) {
      console.error("Failed to handle insurance coverage verification:", error);
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
      }
      if (this.connection) {
        await this.connection.close();
      }
      this.isConnected = false;
      console.log("Billing event consumer disconnected");
    } catch (error) {
      console.error("Error disconnecting billing event consumer:", error);
    }
  }

  /**
   * Check if consumer is connected
   */
  isConsumerConnected(): boolean {
    return this.isConnected;
  }
}
