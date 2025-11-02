/**
 * BillingIntegrationEvents - Application Layer
 * Integration events for billing service communication
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Event-Driven Architecture, HIPAA
 */
import { IntegrationEvent } from '@shared/domain/base/domain-event';
/**
 * Medical Record Completed Event
 * Triggered when a medical record is completed and ready for billing
 */
export declare class MedicalRecordCompletedEvent extends IntegrationEvent {
    readonly recordId: string;
    readonly patientId: string;
    readonly doctorId: string;
    readonly appointmentId: string;
    readonly visitDate: Date;
    readonly diagnoses: Array<{
        code: string;
        display: string;
        category: string;
        severity: string;
        isPrimary: boolean;
    }>;
    readonly medications: Array<{
        code: string;
        name: string;
        dosage: string;
        frequency: string;
        isHighPriority: boolean;
    }>;
    readonly procedures: Array<{
        code: string;
        display: string;
        performedDate: Date;
        cost?: number;
    }>;
    readonly billingInfo: {
        insuranceType?: 'BHYT' | 'BHTN' | 'Private' | 'Self-pay';
        insuranceNumber?: string;
        insuranceValidUntil?: Date;
        estimatedCost?: number;
        priority: 'routine' | 'urgent' | 'emergency';
        specialtyCode?: string;
        hospitalCode?: string;
    };
    readonly completedBy: string;
    readonly completedAt: Date;
    constructor(recordId: string, patientId: string, doctorId: string, appointmentId: string, visitDate: Date, diagnoses: Array<{
        code: string;
        display: string;
        category: string;
        severity: string;
        isPrimary: boolean;
    }>, medications: Array<{
        code: string;
        name: string;
        dosage: string;
        frequency: string;
        isHighPriority: boolean;
    }>, procedures: Array<{
        code: string;
        display: string;
        performedDate: Date;
        cost?: number;
    }>, billingInfo: {
        insuranceType?: 'BHYT' | 'BHTN' | 'Private' | 'Self-pay';
        insuranceNumber?: string;
        insuranceValidUntil?: Date;
        estimatedCost?: number;
        priority: 'routine' | 'urgent' | 'emergency';
        specialtyCode?: string;
        hospitalCode?: string;
    }, completedBy: string, completedAt?: Date);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
    /**
     * Get billing priority
     */
    getBillingPriority(): 'low' | 'medium' | 'high' | 'critical';
    /**
     * Get estimated billing amount
     */
    getEstimatedBillingAmount(): number;
    /**
     * Check if insurance coverage applies
     */
    hasInsuranceCoverage(): boolean;
    /**
     * Get Vietnamese summary
     */
    getVietnameseSummary(): string;
}
/**
 * Medical Record Updated Event
 * Triggered when a medical record is updated and may affect billing
 */
export declare class MedicalRecordUpdatedForBillingEvent extends IntegrationEvent {
    readonly recordId: string;
    readonly patientId: string;
    readonly changes: {
        addedDiagnoses?: Array<{
            code: string;
            display: string;
            cost?: number;
        }>;
        removedDiagnoses?: Array<{
            code: string;
            display: string;
        }>;
        addedMedications?: Array<{
            code: string;
            name: string;
            cost?: number;
        }>;
        removedMedications?: Array<{
            code: string;
            name: string;
        }>;
        addedProcedures?: Array<{
            code: string;
            display: string;
            cost?: number;
        }>;
        removedProcedures?: Array<{
            code: string;
            display: string;
        }>;
        statusChange?: {
            from: string;
            to: string;
        };
    };
    readonly billingImpact: {
        costChange: number;
        requiresNewInvoice: boolean;
        requiresInvoiceUpdate: boolean;
        affectsInsuranceClaim: boolean;
    };
    readonly updatedBy: string;
    readonly updatedAt: Date;
    constructor(recordId: string, patientId: string, changes: {
        addedDiagnoses?: Array<{
            code: string;
            display: string;
            cost?: number;
        }>;
        removedDiagnoses?: Array<{
            code: string;
            display: string;
        }>;
        addedMedications?: Array<{
            code: string;
            name: string;
            cost?: number;
        }>;
        removedMedications?: Array<{
            code: string;
            name: string;
        }>;
        addedProcedures?: Array<{
            code: string;
            display: string;
            cost?: number;
        }>;
        removedProcedures?: Array<{
            code: string;
            display: string;
        }>;
        statusChange?: {
            from: string;
            to: string;
        };
    }, billingImpact: {
        costChange: number;
        requiresNewInvoice: boolean;
        requiresInvoiceUpdate: boolean;
        affectsInsuranceClaim: boolean;
    }, updatedBy: string, updatedAt?: Date);
    getEventData(): any;
    containsPHI(): boolean;
    getPatientId(): string | null;
    /**
     * Get change summary
     */
    getChangeSummary(): string;
    /**
     * Check if requires immediate billing action
     */
    requiresImmediateBillingAction(): boolean;
}
/**
 * Insurance Verification Required Event
 * Triggered when insurance verification is needed for billing
 */
export declare class InsuranceVerificationRequiredEvent extends IntegrationEvent {
    readonly recordId: string;
    readonly patientId: string;
    readonly insuranceInfo: {
        type: 'BHYT' | 'BHTN' | 'Private';
        number: string;
        validUntil: Date;
        issuer?: string;
        coverageLevel?: string;
    };
    readonly verificationReason: 'new_record' | 'expired_coverage' | 'coverage_dispute' | 'high_cost_treatment';
    readonly estimatedCost: number;
    readonly urgency: 'low' | 'medium' | 'high' | 'critical';
    readonly requestedBy: string;
    readonly requestedAt: Date;
    constructor(recordId: string, patientId: string, insuranceInfo: {
        type: 'BHYT' | 'BHTN' | 'Private';
        number: string;
        validUntil: Date;
        issuer?: string;
        coverageLevel?: string;
    }, verificationReason: 'new_record' | 'expired_coverage' | 'coverage_dispute' | 'high_cost_treatment', estimatedCost: number, urgency: 'low' | 'medium' | 'high' | 'critical', requestedBy: string, requestedAt?: Date);
    /**
     * Get Vietnamese insurance type
     */
    private getVietnameseInsuranceType;
    /**
     * Get Vietnamese verification reason
     */
    private getVietnameseVerificationReason;
    /**
     * Get Vietnamese urgency
     */
    private getVietnameseUrgency;
    /**
     * Check if verification is time-sensitive
     */
    isTimeSensitive(): boolean;
    /**
     * Get maximum verification time (in hours)
     */
    getMaxVerificationTime(): number;
    getEventData(): Record<string, any>;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
/**
 * Payment Required Event
 * Triggered when payment is required for a medical record
 */
export declare class PaymentRequiredEvent extends IntegrationEvent {
    readonly recordId: string;
    readonly patientId: string;
    readonly paymentInfo: {
        totalAmount: number;
        insuranceCovered: number;
        patientResponsible: number;
        currency: 'VND';
        dueDate: Date;
        paymentMethods: Array<'cash' | 'card' | 'bank_transfer' | 'insurance_direct'>;
        invoiceNumber?: string;
    };
    readonly itemizedCharges: Array<{
        description: string;
        code?: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        category: 'consultation' | 'medication' | 'procedure' | 'test' | 'other';
    }>;
    readonly priority: 'routine' | 'urgent' | 'immediate';
    readonly generatedBy: string;
    readonly generatedAt: Date;
    constructor(recordId: string, patientId: string, paymentInfo: {
        totalAmount: number;
        insuranceCovered: number;
        patientResponsible: number;
        currency: 'VND';
        dueDate: Date;
        paymentMethods: Array<'cash' | 'card' | 'bank_transfer' | 'insurance_direct'>;
        invoiceNumber?: string;
    }, itemizedCharges: Array<{
        description: string;
        code?: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        category: 'consultation' | 'medication' | 'procedure' | 'test' | 'other';
    }>, priority: 'routine' | 'urgent' | 'immediate', generatedBy: string, generatedAt?: Date);
    /**
     * Format Vietnamese currency
     */
    private formatVietnameseCurrency;
    /**
     * Get Vietnamese priority
     */
    private getVietnamesePriority;
    /**
     * Check if payment is overdue
     */
    isOverdue(): boolean;
    /**
     * Get days until due
     */
    getDaysUntilDue(): number;
    /**
     * Get payment summary
     */
    getPaymentSummary(): string;
    /**
     * Get charge breakdown by category
     */
    getChargeBreakdown(): Record<string, {
        count: number;
        total: number;
    }>;
    getEventData(): Record<string, any>;
    containsPHI(): boolean;
    getPatientId(): string | null;
}
//# sourceMappingURL=BillingIntegrationEvents.d.ts.map