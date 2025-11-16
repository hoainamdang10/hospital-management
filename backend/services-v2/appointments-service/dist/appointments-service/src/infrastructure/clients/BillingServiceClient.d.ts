/**
 * Billing Service HTTP Client
 * Handles communication with Billing Service for payment link creation
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance Clean Architecture - Infrastructure Layer
 */
export interface BillingServiceClientConfig {
    baseUrl: string;
    timeout?: number;
    retryAttempts?: number;
    retryDelay?: number;
}
export interface CreatePaymentLinkRequest {
    invoiceId: string;
    buyerName?: string;
    buyerEmail?: string;
    buyerPhone?: string;
}
export interface CreatePaymentLinkResponse {
    success: boolean;
    checkoutUrl: string;
    qrCode: string;
    paymentLinkId: string;
    orderCode: number;
    amount: number;
}
export interface SearchInvoicesRequest {
    patientId?: string;
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    minAmount?: number;
    maxAmount?: number;
    invoiceNumber?: string;
}
export interface InvoiceSummary {
    invoiceId: string;
    invoiceNumber?: string;
    patientId: string;
    totalAmount: number;
    outstandingAmount: number;
    status: string;
    createdAt: Date;
    finalizedAt?: Date;
}
export interface SearchInvoicesResponse {
    invoices: InvoiceSummary[];
    total: number;
}
/**
 * Billing Service Client
 * Provides HTTP client for inter-service communication with Billing Service
 */
export declare class BillingServiceClient {
    private readonly client;
    private readonly retryAttempts;
    private readonly retryDelay;
    constructor(config: BillingServiceClientConfig);
    /**
     * Setup request/response interceptors
     */
    private setupInterceptors;
    /**
     * Create PayOS payment link for invoice
     * POST /api/v1/invoices/:invoiceId/payos/payment-link
     *
     * @param request - Payment link creation request
     * @returns Payment link response with checkout URL
     * @throws Error if request fails after retries
     */
    createPaymentLink(request: CreatePaymentLinkRequest): Promise<CreatePaymentLinkResponse>;
    /**
     * Search invoices
     * GET /api/v1/invoices/search
     *
     * @param request - Search criteria
     * @returns Search results with invoice summaries
     * @throws Error if request fails after retries
     */
    searchInvoices(request: SearchInvoicesRequest): Promise<SearchInvoicesResponse>;
    /**
     * Health check
     * GET /health
     */
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=BillingServiceClient.d.ts.map