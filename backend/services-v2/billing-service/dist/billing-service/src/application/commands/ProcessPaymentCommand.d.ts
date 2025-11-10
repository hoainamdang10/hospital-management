/**
 * ProcessPaymentCommand - Application Layer
 * Command for processing payment on an invoice
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD
 */
import { PaymentMethod } from '../../domain/aggregates/BillingAggregate';
export interface PayOSPaymentData {
    orderCode: number;
    transactionDateTime: string;
    reference: string;
    accountNumber?: string;
    counterAccountNumber?: string;
    counterAccountName?: string;
    virtualAccountNumber?: string;
    virtualAccountName?: string;
    description?: string;
}
export declare class ProcessPaymentCommand {
    readonly invoiceId: string;
    readonly amount: number;
    readonly currency: string;
    readonly paymentMethod: PaymentMethod;
    readonly processedBy: string;
    readonly transactionId?: string;
    readonly notes?: string;
    readonly payosData?: PayOSPaymentData;
    readonly cardLast4?: string;
    readonly cardBrand?: string;
    readonly cardHolderName?: string;
    readonly bankName?: string;
    readonly bankAccountNumber?: string;
    readonly bankTransferReference?: string;
    readonly correlationId?: string;
    readonly causationId?: string;
    readonly userId?: string;
    readonly tenantId?: string;
    readonly timestamp?: Date;
    constructor(data: {
        invoiceId: string;
        amount: number;
        currency?: string;
        paymentMethod: PaymentMethod;
        processedBy: string;
        transactionId?: string;
        notes?: string;
        payosData?: PayOSPaymentData;
        cardLast4?: string;
        cardBrand?: string;
        cardHolderName?: string;
        bankName?: string;
        bankAccountNumber?: string;
        bankTransferReference?: string;
        correlationId?: string;
        causationId?: string;
        userId?: string;
        tenantId?: string;
        timestamp?: Date;
    });
    /**
     * Validate command
     */
    validate(): void;
    /**
     * Check if currency is valid
     */
    private isValidCurrency;
    /**
     * Check if payment is via PayOS
     */
    isPayOSPayment(): boolean;
    /**
     * Check if payment is via card
     */
    isCardPayment(): boolean;
    /**
     * Check if payment is via bank transfer
     */
    isBankTransferPayment(): boolean;
    /**
     * Check if payment is via cash
     */
    isCashPayment(): boolean;
    /**
     * Check if payment is via insurance direct
     */
    isInsuranceDirectPayment(): boolean;
    /**
     * Get payment method display name
     */
    getPaymentMethodDisplay(): string;
    /**
     * Get formatted amount in VND
     */
    getFormattedAmount(): string;
    /**
     * Check if payment has transaction ID
     */
    hasTransactionId(): boolean;
    /**
     * Get masked card number if available
     */
    getMaskedCardNumber(): string | null;
    /**
     * Get PayOS order code if available
     */
    getPayOSOrderCode(): number | null;
    /**
     * Convert to plain object for logging/serialization
     */
    toObject(): Record<string, any>;
    /**
     * Convert to safe object for logging (without sensitive data)
     */
    toSafeObject(): Record<string, any>;
}
//# sourceMappingURL=ProcessPaymentCommand.d.ts.map