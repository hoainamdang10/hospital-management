/**
 * Billing Event Consumer - Infrastructure Layer
 * Consumes billing events from Billing Service
 * Handles billing report generation, invoice processing, and financial automation
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture
 */
import { CreateScheduleUseCase } from '../../application/use-cases/CreateScheduleUseCase';
import { UpdateScheduleUseCase } from '../../application/use-cases/UpdateScheduleUseCase';
import { CancelScheduleUseCase } from '../../application/use-cases/CancelScheduleUseCase';
import { SupabaseScheduleRepository } from '../persistence/SupabaseScheduleRepository';
export interface BillingEventConsumerConfig {
    rabbitmqUrl: string;
    queueName: string;
    exchangeName: string;
    routingKeys: string[];
    prefetchCount?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
}
export interface BillingInvoiceGeneratedEventData {
    invoiceId: string;
    patientId: string;
    patientName: string;
    appointmentId?: string;
    totalAmount: number;
    currency: string;
    dueDate: Date;
    generatedAt: Date;
    generatedBy: string;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }[];
    departmentId?: string;
    departmentName?: string;
}
export interface BillingPaymentProcessedEventData {
    paymentId: string;
    invoiceId: string;
    patientId: string;
    patientName: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentStatus: 'completed' | 'pending' | 'failed' | 'refunded';
    processedAt: Date;
    processedBy: string;
    transactionId?: string;
}
export interface BillingInsuranceClaimProcessedEventData {
    claimId: string;
    invoiceId: string;
    patientId: string;
    patientName: string;
    insuranceProvider: string;
    claimAmount: number;
    approvedAmount?: number;
    claimStatus: 'submitted' | 'approved' | 'rejected' | 'pending';
    processedAt: Date;
    processedBy: string;
    rejectionReason?: string;
}
export interface BillingReportRequestedEventData {
    reportId: string;
    reportType: 'revenue' | 'expenses' | 'claims' | 'payments' | 'aging' | 'custom';
    reportPeriod: {
        startDate: Date;
        endDate: Date;
    };
    requestedBy: string;
    requestedAt: Date;
    parameters?: {
        departmentId?: string;
        providerId?: string;
        insuranceProvider?: string;
        format?: 'pdf' | 'excel' | 'csv';
        includeDetails?: boolean;
    };
    recipients: string[];
}
export interface BillingPaymentReminderScheduledEventData {
    invoiceId: string;
    patientId: string;
    patientName: string;
    invoiceNumber: string;
    totalAmount: number;
    dueDate: Date;
    reminderDate: Date;
    reminderType: 'before-due' | 'on-due' | 'after-due';
    daysBeforeDue: number;
    scheduledAt: Date;
    scheduledBy: string;
}
/**
 * BillingEventConsumer - Handles billing events for financial automation
 */
export declare class BillingEventConsumer {
    private config;
    private scheduleRepository;
    private createScheduleUseCase;
    private updateScheduleUseCase;
    private cancelScheduleUseCase;
    private connection?;
    private channel?;
    private isConnected;
    private logger;
    constructor(config: BillingEventConsumerConfig, scheduleRepository: SupabaseScheduleRepository, createScheduleUseCase: CreateScheduleUseCase, updateScheduleUseCase: UpdateScheduleUseCase, cancelScheduleUseCase: CancelScheduleUseCase);
    /**
     * Connect to RabbitMQ and start consuming
     */
    connect(): Promise<void>;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Handle billing invoice generated event
     */
    private handleBillingInvoiceGenerated;
    /**
     * Handle billing payment processed event
     */
    private handleBillingPaymentProcessed;
    /**
     * Handle billing insurance claim processed event
     */
    private handleBillingInsuranceClaimProcessed;
    /**
     * Handle billing report requested event
     */
    private handleBillingReportRequested;
    /**
     * Generate cron expression for one-time event
     */
    private generateCronForOneTime;
    /**
     * Generate cron expression for report period
     */
    private generateCronForReportPeriod;
    /**
     * Check if report is recurring
     */
    private isRecurringReport;
    /**
     * Handle billing payment reminder scheduled event
     * Creates a ONCE schedule to trigger notification at reminder date
     */
    private handleBillingPaymentReminderScheduled;
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