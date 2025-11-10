/**
 * PayOSIntegrationService - Application Layer
 * Service for integrating with PayOS payment gateway
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, PayOS API Integration
 */
import { Money } from '../../domain/value-objects/Money';
export interface PayOSPaymentRequest {
    orderCode: string;
    amount: number;
    description: string;
    buyerName?: string;
    buyerEmail?: string;
    buyerPhone?: string;
    buyerAddress?: string;
    items?: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    returnUrl?: string;
    cancelUrl?: string;
    expiredAt?: number;
}
export interface PayOSPaymentResponse {
    success: boolean;
    data?: {
        bin: string;
        accountNumber: string;
        accountName: string;
        amount: number;
        description: string;
        orderCode: string;
        currency: string;
        paymentLinkId: string;
        status: string;
        checkoutUrl: string;
        qrCode: string;
        deepLink: string;
        deepLinkWebApp: string;
    };
    error?: {
        code: string;
        desc: string;
    };
    message: string;
}
export interface PayOSWebhookData {
    code: string;
    desc: string;
    data: {
        orderCode: string;
        amount: number;
        description: string;
        accountNumber: string;
        reference: string;
        transactionDateTime: string;
        currency: string;
        paymentLinkId: string;
        code: string;
        desc: string;
        counterAccountBankId?: string;
        counterAccountBankName?: string;
        counterAccountName?: string;
        counterAccountNumber?: string;
        virtualAccountName?: string;
        virtualAccountNumber?: string;
    };
    signature: string;
}
export interface PayOSPaymentInfo {
    id: string;
    orderCode: string;
    amount: number;
    amountPaid: number;
    amountRemaining: number;
    status: 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED';
    createdAt: string;
    transactions: Array<{
        reference: string;
        amount: number;
        accountNumber: string;
        description: string;
        transactionDateTime: string;
        virtualAccountName?: string;
        virtualAccountNumber?: string;
        counterAccountBankId?: string;
        counterAccountBankName?: string;
        counterAccountName?: string;
        counterAccountNumber?: string;
    }>;
}
/**
 * PayOSIntegrationService
 * Handles PayOS payment gateway integration
 */
export declare class PayOSIntegrationService {
    private readonly apiUrl;
    private readonly clientId;
    private readonly apiKey;
    private readonly checksumKey;
    constructor(apiUrl: string | undefined, clientId: string, apiKey: string, checksumKey: string);
    /**
     * Create payment link
     */
    createPaymentLink(request: PayOSPaymentRequest): Promise<PayOSPaymentResponse>;
    /**
     * Get payment information
     */
    getPaymentInfo(orderCode: string): Promise<{
        success: boolean;
        data?: PayOSPaymentInfo;
        error?: {
            code: string;
            desc: string;
        };
        message: string;
    }>;
    /**
     * Cancel payment
     */
    cancelPayment(orderCode: string, cancellationReason?: string): Promise<{
        success: boolean;
        data?: any;
        error?: {
            code: string;
            desc: string;
        };
        message: string;
    }>;
    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(webhookData: PayOSWebhookData): boolean;
    /**
     * Process webhook
     */
    processWebhook(webhookData: PayOSWebhookData): Promise<{
        success: boolean;
        data?: {
            orderCode: string;
            amount: number;
            status: string;
            transactionId: string;
            paidAt: Date;
            paymentMethod: string;
        };
        error?: {
            code: string;
            desc: string;
        };
        message: string;
    }>;
    /**
     * Generate order code
     */
    generateOrderCode(): string;
    /**
     * Format amount for PayOS (VND, no decimals)
     */
    formatAmount(money: Money): number;
    /**
     * Validate payment request
     */
    private validatePaymentRequest;
    /**
     * Create signature for API requests
     */
    private createSignature;
    /**
     * Create webhook signature
     */
    private createWebhookSignature;
    /**
     * Map PayOS status to internal status
     */
    private mapPayOSStatus;
    /**
     * Get Vietnamese status display
     */
    getVietnameseStatus(status: string): string;
    /**
     * Create payment description for Vietnamese healthcare
     */
    createPaymentDescription(invoiceId: string, patientName?: string): string;
}
//# sourceMappingURL=PayOSIntegrationService.d.ts.map