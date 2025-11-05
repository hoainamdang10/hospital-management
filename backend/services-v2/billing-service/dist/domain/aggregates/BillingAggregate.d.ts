/**
 * BillingAggregate - Domain Layer
 * Core aggregate for billing and invoice management
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Vietnamese Billing Standards
 */
import { AggregateRoot } from '../../../../shared/domain/AggregateRoot';
import { InvoiceId } from '../value-objects/InvoiceId';
import { Money } from '../value-objects/Money';
import { Insurance } from '../value-objects/Insurance';
export declare enum InvoiceStatus {
    DRAFT = "draft",
    PENDING = "pending",
    PAID = "paid",
    PARTIALLY_PAID = "partially_paid",
    OVERDUE = "overdue",
    CANCELLED = "cancelled",
    REFUNDED = "refunded"
}
export declare enum PaymentMethod {
    CASH = "cash",
    CARD = "card",
    BANK_TRANSFER = "bank_transfer",
    PAYOS = "payos",
    INSURANCE_DIRECT = "insurance_direct"
}
export interface BillingItem {
    id: string;
    description: string;
    vietnameseDescription: string;
    quantity: number;
    unitPrice: Money;
    totalPrice: Money;
    category: 'consultation' | 'medication' | 'procedure' | 'test' | 'room' | 'other';
    taxable: boolean;
    insuranceCoverable: boolean;
    medicalRecordId?: string;
    serviceCode?: string;
}
export interface PaymentRecord {
    id: string;
    amount: Money;
    method: PaymentMethod;
    transactionId?: string;
    processedAt: Date;
    processedBy: string;
    notes?: string;
    payosData?: any;
}
export interface InsuranceClaim {
    id: string;
    insurance: Insurance;
    claimAmount: Money;
    approvedAmount?: Money;
    status: 'submitted' | 'processing' | 'approved' | 'rejected' | 'paid';
    submittedAt: Date;
    processedAt?: Date;
    rejectionReason?: string;
    claimNumber?: string;
}
/**
 * BillingAggregate
 * Manages invoices, payments, and insurance claims
 */
export declare class BillingAggregate extends AggregateRoot<InvoiceId> {
    private _patientId;
    private _medicalRecordId;
    private _doctorId;
    private _appointmentId;
    private _status;
    private _items;
    private _subtotal;
    private _taxAmount;
    private _totalAmount;
    private _insurance?;
    private _insuranceCoverage;
    private _patientPayment;
    private _payments;
    private _insuranceClaims;
    private _dueDate;
    private _issuedAt;
    private _issuedBy;
    private _notes?;
    private _vietnameseInvoiceNumber?;
    private constructor();
    /**
     * Create new billing aggregate
     */
    static create(patientId: string, medicalRecordId: string, doctorId: string, appointmentId: string, issuedBy: string): BillingAggregate;
    /**
     * Reconstitute from persistence
     */
    static reconstitute(id: InvoiceId, patientId: string, medicalRecordId: string, doctorId: string, appointmentId: string, status: InvoiceStatus, items: BillingItem[], subtotal: Money, taxAmount: Money, totalAmount: Money, insurance: Insurance | undefined, insuranceCoverage: Money, patientPayment: Money, payments: PaymentRecord[], insuranceClaims: InsuranceClaim[], dueDate: Date, issuedAt: Date, issuedBy: string, notes?: string, vietnameseInvoiceNumber?: string): BillingAggregate;
    get patientId(): string;
    get medicalRecordId(): string;
    get doctorId(): string;
    get appointmentId(): string;
    get status(): InvoiceStatus;
    get items(): BillingItem[];
    get subtotal(): Money;
    get taxAmount(): Money;
    get totalAmount(): Money;
    get insurance(): Insurance | undefined;
    get insuranceCoverage(): Money;
    get patientPayment(): Money;
    get payments(): PaymentRecord[];
    get insuranceClaims(): InsuranceClaim[];
    get dueDate(): Date;
    get issuedAt(): Date;
    get issuedBy(): string;
    get notes(): string | undefined;
    get vietnameseInvoiceNumber(): string | undefined;
    /**
     * Add billing item
     */
    addItem(item: BillingItem): void;
    /**
     * Remove billing item
     */
    removeItem(itemId: string): void;
    /**
     * Set insurance
     */
    setInsurance(insurance: Insurance): void;
    /**
     * Finalize invoice (change from draft to pending)
     */
    finalize(): void;
    /**
     * Process payment
     */
    processPayment(amount: Money, method: PaymentMethod, processedBy: string, transactionId?: string, notes?: string, payosData?: any): void;
    /**
     * Submit insurance claim
     */
    submitInsuranceClaim(): void;
    /**
     * Cancel invoice
     */
    cancel(reason: string, cancelledBy: string): void;
    /**
     * Check if overdue
     */
    isOverdue(): boolean;
    /**
     * Get total paid amount
     */
    getTotalPaidAmount(): Money;
    /**
     * Get remaining amount to pay
     */
    getRemainingAmount(): Money;
    /**
     * Check if fully paid
     */
    isFullyPaid(): boolean;
    /**
     * Get Vietnamese status display
     */
    getVietnameseStatusDisplay(): string;
    /**
     * Recalculate amounts
     */
    private recalculateAmounts;
    /**
     * Update payment status based on payments
     */
    private updatePaymentStatus;
    /**
     * Generate Vietnamese invoice number
     */
    private generateVietnameseInvoiceNumber;
    /**
     * Generate payment ID
     */
    private generatePaymentId;
    /**
     * Generate claim ID
     */
    private generateClaimId;
    /**
     * Generate claim number
     */
    private generateClaimNumber;
}
//# sourceMappingURL=BillingAggregate.d.ts.map