/**
 * ClinicalEventConsumer - Consumes clinical events from Clinical EMR Service
 * Handles automatic billing for medical services, procedures, and medications
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { logger } from '../logging/logger';
import { BillingService } from '../../application/services/BillingService';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IPatientRepository } from '../../domain/entities/Patient';
export interface ClinicalEventConsumerConfig {
    rabbitmqUrl: string;
    queueName: string;
    exchangeName: string;
    routingKeys: string[];
    prefetchCount?: number;
    retryAttempts?: number;
    retryDelayMs?: number;
}
export interface ClinicalPrescriptionCreatedEventData {
    prescriptionId: string;
    patientId: string;
    staffId: string;
    appointmentId?: string;
    medications: Array<{
        name: string;
        dosage: string;
        quantity: number;
        unitPrice: number;
        instructions: string;
    }>;
    prescribedAt: Date;
    totalCost: number;
}
export interface ClinicalLabResultCreatedEventData {
    labResultId: string;
    patientId: string;
    staffId: string;
    appointmentId?: string;
    testType: string;
    testCode: string;
    performedAt: Date;
    cost: number;
    isUrgent: boolean;
}
export interface ClinicalTreatmentPlanCreatedEventData {
    treatmentPlanId: string;
    patientId: string;
    staffId: string;
    appointmentId?: string;
    procedures: Array<{
        code: string;
        name: string;
        cost: number;
        category: string;
    }>;
    createdAt: Date;
    totalCost: number;
    estimatedDuration: number;
}
export interface ClinicalMedicalRecordCreatedEventData {
    medicalRecordId: string;
    patientId: string;
    staffId: string;
    appointmentId?: string;
    recordType: 'consultation' | 'procedure' | 'emergency';
    services: Array<{
        code: string;
        name: string;
        cost: number;
        category: string;
    }>;
    createdAt: Date;
    totalCost: number;
}
/**
 * ClinicalEventConsumer - Handles clinical events for billing
 */
export declare class ClinicalEventConsumer {
    private config;
    private loggerInstance;
    private billingService;
    private invoiceRepository;
    private patientRepository;
    private connection?;
    private channel?;
    private isConnected;
    constructor(config: ClinicalEventConsumerConfig, loggerInstance: typeof logger, billingService: BillingService, invoiceRepository: IInvoiceRepository, patientRepository: IPatientRepository);
    /**
     * Connect to RabbitMQ and start consuming
     */
    connect(): Promise<void>;
    /**
     * Handle incoming message
     */
    private handleMessage;
    /**
     * Handle prescription created event
     */
    private handlePrescriptionCreated;
    /**
     * Handle lab result created event
     */
    private handleLabResultCreated;
    /**
     * Handle treatment plan created event
     */
    private handleTreatmentPlanCreated;
    /**
     * Handle medical record created event
     */
    private handleMedicalRecordCreated;
    /**
     * Disconnect from RabbitMQ
     */
    disconnect(): Promise<void>;
    /**
     * Check if consumer is connected
     */
    isConsumerConnected(): boolean;
}
//# sourceMappingURL=ClinicalEventConsumer.d.ts.map