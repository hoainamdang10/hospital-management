"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentEventConsumer = void 0;
const PaymentLinkCreatedEvent_1 = require("../../domain/events/PaymentLinkCreatedEvent");
/**
 * AppointmentEventConsumer - Handles appointment lifecycle events for billing
 */
class AppointmentEventConsumer {
    constructor(config, loggerInstance, billingService, invoiceRepository, patientRepository, staffRepository, createPayOSPaymentLinkUseCase, eventBus) {
        this.config = config;
        this.loggerInstance = loggerInstance;
        this.billingService = billingService;
        this.invoiceRepository = invoiceRepository;
        this.patientRepository = patientRepository;
        this.staffRepository = staffRepository;
        this.createPayOSPaymentLinkUseCase = createPayOSPaymentLinkUseCase;
        this.eventBus = eventBus;
        this.isConnected = false;
    }
    /**
     * Connect to RabbitMQ and start consuming
     */
    async connect() {
        try {
            this.loggerInstance.info("Connecting to RabbitMQ for Appointment events", {
                queueName: this.config.queueName,
            });
            const amqp = require("amqplib");
            this.connection = await amqp.connect(this.config.rabbitmqUrl);
            this.channel = await this.connection.createChannel();
            if (!this.channel) {
                throw new Error("Failed to create RabbitMQ channel");
            }
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
                await this.channel.bindQueue(this.config.queueName, this.config.exchangeName, routingKey);
                this.loggerInstance.info("Queue bound to routing key", {
                    queueName: this.config.queueName,
                    routingKey,
                });
            }
            // Start consuming
            await this.channel.consume(this.config.queueName, this.handleMessage.bind(this), { noAck: false });
            this.isConnected = true;
            this.loggerInstance.info("Appointment event consumer connected successfully");
            // Handle connection errors
            this.connection.on("error", (error) => {
                this.loggerInstance.error("RabbitMQ connection error", {
                    error: error.message,
                });
                this.isConnected = false;
            });
            this.connection.on("close", () => {
                this.loggerInstance.warn("RabbitMQ connection closed");
                this.isConnected = false;
            });
        }
        catch (error) {
            this.loggerInstance.error("Failed to connect to RabbitMQ", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Handle incoming message
     */
    async handleMessage(msg) {
        if (!msg || !this.channel) {
            return;
        }
        try {
            const { rawEvent, payload } = this.parseEventMessage(msg.content.toString());
            const routingKey = msg.fields.routingKey;
            this.loggerInstance.debug("Received appointment event", {
                routingKey,
                eventId: rawEvent?.eventId,
            });
            // Normalize payload (appointments service publishes payload inside eventData)
            const normalizedPayload = payload || {};
            // Route to appropriate handler
            switch (routingKey) {
                case "appointment.scheduled":
                    await this.handleAppointmentScheduled(this.buildAppointmentScheduledPayload(normalizedPayload, rawEvent));
                    break;
                case "appointment.cancelled_late":
                    await this.handleAppointmentCancelledLate(this.buildAppointmentCancelledPayload(normalizedPayload, rawEvent));
                    break;
                case "appointment.no_show":
                    await this.handleAppointmentNoShow(this.buildAppointmentNoShowPayload(normalizedPayload, rawEvent));
                    break;
                default:
                    this.loggerInstance.warn("Unhandled routing key", { routingKey });
                    break;
            }
            // Acknowledge message
            this.channel.ack(msg);
        }
        catch (error) {
            this.loggerInstance.error("Error processing appointment event", {
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
     * Parse raw RabbitMQ message and extract payload/event metadata
     */
    parseEventMessage(content) {
        try {
            const rawEvent = JSON.parse(content);
            const payload = rawEvent?.eventData || rawEvent?.payload || rawEvent?.data || rawEvent;
            return { rawEvent, payload };
        }
        catch (error) {
            this.loggerInstance.error("Failed to parse appointment event message", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return { rawEvent: null, payload: {} };
        }
    }
    buildAppointmentScheduledPayload(payload, rawEvent) {
        const common = this.extractCommonAppointmentFields(payload, rawEvent);
        return {
            appointmentId: common.appointmentId,
            patientId: common.patientId,
            staffId: common.staffId,
            departmentId: common.departmentId,
            scheduledAt: common.scheduledAt,
            duration: payload?.duration ??
                payload?.durationMinutes ??
                payload?.expectedDuration ??
                30,
            status: "pending_payment",
            serviceType: this.normalizeServiceType(payload?.serviceType || payload?.type),
            notes: payload?.notes || payload?.reason || undefined,
        };
    }
    buildAppointmentCancelledPayload(payload, rawEvent) {
        const common = this.extractCommonAppointmentFields(payload, rawEvent);
        return {
            appointmentId: common.appointmentId,
            patientId: common.patientId,
            staffId: common.staffId,
            departmentId: common.departmentId,
            scheduledAt: common.scheduledAt,
            cancelledAt: this.safeDate(payload?.cancelledAt) ?? new Date(),
            reason: payload?.reason || payload?.cancellationReason || "Unknown reason",
            cancellationType: (payload?.cancellationType || "late"),
            lateFeeApplied: this.toBoolean(payload?.lateFeeApplied),
            lateFeeAmount: this.toNumber(payload?.lateFeeAmount),
        };
    }
    buildAppointmentNoShowPayload(payload, rawEvent) {
        const common = this.extractCommonAppointmentFields(payload, rawEvent);
        return {
            appointmentId: common.appointmentId,
            patientId: common.patientId,
            staffId: common.staffId,
            departmentId: common.departmentId,
            scheduledAt: common.scheduledAt,
            noShowFeeApplied: this.toBoolean(payload?.noShowFeeApplied),
            noShowFeeAmount: this.toNumber(payload?.noShowFeeAmount),
            noShowCount: this.toNumber(payload?.noShowCount),
        };
    }
    extractCommonAppointmentFields(payload, rawEvent) {
        const appointmentId = payload?.appointmentId || rawEvent?.aggregateId;
        const scheduledAt = this.resolveScheduledAt(payload);
        const patientId = payload?.patientId || payload?.patient_id || payload?.patient?.id || null;
        const staffId = payload?.staffId ||
            payload?.doctorId ||
            payload?.providerId ||
            payload?.staff_id ||
            null;
        return {
            appointmentId,
            patientId,
            staffId,
            departmentId: payload?.departmentId ||
                payload?.department_id ||
                payload?.department?.id ||
                null,
            scheduledAt,
        };
    }
    resolveScheduledAt(payload) {
        if (payload?.scheduledAt) {
            return new Date(payload.scheduledAt);
        }
        if (payload?.appointmentDate && payload?.appointmentTime) {
            return new Date(`${payload.appointmentDate}T${payload.appointmentTime}`);
        }
        if (payload?.appointmentDate) {
            return new Date(payload.appointmentDate);
        }
        return new Date();
    }
    normalizeServiceType(value) {
        const normalized = (value || "consultation").toLowerCase();
        if (normalized.includes("procedure")) {
            return "procedure";
        }
        if (normalized.includes("follow")) {
            return "follow_up";
        }
        return "consultation";
    }
    safeDate(value) {
        if (!value) {
            return undefined;
        }
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return undefined;
        }
        return date;
    }
    toBoolean(value) {
        if (typeof value === "boolean") {
            return value;
        }
        if (typeof value === "string") {
            return value === "true" || value === "1";
        }
        return Boolean(value);
    }
    toNumber(value, fallback = 0) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
    /**
     * Normalize staff identifier to UUID stored in provider_schema
     */
    async resolveStaffIdentifier(staffId) {
        try {
            const resolved = await this.staffRepository.resolveStaffId(staffId);
            return resolved;
        }
        catch (error) {
            this.loggerInstance.error("Failed to resolve staff identifier", {
                staffId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return null;
        }
    }
    /**
     * Handle appointment scheduled event (Prepaid Model)
     * Creates invoice with PENDING status and generates PayOS payment link
     */
    async handleAppointmentScheduled(data) {
        const staffUuid = await this.resolveStaffIdentifier(data.staffId);
        if (!staffUuid) {
            this.loggerInstance.error("Unable to resolve staff ID for appointment", {
                appointmentId: data.appointmentId,
                staffId: data.staffId,
            });
            return;
        }
        try {
            // Get patient billing information
            const patient = await this.patientRepository.findById(data.patientId);
            if (!patient) {
                this.loggerInstance.error("Patient not found for billing", {
                    patientId: data.patientId,
                    appointmentId: data.appointmentId,
                });
                return;
            }
            const patientUuid = patient.id;
            this.loggerInstance.info("Processing appointment scheduled for billing (Prepaid Model)", {
                appointmentId: data.appointmentId,
                patientId: patientUuid,
                staffId: staffUuid,
                serviceType: data.serviceType,
            });
            // Generate invoice based on service type
            // Invoice status will be PENDING (waiting for payment)
            const invoice = await this.billingService.generateAppointmentInvoice({
                appointmentId: data.appointmentId,
                patientId: patientUuid,
                staffId: staffUuid,
                departmentId: data.departmentId,
                serviceType: data.serviceType,
                scheduledAt: data.scheduledAt,
                duration: data.duration,
                insuranceInfo: patient.insuranceInfo,
            });
            this.loggerInstance.info("Invoice created for scheduled appointment (Prepaid)", {
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
                    this.loggerInstance.info("PayOS payment link created automatically", {
                        appointmentId: data.appointmentId,
                        invoiceId: invoice.id,
                        checkoutUrl: paymentLinkResult.checkoutUrl,
                        qrCode: paymentLinkResult.qrCode,
                        orderCode: paymentLinkResult.orderCode,
                    });
                    // Emit PaymentLinkCreatedEvent for Notifications Service to send to patient
                    const paymentLinkEvent = new PaymentLinkCreatedEvent_1.PaymentLinkCreatedEvent(invoice.id, data.patientId, paymentLinkResult.orderCode, paymentLinkResult.checkoutUrl, paymentLinkResult.qrCode, invoice.totalAmount.amount, invoice.totalAmount.currency, `Payment for appointment ${data.appointmentId}`, data.appointmentId, // correlationId
                    data.appointmentId);
                    await this.eventBus.publish(paymentLinkEvent);
                    this.loggerInstance.info("PaymentLinkCreatedEvent published", {
                        appointmentId: data.appointmentId,
                        invoiceId: invoice.id,
                        eventType: "billing.payment_link.created",
                    });
                }
                else {
                    this.loggerInstance.error("Failed to create PayOS payment link", {
                        appointmentId: data.appointmentId,
                        invoiceId: invoice.id,
                    });
                }
            }
            catch (payosError) {
                // Log error but don't fail the entire flow - invoice is already created
                this.loggerInstance.error("Exception creating PayOS payment link", {
                    appointmentId: data.appointmentId,
                    invoiceId: invoice.id,
                    error: payosError instanceof Error ? payosError.message : "Unknown error",
                });
            }
        }
        catch (error) {
            this.loggerInstance.error("Failed to generate invoice for scheduled appointment", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Handle appointment cancelled late event
     */
    async handleAppointmentCancelledLate(data) {
        this.loggerInstance.info("Processing late cancellation fee", {
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
                this.loggerInstance.info("Late cancellation fee invoice generated", {
                    appointmentId: data.appointmentId,
                    invoiceId: feeInvoice.id,
                    feeAmount: data.lateFeeAmount,
                });
            }
        }
        catch (error) {
            this.loggerInstance.error("Failed to generate late cancellation fee", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Handle appointment no-show event
     */
    async handleAppointmentNoShow(data) {
        this.loggerInstance.info("Processing no-show fee", {
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
                this.loggerInstance.info("No-show fee invoice generated", {
                    appointmentId: data.appointmentId,
                    invoiceId: feeInvoice.id,
                    feeAmount: data.noShowFeeAmount,
                });
            }
        }
        catch (error) {
            this.loggerInstance.error("Failed to generate no-show fee", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
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
                this.channel = undefined;
            }
            if (this.connection) {
                await this.connection.close();
                this.connection = undefined;
            }
            this.isConnected = false;
            this.loggerInstance.info("Appointment event consumer disconnected successfully");
        }
        catch (error) {
            this.loggerInstance.error("Error disconnecting appointment event consumer", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Check if consumer is connected
     */
    isConsumerConnected() {
        return this.isConnected;
    }
}
exports.AppointmentEventConsumer = AppointmentEventConsumer;
//# sourceMappingURL=AppointmentEventConsumer.js.map