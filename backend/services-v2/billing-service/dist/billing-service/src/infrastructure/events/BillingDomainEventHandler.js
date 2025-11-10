"use strict";
/**
 * BillingDomainEventHandler - Domain Event Handler
 * V2 Clean Architecture + DDD Implementation
 * Handles domain events from Billing Aggregate with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingDomainEventHandler = void 0;
/**
 * Domain Event Handler for Billing Events
 * Follows pattern from Clinical EMR MedicalRecordDomainEventHandler
 */
class BillingDomainEventHandler {
    constructor(config) {
        this.logger = config.logger;
        this.auditService = config.auditService;
        this.eventBus = config.eventBus;
    }
    /**
     * Handle domain events
     */
    async handle(event) {
        try {
            this.logger.info('Processing billing domain event', {
                eventType: event.eventType,
                aggregateId: event.aggregateId,
                eventId: event.eventId
            });
            switch (event.eventType) {
                case 'InvoiceCreated':
                    await this.handleInvoiceCreated(event);
                    break;
                case 'InvoiceUpdated':
                    await this.handleInvoiceUpdated(event);
                    break;
                case 'PaymentProcessed':
                    await this.handlePaymentProcessed(event);
                    break;
                case 'InsuranceClaimSubmitted':
                    await this.handleInsuranceClaimSubmitted(event);
                    break;
                default:
                    this.logger.warn('Unknown billing domain event type', {
                        eventType: event.eventType,
                        eventId: event.eventId
                    });
            }
        }
        catch (error) {
            this.logger.error('Error processing billing domain event', {
                eventType: event.eventType,
                eventId: event.eventId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Handle InvoiceCreated event
     */
    async handleInvoiceCreated(event) {
        try {
            this.logger.info('Handling InvoiceCreated event', {
                invoiceId: event.invoiceId,
                patientId: event.patientId,
                totalAmount: event.totalAmount
            });
            // 1. HIPAA audit logging
            await this.auditService.logBillingAccess('CREATE', event.invoiceId, event.issuedBy, 'Invoice created', {
                patientId: event.patientId,
                doctorId: event.doctorId,
                totalAmount: event.totalAmount,
                eventId: event.eventId
            });
            // 2. Publish integration event for other services
            const integrationEvent = {
                eventId: `invoice-created-${Date.now()}`,
                eventType: 'invoice.created',
                aggregateId: event.invoiceId,
                aggregateType: 'Invoice',
                occurredAt: new Date(),
                serviceName: 'billing-service',
                eventData: {
                    invoiceId: event.invoiceId,
                    invoiceNumber: event.invoiceNumber,
                    patientId: event.patientId,
                    doctorId: event.doctorId,
                    totalAmount: event.totalAmount,
                    dueDate: event.dueDate,
                    hasInsurance: event.hasInsurance,
                    issuedBy: event.issuedBy,
                    createdAt: event.createdAt
                },
                metadata: {
                    priority: 'normal',
                    complianceLevel: 'hipaa',
                    containsPHI: true,
                    patientId: event.patientId,
                    eventCategory: 'billing',
                    eventSubcategory: 'invoice_creation',
                    vietnameseDescription: 'Hóa đơn mới được tạo'
                }
            };
            await this.eventBus.publish(integrationEvent);
            // 3. Trigger follow-up actions if needed
            if (event.appointmentId) {
                // Notify appointment service that invoice is created
                const appointmentNotificationEvent = {
                    eventId: `appointment-invoice-${Date.now()}`,
                    eventType: 'appointment.invoice-created',
                    aggregateId: event.appointmentId,
                    aggregateType: 'Appointment',
                    occurredAt: new Date(),
                    serviceName: 'billing-service',
                    eventData: {
                        appointmentId: event.appointmentId,
                        invoiceId: event.invoiceId,
                        patientId: event.patientId,
                        doctorId: event.doctorId,
                        totalAmount: event.totalAmount
                    }
                };
                await this.eventBus.publish(appointmentNotificationEvent);
            }
            this.logger.info('InvoiceCreated event processed successfully', {
                invoiceId: event.invoiceId,
                eventId: event.eventId
            });
        }
        catch (error) {
            this.logger.error('Error handling InvoiceCreated event', {
                invoiceId: event.invoiceId,
                eventId: event.eventId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Handle PaymentProcessed event
     */
    async handlePaymentProcessed(event) {
        try {
            this.logger.info('Handling PaymentProcessed event', {
                invoiceId: event.invoiceId,
                paymentAmount: event.paymentAmount,
                paymentMethod: event.paymentMethod
            });
            // 1. HIPAA audit logging
            await this.auditService.logBillingAccess('PAYMENT', event.invoiceId, event.processedBy, 'Payment processed', {
                paymentId: event.paymentId,
                paymentAmount: event.paymentAmount,
                paymentMethod: event.paymentMethod,
                transactionId: event.transactionId,
                eventId: event.eventId
            });
            // 2. Publish integration event for other services
            const integrationEvent = {
                eventId: `payment-processed-${Date.now()}`,
                eventType: 'payment.processed',
                aggregateId: event.invoiceId,
                aggregateType: 'Invoice',
                occurredAt: new Date(),
                serviceName: 'billing-service',
                eventData: {
                    invoiceId: event.invoiceId,
                    paymentId: event.paymentId,
                    paymentAmount: event.paymentAmount,
                    paymentMethod: event.paymentMethod,
                    transactionId: event.transactionId,
                    remainingBalance: event.remainingBalance,
                    isFullyPaid: event.isFullyPaid,
                    processedBy: event.processedBy,
                    processedAt: event.processedAt
                },
                metadata: {
                    priority: 'high',
                    complianceLevel: 'hipaa',
                    containsPHI: true,
                    patientId: event.patientId,
                    eventCategory: 'billing',
                    eventSubcategory: 'payment_processing',
                    vietnameseDescription: 'Thanh toán được xử lý'
                }
            };
            await this.eventBus.publish(integrationEvent);
            // 3. Check if invoice is fully paid and trigger completion events
            if (event.isFullyPaid) {
                const invoiceCompletedEvent = {
                    eventId: `invoice-completed-${Date.now()}`,
                    eventType: 'invoice.completed',
                    aggregateId: event.invoiceId,
                    aggregateType: 'Invoice',
                    occurredAt: new Date(),
                    serviceName: 'billing-service',
                    eventData: {
                        invoiceId: event.invoiceId,
                        patientId: event.patientId,
                        totalAmount: event.totalAmount,
                        completedAt: event.processedAt
                    },
                    metadata: {
                        priority: 'normal',
                        eventCategory: 'billing',
                        eventSubcategory: 'invoice_completion'
                    }
                };
                await this.eventBus.publish(invoiceCompletedEvent);
            }
            this.logger.info('PaymentProcessed event processed successfully', {
                invoiceId: event.invoiceId,
                paymentId: event.paymentId,
                eventId: event.eventId
            });
        }
        catch (error) {
            this.logger.error('Error handling PaymentProcessed event', {
                invoiceId: event.invoiceId,
                paymentId: event.paymentId,
                eventId: event.eventId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Handle InvoiceUpdated event
     */
    async handleInvoiceUpdated(event) {
        try {
            this.logger.info('Handling InvoiceUpdated event', {
                invoiceId: event.invoiceId,
                updatedFields: event.updatedFields
            });
            // HIPAA audit logging
            await this.auditService.logBillingAccess('UPDATE', event.invoiceId, event.updatedBy, 'Invoice updated', {
                updatedFields: event.updatedFields,
                updateReason: event.updateReason,
                eventId: event.eventId
            });
            // Publish integration event
            const integrationEvent = {
                eventId: `invoice-updated-${Date.now()}`,
                eventType: 'invoice.updated',
                aggregateId: event.invoiceId,
                aggregateType: 'Invoice',
                occurredAt: new Date(),
                serviceName: 'billing-service',
                eventData: {
                    invoiceId: event.invoiceId,
                    updatedFields: event.updatedFields,
                    updatedBy: event.updatedBy,
                    updatedAt: event.updatedAt,
                    updateReason: event.updateReason
                },
                metadata: {
                    priority: 'normal',
                    complianceLevel: 'hipaa',
                    eventCategory: 'billing',
                    eventSubcategory: 'invoice_update',
                    vietnameseDescription: 'Hóa đơn được cập nhật'
                }
            };
            await this.eventBus.publish(integrationEvent);
        }
        catch (error) {
            this.logger.error('Error handling InvoiceUpdated event', {
                invoiceId: event.invoiceId,
                eventId: event.eventId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Handle InsuranceClaimSubmitted event
     */
    async handleInsuranceClaimSubmitted(event) {
        try {
            this.logger.info('Handling InsuranceClaimSubmitted event', {
                invoiceId: event.invoiceId,
                claimAmount: event.claimAmount,
                insuranceType: event.insuranceType
            });
            // HIPAA audit logging
            await this.auditService.logBillingAccess('INSURANCE_CLAIM', event.invoiceId, event.submittedBy, 'Insurance claim submitted', {
                claimId: event.claimId,
                claimAmount: event.claimAmount,
                insuranceType: event.insuranceType,
                eventId: event.eventId
            });
            // Publish integration event
            const integrationEvent = {
                eventId: `insurance-claim-submitted-${Date.now()}`,
                eventType: 'insurance.claim-submitted',
                aggregateId: event.invoiceId,
                aggregateType: 'Invoice',
                occurredAt: new Date(),
                serviceName: 'billing-service',
                eventData: {
                    invoiceId: event.invoiceId,
                    claimId: event.claimId,
                    claimAmount: event.claimAmount,
                    insuranceType: event.insuranceType,
                    submittedBy: event.submittedBy,
                    submittedAt: event.submittedAt
                },
                metadata: {
                    priority: 'normal',
                    complianceLevel: 'hipaa',
                    eventCategory: 'billing',
                    eventSubcategory: 'insurance_claim',
                    vietnameseDescription: 'Yêu cầu bảo hiểm được gửi'
                }
            };
            await this.eventBus.publish(integrationEvent);
        }
        catch (error) {
            this.logger.error('Error handling InsuranceClaimSubmitted event', {
                invoiceId: event.invoiceId,
                claimId: event.claimId,
                eventId: event.eventId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Check if handler can handle the event type
     */
    canHandle(eventType) {
        return ['InvoiceCreated', 'InvoiceUpdated', 'PaymentProcessed', 'InsuranceClaimSubmitted'].includes(eventType);
    }
    /**
     * Get handler status
     */
    getStatus() {
        return {
            handlerName: 'BillingDomainEventHandler',
            supportedEvents: ['InvoiceCreated', 'InvoiceUpdated', 'PaymentProcessed', 'InsuranceClaimSubmitted'],
            isHealthy: true,
            lastProcessedAt: new Date().toISOString()
        };
    }
}
exports.BillingDomainEventHandler = BillingDomainEventHandler;
//# sourceMappingURL=BillingDomainEventHandler.js.map