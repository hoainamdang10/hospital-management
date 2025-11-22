import { ILogger } from "../../../../shared/application/services/logger.interface";
export interface VnpayConfig {
    tmnCode: string;
    hashSecret: string;
    baseUrl: string;
    returnUrl?: string;
    ipAddress?: string;
    orderType?: string;
    locale?: string;
    timeZone?: string;
}
export interface CreatePaymentLinkRequest {
    orderCode: number;
    amount: number;
    description: string;
    buyerEmail?: string;
    returnUrl?: string;
}
export interface PaymentLinkResponse {
    checkoutUrl: string;
    qrCode: string;
    paymentLinkId: string;
    orderCode: number;
    amount: number;
}
export interface WebhookData {
    orderCode: number;
    amount: number;
    description: string;
    reference: string;
    transactionDateTime: string;
    code: string;
    desc: string;
    bankCode?: string;
    bankTranNo?: string;
    currency?: string;
}
export interface RefundRequest {
    orderCode: string;
    transactionNo: string;
    transactionDate: string;
    amount: number;
    description: string;
    refundedBy: string;
}
export interface RefundResponse {
    success: boolean;
    refundId: string;
    message: string;
    responseCode?: string;
    transactionNo?: string;
}
export declare class VnpayIntegrationService {
    private readonly config;
    private readonly logger;
    private readonly refundApiUrl;
    constructor(config: VnpayConfig, logger: ILogger);
    createPaymentLink(request: CreatePaymentLinkRequest): Promise<PaymentLinkResponse>;
    verifyIpnSignature(params: Record<string, string | undefined>, signature: string): boolean;
    static generateOrderCode(): number;
    /**
     * Process refund through VNPAY API
     * VNPAY Refund API Documentation: https://sandbox.vnpayment.vn/apis/docs/huong-dan-tich-hop/#ho%E1%BA%A3n-ti%E1%BB%81n-refund
     */
    processRefund(request: RefundRequest): Promise<RefundResponse>;
    private formatDate;
    private createSignedQuery;
    private generateSecureHash;
    /**
     * Generate secure hash for IPN verification
     * CRITICAL DISCOVERY: VNPAY sends RAW values in IPN but hashes URL-encoded values!
     * - IPN query params: "Thanh toán hóa đơn" (raw)
     * - Hash input: "Thanh+to%C3%A1n+h%C3%B3a+%C4%91%C6%A1n" (URL-encoded with + for space)
     */
    private generateIpnSecureHash;
    private encodeValue;
}
//# sourceMappingURL=VnpayIntegrationService.d.ts.map