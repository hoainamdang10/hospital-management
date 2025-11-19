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
export declare class VnpayIntegrationService {
    private readonly config;
    private readonly logger;
    constructor(config: VnpayConfig, logger: ILogger);
    createPaymentLink(request: CreatePaymentLinkRequest): Promise<PaymentLinkResponse>;
    verifyIpnSignature(params: Record<string, string | undefined>, signature: string): boolean;
    static generateOrderCode(): number;
    private formatDate;
    private createSignedQuery;
    private generateSecureHash;
    private encodeValue;
}
//# sourceMappingURL=VnpayIntegrationService.d.ts.map