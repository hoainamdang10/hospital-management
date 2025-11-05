/**
 * GenerateInvoiceUseCase - Application Layer
 * Use case for generating invoices from medical records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, Vietnamese Healthcare Standards
 */
import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IDomainEventPublisher } from '../../../../shared/domain/events/IDomainEventPublisher';
import { InsuranceType, BHYTBeneficiaryType, BHTNAccidentType } from '../../domain/value-objects/Insurance';
export interface GenerateInvoiceRequest {
    patientId: string;
    medicalRecordId: string;
    doctorId: string;
    appointmentId: string;
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
        beneficiaryType?: BHYTBeneficiaryType;
        accidentType?: BHTNAccidentType;
        accidentDate?: Date;
        employerInfo?: string;
        insuranceCompany?: string;
        policyType?: string;
    };
    notes?: string;
    issuedBy: string;
}
export interface GenerateInvoiceResponse {
    success: boolean;
    data?: {
        invoiceId: string;
        vietnameseInvoiceNumber?: string;
        totalAmount: number;
        currency: string;
        insuranceCoverage: number;
        patientPayment: number;
        status: string;
        dueDate: Date;
        items: Array<{
            id: string;
            description: string;
            vietnameseDescription: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            category: string;
        }>;
        insurance?: {
            type: string;
            number: string;
            coverageLevel: number;
            vietnameseDisplay: string;
        };
        billingBreakdown: {
            subtotal: number;
            taxAmount: number;
            totalAmount: number;
            insuranceCoverage: number;
            patientPayment: number;
            vatRate: number;
        };
        vietnameseSummary: string;
    };
    errors?: Array<{
        field: string;
        message: string;
    }>;
    message: string;
}
/**
 * GenerateInvoiceUseCase
 * Handles invoice generation from medical records
 */
export declare class GenerateInvoiceUseCase {
    private readonly billingRepository;
    private readonly eventPublisher;
    constructor(billingRepository: IBillingRepository, eventPublisher: IDomainEventPublisher);
    /**
     * Execute use case
     */
    execute(request: GenerateInvoiceRequest): Promise<GenerateInvoiceResponse>;
    /**
     * Validate request
     */
    private validateRequest;
    /**
     * Create insurance from request
     */
    private createInsurance;
    /**
     * Generate Vietnamese summary
     */
    private generateVietnameseSummary;
    /**
     * Generate item ID
     */
    private generateItemId;
    /**
     * Validate BHYT number
     */
    private isValidBHYTNumber;
    /**
     * Validate BHTN number
     */
    private isValidBHTNNumber;
}
//# sourceMappingURL=GenerateInvoiceUseCase.d.ts.map