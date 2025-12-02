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
    constructor(config, loggerInstance, billingService, invoiceRepository, patientRepository, staffRepository, createPayOSPaymentLinkUseCase, eventBus, refundPaymentUseCase) {
        this.config = config;
        this.loggerInstance = loggerInstance;
        this.billingService = billingService;
        this.invoiceRepository = invoiceRepository;
        this.patientRepository = patientRepository;
        this.staffRepository = staffRepository;
        this.createPayOSPaymentLinkUseCase = createPayOSPaymentLinkUseCase;
        this.eventBus = eventBus;
        this.refundPaymentUseCase = refundPaymentUseCase;
        this.isConnected = false;
        this.patientIdCache = new Map();
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
                case "appointment.cancelled":
                    await this.handleAppointmentCancelled(this.buildAppointmentCancelledRefundPayload(normalizedPayload, rawEvent));
                    break;
                case "appointment.cancelled_late":
                    await this.handleAppointmentCancelledLate(this.buildAppointmentCancelledPayload(normalizedPayload, rawEvent));
                    break;
                case "appointment.no_show":
                    await this.handleAppointmentNoShow(this.buildAppointmentNoShowPayload(normalizedPayload, rawEvent));
                    break;
                case "appointment.rescheduled":
                    await this.handleAppointmentRescheduled(this.buildAppointmentRescheduledPayload(normalizedPayload, rawEvent));
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
        const consultationFeeRaw = payload?.consultationFee ||
            payload?.appointment?.consultationFee ||
            payload?.billing?.consultationFee;
        const consultationFee = this.toNumber(consultationFeeRaw, NaN);
        return {
            appointmentId: common.appointmentId,
            patientId: common.patientId || common.patientRecordId || common.patientCode || "",
            patientRecordId: common.patientRecordId,
            patientCode: common.patientCode,
            staffId: common.staffId,
            departmentId: common.departmentId,
            scheduledAt: common.scheduledAt,
            duration: payload?.duration ??
                payload?.durationMinutes ??
                payload?.expectedDuration ??
                30,
            status: "pending_payment",
            serviceType: this.normalizeServiceType(payload?.serviceType || payload?.type),
            consultationFee: Number.isFinite(consultationFee) && consultationFee > 0
                ? consultationFee
                : undefined,
            notes: payload?.notes || payload?.reason || undefined,
        };
    }
    buildAppointmentCancelledPayload(payload, rawEvent) {
        const common = this.extractCommonAppointmentFields(payload, rawEvent);
        return {
            appointmentId: common.appointmentId,
            patientId: common.patientId || common.patientRecordId || common.patientCode || "",
            patientRecordId: common.patientRecordId,
            patientCode: common.patientCode,
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
            patientId: common.patientId || common.patientRecordId || common.patientCode || "",
            patientRecordId: common.patientRecordId,
            patientCode: common.patientCode,
            staffId: common.staffId,
            departmentId: common.departmentId,
            scheduledAt: common.scheduledAt,
            noShowFeeApplied: this.toBoolean(payload?.noShowFeeApplied),
            noShowFeeAmount: this.toNumber(payload?.noShowFeeAmount),
            noShowCount: this.toNumber(payload?.noShowCount),
        };
    }
    buildAppointmentCancelledRefundPayload(payload, rawEvent) {
        const common = this.extractCommonAppointmentFields(payload, rawEvent);
        return {
            appointmentId: common.appointmentId,
            patientId: common.patientId || common.patientRecordId || common.patientCode || "",
            patientRecordId: common.patientRecordId,
            patientCode: common.patientCode,
            staffId: common.staffId,
            departmentId: common.departmentId,
            scheduledAt: common.scheduledAt,
            cancelledAt: this.safeDate(payload?.cancelledAt) ?? new Date(),
            cancellationReason: payload?.cancellationReason || payload?.reason || "Unknown reason",
            cancelledBy: payload?.cancelledBy || "system",
            cancellationPolicy: {
                penaltyApplied: this.toBoolean(payload?.cancellationPolicy?.penaltyApplied),
                refundEligible: this.toBoolean(payload?.cancellationPolicy?.refundEligible),
                rescheduleAllowed: this.toBoolean(payload?.cancellationPolicy?.rescheduleAllowed),
                penaltyAmount: this.toNumber(payload?.cancellationPolicy?.penaltyAmount),
                refundPercentage: this.toNumber(payload?.cancellationPolicy?.refundPercentage),
            },
        };
    }
    buildAppointmentRescheduledPayload(payload, rawEvent) {
        const common = this.extractCommonAppointmentFields(payload, rawEvent);
        const policy = payload?.reschedulePolicy || payload?.policy;
        return {
            appointmentId: common.appointmentId,
            patientId: common.patientId || common.patientRecordId || common.patientCode || "",
            patientRecordId: common.patientRecordId,
            patientCode: common.patientCode,
            staffId: common.staffId,
            departmentId: common.departmentId,
            originalStartTime: this.safeDate(payload?.originalStartTime) ??
                this.safeDate(payload?.oldStartTime),
            newStartTime: this.safeDate(payload?.newStartTime) ??
                this.safeDate(payload?.appointmentDate),
            rescheduledAt: this.safeDate(payload?.rescheduledAt) ?? new Date(),
            rescheduledBy: payload?.rescheduledBy || rawEvent?.userId || "system",
            reason: payload?.rescheduleReason || payload?.reason || "Đổi lịch hẹn",
            reschedulePolicy: policy
                ? {
                    feeApplied: this.toBoolean(policy?.feeApplied),
                    freeRescheduleUsed: this.toBoolean(policy?.freeRescheduleUsed),
                    remainingFreeReschedules: this.toNumber(policy?.remainingFreeReschedules),
                    rescheduleAmount: this.toNumber(policy?.rescheduleAmount),
                }
                : undefined,
        };
    }
    extractCommonAppointmentFields(payload, rawEvent) {
        const appointmentId = payload?.appointmentId ||
            payload?.appointment_id ||
            rawEvent?.aggregateId ||
            rawEvent?.appointmentId;
        const scheduledAt = this.resolveScheduledAt(payload);
        const patientId = payload?.patientId ||
            payload?.patient_id ||
            payload?.patientCode ||
            payload?.patient_code ||
            payload?.patient?.patientId ||
            payload?.patient?.patient_id ||
            rawEvent?.patientId ||
            rawEvent?.patient_id ||
            null;
        const patientRecordId = payload?.patientRecordId ||
            payload?.patient_record_id ||
            payload?.patient?.recordId ||
            payload?.patient?.id ||
            rawEvent?.patientRecordId ||
            rawEvent?.patient_record_id ||
            null;
        const patientCode = payload?.patientCode ||
            payload?.patient_code ||
            payload?.patient?.patientCode ||
            rawEvent?.patientCode ||
            rawEvent?.patient_code ||
            null;
        const staffId = payload?.staffId ||
            payload?.doctorId ||
            payload?.providerId ||
            payload?.staff_id ||
            payload?.doctor_id ||
            null;
        return {
            appointmentId,
            patientId,
            patientRecordId,
            patientCode,
            staffId,
            doctorName: payload?.doctorName ||
                payload?.doctor_name ||
                payload?.doctorFullName ||
                payload?.doctor?.name,
            doctorDepartment: payload?.departmentName ||
                payload?.department?.name ||
                payload?.doctorDepartment ||
                payload?.department_id ||
                null,
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
     * Best-effort enrichment to attach doctor name/department to appointment events.
     * Falls back to staffId/departmentId when profile lookup is unavailable.
     */
    async enrichDoctorInfo(data) {
        if (data.doctorName && data.doctorDepartment) {
            return data;
        }
        try {
            const staffId = data.staffId;
            if (staffId) {
                const profile = await this.staffRepository.findById(staffId);
                const personal = profile?.personal_info || {};
                const derivedName = personal.fullName ||
                    personal.full_name ||
                    personal.name ||
                    personal.displayName;
                const derivedDepartment = data.doctorDepartment ||
                    personal?.department?.name ||
                    personal?.departmentName ||
                    personal?.department;
                return {
                    ...data,
                    doctorName: data.doctorName || derivedName || staffId,
                    doctorDepartment: data.doctorDepartment ||
                        derivedDepartment ||
                        data.departmentId ||
                        undefined,
                };
            }
        }
        catch (error) {
            this.loggerInstance.warn("Doctor enrichment failed (non-blocking)", {
                appointmentId: data.appointmentId,
                staffId: data.staffId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
        return {
            ...data,
            doctorName: data.doctorName || data.staffId || undefined,
            doctorDepartment: data.doctorDepartment || data.departmentId || undefined,
        };
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
        const staffUuid = data.staffId && data.staffId.trim().length > 0
            ? await this.resolveStaffIdentifier(data.staffId)
            : null;
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
            this.cachePatientIdentifier(data.patientId, patientUuid);
            this.cachePatientIdentifier(data.patientRecordId, patientUuid);
            this.cachePatientIdentifier(data.patientCode, patientUuid);
            const enrichedData = await this.enrichDoctorInfo({
                ...data,
                staffId: staffUuid || data.staffId,
            });
            this.loggerInstance.info("Processing appointment scheduled for billing (Prepaid Model)", {
                appointmentId: enrichedData.appointmentId,
                patientId: patientUuid,
                staffId: staffUuid,
                serviceType: enrichedData.serviceType,
                doctorName: enrichedData.doctorName,
                doctorDepartment: enrichedData.doctorDepartment,
            });
            // Generate invoice based on service type
            // Invoice status will be PENDING (waiting for payment)
            const invoice = await this.billingService.generateAppointmentInvoice({
                appointmentId: enrichedData.appointmentId,
                patientId: patientUuid,
                staffId: staffUuid,
                departmentId: enrichedData.departmentId || "",
                doctorName: enrichedData.doctorName,
                doctorDepartment: enrichedData.doctorDepartment,
                serviceType: enrichedData.serviceType,
                scheduledAt: enrichedData.scheduledAt,
                duration: enrichedData.duration,
                consultationFee: enrichedData.consultationFee,
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
        const patientUuid = await this.resolvePatientUuidForEvent(data, "appointment.cancelled_late");
        if (!patientUuid) {
            return;
        }
        this.loggerInstance.info("Processing late cancellation fee", {
            appointmentId: data.appointmentId,
            patientId: patientUuid,
            lateFeeAmount: data.lateFeeAmount,
        });
        try {
            if (data.lateFeeApplied && data.lateFeeAmount > 0) {
                // Generate late cancellation fee invoice
                const feeInvoice = await this.billingService.generateLateCancellationFee({
                    appointmentId: data.appointmentId,
                    patientId: patientUuid,
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
        const patientUuid = await this.resolvePatientUuidForEvent(data, "appointment.no_show");
        if (!patientUuid) {
            return;
        }
        this.loggerInstance.info("Processing no-show fee", {
            appointmentId: data.appointmentId,
            patientId: patientUuid,
            noShowCount: data.noShowCount,
            noShowFeeAmount: data.noShowFeeAmount,
        });
        try {
            if (data.noShowFeeApplied && data.noShowFeeAmount > 0) {
                // Generate no-show fee invoice
                const feeInvoice = await this.billingService.generateNoShowFee({
                    appointmentId: data.appointmentId,
                    patientId: patientUuid,
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
     * Handle appointment rescheduled event (apply reschedule fee if required)
     */
    async handleAppointmentRescheduled(data) {
        if (!data) {
            this.loggerInstance.warn("Reschedule event missing payload");
            return;
        }
        const patientUuid = await this.resolvePatientUuidForEvent(data, "appointment.rescheduled");
        if (!patientUuid) {
            return;
        }
        const feeApplied = data.reschedulePolicy?.feeApplied &&
            Number(data.reschedulePolicy?.rescheduleAmount) > 0;
        if (!feeApplied) {
            this.loggerInstance.info("Reschedule event - no fee applied", {
                appointmentId: data.appointmentId,
            });
            return;
        }
        const amount = Number(data.reschedulePolicy?.rescheduleAmount || 0);
        try {
            await this.billingService.generateRescheduleFee({
                appointmentId: data.appointmentId,
                patientId: patientUuid,
                rescheduleAmount: amount,
                reason: data.reason || "Đổi lịch hẹn",
            });
            this.loggerInstance.info("Reschedule fee invoice created", {
                appointmentId: data.appointmentId,
                amount,
            });
        }
        catch (error) {
            this.loggerInstance.error("Failed to process reschedule fee", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Handle appointment cancelled event (refund case)
     * Simplified approach: Only handle billing refund logic
     */
    async handleAppointmentCancelled(data) {
        const patientUuid = await this.resolvePatientUuidForEvent(data, "appointment.cancelled");
        if (!patientUuid) {
            return;
        }
        this.loggerInstance.info("Processing appointment cancellation for refund", {
            appointmentId: data.appointmentId,
            patientId: patientUuid,
            refundEligible: data.cancellationPolicy.refundEligible,
            refundPercentage: data.cancellationPolicy.refundPercentage,
        });
        // Fallback: nếu payload không gửi policy, coi như đủ điều kiện hoàn 100%
        const refundEligible = data.cancellationPolicy.refundEligible !== undefined
            ? data.cancellationPolicy.refundEligible
            : true;
        const refundPercentage = data.cancellationPolicy.refundPercentage !== undefined
            ? data.cancellationPolicy.refundPercentage
            : 100;
        try {
            // Only process if refund is eligible
            if (refundEligible && refundPercentage > 0) {
                this.loggerInstance.info("Refund eligible - processing refund", {
                    appointmentId: data.appointmentId,
                    patientId: patientUuid,
                    refundPercentage,
                    reason: data.cancellationReason,
                });
                // Call RefundPaymentUseCase if available
                if (this.refundPaymentUseCase) {
                    const refundResult = await this.refundPaymentUseCase.execute({
                        appointmentId: data.appointmentId,
                        patientId: patientUuid,
                        refundPercentage,
                        reason: data.cancellationReason,
                        refundedBy: data.cancelledBy,
                    }, this.getSystemContext());
                    if (refundResult.success) {
                        this.loggerInstance.info("Refund processed successfully", {
                            appointmentId: data.appointmentId,
                            refundAmount: refundResult.refundAmount,
                        });
                    }
                    else {
                        this.loggerInstance.error("Refund processing failed", {
                            appointmentId: data.appointmentId,
                            errors: refundResult.errors,
                        });
                    }
                }
                else {
                    this.loggerInstance.warn("RefundPaymentUseCase not available - skipping refund", {
                        appointmentId: data.appointmentId,
                    });
                }
            }
            // Persist cancellation metadata on existing invoices to improve UX
            const cancelledInvoices = await this.invoiceRepository.findAllByAppointmentId(data.appointmentId);
            for (const inv of cancelledInvoices) {
                inv.setMetadata({
                    cancellationReason: data.cancellationReason,
                    cancelledBy: data.cancelledBy,
                });
                await this.invoiceRepository.save(inv);
            }
            // Handle penalty if applied
            if (data.cancellationPolicy.penaltyApplied &&
                data.cancellationPolicy.penaltyAmount &&
                data.cancellationPolicy.penaltyAmount > 0) {
                this.loggerInstance.info("Penalty applied - generating penalty invoice", {
                    appointmentId: data.appointmentId,
                    patientId: patientUuid,
                    penaltyAmount: data.cancellationPolicy.penaltyAmount,
                });
                // Generate penalty invoice
                const penaltyInvoice = await this.billingService.generateLateCancellationFee({
                    appointmentId: data.appointmentId,
                    patientId: patientUuid,
                    cancelledAt: data.cancelledAt,
                    reason: data.cancellationReason,
                    feeAmount: data.cancellationPolicy.penaltyAmount,
                });
                this.loggerInstance.info("Penalty invoice generated", {
                    appointmentId: data.appointmentId,
                    invoiceId: penaltyInvoice.id,
                    penaltyAmount: data.cancellationPolicy.penaltyAmount,
                });
            }
        }
        catch (error) {
            this.loggerInstance.error("Failed to process appointment cancellation", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Build a minimal system context for healthcare use cases invoked from event consumers.
     * Prevents "User context required" errors while keeping audit metadata consistent.
     */
    getSystemContext() {
        return {
            userId: "system",
            role: "system",
            timestamp: new Date(),
            correlationId: undefined,
        };
    }
    /**
     * Resolve canonical patient UUID for downstream billing operations.
     */
    async resolvePatientUuidForEvent(data, context) {
        const directRecordId = data.patientRecordId;
        if (directRecordId && this.isUUID(directRecordId)) {
            this.cachePatientIdentifier(data.patientId, directRecordId);
            this.cachePatientIdentifier(data.patientCode, directRecordId);
            return directRecordId;
        }
        const candidatePatientId = data.patientId;
        if (candidatePatientId && this.isUUID(candidatePatientId)) {
            this.cachePatientIdentifier(candidatePatientId, candidatePatientId);
            this.cachePatientIdentifier(data.patientRecordId, candidatePatientId);
            this.cachePatientIdentifier(data.patientCode, candidatePatientId);
            return candidatePatientId;
        }
        const cached = [data.patientId, data.patientRecordId, data.patientCode]
            .filter((key) => Boolean(key))
            .map((key) => this.patientIdCache.get(key))
            .find((value) => Boolean(value));
        if (cached) {
            this.cachePatientIdentifier(data.patientId, cached);
            this.cachePatientIdentifier(data.patientCode, cached);
            return cached;
        }
        const lookupId = data.patientRecordId || data.patientId || data.patientCode;
        if (!lookupId) {
            this.loggerInstance.error("Missing patient identifier in event", {
                context,
            });
            return null;
        }
        try {
            const patient = await this.patientRepository.findById(lookupId);
            if (!patient) {
                this.loggerInstance.error("Patient not found while processing appointment event", { context, lookupId });
                return null;
            }
            this.cachePatientIdentifier(lookupId, patient.id);
            this.cachePatientIdentifier(data.patientId, patient.id);
            this.cachePatientIdentifier(data.patientCode, patient.id);
            this.cachePatientIdentifier(data.patientRecordId, patient.id);
            return patient.id;
        }
        catch (error) {
            this.loggerInstance.error("Failed to resolve patient identifier for event", {
                context,
                lookupId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            return null;
        }
    }
    cachePatientIdentifier(identifier, resolvedUuid) {
        if (!identifier || !resolvedUuid) {
            return;
        }
        this.patientIdCache.set(identifier, resolvedUuid);
    }
    isUUID(value) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
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