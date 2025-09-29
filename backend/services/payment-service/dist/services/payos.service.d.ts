export interface PaymentRequest {
    orderCode: string;
    amount: number;
    description: string;
    serviceName: string;
    appointmentId: string;
    patientInfo?: {
        doctorName: string;
        department: string;
        appointmentDate: string;
        timeSlot: string;
    };
}
export interface PayOSResponse {
    bin: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    description: string;
    orderCode: number;
    currency: string;
    paymentLinkId: string;
    status: string;
    checkoutUrl: string;
    qrCode: string;
}
export interface PaymentResult {
    success: boolean;
    orderCode: string;
    amount: number;
    transactionId?: string;
    status: 'success' | 'failed' | 'pending' | 'cancelled';
    failureReason?: string;
}
export interface PaymentInfo {
    id: string;
    orderCode: number;
    amount: number;
    amountPaid: number;
    amountRemaining: number;
    status: string;
    createdAt: string;
    transactions: Array<{
        reference: string;
        amount: number;
        accountNumber: string;
        description: string;
        transactionDateTime: string;
    }>;
}
export declare class PayOSService {
    private payOS;
    private readonly returnUrl;
    private readonly cancelUrl;
    constructor();
    createPaymentLink(paymentData: PaymentRequest): Promise<PayOSResponse>;
    verifyPaymentWebhook(webhookData: any): Promise<PaymentResult>;
    getPaymentInfo(orderCode: string): Promise<PaymentInfo>;
    cancelPaymentLink(orderCode: string, reason?: string): Promise<boolean>;
    generateOrderCode(): string;
    validateWebhookSignature(payload: string, signature: string): boolean;
    private mapPayOSStatusToInternal;
    formatAmount(amount: number): number;
    validateAmount(amount: number): boolean;
    getEnvironmentInfo(): {
        environment: string;
        isProduction: boolean;
    };
}
//# sourceMappingURL=payos.service.d.ts.map