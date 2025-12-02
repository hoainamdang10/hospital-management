"use strict";
/**
 * Appointment Event Consumer - Infrastructure Layer
 * Consumes appointment events from Appointments Service
 * Handles appointment notifications, reminders, confirmations, and status updates
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
exports.AppointmentEventConsumer = void 0;
const priority_normalizer_1 = require("../../domain/services/priority-normalizer");
/**
 * AppointmentEventConsumer - Handles appointment events for notifications
 */
class AppointmentEventConsumer {
    constructor(config, sendNotificationUseCase, getNotificationPreferencesUseCase, createAppointmentRemindersUseCase, appointmentReminderRepo, inboxRepo) {
        this.config = config;
        this.sendNotificationUseCase = sendNotificationUseCase;
        this.getNotificationPreferencesUseCase = getNotificationPreferencesUseCase;
        this.createAppointmentRemindersUseCase = createAppointmentRemindersUseCase;
        this.appointmentReminderRepo = appointmentReminderRepo;
        this.inboxRepo = inboxRepo;
        this.isConnected = false;
        this.reconnecting = false;
    }
    /**
     * Connect to RabbitMQ and start consuming
     */
    async connect() {
        const maxAttempts = Math.max(1, this.config.retryAttempts || 3);
        const retryDelay = this.config.retryDelayMs || 1000;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log("Connecting to RabbitMQ for Appointment events", {
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
                    await this.channel.bindQueue(this.config.queueName, this.config.exchangeName, routingKey);
                    console.log("Queue bound to routing key", {
                        queueName: this.config.queueName,
                        routingKey,
                    });
                }
                this.channel.prefetch(this.config.prefetchCount || 10);
                // Start consuming
                await this.channel.consume(this.config.queueName, this.handleMessage.bind(this), { noAck: false });
                this.isConnected = true;
                console.log("Appointment event consumer connected successfully");
                return;
            }
            catch (error) {
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
                console.log(`Retrying appointment consumer connection in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
    setupConnectionListeners() {
        if (!this.connection) {
            return;
        }
        this.connection.on("error", (error) => {
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
    triggerReconnect() {
        if (this.reconnecting) {
            return;
        }
        this.reconnecting = true;
        const delay = this.config.retryDelayMs || 1000;
        setTimeout(() => {
            this.connect()
                .catch((error) => {
                console.error("Appointment event consumer reconnect failed", error);
            })
                .finally(() => {
                this.reconnecting = false;
            });
        }, delay);
    }
    async closeConnectionSilently() {
        try {
            await this.disconnect();
        }
        catch {
            // ignore cleanup failures during retry
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
            const content = msg.content.toString();
            const event = JSON.parse(content);
            const routingKey = msg.fields.routingKey;
            const payload = event.payload ?? event.data ?? event.eventData ?? event;
            // Idempotency check
            const eventId = event.eventId || event.id || event.metadata?.eventId;
            if (!eventId) {
                console.error("[AppointmentEventConsumer] Missing eventId, cannot process:", event);
                this.channel?.ack(msg);
                return;
            }
            if (routingKey.startsWith("appointment.")) {
                const appointmentId = payload?.appointmentId || event.eventData?.appointmentId;
                if (!appointmentId) {
                    console.error("[AppointmentEventConsumer] Missing appointmentId in payload", { eventId, routingKey, event });
                    this.channel?.ack(msg);
                    return;
                }
                // Normalize payload with appointmentId ensured
                payload.appointmentId = appointmentId;
            }
            if (await this.inboxRepo.exists(eventId)) {
                console.debug(`[AppointmentEventConsumer] Duplicate event ${eventId}, skipping`);
                this.channel?.ack(msg);
                return;
            }
            console.log(`[AppointmentEventConsumer] Processing event: ${routingKey} (${eventId})`);
            let handled = false;
            // Route to appropriate handler
            // ✅ MVP SCOPE: Only handle core booking + payment flow
            if (routingKey.startsWith("appointment.reminder")) {
                await this.handleAppointmentReminder(payload);
                handled = true;
            }
            else {
                switch (routingKey) {
                    case "appointment.scheduled":
                        await this.handleAppointmentScheduled(payload);
                        handled = true;
                        break;
                    case "appointment.confirmed":
                        await this.handleAppointmentConfirmed(payload);
                        handled = true;
                        break;
                    case "appointment.cancelled":
                        await this.handleAppointmentCancelled(payload);
                        handled = true;
                        break;
                    case "appointment.rescheduled":
                        await this.handleAppointmentRescheduled(payload);
                        handled = true;
                        break;
                    case "appointment.completed":
                        await this.handleAppointmentCompleted(payload);
                        handled = true;
                        break;
                    // case 'appointment.no_show':
                    //   await this.handleAppointmentNoShow(event.payload as AppointmentNoShowEventData);
                    //   handled = true;
                    //   break;
                    default:
                        console.warn("[AppointmentEventConsumer] Unhandled routing key (may be out of MVP scope)", { routingKey });
                        break;
                }
            }
            if (handled) {
                // Store in inbox after successful processing
                await this.inboxRepo.store({
                    idempotencyKey: eventId,
                    eventType: routingKey,
                    payload: event,
                });
            }
            // Acknowledge message
            this.channel.ack(msg);
        }
        catch (error) {
            console.error("Error processing appointment event", {
                error: error instanceof Error ? error.message : "Unknown error",
                routingKey: msg.fields.routingKey,
            });
            // Check for non-retryable errors (e.g., validation errors, bad data)
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isNonRetryable = errorMessage.includes("định dạng") ||
                errorMessage.includes("Validation") ||
                errorMessage.includes("Invalid") ||
                errorMessage.includes("format");
            if (this.channel) {
                if (isNonRetryable) {
                    console.warn("[AppointmentEventConsumer] Non-retryable error detected, discarding message to prevent loop", {
                        routingKey: msg.fields.routingKey,
                        error: errorMessage,
                    });
                    // Do not requeue (false)
                    this.channel.nack(msg, false, false);
                }
                else {
                    // Requeue for transient errors
                    this.channel.nack(msg, false, true);
                }
            }
        }
    }
    /**
     * Handle appointment scheduled event
     *
     * ⚠️ REFACTORED FOR MVP:
     * - Send "yêu cầu đã nhận, vui lòng thanh toán" notification
     * - DO NOT create reminders yet (waiting for payment confirmation)
     * - Use new template: APPOINTMENT_SCHEDULED
     */
    async handleAppointmentScheduled(data) {
        console.log("[AppointmentEventConsumer] Processing appointment scheduled (PENDING_PAYMENT)", {
            appointmentId: data.appointmentId,
            patientId: data.patientId,
            doctorId: data.doctorId,
            status: data.status,
            appointmentDate: data.appointmentDate,
            appointmentTime: data.appointmentTime,
        });
        try {
            // ===== ONLY IF STATUS IS PENDING_PAYMENT =====
            // For prepaid flow, this is just initial booking notification
            // Real confirmation happens after payment
            // Get patient notification preferences
            const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.patientId,
                userType: "patient",
            });
            // Send initial booking notification to patient
            // ⚠️ UX CLEAR: "Yêu cầu đã nhận, vui lòng thanh toán trong 30 phút"
            await this.dispatchNotification({
                recipientId: data.patientId,
                recipientType: "PATIENT",
                recipientName: data.patientName,
                recipientEmail: patientPreferences?.preferences?.email,
                recipientPhone: patientPreferences?.preferences?.phoneNumber,
                templateType: "APPOINTMENT_SCHEDULED", // ✅ NEW template
                channels: ["EMAIL", "SMS"],
                priority: "NORMAL",
                data: {
                    patientName: data.patientName,
                    appointmentId: data.appointmentId,
                    doctorName: data.doctorName,
                    departmentName: data.departmentName,
                    appointmentDate: data.appointmentDate,
                    appointmentTime: data.appointmentTime,
                    consultationFee: data.consultationFee,
                    paymentDeadline: "30", // 30 minutes
                    statusMessage: "Yêu cầu đặt lịch đã được nhận. Vui lòng thanh toán để xác nhận lịch hẹn.",
                },
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    status: data.status,
                    flow: "prepaid_booking",
                },
            });
            console.log("[AppointmentEventConsumer] Appointment scheduled notification sent (payment pending)", {
                appointmentId: data.appointmentId,
                templateUsed: "APPOINTMENT_SCHEDULED",
            });
            // ❌ DO NOT create reminders here!
            // Reminders only created after payment confirmed (appointment.confirmed event)
            // See handleAppointmentConfirmed() method
            // ❌ DO NOT send urgent notifications in MVP
            // Focus on core booking + payment flow only
        }
        catch (error) {
            console.error("Failed to process appointment scheduled", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Handle appointment confirmed event (after payment completed)
     *
     * ✅ REFACTORED FOR MVP:
     * - Send "lịch hẹn đã được xác nhận" notification
     * - Create appointment reminders (24H, 2H, 30M)
     * - Notify both patient AND doctor
     * - Use new template: APPOINTMENT_CONFIRMED
     */
    async handleAppointmentConfirmed(data) {
        console.log("[AppointmentEventConsumer] Processing appointment confirmed (AFTER PAYMENT)", {
            appointmentId: data.appointmentId,
            patientId: data.patientId,
            doctorId: data.doctorId,
            confirmedBy: data.confirmedBy,
            confirmedAt: data.confirmedAt,
            previousStatus: data.previousStatus,
        });
        try {
            // ===== 1. Send confirmation notification to PATIENT =====
            const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.patientId,
                userType: "patient",
            });
            await this.dispatchNotification({
                recipientId: data.patientId,
                recipientType: "PATIENT",
                recipientName: data.patientName,
                recipientEmail: patientPreferences?.preferences?.email,
                recipientPhone: patientPreferences?.preferences?.phoneNumber,
                templateType: "APPOINTMENT_CONFIRMED", // ✅ NEW template
                channels: ["EMAIL", "SMS"],
                priority: "HIGH",
                data: {
                    patientName: data.patientName,
                    appointmentId: data.appointmentId,
                    doctorName: data.doctorName,
                    departmentName: data.departmentName || "Khoa Khám Bệnh",
                    appointmentDate: data.appointmentDate,
                    appointmentTime: data.appointmentTime,
                    durationMinutes: data.durationMinutes || 30,
                    consultationFee: data.consultationFee || 0,
                    confirmedAt: data.confirmedAt,
                    statusMessage: "Lịch hẹn của bạn đã được xác nhận. Vui lòng đến đúng giờ.",
                },
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    confirmedBy: data.confirmedBy,
                    flow: "prepaid_confirmation",
                },
            });
            console.log("[AppointmentEventConsumer] Patient confirmation sent", {
                appointmentId: data.appointmentId,
                patientId: data.patientId,
            });
            // ===== 2. Send notification to DOCTOR =====
            const doctorPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.doctorId,
                userType: "staff",
            });
            await this.dispatchNotification({
                recipientId: data.doctorId,
                recipientType: "DOCTOR",
                recipientName: data.doctorName,
                recipientEmail: doctorPreferences?.preferences?.email,
                templateType: "APPOINTMENT_CONFIRMED",
                channels: ["EMAIL", "IN_APP"],
                priority: "NORMAL",
                data: {
                    doctorName: data.doctorName,
                    patientName: data.patientName,
                    appointmentId: data.appointmentId,
                    appointmentDate: data.appointmentDate,
                    appointmentTime: data.appointmentTime,
                    durationMinutes: data.durationMinutes || 30,
                    confirmedAt: data.confirmedAt,
                },
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    recipientRole: "doctor",
                },
            });
            console.log("[AppointmentEventConsumer] Doctor confirmation sent", {
                appointmentId: data.appointmentId,
                doctorId: data.doctorId,
            });
            // ===== 3. Create appointment reminders (24H, 2H, 30M) =====
            try {
                // ✅ PROPER FIX: Use typed adapter for compile-time safety
                const { AppointmentEventAdapter } = await Promise.resolve().then(() => __importStar(require("./adapters/AppointmentEventAdapter")));
                const patientPhone = patientPreferences?.preferences?.phoneNumber;
                const patientEmail = patientPreferences?.preferences?.email;
                if (!patientPhone && !patientEmail) {
                    console.warn("[AppointmentEventConsumer] Skip creating reminders (no contact info)", { appointmentId: data.appointmentId });
                    throw new Error("No contact info for reminders");
                }
                const remindersRequest = AppointmentEventAdapter.toCreateRemindersRequest(data, patientPreferences?.preferences);
                // ✅ Runtime validation (optional but recommended)
                const validation = AppointmentEventAdapter.validateRemindersRequest(remindersRequest);
                if (!validation.valid) {
                    console.error("[AppointmentEventConsumer] Invalid reminders request", {
                        appointmentId: data.appointmentId,
                        errors: validation.errors,
                    });
                    throw new Error(`Invalid reminders request: ${validation.errors.join(", ")}`);
                }
                // ✅ Execute with type-safe request
                const result = await this.createAppointmentRemindersUseCase.execute(remindersRequest);
                if (result.success) {
                    console.log("[AppointmentEventConsumer] Reminders created successfully", {
                        appointmentId: data.appointmentId,
                        remindersCreated: result.created,
                        reminderTypes: ["24H", "2H", "30M"],
                    });
                }
                else {
                    console.error("[AppointmentEventConsumer] Failed to create reminders", {
                        appointmentId: data.appointmentId,
                        error: result.message,
                    });
                    throw new Error(result.message || "Failed to create reminders");
                }
            }
            catch (reminderError) {
                console.error("[AppointmentEventConsumer] Failed to create reminders (non-critical)", {
                    appointmentId: data.appointmentId,
                    error: reminderError instanceof Error
                        ? reminderError.message
                        : "Unknown error",
                });
                // Don't throw - confirmation already sent, reminders are non-critical
            }
            console.log("[AppointmentEventConsumer] Appointment confirmed flow completed", {
                appointmentId: data.appointmentId,
                notificationsSent: 2, // patient + doctor
                remindersCreated: 3, // 24H, 2H, 30M
            });
        }
        catch (error) {
            console.error("[AppointmentEventConsumer] Failed to process appointment confirmed", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Handle appointment cancelled event
     *
     * ✅ REFACTORED FOR MVP:
     * - Send cancellation notification (payment timeout or user cancellation)
     * - Cancel all pending reminders
     * - Notify both patient AND doctor
     * - Use new template: APPOINTMENT_CANCELLED
     */
    async handleAppointmentCancelled(data) {
        console.log("[AppointmentEventConsumer] Processing appointment cancelled", {
            appointmentId: data.appointmentId,
            patientId: data.patientId,
            cancelledBy: data.cancelledBy,
            cancellationReason: data.cancellationReason,
        });
        try {
            // ===== 1. Cancel all pending reminders for this appointment =====
            try {
                await this.appointmentReminderRepo.cancelByAppointmentId(data.appointmentId, data.cancellationReason, data.cancelledBy);
                console.log("[AppointmentEventConsumer] Reminders cancelled", {
                    appointmentId: data.appointmentId,
                });
            }
            catch (reminderError) {
                console.error("[AppointmentEventConsumer] Error cancelling reminders (non-critical)", {
                    error: reminderError instanceof Error
                        ? reminderError.message
                        : "Unknown",
                });
                // Don't throw - continue with notification
            }
            // ===== 2. Send cancellation notification to PATIENT =====
            const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.patientId,
                userType: "patient",
            });
            await this.dispatchNotification({
                recipientId: data.patientId,
                recipientType: "PATIENT",
                recipientName: data.patientName,
                recipientEmail: patientPreferences?.preferences?.email,
                recipientPhone: patientPreferences?.preferences?.phoneNumber,
                templateType: "APPOINTMENT_CANCELLED", // ✅ NEW template
                channels: ["EMAIL", "SMS"],
                priority: "HIGH",
                data: {
                    patientName: data.patientName,
                    appointmentId: data.appointmentId,
                    doctorName: data.doctorName,
                    appointmentDate: data.appointmentDate,
                    appointmentTime: data.appointmentTime,
                    cancellationReason: data.cancellationReason,
                    cancelledBy: data.cancelledBy,
                    cancelledAt: data.cancelledAt,
                    refundAmount: data.refundAmount || 0,
                    statusMessage: data.cancellationReason.includes("Payment timeout") ||
                        data.cancellationReason.includes("payment") ||
                        data.cancellationReason.includes("thanh toán")
                        ? "Lịch hẹn đã bị hủy do không thanh toán đúng hạn."
                        : "Lịch hẹn của bạn đã bị hủy.",
                },
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    cancelledBy: data.cancelledBy,
                    reason: data.cancellationReason,
                },
            });
            console.log("[AppointmentEventConsumer] Patient cancellation notification sent", {
                appointmentId: data.appointmentId,
                patientId: data.patientId,
            });
            // ===== 3. Send cancellation notification to DOCTOR =====
            const doctorPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.doctorId,
                userType: "staff",
            });
            await this.dispatchNotification({
                recipientId: data.doctorId,
                recipientType: "DOCTOR",
                recipientName: data.doctorName,
                recipientEmail: doctorPreferences?.preferences?.email,
                templateType: "APPOINTMENT_CANCELLED",
                channels: ["EMAIL", "IN_APP"],
                priority: "NORMAL",
                data: {
                    doctorName: data.doctorName,
                    patientName: data.patientName,
                    appointmentId: data.appointmentId,
                    appointmentDate: data.appointmentDate,
                    appointmentTime: data.appointmentTime,
                    cancellationReason: data.cancellationReason,
                    cancelledBy: data.cancelledBy,
                },
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    recipientRole: "doctor",
                },
            });
            console.log("[AppointmentEventConsumer] Doctor cancellation notification sent", {
                appointmentId: data.appointmentId,
                doctorId: data.doctorId,
            });
            console.log("[AppointmentEventConsumer] Appointment cancelled flow completed", {
                appointmentId: data.appointmentId,
                notificationsSent: 2, // patient + doctor
                remindersCancelled: true,
            });
        }
        catch (error) {
            console.error("[AppointmentEventConsumer] Failed to process appointment cancelled", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Handle appointment completed event
     */
    async handleAppointmentCompleted(data) {
        console.log("Processing appointment completed for notifications", {
            appointmentId: data.appointmentId,
            patientId: data.patientId,
            completedBy: data.completedBy,
            outcome: data.outcome,
            followUpRequired: data.followUpRequired,
        });
        try {
            // Send completion notification to patient
            const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.patientId,
                userType: "patient",
            });
            await this.sendAppointmentCompletedNotification(data, patientPreferences);
            // Send follow-up notification if required
            if (data.followUpRequired && data.followUpDate) {
                await this.sendFollowUpNotification(data, patientPreferences);
            }
            // Send prescription notification if provided
            if (data.prescriptionProvided) {
                await this.sendPrescriptionNotification(data, patientPreferences);
            }
            // Send lab test notification if ordered
            if (data.labTestsOrdered) {
                await this.sendLabTestNotification(data, patientPreferences);
            }
        }
        catch (error) {
            console.error("Failed to process appointment completed", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Handle appointment rescheduled event
     */
    async handleAppointmentRescheduled(data) {
        // Normalize fields from appointments-service payload (originalStartTime/newStartTime)
        const originalDateTime = data.oldDate ||
            data.originalStartTime ||
            data.oldStartTime
            ? new Date(data.oldDate ||
                data.originalStartTime ||
                data.oldStartTime)
            : undefined;
        const newDateTime = data.newDate || data.newStartTime
            ? new Date(data.newDate || data.newStartTime)
            : undefined;
        const normalized = {
            ...data,
            oldDate: originalDateTime || data.oldDate || new Date(),
            oldTime: data.oldTime ||
                (originalDateTime
                    ? this.formatTime(originalDateTime)
                    : "Không xác định"),
            newDate: newDateTime || data.newDate || new Date(),
            newTime: data.newTime ||
                (newDateTime ? this.formatTime(newDateTime) : "Không xác định"),
            reason: data.reason || data.rescheduleReason || "Đổi lịch hẹn",
        };
        console.log("Processing appointment rescheduled for notifications", {
            appointmentId: normalized.appointmentId,
            patientId: normalized.patientId,
            oldDate: normalized.oldDate,
            oldTime: normalized.oldTime,
            newDate: normalized.newDate,
            newTime: normalized.newTime,
            rescheduledBy: normalized.rescheduledBy,
        });
        try {
            // Send reschedule notification to patient
            const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.patientId,
                userType: "patient",
            });
            await this.sendAppointmentRescheduledNotification(normalized, patientPreferences);
            // Send reschedule notification to doctor
            const doctorPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.doctorId,
                userType: "staff",
            });
            await this.sendDoctorAppointmentRescheduledNotification(normalized, doctorPreferences);
            // Update reminder schedules for new time
            await this.updateReminderSchedules(normalized, patientPreferences);
        }
        catch (error) {
            console.error("Failed to process appointment rescheduled", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Handle appointment reminder event
     */
    async handleAppointmentReminder(data) {
        const normalized = {
            ...data,
            appointmentDate: data.appointmentDate instanceof Date
                ? data.appointmentDate
                : new Date(data.appointmentDate),
            reminderSentAt: data.reminderSentAt instanceof Date
                ? data.reminderSentAt
                : new Date(data.reminderSentAt || Date.now()),
        };
        console.log("Processing appointment reminder for notifications", {
            appointmentId: normalized.appointmentId,
            patientId: normalized.patientId,
            reminderType: normalized.reminderType,
            appointmentDate: normalized.appointmentDate,
            appointmentTime: normalized.appointmentTime,
        });
        try {
            // Get patient notification preferences
            const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: normalized.patientId,
                userType: "patient",
            });
            // Send reminder notification to patient
            await this.sendAppointmentReminderNotification(normalized, patientPreferences);
            // Send reminder to doctor for specific reminder types
            if (normalized.reminderType === "2_hours" ||
                normalized.reminderType === "30_minutes") {
                const doctorPreferences = await this.getNotificationPreferencesUseCase.execute({
                    userId: normalized.doctorId,
                    userType: "staff",
                });
                await this.sendDoctorReminderNotification(normalized, doctorPreferences);
            }
        }
        catch (error) {
            console.error("Failed to process appointment reminder", {
                appointmentId: normalized.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Handle appointment no-show event
     */
    async handleAppointmentNoShow(data) {
        console.log("Processing appointment no-show for notifications", {
            appointmentId: data.appointmentId,
            patientId: data.patientId,
            markedBy: data.markedBy,
            noShowFee: data.noShowFee,
        });
        try {
            // Send no-show notification to patient
            const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.patientId,
                userType: "patient",
            });
            await this.sendNoShowNotification(data, patientPreferences);
            // Send no-show notification to doctor
            const doctorPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.doctorId,
                userType: "staff",
            });
            await this.sendDoctorNoShowNotification(data, doctorPreferences);
            // Send reschedule offer if applicable
            if (data.rescheduleOffered) {
                await this.sendRescheduleOffer(data, patientPreferences);
            }
        }
        catch (error) {
            console.error("Failed to process appointment no-show", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Send appointment confirmation to patient
     */
    async sendAppointmentConfirmationToPatient(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.patientId,
                recipientType: "patient",
                type: "appointment_confirmation",
                title: "Xác nhận lịch hẹn thành công",
                content: this.generateAppointmentConfirmationContent(data),
                channels: this.getEnabledChannels(preferences, [
                    "email",
                    "sms",
                    "in_app",
                ]),
                priority: this.mapPriority(data.priority || "NORMAL"),
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    appointmentDate: data.appointmentDate,
                    appointmentTime: data.appointmentTime,
                    doctorName: data.doctorName,
                    departmentName: data.departmentName,
                    consultationFee: data.consultationFee,
                },
                templateData: {
                    patientName: data.patientName,
                    doctorName: data.doctorName,
                    departmentName: data.departmentName,
                    appointmentDate: this.formatDate(data.appointmentDate),
                    appointmentTime: data.appointmentTime,
                    consultationFee: data.consultationFee,
                },
            };
            await this.dispatchNotification(notificationData);
            console.log("Sent appointment confirmation to patient", {
                appointmentId: data.appointmentId,
                patientId: data.patientId,
            });
        }
        catch (error) {
            console.error("Failed to send appointment confirmation to patient", {
                appointmentId: data.appointmentId,
                patientId: data.patientId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send appointment notification to doctor
     */
    async sendAppointmentNotificationToDoctor(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.doctorId,
                recipientType: "staff",
                type: "new_appointment",
                title: "Lịch hẹn mới",
                content: this.generateDoctorAppointmentContent(data),
                channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
                priority: this.mapPriority(data.priority),
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    patientId: data.patientId,
                    patientName: data.patientName,
                    appointmentDate: data.appointmentDate,
                    appointmentTime: data.appointmentTime,
                    departmentName: data.departmentName,
                },
                templateData: {
                    doctorName: data.doctorName,
                    patientName: data.patientName,
                    appointmentDate: this.formatDate(data.appointmentDate),
                    appointmentTime: data.appointmentTime,
                    departmentName: data.departmentName,
                },
            };
            await this.dispatchNotification(notificationData);
            console.log("Sent appointment notification to doctor", {
                appointmentId: data.appointmentId,
                doctorId: data.doctorId,
            });
        }
        catch (error) {
            console.error("Failed to send appointment notification to doctor", {
                appointmentId: data.appointmentId,
                doctorId: data.doctorId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send urgent appointment notification
     */
    async sendUrgentAppointmentNotification(data) {
        try {
            const notificationData = {
                recipientId: data.departmentId,
                recipientType: "department",
                type: "urgent_appointment",
                title: "Lịch hẹn khẩn cấp",
                content: `Lịch hẹn khẩn cấp đã được đặt cho bệnh nhân ${data.patientName} với bác sĩ ${data.doctorName} vào lúc ${this.formatDate(data.appointmentDate)} ${data.appointmentTime}`,
                channels: ["in_app", "email"],
                priority: "urgent",
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    patientId: data.patientId,
                    doctorId: data.doctorId,
                    urgency: data.priority,
                },
            };
            await this.dispatchNotification(notificationData);
            console.log("Sent urgent appointment notification", {
                appointmentId: data.appointmentId,
                departmentId: data.departmentId,
            });
        }
        catch (error) {
            console.error("Failed to send urgent appointment notification", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Schedule appointment reminders (creates reminder records in database)
     */
    async scheduleAppointmentReminders(data, preferences) {
        try {
            // Extract patient contact info from preferences
            const patientPhone = preferences?.phoneNumber;
            const patientEmail = preferences?.email;
            const patientLanguage = preferences?.language || "vi";
            // Create reminder records using CreateAppointmentRemindersUseCase
            const result = await this.createAppointmentRemindersUseCase.execute({
                appointmentId: data.appointmentId,
                tenantId: "hospital-1",
                patientId: data.patientId,
                patientName: data.patientName,
                patientPhone,
                patientEmail,
                patientLanguage,
                doctorId: data.doctorId,
                doctorName: data.doctorName,
                doctorSpecialization: data.departmentName, // Using department as specialization
                appointmentDate: data.appointmentDate,
                appointmentTime: data.appointmentTime,
                appointmentType: data.type,
                reason: data.notes,
            });
            if (result.success) {
                console.log(`[AppointmentEventConsumer] Created ${result.created} reminder(s) for appointment ${data.appointmentId}`);
            }
            else {
                console.error(`[AppointmentEventConsumer] Failed to create reminders: ${result.message}`);
            }
        }
        catch (error) {
            console.error("Failed to schedule appointment reminders", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Generate appointment confirmation content
     */
    generateAppointmentConfirmationContent(data) {
        return `
      Kính gửi ${data.patientName},

      Lịch hẹn của bạn đã được xác nhận:
      - Bác sĩ: ${data.doctorName}
      - Khoa: ${data.departmentName}
      - Thời gian: ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime}
      - Phí khám: ${data.consultationFee.toLocaleString("vi-VN")} VNĐ

      Vui lòng đến trước 15 phút để hoàn tất thủ tục.

      Trân trọng,
      Bệnh viện
    `.trim();
    }
    /**
     * Generate doctor appointment content
     */
    generateDoctorAppointmentContent(data) {
        return `
      Bác sĩ ${data.doctorName},

      Bạn có lịch hẹn mới:
      - Bệnh nhân: ${data.patientName}
      - Khoa: ${data.departmentName}
      - Thời gian: ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime}
      - Mức độ ưu tiên: ${data.priority}

      Vui lòng kiểm tra thông tin chi tiết trong hệ thống.
    `.trim();
    }
    /**
     * Generate reminder content
     */
    generateReminderContent(data, reminderType) {
        const timeText = {
            "24_hours": "ngày mai",
            "2_hours": "sau 2 giờ",
            "30_minutes": "sau 30 phút",
        }[reminderType] || "sắp tới";
        return `
      Nhắc nhở: Bạn có lịch hẹn ${timeText}

      - Bác sĩ: ${data.doctorName}
      - Khoa: ${data.departmentName}
      - Thời gian: ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime}

      Vui lòng đến đúng giờ.
    `.trim();
    }
    /**
     * Get enabled channels based on preferences
     */
    getEnabledChannels(preferences, defaultChannels) {
        if (!preferences || !preferences.channels) {
            return defaultChannels;
        }
        return defaultChannels.filter((channel) => preferences.channels[channel] !== false);
    }
    /**
     * Map priority from appointment system to notification system
     */
    mapPriority(appointmentPriority) {
        const normalized = appointmentPriority?.toLowerCase?.() ?? "normal";
        const priorityMap = {
            emergency: "URGENT",
            urgent: "HIGH",
            high: "HIGH",
            normal: "NORMAL",
            low: "LOW",
        };
        return priorityMap[normalized] ?? "NORMAL";
    }
    /**
     * Format date for Vietnamese locale
     */
    formatDate(date) {
        return date.toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }
    async dispatchNotification(payload) {
        await this.sendNotificationUseCase.execute({
            ...payload,
            priority: (0, priority_normalizer_1.normalizePriority)(payload.priority),
        });
    }
    formatTime(date) {
        return date.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
    }
    /**
     * Send appointment confirmed notification
     */
    async sendAppointmentConfirmedNotification(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.patientId,
                recipientType: "patient",
                type: "appointment_confirmed",
                title: "Lịch hẹn đã được xác nhận",
                content: `Lịch hẹn của bạn vào ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime} đã được xác nhận.`,
                channels: this.getEnabledChannels(preferences, [
                    "email",
                    "sms",
                    "in_app",
                ]),
                priority: this.mapPriority("NORMAL"),
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    confirmedBy: data.confirmedBy,
                    confirmedAt: data.confirmedAt,
                },
            };
            await this.dispatchNotification(notificationData);
        }
        catch (error) {
            console.error("Failed to send appointment confirmed notification", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send doctor appointment confirmed notification
     */
    async sendDoctorAppointmentConfirmedNotification(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.doctorId,
                recipientType: "staff",
                type: "appointment_confirmed",
                title: "Lịch hẹn đã được xác nhận",
                content: `Lịch hẹn với bệnh nhân ${data.patientName} vào ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime} đã được xác nhận.`,
                channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
                priority: "normal",
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    confirmedBy: data.confirmedBy,
                },
            };
            await this.dispatchNotification(notificationData);
        }
        catch (error) {
            console.error("Failed to send doctor appointment confirmed notification", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send appointment cancelled notification
     */
    async sendAppointmentCancelledNotification(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.patientId,
                recipientType: "patient",
                type: "appointment_cancelled",
                title: "Lịch hẹn đã bị hủy",
                content: `Lịch hẹn của bạn vào ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime} đã bị hủy. Lý do: ${data.cancellationReason}`,
                channels: this.getEnabledChannels(preferences, [
                    "email",
                    "sms",
                    "in_app",
                ]),
                priority: "high",
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    cancelledBy: data.cancelledBy,
                    cancellationReason: data.cancellationReason,
                },
            };
            await this.dispatchNotification(notificationData);
        }
        catch (error) {
            console.error("Failed to send appointment cancelled notification", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send doctor appointment cancelled notification
     */
    async sendDoctorAppointmentCancelledNotification(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.doctorId,
                recipientType: "staff",
                type: "appointment_cancelled",
                title: "Lịch hẹn đã bị hủy",
                content: `Lịch hẹn với bệnh nhân ${data.patientName} vào ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime} đã bị hủy.`,
                channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
                priority: "high",
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    cancelledBy: data.cancelledBy,
                },
            };
            await this.dispatchNotification(notificationData);
        }
        catch (error) {
            console.error("Failed to send doctor appointment cancelled notification", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send refund notification
     */
    async sendRefundNotification(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.patientId,
                recipientType: "patient",
                type: "refund_processed",
                title: "Hoàn tiền đã được xử lý",
                content: `Hoàn tiền ${data.refundAmount?.toLocaleString("vi-VN")} VNĐ đã được xử lý cho lịch hẹn đã hủy.`,
                channels: this.getEnabledChannels(preferences, ["email", "in_app"]),
                priority: "normal",
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    refundAmount: data.refundAmount,
                },
            };
            await this.dispatchNotification(notificationData);
        }
        catch (error) {
            console.error("Failed to send refund notification", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send appointment completed notification
     */
    async sendAppointmentCompletedNotification(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.patientId,
                recipientType: "patient",
                type: "appointment_completed",
                title: "Lịch hẹn đã hoàn thành",
                content: `Lịch hẹn của bạn vào ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime} đã hoàn thành. Kết quả: ${data.outcome}`,
                channels: this.getEnabledChannels(preferences, ["email", "in_app"]),
                priority: "normal",
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    completedBy: data.completedBy,
                    outcome: data.outcome,
                },
            };
            await this.dispatchNotification(notificationData);
        }
        catch (error) {
            console.error("Failed to send appointment completed notification", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send follow-up notification
     */
    async sendFollowUpNotification(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.patientId,
                recipientType: "patient",
                type: "follow_up_required",
                title: "Cần tái khám",
                content: `Bạn cần tái khám vào ${this.formatDate(data.followUpDate)}. Vui lòng đặt lịch hẹn mới.`,
                channels: this.getEnabledChannels(preferences, [
                    "email",
                    "sms",
                    "in_app",
                ]),
                priority: "high",
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    followUpDate: data.followUpDate,
                },
            };
            await this.dispatchNotification(notificationData);
        }
        catch (error) {
            console.error("Failed to send follow-up notification", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send prescription notification
     */
    async sendPrescriptionNotification(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.patientId,
                recipientType: "patient",
                type: "prescription_available",
                title: "Đơn thuốc đã sẵn sàng",
                content: "Đơn thuốc từ buổi khám của bạn đã sẵn sàng. Vui lòng đến nhà thuốc để lấy thuốc.",
                channels: this.getEnabledChannels(preferences, ["email", "in_app"]),
                priority: "normal",
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                },
            };
            await this.dispatchNotification(notificationData);
        }
        catch (error) {
            console.error("Failed to send prescription notification", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send lab test notification
     */
    async sendLabTestNotification(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.patientId,
                recipientType: "patient",
                type: "lab_tests_ordered",
                title: "Đã chỉ định xét nghiệm",
                content: "Bác sĩ đã chỉ định xét nghiệm. Vui lòng đến phòng xét nghiệm để thực hiện.",
                channels: this.getEnabledChannels(preferences, ["email", "in_app"]),
                priority: "normal",
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                },
            };
            await this.dispatchNotification(notificationData);
        }
        catch (error) {
            console.error("Failed to send lab test notification", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send appointment rescheduled notification
     */
    async sendAppointmentRescheduledNotification(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.patientId,
                recipientType: "patient",
                type: "appointment_rescheduled",
                title: "Lịch hẹn đã được dời",
                content: `Lịch hẹn của bạn đã được dời từ ${this.formatDate(data.oldDate)} lúc ${data.oldTime} sang ${this.formatDate(data.newDate)} lúc ${data.newTime}. Lý do: ${data.reason}`,
                channels: this.getEnabledChannels(preferences, [
                    "email",
                    "sms",
                    "in_app",
                ]),
                priority: "high",
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    oldDate: data.oldDate,
                    oldTime: data.oldTime,
                    newDate: data.newDate,
                    newTime: data.newTime,
                },
            };
            await this.dispatchNotification(notificationData);
        }
        catch (error) {
            console.error("Failed to send appointment rescheduled notification", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send doctor appointment rescheduled notification
     */
    async sendDoctorAppointmentRescheduledNotification(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.doctorId,
                recipientType: "staff",
                type: "appointment_rescheduled",
                title: "Lịch hẹn đã được dời",
                content: `Lịch hẹn với bệnh nhân ${data.patientName} đã được dời từ ${this.formatDate(data.oldDate)} lúc ${data.oldTime} sang ${this.formatDate(data.newDate)} lúc ${data.newTime}.`,
                channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
                priority: "high",
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    rescheduledBy: data.rescheduledBy,
                },
            };
            await this.dispatchNotification(notificationData);
        }
        catch (error) {
            console.error("Failed to send doctor appointment rescheduled notification", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Update reminder schedules (cancel old reminders and create new ones for rescheduled appointment)
     */
    async updateReminderSchedules(data, preferences) {
        try {
            // Cancel old reminders
            await this.appointmentReminderRepo.cancelByAppointmentId(data.appointmentId, `Appointment rescheduled: ${data.reason}`, data.rescheduledBy);
            console.log(`[AppointmentEventConsumer] Cancelled old reminder(s) for rescheduled appointment ${data.appointmentId}`);
            // Extract patient contact info from preferences
            const patientPhone = preferences?.phoneNumber;
            const patientEmail = preferences?.email;
            const patientLanguage = preferences?.language || "vi";
            if (!patientPhone && !patientEmail) {
                console.warn("[AppointmentEventConsumer] Skip reschedule reminders (no contact info)", { appointmentId: data.appointmentId });
                return;
            }
            // Create new reminder records for the new appointment time
            const createResult = await this.createAppointmentRemindersUseCase.execute({
                appointmentId: data.appointmentId,
                tenantId: "hospital-1",
                patientId: data.patientId,
                patientName: data.patientName,
                patientPhone,
                patientEmail,
                patientLanguage,
                doctorId: data.doctorId,
                doctorName: data.doctorName,
                doctorSpecialization: undefined, // Not available in reschedule event
                appointmentDate: data.newDate,
                appointmentTime: data.newTime,
                appointmentType: undefined,
                reason: data.reason,
            });
            if (createResult.success) {
                console.log(`[AppointmentEventConsumer] Created ${createResult.created} new reminder(s) for rescheduled appointment ${data.appointmentId}`);
            }
            else {
                console.error(`[AppointmentEventConsumer] Failed to create new reminders: ${createResult.message}`);
            }
        }
        catch (error) {
            console.error("Failed to update reminder schedules", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send appointment reminder notification
     */
    async sendAppointmentReminderNotification(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.patientId,
                recipientType: "patient",
                type: "appointment_reminder",
                title: "Nhắc nhở lịch hẹn",
                content: this.generateReminderContent(data, data.reminderType),
                channels: this.getEnabledChannels(preferences, [
                    "sms",
                    "email",
                    "in_app",
                ]),
                priority: "normal",
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    reminderType: data.reminderType,
                },
            };
            await this.dispatchNotification(notificationData);
        }
        catch (error) {
            console.error("Failed to send appointment reminder notification", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send doctor reminder notification
     */
    async sendDoctorReminderNotification(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.doctorId,
                recipientType: "staff",
                type: "appointment_reminder",
                title: "Nhắc nhở lịch hẹn",
                content: `Nhắc nhở: Bạn có lịch hẹn với bệnh nhân ${data.patientName} vào ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime}.`,
                channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
                priority: "normal",
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    reminderType: data.reminderType,
                },
            };
            await this.dispatchNotification(notificationData);
        }
        catch (error) {
            console.error("Failed to send doctor reminder notification", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send no-show notification
     */
    async sendNoShowNotification(data, preferences) {
        try {
            let content = `Bạn đã không đến lịch hẹn vào ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime}.`;
            if (data.noShowFee && data.noShowFee > 0) {
                content += ` Phí không đến: ${data.noShowFee.toLocaleString("vi-VN")} VNĐ.`;
            }
            const notificationData = {
                recipientId: data.patientId,
                recipientType: "patient",
                type: "appointment_no_show",
                title: "Không đến lịch hẹn",
                content,
                channels: this.getEnabledChannels(preferences, [
                    "email",
                    "sms",
                    "in_app",
                ]),
                priority: "high",
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                    noShowFee: data.noShowFee,
                },
            };
            await this.dispatchNotification(notificationData);
        }
        catch (error) {
            console.error("Failed to send no-show notification", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send doctor no-show notification
     */
    async sendDoctorNoShowNotification(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.doctorId,
                recipientType: "staff",
                type: "appointment_no_show",
                title: "Bệnh nhân không đến",
                content: `Bệnh nhân ${data.patientName} đã không đến lịch hẹn vào ${this.formatDate(data.appointmentDate)} lúc ${data.appointmentTime}.`,
                channels: this.getEnabledChannels(preferences, ["in_app", "email"]),
                priority: "normal",
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                },
            };
            await this.dispatchNotification(notificationData);
        }
        catch (error) {
            console.error("Failed to send doctor no-show notification", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send reschedule offer
     */
    async sendRescheduleOffer(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.patientId,
                recipientType: "patient",
                type: "reschedule_offer",
                title: "Đề nghị dời lịch hẹn",
                content: "Chúng tôi xin lỗi vì sự bất tiện. Bạn có thể đặt lịch hẹn mới mà không tốn phí.",
                channels: this.getEnabledChannels(preferences, ["email", "in_app"]),
                priority: "normal",
                scheduledAt: new Date(),
                metadata: {
                    appointmentId: data.appointmentId,
                },
            };
            await this.dispatchNotification(notificationData);
        }
        catch (error) {
            console.error("Failed to send reschedule offer", {
                appointmentId: data.appointmentId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
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
            console.log("Appointment event consumer disconnected successfully");
        }
        catch (error) {
            console.error("Failed to disconnect Appointment event consumer:", error);
            throw error;
        }
    }
    /**
     * Check if consumer is connected
     */
    isConsumerConnected() {
        return this.isConnected && !!this.channel && !!this.connection;
    }
}
exports.AppointmentEventConsumer = AppointmentEventConsumer;
//# sourceMappingURL=AppointmentEventConsumer.js.map