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
import { logger } from '../logging/logger';
import { BillingService } from '../../application/services/BillingService';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IPatientRepository } from '../../domain/entities/Patient';
import { CreatePayOSPaymentLinkUseCase } from '../../application/use-cases/CreatePayOSPaymentLinkUseCase';
import { IEventBus } from '../../../../shared/application/services/event-bus.interface';
export interface AppointmentEventConsumerConfig {
    rabbitmqUrl: string;
    queueName: string;
    exchangeName: string;
    routingKeys: string[];
    prefetchCount?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
}
export interface AppointmentScheduledEventData {
    appointmentId: string;
    patientId: string;
    staffId: string;
    departmentId: string;
    scheduledAt: Date;
    duration: number;
    status: 'pending_payment';
    serviceType: 'consultation' | 'procedure' | 'follow_up';
    notes?: string;
}
export interface AppointmentCancelledLateEventData {
    appointmentId: string;
    patientId: string;
    staffId: string;
    departmentId: string;
    scheduledAt: Date;
    cancelledAt: Date;
    reason: string;
    cancellationType: 'late' | 'no_show' | 'same_day';
    lateFeeApplied: boolean;
    lateFeeAmount: number;
}
export interface AppointmentNoShowEventData {
    appointmentId: string;
    patientId: string;
    staffId: string;
    departmentId: string;
    scheduledAt: Date;
    noShowFeeApplied: boolean;
    noShowFeeAmount: number;
    noShowCount: number;
}
/**
 * AppointmentEventConsumer - Handles appointment lifecycle events for billing
 */
export declare class AppointmentEventConsumer {
    private config;
    private loggerInstance;
    private billingService;
    private invoiceRepository;
    private patientRepository;
    private createPayOSPaymentLinkUseCase;
    private eventBus;
    private connection?;
    private channel?;
    private isConnected;
    constructor(config: AppointmentEventConsumerConfig, loggerInstance: typeof logger, billingService: BillingService, invoiceRepository: IInvoiceRepository, patientRepository: IPatientRepository, createPayOSPaymentLinkUseCase: CreatePayOSPaymentLinkUseCase, eventBus: IEventBus);
    /**
     * Connect to RabbitMQ and start consuming
     */
    connect(): Promise<void>;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Handle appointment scheduled event (Prepaid Model)
     * Creates invoice with PENDING status and generates PayOS payment link
     */
    private handleAppointmentScheduled;
    /**
     * Handle appointment cancelled late event
     */
    private handleAppointmentCancelledLate;
    /**
     * Handle appointment no-show event
     */
    private handleAppointmentNoShow;
    /**
     * Disconnect from RabbitMQ
     */
    disconnect(): Promise<void>;
    /**
     * Check if consumer is connected
     */
    isConsumerConnected(): boolean;
}
//# sourceMappingURL=AppointmentEventConsumer.d.ts.map