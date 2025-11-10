/**
 * PayOS Payment Service
 * Integration with PayOS payment gateway for Vietnam
 *
 * @author Hospital Management Team
 * @version 1.0.0
 */
export interface PaymentItem {
    name: string;
    quantity: number;
    price: number;
    unit?: string;
}
export interface CreatePaymentRequest {
    orderCode: number;
    amount: number;
    description: string;
    items: PaymentItem[];
    buyerName?: string;
    buyerEmail?: string;
    buyerPhone?: string;
}
export interface PaymentLinkResponse {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
}
export declare class PayOSService {
    private payOS;
    private returnUrl;
    private cancelUrl;
    constructor(clientId: string, apiKey: string, checksumKey: string, returnUrl: string, cancelUrl: string);
    /**
     * Create payment link for invoice
     */
    createPaymentLink(request: CreatePaymentRequest): Promise<PaymentLinkResponse>;
    /**
     * Get payment information by order code or payment link ID
     */
    getPaymentInfo(orderId: string | number): Promise<any>;
    /**
     * Cancel payment link
     */
    cancelPayment(orderCode: number, reason?: string): Promise<any>;
    /**
     * Verify webhook data from PayOS
     */
    verifyWebhookData(webhookBody: any): any;
    /**
     * Confirm webhook URL (one-time setup)
     */
    confirmWebhook(webhookUrl: string): Promise<string>;
}
//# sourceMappingURL=PayOSService.d.ts.map