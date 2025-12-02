/**
 * Billing Event Consumer - Infrastructure Layer
 * Consumes billing events from Billing Service
 * Handles billing notifications, payment reminders, insurance updates, and financial alerts
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { IInboxRepository } from "../../domain/repositories/IInboxRepository";
import { SendNotificationUseCase } from "../../application/use-cases/SendNotificationUseCase";
import { GetNotificationPreferencesUseCase } from "../../application/use-cases/GetNotificationPreferencesUseCase";
export interface BillingEventConsumerConfig {
    rabbitmqUrl: string;
    queueName: string;
    exchangeName: string;
    routingKeys: string[];
    prefetchCount?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
}
export interface InsuranceCoverageVerifiedEventData {
    patientId: string;
    patientName: string;
    insuranceProvider: string;
    insuranceNumber: string;
    coverageType: string;
    coverageStatus: "verified" | "partial" | "rejected" | "pending";
    coverageAmount: number;
    deductible: number;
    coPayment: number;
    verifiedAt: Date;
    verifiedBy: string;
    validUntil: Date;
    notes?: string;
}
export interface PreAuthorizationRequestedEventData {
    preAuthId: string;
    patientId: string;
    patientName: string;
    physicianId: string;
    physicianName: string;
    procedureType: string;
    estimatedCost: number;
    urgencyLevel: "routine" | "urgent" | "emergency";
    requestedAt: Date;
    requestedBy: string;
    insuranceProvider: string;
    expectedResponseDate: Date;
}
export interface PreAuthorizationApprovedEventData {
    preAuthId: string;
    patientId: string;
    patientName: string;
    physicianId: string;
    physicianName: string;
    procedureType: string;
    approvedAmount: number;
    approvedAt: Date;
    approvedBy: string;
    validUntil: Date;
    conditions?: string[];
    notes?: string;
}
export interface PreAuthorizationDeniedEventData {
    preAuthId: string;
    patientId: string;
    patientName: string;
    physicianId: string;
    physicianName: string;
    procedureType: string;
    deniedAt: Date;
    deniedBy: string;
    denialReason: string;
    appealDeadline?: Date;
    alternativeOptions?: string[];
}
export interface RateUpdatedEventData {
    rateId: string;
    serviceType: string;
    procedureCode: string;
    oldRate: number;
    newRate: number;
    effectiveDate: Date;
    updatedBy: string;
    updatedAt: Date;
    affectedAppointments?: string[];
    patientNotifications?: {
        patientId: string;
        patientName: string;
        appointmentId: string;
        oldCost: number;
        newCost: number;
    }[];
}
export interface PaymentProcessedEventData {
    paymentId: string;
    patientId: string;
    patientName: string;
    amount: number;
    paymentMethod: string;
    paymentStatus: "completed" | "failed" | "refunded" | "partial_refund";
    processedAt: Date;
    processedBy: string;
    invoiceId: string;
    appointmentId?: string;
    transactionId?: string;
    dueAmount?: number;
    refundAmount?: number;
}
export interface InvoiceGeneratedEventData {
    invoiceId: string;
    patientId: string;
    patientName: string;
    totalAmount: number;
    dueDate: Date;
    generatedAt: Date;
    generatedBy: string;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
    insuranceCoverage?: number;
    patientResponsibility: number;
}
export interface PaymentReminderScheduledEventData {
    reminderId: string;
    patientId: string;
    patientName: string;
    invoiceId: string;
    amount: number;
    dueDate: Date;
    reminderType: "first_notice" | "second_notice" | "final_notice" | "overdue";
    scheduledFor: Date;
    message: string;
}
export interface PaymentReminderDueEventData {
    invoiceId: string;
    patientId: string;
    patientName: string;
    invoiceNumber: string;
    totalAmount: number;
    dueDate: string;
    reminderType: "before-due" | "on-due" | "after-due";
    daysBeforeDue: number;
    scheduledBy: string;
}
export interface RefundProcessedEventData {
    refundId: string;
    patientId: string;
    patientName: string;
    originalPaymentId: string;
    refundAmount: number;
    refundReason: string;
    processedAt: Date;
    processedBy: string;
    refundMethod: string;
    processingTime?: number;
}
/**
 * BillingEventConsumer - Handles billing events for notifications
 */
export declare class BillingEventConsumer {
    private config;
    private sendNotificationUseCase;
    private getNotificationPreferencesUseCase;
    private inboxRepo;
    private connection?;
    private channel?;
    private isConnected;
    private reconnecting;
    constructor(config: BillingEventConsumerConfig, sendNotificationUseCase: SendNotificationUseCase, getNotificationPreferencesUseCase: GetNotificationPreferencesUseCase, inboxRepo: IInboxRepository);
    /**
     * Connect to RabbitMQ and start consuming
     */
    connect(): Promise<void>;
    private setupConnectionListeners;
    private triggerReconnect;
    private closeConnectionSilently;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Handle insurance coverage verified event
     */
    private handleInsuranceCoverageVerified;
    /**
     * Handle pre-authorization requested event
     */
    private handlePreAuthorizationRequested;
    /**
     * Handle pre-authorization approved event
     */
    private handlePreAuthorizationApproved;
    /**
     * Handle pre-authorization denied event
     */
    private handlePreAuthorizationDenied;
    /**
     * Handle rate updated event
     */
    private handleRateUpdated;
    /**
     * Handle payment processed event
     *
     * ✅ REFACTORED FOR MVP:
     * - Send payment receipt when status = 'completed'
     * - Use new template: PAYMENT_COMPLETED
     * - Skip failed/refunded in MVP (future work)
     */
    private handlePaymentProcessed;
    /**
     * Handle payment refunded event
     */
    private handlePaymentRefunded;
    /**
     * Handle invoice generated event
     */
    private handleInvoiceGenerated;
    /**
     * Handle payment reminder scheduled event
     */
    private handlePaymentReminderScheduled;
    /**
     * Handle payment reminder due event (triggered by Scheduler Service)
     */
    private handlePaymentReminderDue;
    /**
     * Handle refund processed event
     */
    private handleRefundProcessed;
    /**
     * Send insurance verification notification to patient
     */
    private sendInsuranceVerificationNotification;
    /**
     * Send coverage issue notification
     */
    private sendCoverageIssueNotification;
    /**
     * Send billing review notification
     */
    private sendBillingReviewNotification;
    /**
     * Send pre-authorization request notification to patient
     */
    private sendPreAuthRequestNotification;
    /**
     * Send urgent pre-authorization notification to physician
     */
    private sendUrgentPreAuthNotification;
    /**
     * Schedule pre-authorization follow-up
     */
    private schedulePreAuthFollowUp;
    /**
     * Send pre-authorization approval notification to patient
     */
    private sendPreAuthApprovalNotification;
    /**
     * Send pre-authorization approval notification to physician
     */
    private sendPreAuthPhysicianApprovalNotification;
    /**
     * Send pre-authorization billing notification
     */
    private sendPreAuthBillingNotification;
    /**
     * Send pre-authorization denial notification to patient
     */
    private sendPreAuthDenialNotification;
    /**
     * Send pre-authorization denial notification to physician
     */
    private sendPreAuthPhysicianDenialNotification;
    /**
     * Schedule appeal reminder
     */
    private scheduleAppealReminder;
    /**
     * Send rate update notification
     */
    private sendRateUpdateNotification;
    /**
     * Send patient rate change notifications
     */
    private sendPatientRateChangeNotifications;
    /**
     * Send physician rate change notifications
     */
    private sendPhysicianRateChangeNotifications;
    /**
     * Send payment notification to patient
     */
    private sendPaymentNotification;
    /**
     * Send payment failure notification
     */
    private sendPaymentFailureNotification;
    /**
     * Send refund notification
     */
    private sendRefundNotification;
    /**
     * Send invoice notification to patient
     */
    private sendInvoiceNotification;
    /**
     * Send high-value invoice notification
     */
    private sendHighValueInvoiceNotification;
    /**
     * Schedule payment reminders
     */
    private schedulePaymentReminders;
    /**
     * Send payment reminder notification
     */
    private sendPaymentReminderNotification;
    /**
     * Send overdue account notification
     */
    private sendOverdueAccountNotification;
    /**
     * Send refund processed notification
     */
    private sendRefundProcessedNotification;
    /**
     * Send refund department notification
     */
    private sendRefundDepartmentNotification;
    /**
     * Helper methods
     */
    private getEnabledChannels;
    private getReminderMessage;
    private formatDate;
    private dispatchNotification;
    /**
     * Disconnect from RabbitMQ
     */
    disconnect(): Promise<void>;
    /**
     * Check if consumer is connected
     */
    isConsumerConnected(): boolean;
}
//# sourceMappingURL=BillingEventConsumer.d.ts.map