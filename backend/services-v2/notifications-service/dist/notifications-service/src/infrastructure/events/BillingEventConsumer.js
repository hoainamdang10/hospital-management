"use strict";
/**
 * Billing Event Consumer - Infrastructure Layer
 * Consumes billing events from Billing Service
 * Handles billing notifications, payment reminders, insurance updates, and financial alerts
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingEventConsumer = void 0;
/**
 * BillingEventConsumer - Handles billing events for notifications
 */
class BillingEventConsumer {
    constructor(config, sendNotificationUseCase, getNotificationPreferencesUseCase, inboxRepo) {
        this.config = config;
        this.sendNotificationUseCase = sendNotificationUseCase;
        this.getNotificationPreferencesUseCase = getNotificationPreferencesUseCase;
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
                console.log("Billing event consumer connected successfully");
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
                console.log(`Retrying billing consumer connection in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`);
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
                console.error("Billing event consumer reconnect failed", error);
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
            // Ignore cleanup failures during retries
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
                console.error("[BillingEventConsumer] Missing eventId, cannot process:", event);
                this.channel?.ack(msg);
                return;
            }
            if (routingKey.startsWith("billing.payment.") &&
                !(payload?.paymentId || event.eventData?.paymentId)) {
                console.error("[BillingEventConsumer] Missing paymentId in payload", {
                    eventId,
                    routingKey,
                    event,
                });
                this.channel?.ack(msg);
                return;
            }
            if (await this.inboxRepo.exists(eventId)) {
                console.debug(`[BillingEventConsumer] Duplicate event ${eventId}, skipping`);
                this.channel?.ack(msg);
                return;
            }
            console.log(`[BillingEventConsumer] Processing event: ${routingKey} (${eventId})`);
            // Route to appropriate handler
            switch (routingKey) {
                case "billing.insurance.coverage.verified":
                    await this.handleInsuranceCoverageVerified(event.payload);
                    break;
                case "billing.preauthorization.requested":
                    await this.handlePreAuthorizationRequested(event.payload);
                    break;
                case "billing.preauthorization.approved":
                    await this.handlePreAuthorizationApproved(event.payload);
                    break;
                case "billing.preauthorization.denied":
                    await this.handlePreAuthorizationDenied(event.payload);
                    break;
                case "billing.rate.updated":
                    await this.handleRateUpdated(payload);
                    break;
                case "billing.payment.completed":
                case "billing.payment.processed":
                    await this.handlePaymentProcessed(payload);
                    break;
                case "billing.invoice.generated":
                    await this.handleInvoiceGenerated(payload);
                    break;
                case "billing.payment.reminder.scheduled":
                    await this.handlePaymentReminderScheduled(payload);
                    break;
                case "billing.payment.reminder.due":
                    await this.handlePaymentReminderDue(payload);
                    break;
                case "billing.refund.processed":
                    await this.handleRefundProcessed(payload);
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
        }
        catch (error) {
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
    async handleInsuranceCoverageVerified(data) {
        console.log("Processing insurance coverage verification for notifications", {
            patientId: data.patientId,
            insuranceProvider: data.insuranceProvider,
            coverageStatus: data.coverageStatus,
            coverageAmount: data.coverageAmount,
        });
        try {
            // Get patient notification preferences
            const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.patientId,
                userType: "patient",
            });
            // Send insurance verification notification to patient
            await this.sendInsuranceVerificationNotification(data, patientPreferences);
            // Send special notification for partial or rejected coverage
            if (data.coverageStatus === "partial" ||
                data.coverageStatus === "rejected") {
                await this.sendCoverageIssueNotification(data, patientPreferences);
            }
            // Send notification to billing department for review
            if (data.coverageStatus === "rejected" ||
                data.coverageStatus === "pending") {
                await this.sendBillingReviewNotification(data);
            }
        }
        catch (error) {
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
    async handlePreAuthorizationRequested(data) {
        console.log("Processing pre-authorization request for notifications", {
            preAuthId: data.preAuthId,
            patientId: data.patientId,
            procedureType: data.procedureType,
            estimatedCost: data.estimatedCost,
            urgencyLevel: data.urgencyLevel,
        });
        try {
            // Get patient notification preferences
            const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.patientId,
                userType: "patient",
            });
            // Send pre-authorization request notification to patient
            await this.sendPreAuthRequestNotification(data, patientPreferences);
            // Send urgent pre-auth notification to physician
            if (data.urgencyLevel === "urgent" || data.urgencyLevel === "emergency") {
                const physicianPreferences = await this.getNotificationPreferencesUseCase.execute({
                    userId: data.physicianId,
                    userType: "staff",
                });
                await this.sendUrgentPreAuthNotification(data, physicianPreferences);
            }
            // Schedule follow-up reminder for expected response date
            await this.schedulePreAuthFollowUp(data, patientPreferences);
        }
        catch (error) {
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
    async handlePreAuthorizationApproved(data) {
        console.log("Processing pre-authorization approval for notifications", {
            preAuthId: data.preAuthId,
            patientId: data.patientId,
            procedureType: data.procedureType,
            approvedAmount: data.approvedAmount,
        });
        try {
            // Get patient notification preferences
            const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.patientId,
                userType: "patient",
            });
            // Send pre-authorization approval notification to patient
            await this.sendPreAuthApprovalNotification(data, patientPreferences);
            // Send approval notification to physician
            const physicianPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.physicianId,
                userType: "staff",
            });
            await this.sendPreAuthPhysicianApprovalNotification(data, physicianPreferences);
            // Send notification to billing department
            await this.sendPreAuthBillingNotification(data);
        }
        catch (error) {
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
    async handlePreAuthorizationDenied(data) {
        console.log("Processing pre-authorization denial for notifications", {
            preAuthId: data.preAuthId,
            patientId: data.patientId,
            procedureType: data.procedureType,
            denialReason: data.denialReason,
        });
        try {
            // Get patient notification preferences
            const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.patientId,
                userType: "patient",
            });
            // Send pre-authorization denial notification to patient
            await this.sendPreAuthDenialNotification(data, patientPreferences);
            // Send denial notification to physician
            const physicianPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.physicianId,
                userType: "staff",
            });
            await this.sendPreAuthPhysicianDenialNotification(data, physicianPreferences);
            // Send appeal deadline reminder if applicable
            if (data.appealDeadline) {
                await this.scheduleAppealReminder(data, patientPreferences);
            }
        }
        catch (error) {
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
    async handleRateUpdated(data) {
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
        }
        catch (error) {
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
     * ✅ REFACTORED FOR MVP:
     * - Send payment receipt when status = 'completed'
     * - Use new template: PAYMENT_COMPLETED
     * - Skip failed/refunded in MVP (future work)
     */
    async handlePaymentProcessed(data) {
        console.log("[BillingEventConsumer] Processing payment processed for notifications", {
            paymentId: data.paymentId,
            patientId: data.patientId,
            amount: data.amount,
            paymentStatus: data.paymentStatus,
            paymentMethod: data.paymentMethod,
        });
        try {
            // ===== GUARD: Only process completed payments in MVP =====
            if (data.paymentStatus !== "completed") {
                console.log("[BillingEventConsumer] Ignoring non-completed payment (MVP scope)", {
                    paymentId: data.paymentId,
                    paymentStatus: data.paymentStatus,
                });
                return;
            }
            // Get patient notification preferences
            const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.patientId,
                userType: "patient",
            });
            // ===== Send payment receipt notification =====
            await this.sendNotificationUseCase.execute({
                recipientId: data.patientId,
                recipientType: "PATIENT",
                recipientName: data.patientName,
                recipientEmail: patientPreferences?.preferences?.email,
                recipientPhone: patientPreferences?.preferences?.phoneNumber,
                templateType: "PAYMENT_COMPLETED", // ✅ NEW template
                channels: ["EMAIL"],
                priority: "NORMAL",
                data: {
                    patientName: data.patientName,
                    paymentId: data.paymentId,
                    appointmentId: data.appointmentId || "N/A",
                    amount: data.amount,
                    paymentMethod: data.paymentMethod,
                    transactionId: data.transactionId || data.paymentId,
                    completedAt: data.processedAt,
                    statusMessage: "Thanh toán thành công. Lịch hẹn của bạn đã được xác nhận.",
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
        }
        catch (error) {
            console.error("[BillingEventConsumer] Failed to process payment", {
                paymentId: data.paymentId,
                patientId: data.patientId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Handle invoice generated event
     */
    async handleInvoiceGenerated(data) {
        console.log("Processing invoice generation for notifications", {
            invoiceId: data.invoiceId,
            patientId: data.patientId,
            totalAmount: data.totalAmount,
            dueDate: data.dueDate,
            patientResponsibility: data.patientResponsibility,
        });
        try {
            // Get patient notification preferences
            const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.patientId,
                userType: "patient",
            });
            // Send invoice notification to patient
            await this.sendInvoiceNotification(data, patientPreferences);
            // Send high-value invoice notification to billing department
            if (data.totalAmount > 5000000) {
                // 5 million VND
                await this.sendHighValueInvoiceNotification(data);
            }
            // Schedule payment reminders
            await this.schedulePaymentReminders(data, patientPreferences);
        }
        catch (error) {
            console.error("Failed to process invoice generation", {
                invoiceId: data.invoiceId,
                patientId: data.patientId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Handle payment reminder scheduled event
     */
    async handlePaymentReminderScheduled(data) {
        console.log("Processing payment reminder scheduling for notifications", {
            reminderId: data.reminderId,
            patientId: data.patientId,
            invoiceId: data.invoiceId,
            reminderType: data.reminderType,
            scheduledFor: data.scheduledFor,
        });
        try {
            // Get patient notification preferences
            const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.patientId,
                userType: "patient",
            });
            // Send payment reminder notification
            await this.sendPaymentReminderNotification(data, patientPreferences);
            // Send final notice to billing department
            if (data.reminderType === "final_notice" ||
                data.reminderType === "overdue") {
                await this.sendOverdueAccountNotification(data);
            }
        }
        catch (error) {
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
    async handlePaymentReminderDue(data) {
        console.log("Processing payment reminder due for notifications", {
            invoiceId: data.invoiceId,
            patientId: data.patientId,
            reminderType: data.reminderType,
            daysBeforeDue: data.daysBeforeDue,
            totalAmount: data.totalAmount,
        });
        try {
            // Get patient notification preferences
            const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.patientId,
                userType: "patient",
            });
            // Determine notification priority and message based on reminder type
            let priority = "normal";
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
            await this.sendNotificationUseCase.execute({
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
        }
        catch (error) {
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
    async handleRefundProcessed(data) {
        console.log("Processing refund processing for notifications", {
            refundId: data.refundId,
            patientId: data.patientId,
            refundAmount: data.refundAmount,
            refundReason: data.refundReason,
            refundMethod: data.refundMethod,
        });
        try {
            // Get patient notification preferences
            const patientPreferences = await this.getNotificationPreferencesUseCase.execute({
                userId: data.patientId,
                userType: "patient",
            });
            // Send refund notification to patient
            await this.sendRefundProcessedNotification(data, patientPreferences);
            // Send refund notification to billing department
            await this.sendRefundDepartmentNotification(data);
        }
        catch (error) {
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
    async sendInsuranceVerificationNotification(data, preferences) {
        try {
            const statusText = {
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
            await this.sendNotificationUseCase.execute(notificationData);
            console.log("Sent insurance verification notification to patient", {
                patientId: data.patientId,
                coverageStatus: data.coverageStatus,
            });
        }
        catch (error) {
            console.error("Failed to send insurance verification notification", {
                patientId: data.patientId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send coverage issue notification
     */
    async sendCoverageIssueNotification(data, preferences) {
        try {
            let issueText = "";
            if (data.coverageStatus === "partial") {
                issueText = `Bảo hiểm chỉ chi trả một phần. Bạn cần thanh toán thêm: ${data.coPayment.toLocaleString("vi-VN")} VNĐ.`;
            }
            else if (data.coverageStatus === "rejected") {
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
            await this.sendNotificationUseCase.execute(notificationData);
        }
        catch (error) {
            console.error("Failed to send coverage issue notification", {
                patientId: data.patientId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send billing review notification
     */
    async sendBillingReviewNotification(data) {
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
            await this.sendNotificationUseCase.execute(notificationData);
        }
        catch (error) {
            console.error("Failed to send billing review notification", {
                patientId: data.patientId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send pre-authorization request notification to patient
     */
    async sendPreAuthRequestNotification(data, preferences) {
        try {
            const urgencyText = {
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
            await this.sendNotificationUseCase.execute(notificationData);
            console.log("Sent pre-authorization request notification to patient", {
                patientId: data.patientId,
                preAuthId: data.preAuthId,
            });
        }
        catch (error) {
            console.error("Failed to send pre-authorization request notification", {
                patientId: data.patientId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send urgent pre-authorization notification to physician
     */
    async sendUrgentPreAuthNotification(data, preferences) {
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
            await this.sendNotificationUseCase.execute(notificationData);
        }
        catch (error) {
            console.error("Failed to send urgent pre-authorization notification", {
                physicianId: data.physicianId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Schedule pre-authorization follow-up
     */
    async schedulePreAuthFollowUp(data, preferences) {
        try {
            const followUpDate = new Date(data.expectedResponseDate.getTime() + 24 * 60 * 60 * 1000); // 1 day after expected response
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
            await this.sendNotificationUseCase.execute(notificationData);
        }
        catch (error) {
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
    async sendPreAuthApprovalNotification(data, preferences) {
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
            await this.sendNotificationUseCase.execute(notificationData);
            console.log("Sent pre-authorization approval notification to patient", {
                patientId: data.patientId,
                preAuthId: data.preAuthId,
            });
        }
        catch (error) {
            console.error("Failed to send pre-authorization approval notification", {
                patientId: data.patientId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send pre-authorization approval notification to physician
     */
    async sendPreAuthPhysicianApprovalNotification(data, preferences) {
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
            await this.sendNotificationUseCase.execute(notificationData);
        }
        catch (error) {
            console.error("Failed to send pre-authorization physician approval notification", {
                physicianId: data.physicianId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send pre-authorization billing notification
     */
    async sendPreAuthBillingNotification(data) {
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
            await this.sendNotificationUseCase.execute(notificationData);
        }
        catch (error) {
            console.error("Failed to send pre-authorization billing notification", {
                preAuthId: data.preAuthId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send pre-authorization denial notification to patient
     */
    async sendPreAuthDenialNotification(data, preferences) {
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
            await this.sendNotificationUseCase.execute(notificationData);
            console.log("Sent pre-authorization denial notification to patient", {
                patientId: data.patientId,
                preAuthId: data.preAuthId,
            });
        }
        catch (error) {
            console.error("Failed to send pre-authorization denial notification", {
                patientId: data.patientId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send pre-authorization denial notification to physician
     */
    async sendPreAuthPhysicianDenialNotification(data, preferences) {
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
            await this.sendNotificationUseCase.execute(notificationData);
        }
        catch (error) {
            console.error("Failed to send pre-authorization physician denial notification", {
                physicianId: data.physicianId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Schedule appeal reminder
     */
    async scheduleAppealReminder(data, preferences) {
        try {
            if (!data.appealDeadline)
                return;
            const reminderDate = new Date(data.appealDeadline.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days before deadline
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
            await this.sendNotificationUseCase.execute(notificationData);
        }
        catch (error) {
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
    async sendRateUpdateNotification(data) {
        try {
            const changeAmount = data.newRate - data.oldRate;
            const changeText = changeAmount > 0
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
            await this.sendNotificationUseCase.execute(notificationData);
        }
        catch (error) {
            console.error("Failed to send rate update notification", {
                rateId: data.rateId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send patient rate change notifications
     */
    async sendPatientRateChangeNotifications(data) {
        try {
            if (!data.patientNotifications)
                return;
            for (const patientNotif of data.patientNotifications) {
                const changeAmount = patientNotif.newCost - patientNotif.oldCost;
                const changeText = changeAmount > 0
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
                await this.sendNotificationUseCase.execute(notificationData);
            }
        }
        catch (error) {
            console.error("Failed to send patient rate change notifications", {
                rateId: data.rateId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send physician rate change notifications
     */
    async sendPhysicianRateChangeNotifications(data) {
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
            await this.sendNotificationUseCase.execute(notificationData);
        }
        catch (error) {
            console.error("Failed to send physician rate change notifications", {
                rateId: data.rateId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send payment notification to patient
     */
    async sendPaymentNotification(data, preferences) {
        try {
            const statusText = {
                completed: "hoàn thành",
                failed: "thất bại",
                refunded: "đã hoàn tiền",
                partial_refund: "hoàn tiền một phần",
            }[data.paymentStatus] || data.paymentStatus;
            let content = `Thanh toán ${data.amount.toLocaleString("vi-VN")} VNĐ bằng ${data.paymentMethod} đã ${statusText}.`;
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
                priority: data.paymentStatus === "failed" ? "high" : "normal",
                scheduledAt: new Date(),
                metadata: {
                    patientId: data.patientId,
                    paymentId: data.paymentId,
                    paymentStatus: data.paymentStatus,
                    amount: data.amount,
                },
            };
            await this.sendNotificationUseCase.execute(notificationData);
            console.log("Sent payment notification to patient", {
                patientId: data.patientId,
                paymentId: data.paymentId,
                paymentStatus: data.paymentStatus,
            });
        }
        catch (error) {
            console.error("Failed to send payment notification", {
                patientId: data.patientId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send payment failure notification
     */
    async sendPaymentFailureNotification(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.patientId,
                recipientType: "patient",
                type: "payment_failed",
                title: "Thanh toán thất bại",
                content: `Thanh toán ${data.amount.toLocaleString("vi-VN")} VNĐ đã thất bại. Vui lòng kiểm tra thông tin thanh toán và thử lại hoặc liên hệ phòng kế toán.`,
                channels: this.getEnabledChannels(preferences, ["email", "sms"]),
                priority: "high",
                scheduledAt: new Date(),
                metadata: {
                    patientId: data.patientId,
                    paymentId: data.paymentId,
                    amount: data.amount,
                },
            };
            await this.sendNotificationUseCase.execute(notificationData);
        }
        catch (error) {
            console.error("Failed to send payment failure notification", {
                patientId: data.patientId,
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
                content: `Hoàn tiền ${data.refundAmount?.toLocaleString("vi-VN")} VNĐ đã được xử lý cho thanh toán #${data.paymentId}.`,
                channels: this.getEnabledChannels(preferences, ["email", "in_app"]),
                priority: "normal",
                scheduledAt: new Date(),
                metadata: {
                    patientId: data.patientId,
                    paymentId: data.paymentId,
                    refundAmount: data.refundAmount,
                },
            };
            await this.sendNotificationUseCase.execute(notificationData);
        }
        catch (error) {
            console.error("Failed to send refund notification", {
                patientId: data.patientId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send invoice notification to patient
     */
    async sendInvoiceNotification(data, preferences) {
        try {
            const notificationData = {
                recipientId: data.patientId,
                recipientType: "patient",
                type: "invoice_generated",
                title: "Hóa đơn mới",
                content: `Hóa đơn #${data.invoiceId} đã được tạo. Tổng cộng: ${data.totalAmount.toLocaleString("vi-VN")} VNĐ. Số tiền bạn cần thanh toán: ${data.patientResponsibility.toLocaleString("vi-VN")} VNĐ. Hạn thanh toán: ${this.formatDate(data.dueDate)}.`,
                channels: this.getEnabledChannels(preferences, ["email", "in_app"]),
                priority: data.patientResponsibility > 10000000 ? "high" : "normal", // High if > 10M VND
                scheduledAt: new Date(),
                metadata: {
                    patientId: data.patientId,
                    invoiceId: data.invoiceId,
                    totalAmount: data.totalAmount,
                    dueDate: data.dueDate,
                    patientResponsibility: data.patientResponsibility,
                },
            };
            await this.sendNotificationUseCase.execute(notificationData);
            console.log("Sent invoice notification to patient", {
                patientId: data.patientId,
                invoiceId: data.invoiceId,
            });
        }
        catch (error) {
            console.error("Failed to send invoice notification", {
                patientId: data.patientId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send high-value invoice notification
     */
    async sendHighValueInvoiceNotification(data) {
        try {
            const notificationData = {
                recipientId: "billing_department",
                recipientType: "department",
                type: "high_value_invoice",
                title: "Hóa đơn giá trị cao",
                content: `Hóa đơn giá trị cao đã được tạo cho bệnh nhân ${data.patientName}: ${data.totalAmount.toLocaleString("vi-VN")} VNĐ. Cần xem xét phương thức thanh toán.`,
                channels: ["in_app", "email"],
                priority: "high",
                scheduledAt: new Date(),
                metadata: {
                    patientId: data.patientId,
                    invoiceId: data.invoiceId,
                    totalAmount: data.totalAmount,
                },
            };
            await this.sendNotificationUseCase.execute(notificationData);
        }
        catch (error) {
            console.error("Failed to send high-value invoice notification", {
                invoiceId: data.invoiceId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Schedule payment reminders
     */
    async schedulePaymentReminders(data, preferences) {
        try {
            const reminderSchedule = [
                { type: "first_notice", daysBefore: 7 },
                { type: "second_notice", daysBefore: 3 },
                { type: "final_notice", daysBefore: 1 },
            ];
            for (const reminder of reminderSchedule) {
                const reminderDate = new Date(data.dueDate.getTime() - reminder.daysBefore * 24 * 60 * 60 * 1000);
                if (reminderDate > new Date()) {
                    const message = this.getReminderMessage(reminder.type, data.dueDate, data.patientResponsibility);
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
                            dueDate: data.dueDate,
                        },
                    };
                    await this.sendNotificationUseCase.execute(notificationData);
                }
            }
            console.log("Scheduled payment reminders", {
                invoiceId: data.invoiceId,
                patientId: data.patientId,
                remindersCount: reminderSchedule.length,
            });
        }
        catch (error) {
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
    async sendPaymentReminderNotification(data, preferences) {
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
                priority: data.reminderType === "final_notice" ||
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
            await this.sendNotificationUseCase.execute(notificationData);
            console.log("Sent payment reminder notification", {
                patientId: data.patientId,
                invoiceId: data.invoiceId,
                reminderType: data.reminderType,
            });
        }
        catch (error) {
            console.error("Failed to send payment reminder notification", {
                patientId: data.patientId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send overdue account notification
     */
    async sendOverdueAccountNotification(data) {
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
            await this.sendNotificationUseCase.execute(notificationData);
        }
        catch (error) {
            console.error("Failed to send overdue account notification", {
                invoiceId: data.invoiceId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send refund processed notification
     */
    async sendRefundProcessedNotification(data, preferences) {
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
            await this.sendNotificationUseCase.execute(notificationData);
            console.log("Sent refund processed notification to patient", {
                patientId: data.patientId,
                refundId: data.refundId,
            });
        }
        catch (error) {
            console.error("Failed to send refund processed notification", {
                patientId: data.patientId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Send refund department notification
     */
    async sendRefundDepartmentNotification(data) {
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
            await this.sendNotificationUseCase.execute(notificationData);
        }
        catch (error) {
            console.error("Failed to send refund department notification", {
                refundId: data.refundId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    /**
     * Helper methods
     */
    getEnabledChannels(preferences, defaultChannels) {
        if (!preferences || !preferences.channels) {
            return defaultChannels;
        }
        return defaultChannels.filter((channel) => preferences.channels[channel] !== false);
    }
    getReminderMessage(type, dueDate, amount) {
        const dueDateStr = this.formatDate(dueDate);
        const amountStr = amount.toLocaleString("vi-VN");
        const messages = {
            first_notice: `Nhắc nhở: Hóa đơn của bạn sẽ đến hạn vào ${dueDateStr}. Số tiền cần thanh toán: ${amountStr} VNĐ.`,
            second_notice: `Nhắc nhở quan trọng: Hóa đơn của bạn sẽ đến hạn vào ${dueDateStr}. Số tiền cần thanh toán: ${amountStr} VNĐ.`,
            final_notice: `CẢNH BÁO: Hóa đơn của bạn sẽ đến hạn vào ${dueDateStr}. Số tiền cần thanh toán: ${amountStr} VNĐ. Vui lòng thanh toán ngay để tránh phí trễ hạn.`,
        };
        return messages[type] || messages["first_notice"];
    }
    formatDate(date) {
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
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
            console.log("Billing event consumer disconnected successfully");
        }
        catch (error) {
            console.error("Error disconnecting billing event consumer", {
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
exports.BillingEventConsumer = BillingEventConsumer;
//# sourceMappingURL=BillingEventConsumer.js.map