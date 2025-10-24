"use strict";
/**
 * NotificationEventHandlers - Event Handlers
 * Event handlers for cross-service integration with Vietnamese healthcare context
 * Implements Inbox Pattern for idempotent event processing
 *
 * BOUNDED CONTEXT RESPONSIBILITIES:
 * ✅ IN SCOPE:
 *    - Receive scheduled notification events from Scheduler Service
 *    - Send immediate notifications from other services
 *    - Idempotent event processing (Inbox Pattern)
 *    - Multi-channel delivery (EMAIL, SMS, PUSH, IN_APP, VOICE)
 *    - Delivery tracking and retry logic
 *
 * ❌ OUT OF SCOPE:
 *    - Scheduling logic (belongs to Scheduler Service)
 *    - Business logic to create notifications (belongs to domain services)
 *    - User preferences management (belongs to Identity Service)
 *
 * EVENT FLOW:
 * 1. Scheduled Notifications:
 *    Appointments Service → Scheduler Service → (RabbitMQ) → Notifications Service
 *    - Appointments Service creates schedule via SchedulerServiceClient
 *    - Scheduler Service fires event when due
 *    - Notifications Service receives event and sends notification
 *
 * 2. Immediate Notifications:
 *    Any Service → Notifications Service (direct API call)
 *    - Service calls Notifications API directly
 *    - Notification sent immediately
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, Vietnamese Healthcare Standards, Inbox Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationEventHandlers = void 0;
class NotificationEventHandlers {
    constructor(notificationService, inboxRepo, sendNotificationUseCase) {
        this.notificationService = notificationService;
        this.inboxRepo = inboxRepo;
        this.sendNotificationUseCase = sendNotificationUseCase;
    }
    /**
     * Handle schedule run due event from Scheduler Service
     * This is the ONLY entry point for scheduled notifications
     * Implements Inbox Pattern for idempotent processing
     */
    async handleScheduleRunDue(event) {
        const idempotencyKey = event.headers.idempotency_key;
        try {
            // Step 1: Check if event is duplicate (Inbox Pattern)
            const result = await this.inboxRepo.processEventIdempotent(idempotencyKey, event.type, event.payload, event.headers);
            if (!result.isNew) {
                console.log(`[Inbox] Duplicate event ${idempotencyKey}, skipping`);
                return;
            }
            console.log(`[Inbox] New event ${idempotencyKey}, processing...`);
            // Step 2: Get inbox event and mark as processing
            const inboxEvent = await this.inboxRepo.findById(result.inboxId);
            if (!inboxEvent) {
                throw new Error(`Inbox event ${result.inboxId} not found`);
            }
            inboxEvent.markAsProcessing();
            await this.inboxRepo.update(inboxEvent);
            // Step 3: Send notification immediately
            await this.sendNotificationUseCase.execute({
                recipientId: event.payload.recipient.recipientId,
                recipientType: event.payload.recipient.recipientType,
                templateType: event.payload.template.templateType,
                templateData: event.payload.template.templateData,
                channels: event.payload.channels,
                priority: event.payload.priority,
                metadata: {
                    correlationId: event.headers.correlation_id || event.payload.metadata?.correlationId,
                    source: event.payload.metadata?.source || 'SCHEDULER_SERVICE',
                    tags: event.payload.metadata?.tags || [],
                    healthcareContext: event.payload.metadata?.healthcareContext
                }
            });
            // Step 4: Mark inbox event as completed
            inboxEvent.markAsCompleted();
            await this.inboxRepo.update(inboxEvent);
            console.log(`[Inbox] Event ${idempotencyKey} processed successfully`);
        }
        catch (error) {
            console.error(`[Inbox] Error processing event ${idempotencyKey}:`, error);
            // Mark inbox event as failed
            try {
                const inboxEvent = await this.inboxRepo.findByIdempotencyKey(idempotencyKey);
                if (inboxEvent) {
                    inboxEvent.markAsFailed(error instanceof Error ? error.message : 'Unknown error');
                    await this.inboxRepo.update(inboxEvent);
                }
            }
            catch (updateError) {
                console.error(`[Inbox] Failed to update inbox event ${idempotencyKey}:`, updateError);
            }
            throw new Error(`Lỗi xử lý sự kiện schedule run due: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Handle appointment scheduled event (IMMEDIATE CONFIRMATION ONLY)
     * NOTE: Reminder scheduling is handled by Appointments Service → Scheduler Service
     */
    async handleAppointmentScheduled(event) {
        try {
            const { appointmentId, patientId, doctorId, appointmentDate, appointmentTime, doctorName, roomNumber } = event.eventData;
            // Send immediate confirmation ONLY
            // Reminder scheduling is handled by Appointments Service calling Scheduler Service
            await this.notificationService.sendNotification({
                recipientId: patientId,
                recipientType: 'PATIENT',
                templateType: 'APPOINTMENT_CONFIRMATION',
                templateData: {
                    patientName: event.eventData.patientName || 'Quý khách',
                    appointmentDate: new Date(appointmentDate).toLocaleDateString('vi-VN'),
                    appointmentTime: appointmentTime,
                    doctorName: doctorName,
                    roomNumber: roomNumber || 'Sẽ thông báo sau',
                    hospitalName: 'Bệnh viện Đa khoa',
                    contactPhone: '1900-xxxx'
                },
                channels: ['EMAIL', 'SMS'],
                priority: 'NORMAL',
                metadata: {
                    correlationId: event.metadata?.correlationId,
                    healthcareContext: {
                        patientId,
                        doctorId,
                        appointmentId
                    },
                    tags: ['appointment', 'confirmation'],
                    source: 'APPOINTMENT_SERVICE'
                }
            });
        }
        catch (error) {
            console.error('Lỗi khi xử lý sự kiện appointment scheduled:', error);
            throw new Error(`Lỗi xử lý sự kiện appointment scheduled: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Handle appointment cancelled event
     */
    async handleAppointmentCancelled(event) {
        try {
            const { appointmentId, patientId, doctorId, appointmentDate, appointmentTime, doctorName, cancellationReason } = event.eventData;
            // Send cancellation notification
            await this.notificationService.sendNotification({
                recipientId: patientId,
                recipientType: 'PATIENT',
                templateType: 'APPOINTMENT_CANCELLED',
                templateData: {
                    patientName: event.eventData.patientName || 'Quý khách',
                    appointmentDate: new Date(appointmentDate).toLocaleDateString('vi-VN'),
                    appointmentTime: appointmentTime,
                    doctorName: doctorName,
                    cancellationReason: cancellationReason || 'Không có lý do cụ thể',
                    hospitalName: 'Bệnh viện Đa khoa',
                    contactPhone: '1900-xxxx',
                    rebookingUrl: 'https://booking.hospital.com'
                },
                channels: ['EMAIL', 'SMS', 'PUSH'],
                priority: 'HIGH',
                metadata: {
                    correlationId: event.metadata?.correlationId,
                    healthcareContext: {
                        patientId,
                        doctorId,
                        appointmentId
                    },
                    tags: ['appointment', 'cancellation'],
                    source: 'APPOINTMENT_SERVICE'
                }
            });
            // Cancel any pending appointment reminders
            // This would require implementing a cancel notification feature
            // await this.notificationService.cancelNotificationsByContext({ appointmentId });
        }
        catch (error) {
            console.error('Lỗi khi xử lý sự kiện appointment cancelled:', error);
            throw new Error(`Lỗi xử lý sự kiện appointment cancelled: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Handle medical record updated event
     */
    async handleMedicalRecordUpdated(event) {
        try {
            const { recordId, patientId, doctorId, updateType, hasTestResults, requiresFollowUp } = event.eventData;
            // Send notification for test results
            if (updateType === 'TEST_RESULTS' && hasTestResults) {
                await this.notificationService.sendNotification({
                    recipientId: patientId,
                    recipientType: 'PATIENT',
                    templateType: 'TEST_RESULTS_READY',
                    templateData: {
                        patientName: event.eventData.patientName || 'Quý khách',
                        testType: event.eventData.testType || 'Xét nghiệm',
                        testCode: event.eventData.testCode || recordId,
                        sampleDate: event.eventData.sampleDate ? new Date(event.eventData.sampleDate).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
                        requiresConsultation: requiresFollowUp || false,
                        onlinePortalUrl: 'https://portal.hospital.com',
                        consultationBookingUrl: 'https://booking.hospital.com',
                        hospitalName: 'Bệnh viện Đa khoa',
                        contactPhone: '1900-xxxx'
                    },
                    channels: ['EMAIL', 'SMS', 'PUSH'],
                    priority: requiresFollowUp ? 'HIGH' : 'NORMAL',
                    metadata: {
                        correlationId: event.metadata?.correlationId,
                        healthcareContext: {
                            patientId,
                            doctorId,
                            medicalRecordId: recordId
                        },
                        tags: ['test-results', 'medical-records'],
                        source: 'CLINICAL_EMR_SERVICE'
                    }
                });
            }
            // Send follow-up notification if required
            if (requiresFollowUp) {
                await this.notificationService.sendNotification({
                    recipientId: patientId,
                    recipientType: 'PATIENT',
                    templateType: 'FOLLOW_UP_REQUIRED',
                    templateData: {
                        patientName: event.eventData.patientName || 'Quý khách',
                        doctorName: event.eventData.doctorName || 'Bác sĩ',
                        followUpReason: event.eventData.followUpReason || 'Cần tái khám',
                        bookingUrl: 'https://booking.hospital.com',
                        hospitalName: 'Bệnh viện Đa khoa',
                        contactPhone: '1900-xxxx'
                    },
                    channels: ['EMAIL', 'SMS'],
                    priority: 'HIGH',
                    metadata: {
                        correlationId: event.metadata?.correlationId,
                        healthcareContext: {
                            patientId,
                            doctorId,
                            medicalRecordId: recordId
                        },
                        tags: ['follow-up', 'medical-records'],
                        source: 'CLINICAL_EMR_SERVICE'
                    }
                });
            }
        }
        catch (error) {
            console.error('Lỗi khi xử lý sự kiện medical record updated:', error);
            throw new Error(`Lỗi xử lý sự kiện medical record updated: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Handle invoice generated event (IMMEDIATE NOTIFICATION ONLY)
     * NOTE: Payment reminder scheduling is handled by Billing Service → Scheduler Service
     */
    async handleInvoiceGenerated(event) {
        try {
            const { invoiceId, patientId, amount, dueDate, services, insuranceCoverage } = event.eventData;
            // Send invoice notification ONLY
            // Payment reminder scheduling is handled by Billing Service calling Scheduler Service
            await this.notificationService.sendNotification({
                recipientId: patientId,
                recipientType: 'PATIENT',
                templateType: 'INVOICE_GENERATED',
                templateData: {
                    patientName: event.eventData.patientName || 'Quý khách',
                    invoiceNumber: invoiceId,
                    amount: amount.toLocaleString('vi-VN'),
                    serviceDate: event.eventData.serviceDate ? new Date(event.eventData.serviceDate).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN'),
                    dueDate: new Date(dueDate).toLocaleDateString('vi-VN'),
                    services: services || [],
                    insuranceCoverage: insuranceCoverage || false,
                    insuranceAmount: event.eventData.insuranceAmount ? event.eventData.insuranceAmount.toLocaleString('vi-VN') : '0',
                    finalAmount: event.eventData.finalAmount ? event.eventData.finalAmount.toLocaleString('vi-VN') : amount.toLocaleString('vi-VN'),
                    bankAccount: 'STK: 123456789 - Ngân hàng ABC',
                    paymentUrl: 'https://payment.hospital.com',
                    hospitalName: 'Bệnh viện Đa khoa',
                    contactPhone: '1900-xxxx'
                },
                channels: ['EMAIL', 'SMS'],
                priority: 'NORMAL',
                metadata: {
                    correlationId: event.metadata?.correlationId,
                    healthcareContext: {
                        patientId,
                        invoiceId
                    },
                    tags: ['invoice', 'billing'],
                    source: 'BILLING_SERVICE'
                }
            });
        }
        catch (error) {
            console.error('Lỗi khi xử lý sự kiện invoice generated:', error);
            throw new Error(`Lỗi xử lý sự kiện invoice generated: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Handle payment completed event
     */
    async handlePaymentCompleted(event) {
        try {
            const { paymentId, invoiceId, patientId, amount, paymentMethod } = event.eventData;
            // Send payment confirmation
            await this.notificationService.sendNotification({
                recipientId: patientId,
                recipientType: 'PATIENT',
                templateType: 'PAYMENT_CONFIRMATION',
                templateData: {
                    patientName: event.eventData.patientName || 'Quý khách',
                    invoiceNumber: invoiceId,
                    paymentId: paymentId,
                    amount: amount.toLocaleString('vi-VN'),
                    paymentMethod: paymentMethod || 'Chuyển khoản',
                    paymentDate: new Date().toLocaleDateString('vi-VN'),
                    hospitalName: 'Bệnh viện Đa khoa',
                    contactPhone: '1900-xxxx'
                },
                channels: ['EMAIL', 'SMS'],
                priority: 'NORMAL',
                metadata: {
                    correlationId: event.metadata?.correlationId,
                    healthcareContext: {
                        patientId,
                        invoiceId,
                        paymentId
                    },
                    tags: ['payment', 'confirmation', 'billing'],
                    source: 'BILLING_SERVICE'
                }
            });
        }
        catch (error) {
            console.error('Lỗi khi xử lý sự kiện payment completed:', error);
            throw new Error(`Lỗi xử lý sự kiện payment completed: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Handle emergency alert event
     */
    async handleEmergencyAlert(event) {
        try {
            const { patientId, alertType, alertMessage, location, emergencyContacts } = event.eventData;
            // Send emergency alert to patient
            await this.notificationService.sendNotification({
                recipientId: patientId,
                recipientType: 'PATIENT',
                templateType: 'EMERGENCY_ALERT',
                templateData: {
                    patientName: event.eventData.patientName || 'Bệnh nhân',
                    alertType: alertType,
                    alertMessage: alertMessage,
                    alertTime: new Date().toLocaleString('vi-VN'),
                    location: location || 'Bệnh viện',
                    actionRequired: event.eventData.actionRequired || 'Liên hệ ngay với bệnh viện',
                    emergencyPhone: '115',
                    hospitalName: 'Bệnh viện Đa khoa'
                },
                channels: ['SMS', 'VOICE', 'PUSH'],
                priority: 'URGENT',
                metadata: {
                    correlationId: event.metadata?.correlationId,
                    healthcareContext: {
                        patientId,
                        alertType
                    },
                    tags: ['emergency', 'alert', 'urgent'],
                    source: event.metadata?.source || 'EMERGENCY_SYSTEM'
                }
            });
            // Send alerts to emergency contacts
            if (emergencyContacts && emergencyContacts.length > 0) {
                for (const contact of emergencyContacts) {
                    await this.notificationService.sendNotification({
                        recipientId: contact.contactId,
                        recipientType: 'FAMILY',
                        templateType: 'EMERGENCY_ALERT',
                        templateData: {
                            patientName: event.eventData.patientName || 'Bệnh nhân',
                            alertType: alertType,
                            alertMessage: alertMessage,
                            alertTime: new Date().toLocaleString('vi-VN'),
                            location: location || 'Bệnh viện',
                            actionRequired: 'Vui lòng liên hệ ngay với bệnh viện',
                            emergencyPhone: '115',
                            hospitalName: 'Bệnh viện Đa khoa'
                        },
                        channels: ['SMS', 'VOICE'],
                        priority: 'URGENT',
                        metadata: {
                            correlationId: event.metadata?.correlationId,
                            healthcareContext: {
                                patientId,
                                alertType,
                                emergencyContactId: contact.contactId
                            },
                            tags: ['emergency', 'alert', 'family'],
                            source: event.metadata?.source || 'EMERGENCY_SYSTEM'
                        }
                    });
                }
            }
        }
        catch (error) {
            console.error('Lỗi khi xử lý sự kiện emergency alert:', error);
            throw new Error(`Lỗi xử lý sự kiện emergency alert: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Handle medication reminder event
     */
    async handleMedicationReminder(event) {
        try {
            const { patientId, medicationName, dosage, medicationTime, mealInstruction } = event.eventData;
            await this.notificationService.sendNotification({
                recipientId: patientId,
                recipientType: 'PATIENT',
                templateType: 'MEDICATION_REMINDER',
                templateData: {
                    patientName: event.eventData.patientName || 'Quý khách',
                    medicationName: medicationName,
                    dosage: dosage,
                    medicationTime: medicationTime,
                    mealInstruction: mealInstruction || 'Uống sau khi ăn',
                    sideEffects: event.eventData.sideEffects,
                    specialInstructions: event.eventData.specialInstructions,
                    doctorPhone: event.eventData.doctorPhone || '1900-xxxx',
                    hospitalName: 'Bệnh viện Đa khoa'
                },
                channels: ['SMS', 'PUSH', 'IN_APP'],
                priority: 'HIGH',
                metadata: {
                    correlationId: event.metadata?.correlationId,
                    healthcareContext: {
                        patientId,
                        medicationName
                    },
                    tags: ['medication', 'reminder', 'healthcare'],
                    source: 'MEDICATION_SERVICE'
                }
            });
        }
        catch (error) {
            console.error('Lỗi khi xử lý sự kiện medication reminder:', error);
            throw new Error(`Lỗi xử lý sự kiện medication reminder: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Generic event handler dispatcher
     */
    async handleEvent(event) {
        try {
            const eventType = 'eventType' in event ? event.eventType : event.type;
            const serviceName = 'serviceName' in event ? event.serviceName : 'SCHEDULER_SERVICE';
            console.log(`Xử lý sự kiện: ${eventType} từ ${serviceName}`);
            // Handle ScheduleRunDue event from Scheduler Service (CRITICAL PATH)
            if (eventType === 'schedule.run.due' || eventType === 'ScheduleRunDue') {
                await this.handleScheduleRunDue(event);
                return;
            }
            // Handle other integration events
            const integrationEvent = event;
            switch (integrationEvent.eventType) {
                case 'AppointmentScheduled':
                    await this.handleAppointmentScheduled(integrationEvent);
                    break;
                case 'AppointmentCancelled':
                    await this.handleAppointmentCancelled(integrationEvent);
                    break;
                case 'MedicalRecordUpdated':
                    await this.handleMedicalRecordUpdated(integrationEvent);
                    break;
                case 'InvoiceGenerated':
                    await this.handleInvoiceGenerated(integrationEvent);
                    break;
                case 'PaymentCompleted':
                    await this.handlePaymentCompleted(integrationEvent);
                    break;
                case 'EmergencyAlert':
                    await this.handleEmergencyAlert(integrationEvent);
                    break;
                case 'MedicationReminder':
                    await this.handleMedicationReminder(integrationEvent);
                    break;
                default:
                    console.warn(`Không có handler cho sự kiện: ${integrationEvent.eventType}`);
                    break;
            }
        }
        catch (error) {
            const eventType = 'eventType' in event ? event.eventType : event.type;
            console.error(`Lỗi khi xử lý sự kiện ${eventType}:`, error);
            throw error;
        }
    }
}
exports.NotificationEventHandlers = NotificationEventHandlers;
//# sourceMappingURL=NotificationEventHandlers.js.map