/**
 * CreateInvoiceUseCase - Application Layer
 * V2 Clean Architecture + DDD Implementation
 * Use case for creating new invoices with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards
 */
import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { InvoiceStatus } from '../../domain/aggregates/BillingAggregate';
import { InsuranceType } from '../../domain/value-objects/Insurance';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';
export interface CreateInvoiceRequest {
    patientId: string;
    medicalRecordId?: string;
    doctorId: string;
    appointmentId?: string;
    items: Array<{
        description: string;
        vietnameseDescription: string;
        quantity: number;
        unitPrice: number;
        category: 'consultation' | 'medication' | 'procedure' | 'test' | 'room' | 'other';
        taxable: boolean;
        insuranceCoverable: boolean;
        serviceCode?: string;
    }>;
    insurance?: {
        type: InsuranceType;
        number: string;
        validUntil: Date;
        coverageLevel: number;
        issuedBy?: string;
        beneficiaryType?: string;
        accidentType?: string;
        accidentDate?: Date;
        employerInfo?: string;
        insuranceCompany?: string;
        policyType?: string;
    };
    notes?: string;
    issuedBy: string;
    dueDate?: Date;
}
export interface CreateInvoiceResponse {
    success: boolean;
    data?: {
        invoiceId: string;
        invoiceNumber: string;
        totalAmount: number;
        insuranceCoverage: number;
        patientPayable: number;
        status: InvoiceStatus;
        createdAt: Date;
    };
    message: string;
    errors?: Array<{
        field: string;
        message: string;
        code: string;
    }>;
}
/**
 * Create Invoice Use Case
 * Implements invoice creation with Vietnamese healthcare compliance
 */
export declare class CreateInvoiceUseCase extends BaseHealthcareUseCase<CreateInvoiceRequest, CreateInvoiceResponse> {
    private readonly billingRepository;
    private readonly eventBus;
    constructor(billingRepository: IBillingRepository, eventBus: IEventBus, logger: ILogger);
    /**
     * Execute invoice creation
     */
    protected executeCore(request: CreateInvoiceRequest): Promise<CreateInvoiceResponse>;
    /**
     * Validate create invoice request
     */
    private validateRequest;
    /**
     * Generate unique invoice ID
     */
    private generateInvoiceId;
    /**
     * Create billing items from request
     */
    private createBillingItems;
    /**
     * Create insurance from request
     */
    private createInsurance;
    /**
     * Calculate default due date (30 days from now)
     */
    private calculateDefaultDueDate;
}
//# sourceMappingURL=CreateInvoiceUseCase.d.ts.map