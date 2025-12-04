"use strict";
/**
 * Billing Event Consumer - Infrastructure Layer
 * Consumes billing events from Billing Service
 * Handles billing requirements, insurance constraints, and financial aspects for appointments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingEventConsumer = void 0;
/**
 * Billing Event Consumer
 * Handles events from Billing Service and updates appointment state accordingly
 */
class BillingEventConsumer {
    constructor(config, appointmentRepository, queueRepository, reminderService, conflictResolutionService, inboxRepository, paymentCompletedHandler) {
        this.config = config;
        this.appointmentRepository = appointmentRepository;
        this.queueRepository = queueRepository;
        this.reminderService = reminderService;
        this.conflictResolutionService = conflictResolutionService;
        this.inboxRepository = inboxRepository;
        this.paymentCompletedHandler = paymentCompletedHandler;
        this.isConnected = false;
    }
    /**
     * Connect to RabbitMQ and start consuming events
     */
    async connect() {
        try {
            const amqp = await Promise.resolve().then(() => __importStar(require("amqplib")));
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
                await this.channel.bindQueue(queue.queue, this.config.exchangeName, key);
                console.log(`Bound queue to routing key: ${key}`);
            }
            // Start consuming
            await this.channel.consume(queue.queue, (msg) => {
                if (msg) {
                    this.handleMessage(msg).catch((err) => {
                        console.error("Error handling billing event:", err);
                        this.channel.nack(msg, false, true); // Requeue on error
                    });
                }
            });
            this.isConnected = true;
            console.log("Billing event consumer connected");
        }
        catch (error) {
            console.error("Failed to connect billing event consumer:", error);
            throw error;
        }
    }
    /**
     * Handle incoming message
     */
    async handleMessage(msg) {
        try {
            const content = msg.content.toString();
            const event = JSON.parse(content);
            // FIX: EventBus serializes events using toJSON() which returns { eventType, eventData, ... }
            // Other services sometimes emit { type, payload } or rely on routing keys only.
            const routingKey = msg.fields?.routingKey;
            const eventType = event.eventType ||
                event.type ||
                event.event_type ||
                event.metadata?.eventType ||
                routingKey ||
                "unknown";
            const eventData = event.eventData ||
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
                    await this.paymentCompletedHandler.handle(eventData);
                    break;
                case "billing.invoice.expired":
                case "InvoiceExpired":
                case "invoice.expired":
                    await this.handleInvoiceExpired(this.buildInvoiceExpiredPayload(eventData));
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
        }
        catch (error) {
            console.error("Error processing billing event:", error);
            throw error;
        }
    }
    /**
     * Handle pre-authorization requested event
     */
    async handlePreAuthorizationRequested(data) {
        try {
            console.log("Processing pre-authorization request", {
                authorizationId: data.authorizationId,
                patientId: data.patientId,
                appointmentId: data.appointmentId,
            });
            // If appointment-specific, update its status
            if (data.appointmentId) {
                const appointment = await this.appointmentRepository.findByIdString(data.appointmentId);
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
        }
        catch (error) {
            console.error("Failed to handle pre-authorization request:", error);
            throw error;
        }
    }
    /**
     * Handle pre-authorization approved event
     */
    async handlePreAuthorizationApproved(data) {
        try {
            console.log("Processing pre-authorization approval", {
                authorizationId: data.authorizationId,
                appointmentId: data.appointmentId,
            });
            // Update appointment if specified
            if (data.appointmentId) {
                const appointment = await this.appointmentRepository.findByIdString(data.appointmentId);
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
        }
        catch (error) {
            console.error("Failed to handle pre-authorization approval:", error);
            throw error;
        }
    }
    /**
     * Handle pre-authorization denied event
     */
    async handlePreAuthorizationDenied(data) {
        try {
            console.log("Processing pre-authorization denial", {
                authorizationId: data.authorizationId,
                appointmentId: data.appointmentId,
            });
            // Update appointment if specified
            if (data.appointmentId) {
                const appointment = await this.appointmentRepository.findByIdString(data.appointmentId);
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
        }
        catch (error) {
            console.error("Failed to handle pre-authorization denial:", error);
            throw error;
        }
    }
    /**
     * Handle billing rate updated event
     */
    async handleBillingRateUpdated(data) {
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
        }
        catch (error) {
            console.error("Failed to handle billing rate update:", error);
            throw error;
        }
    }
    /**
     * Handle insurance coverage verified event
     */
    async handleInsuranceCoverageVerified(data) {
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
            console.log(`Successfully updated insurance coverage for patient ${data.patientId}`);
        }
        catch (error) {
            console.error("Failed to handle insurance coverage verification:", error);
            throw error;
        }
    }
    buildInvoiceExpiredPayload(event) {
        const expiredAt = event?.expiredAt || event?.expired_at;
        return {
            invoiceId: event?.invoiceId || event?.invoice_id,
            appointmentId: event?.appointmentId || event?.appointment_id || event?.aggregateId,
            patientId: event?.patientId || event?.patient_id,
            reason: event?.reason || "Invoice expired",
            expiredAt: expiredAt ? new Date(expiredAt) : new Date(),
        };
    }
    async handleInvoiceExpired(data) {
        if (!data.appointmentId) {
            console.warn("Received billing.invoice.expired event without appointmentId", data);
            return;
        }
        try {
            const appointment = await this.appointmentRepository.findByIdString(data.appointmentId);
            if (!appointment) {
                console.warn(`InvoiceExpired event ignored - appointment ${data.appointmentId} not found`);
                return;
            }
            if (appointment.status === "cancelled" ||
                appointment.status === "completed") {
                console.info(`InvoiceExpired event ignored - appointment ${data.appointmentId} already ${appointment.status}`);
                return;
            }
            appointment.cancel(data.reason || "Invoice expired - payment timeout", "system");
            await this.appointmentRepository.save(appointment);
            console.info(`Appointment ${data.appointmentId} cancelled due to billing invoice expiration`);
        }
        catch (error) {
            console.error(`Failed to process billing.invoice.expired for appointment ${data.appointmentId}`, error);
            throw error;
        }
    }
    /**
     * Disconnect from RabbitMQ
     */
    async disconnect() {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            this.isConnected = false;
            console.log("Billing event consumer disconnected");
        }
        catch (error) {
            console.error("Error disconnecting billing event consumer:", error);
        }
    }
    /**
     * Check if consumer is connected
     */
    isConsumerConnected() {
        return this.isConnected;
    }
}
exports.BillingEventConsumer = BillingEventConsumer;
//# sourceMappingURL=BillingEventConsumer.js.map