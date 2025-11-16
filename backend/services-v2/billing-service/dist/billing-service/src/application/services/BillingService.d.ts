/**
 * BillingService - Service for handling billing operations and event-based invoice generation
 * Provides methods for generating invoices from various healthcare events
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Event-Driven Architecture
 */
import { Invoice } from '../../domain/aggregates/Invoice';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IPatientRepository } from '../../domain/entities/Patient';
import { logger } from '../../infrastructure/logging/logger';
import { CreateInvoiceUseCase } from '../use-cases/CreateInvoiceUseCase';
import { ProcessPaymentUseCase } from '../use-cases/ProcessPaymentUseCase';
export interface AppointmentInvoiceRequest {
    appointmentId: string;
    patientId: string;
    staffId: string;
    departmentId: string;
    serviceType: 'consultation' | 'procedure' | 'follow_up';
    scheduledAt: Date;
    completedAt?: Date;
    duration: number;
    insuranceInfo?: any;
}
export interface LateCancellationFeeRequest {
    appointmentId: string;
    patientId: string;
    cancelledAt: Date;
    reason: string;
    feeAmount: number;
}
export interface NoShowFeeRequest {
    appointmentId: string;
    patientId: string;
    scheduledAt: Date;
    noShowCount: number;
    feeAmount: number;
}
export interface PrescriptionInvoiceRequest {
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
    insuranceInfo?: any;
}
export interface LabTestInvoiceRequest {
    labResultId: string;
    patientId: string;
    staffId: string;
    appointmentId?: string;
    testType: string;
    testCode: string;
    performedAt: Date;
    cost: number;
    isUrgent: boolean;
    insuranceInfo?: any;
}
export interface TreatmentPlanInvoiceRequest {
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
    insuranceInfo?: any;
}
export interface MedicalRecordInvoiceRequest {
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
    insuranceInfo?: any;
}
/**
 * BillingService - Handles billing operations and event-based invoice generation
 */
export declare class BillingService {
    private invoiceRepository;
    private patientRepository;
    private createInvoiceUseCase;
    private processPaymentUseCase;
    private loggerInstance;
    constructor(invoiceRepository: IInvoiceRepository, patientRepository: IPatientRepository, createInvoiceUseCase: CreateInvoiceUseCase, processPaymentUseCase: ProcessPaymentUseCase, loggerInstance: typeof logger);
    /**
     * Generate invoice for completed appointment
     */
    generateAppointmentInvoice(request: AppointmentInvoiceRequest): Promise<Invoice>;
    /**
     * Generate late cancellation fee invoice
     */
    generateLateCancellationFee(request: LateCancellationFeeRequest): Promise<Invoice>;
    /**
     * Generate no-show fee invoice
     */
    generateNoShowFee(request: NoShowFeeRequest): Promise<Invoice>;
    /**
     * Generate prescription invoice
     */
    generatePrescriptionInvoice(request: PrescriptionInvoiceRequest): Promise<Invoice>;
    /**
     * Generate lab test invoice
     */
    generateLabTestInvoice(request: LabTestInvoiceRequest): Promise<Invoice>;
    /**
     * Generate treatment plan invoice
     */
    generateTreatmentPlanInvoice(request: TreatmentPlanInvoiceRequest): Promise<Invoice>;
    /**
     * Generate medical record invoice
     */
    generateMedicalRecordInvoice(request: MedicalRecordInvoiceRequest): Promise<Invoice>;
    /**
     * Helper methods
     */
    private calculateConsultationFee;
    private getServiceTypeDescription;
    private getServiceTypeCode;
    private calculateInsuranceCoverage;
}
//# sourceMappingURL=BillingService.d.ts.map