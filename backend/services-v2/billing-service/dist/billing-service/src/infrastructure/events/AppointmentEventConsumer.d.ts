/**
 * AppointmentEventConsumer - Consumes appointment events from Appointments Service
 * Handles automatic invoice generation and fee calculations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { logger } from '../logging/logger';
import { BillingService } from '../../application/services/BillingService';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IPatientRepository } from '../../domain/entities/Patient';
export interface AppointmentEventConsumerConfig {
    rabbitmqUrl: string;
    queueName: string;
    exchangeName: string;
    routingKeys: string[];
    prefetchCount?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
}
export interface AppointmentCompletedEventData {
    appointmentId: string;
    patientId: string;
    staffId: string;
    departmentId: string;
    scheduledAt: Date;
    completedAt: Date;
    duration: number;
    status: 'completed';
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
    private connection?;
    private channel?;
    private isConnected;
    constructor(config: AppointmentEventConsumerConfig, loggerInstance: typeof logger, billingService: BillingService, invoiceRepository: IInvoiceRepository, patientRepository: IPatientRepository);
    /**
     * Connect to RabbitMQ and start consuming
     */
    connect(): Promise<void>;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Handle appointment completed event
     */
    private handleAppointmentCompleted;
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