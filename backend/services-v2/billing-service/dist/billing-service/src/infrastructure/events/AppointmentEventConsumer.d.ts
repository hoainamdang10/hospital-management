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
import { logger } from "../logging/logger";
import { BillingService } from "../../application/services/BillingService";
import { IInvoiceRepository } from "../../domain/repositories/IInvoiceRepository";
import { IPatientRepository } from "../../domain/entities/Patient";
import { CreatePayOSPaymentLinkUseCase } from "../../application/use-cases/CreatePayOSPaymentLinkUseCase";
import { IEventBus } from "../../../../shared/application/services/event-bus.interface";
import { SupabaseStaffRepository } from "../repositories/SupabaseStaffRepository";
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
    status: "pending_payment";
    serviceType: "consultation" | "procedure" | "follow_up";
    consultationFee?: number;
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
    cancellationType: "late" | "no_show" | "same_day";
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
export interface AppointmentCancelledRefundEventData {
    appointmentId: string;
    patientId: string;
    staffId: string;
    departmentId: string;
    scheduledAt: Date;
    cancelledAt: Date;
    cancellationReason: string;
    cancelledBy: string;
    cancellationPolicy: {
        penaltyApplied: boolean;
        refundEligible: boolean;
        rescheduleAllowed: boolean;
        penaltyAmount?: number;
        refundPercentage?: number;
    };
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
    private staffRepository;
    private createPayOSPaymentLinkUseCase;
    private eventBus;
    private refundPaymentUseCase?;
    private connection?;
    private channel?;
    private isConnected;
    constructor(config: AppointmentEventConsumerConfig, loggerInstance: typeof logger, billingService: BillingService, invoiceRepository: IInvoiceRepository, patientRepository: IPatientRepository, staffRepository: SupabaseStaffRepository, createPayOSPaymentLinkUseCase: CreatePayOSPaymentLinkUseCase, eventBus: IEventBus, refundPaymentUseCase?: any | undefined);
    /**
     * Connect to RabbitMQ and start consuming
     */
    connect(): Promise<void>;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Parse raw RabbitMQ message and extract payload/event metadata
     */
    private parseEventMessage;
    private buildAppointmentScheduledPayload;
    private buildAppointmentCancelledPayload;
    private buildAppointmentNoShowPayload;
    private buildAppointmentCancelledRefundPayload;
    private extractCommonAppointmentFields;
    private resolveScheduledAt;
    private normalizeServiceType;
    private safeDate;
    private toBoolean;
    private toNumber;
    /**
     * Normalize staff identifier to UUID stored in provider_schema
     */
    private resolveStaffIdentifier;
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
     * Handle appointment cancelled event (refund case)
     * Simplified approach: Only handle billing refund logic
     */
    private handleAppointmentCancelled;
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