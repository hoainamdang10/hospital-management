/**
 * CreateInvoiceCommand - Application Layer
 * Command for creating a new invoice
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */
import { InsuranceType } from '../../domain/value-objects/Insurance';
export interface BillingItemInput {
    description: string;
    vietnameseDescription: string;
    quantity: number;
    unitPrice: number;
    category: 'consultation' | 'medication' | 'procedure' | 'test' | 'room' | 'other';
    taxable?: boolean;
    insuranceCoverable?: boolean;
    medicalRecordId?: string;
    serviceCode?: string;
}
export interface InsuranceInput {
    type: InsuranceType;
    number: string;
    validUntil: Date | string;
    coverageLevel: number;
    issuedBy?: string;
    beneficiaryType?: string;
    accidentType?: string;
    accidentDate?: Date | string;
    employerInfo?: string;
    insuranceCompany?: string;
    policyType?: string;
}
export declare class CreateInvoiceCommand {
    readonly patientId: string;
    readonly medicalRecordId: string;
    readonly doctorId: string;
    readonly appointmentId: string;
    readonly items: BillingItemInput[];
    readonly insurance?: InsuranceInput;
    readonly notes?: string;
    readonly issuedBy: string;
    readonly dueDate?: Date;
    readonly currency?: string;
    readonly correlationId?: string;
    readonly causationId?: string;
    readonly userId?: string;
    readonly tenantId?: string;
    constructor(data: {
        patientId: string;
        medicalRecordId: string;
        doctorId: string;
        appointmentId: string;
        items: BillingItemInput[];
        insurance?: InsuranceInput;
        notes?: string;
        issuedBy: string;
        dueDate?: Date;
        currency?: string;
        correlationId?: string;
        causationId?: string;
        userId?: string;
        tenantId?: string;
    });
    /**
     * Validate command
     */
    validate(): void;
    /**
     * Check if invoice has insurance
     */
    hasInsurance(): boolean;
    /**
     * Get total quantity of items
     */
    getTotalQuantity(): number;
    /**
     * Get estimated total amount (without tax/insurance)
     */
    getEstimatedTotal(): number;
    /**
     * Get taxable items count
     */
    getTaxableItemsCount(): number;
    /**
     * Get insurance coverable items count
     */
    getInsuranceCoverableItemsCount(): number;
    /**
     * Convert to plain object for logging/serialization
     */
    toObject(): Record<string, any>;
}
//# sourceMappingURL=CreateInvoiceCommand.d.ts.map