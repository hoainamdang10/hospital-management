import { ILogger } from '../../../../shared/application/services/logger.interface';
export interface PayOSConfig {
    clientId: string;
    apiKey: string;
    checksumKey: string;
    baseUrl?: string;
}
export interface CreatePaymentLinkRequest {
    orderCode: number;
    amount: number;
    description: string;
    items: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    buyerName?: string;
    buyerEmail?: string;
    buyerPhone?: string;
    buyerAddress?: string;
    returnUrl?: string;
    cancelUrl?: string;
}
export interface PaymentLinkResponse {
    checkoutUrl: string;
    qrCode: string;
    paymentLinkId: string;
    orderCode: number;
    amount: number;
}
export interface PaymentInfo {
    orderCode: number;
    amount: number;
    description: string;
    status: 'PENDING' | 'PROCESSING' | 'PAID' | 'CANCELLED';
    transactions: Array<{
        reference: string;
        amount: number;
        description: string;
        transactionDateTime: string;
    }>;
}
export interface WebhookData {
    orderCode: number;
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
}
export declare class PayOSIntegrationService {
    private readonly config;
    private readonly logger;
    private readonly client;
    private readonly checksumKey;
    constructor(config: PayOSConfig, logger: ILogger);
    /**
     * Create payment link
     */
    createPaymentLink(request: CreatePaymentLinkRequest): Promise<PaymentLinkResponse>;
    /**
     * Get payment information
     */
    getPaymentInfo(orderCode: number): Promise<PaymentInfo>;
    /**
     * Cancel payment link
     */
    cancelPaymentLink(orderCode: number, reason?: string): Promise<void>;
    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(webhookData: WebhookData, signature: string): boolean;
    /**
     * Confirm webhook URL (one-time setup)
     */
    confirmWebhookUrl(webhookUrl: string): Promise<void>;
    /**
     * Generate signature for PayOS requests
     */
    private generateSignature;
    /**
     * Generate unique order code
     */
    static generateOrderCode(): number;
}
//# sourceMappingURL=PayOSIntegrationService.d.ts.map