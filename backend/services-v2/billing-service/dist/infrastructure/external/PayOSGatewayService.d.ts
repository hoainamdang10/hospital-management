/**
 * PayOSGatewayService - Infrastructure Layer
 * V2 Clean Architecture + DDD Implementation
 * Gateway service for PayOS payment integration with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, PayOS API Integration, Vietnamese Healthcare Standards
 */
import { Money } from '../../domain/value-objects/Money';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { IAuditService } from '../../../../shared/application/services/audit.service.interface';
export interface PayOSConfig {
    apiUrl: string;
    clientId: string;
    apiKey: string;
    checksumKey: string;
    environment: 'sandbox' | 'production';
    webhookUrl: string;
    returnUrl: string;
    cancelUrl: string;
}
export interface PayOSPaymentRequest {
    invoiceId: string;
    patientId: string;
    amount: Money;
    description: string;
    patientInfo?: {
        name?: string;
        email?: string;
        phone?: string;
        address?: string;
    };
    items?: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    metadata?: Record<string, any>;
    expiredAt?: Date;
}
export interface PayOSPaymentResult {
    success: boolean;
    data?: {
        orderCode: string;
        paymentLinkId: string;
        checkoutUrl: string;
        qrCode: string;
        deepLink: string;
        deepLinkWebApp: string;
        amount: number;
        currency: string;
        status: string;
        expiresAt: Date;
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
export interface PayOSWebhookResult {
    success: boolean;
    data?: {
        orderCode: string;
        invoiceId: string;
        amount: number;
        currency: string;
        status: 'PAID' | 'CANCELLED' | 'EXPIRED';
        transactionId: string;
        paidAt: Date;
        paymentMethod: string;
        bankCode?: string;
        bankName?: string;
        accountNumber?: string;
    };
    error?: {
        code: string;
        message: string;
    };
}
export interface PayOSGatewayServiceConfig {
    payosConfig: PayOSConfig;
    logger: ILogger;
    auditService: IAuditService;
}
/**
 * PayOS Gateway Service
 * Infrastructure service for PayOS payment gateway integration with Vietnamese healthcare compliance
 */
export declare class PayOSGatewayService {
    private readonly payosService;
    private readonly config;
    private readonly logger;
    private readonly auditService;
    constructor(serviceConfig: PayOSGatewayServiceConfig);
    /**
     * Create payment link for invoice
     */
    createPaymentLink(request: PayOSPaymentRequest): Promise<PayOSPaymentResult>;
    /**
     * Get payment status
     */
    getPaymentStatus(orderCode: string): Promise<{
        success: boolean;
        data?: {
            orderCode: string;
            status: string;
            amount: number;
            amountPaid: number;
            amountRemaining: number;
            transactions: Array<{
                reference: string;
                amount: number;
                description: string;
                transactionDateTime: Date;
                bankCode?: string;
                bankName?: string;
            }>;
        };
        error?: {
            code: string;
            message: string;
        };
    }>;
    /**
     * Cancel payment
     */
    cancelPayment(orderCode: string, reason?: string): Promise<{
        success: boolean;
        data?: any;
        error?: {
            code: string;
            message: string;
        };
    }>;
    /**
     * Process webhook notification
     */
    processWebhook(webhookData: any, signature: string): Promise<PayOSWebhookResult>;
    /**
     * Validate payment request
     */
    private validatePaymentRequest;
    /**
     * Generate order code from invoice ID
     */
    private generateOrderCode;
    /**
     * Extract invoice ID from order code
     */
    private extractInvoiceIdFromOrderCode;
    /**
     * Create payment description
     */
    private createPaymentDescription;
    /**
     * Create default items for PayOS
     */
    private createDefaultItems;
    /**
     * Simple hash function
     */
    private simpleHash;
    /**
     * Get PayOS status in Vietnamese
     */
    getVietnameseStatus(status: string): string;
    /**
     * Check if environment is production
     */
    isProduction(): boolean;
    /**
     * Get webhook URL
     */
    getWebhookUrl(): string;
    /**
     * Get return URL
     */
    getReturnUrl(): string;
    /**
     * Get cancel URL
     */
    getCancelUrl(): string;
    /**
     * Format amount for display
     */
    formatAmount(amount: Money): string;
    /**
     * Create payment summary for Vietnamese healthcare
     */
    createPaymentSummary(request: PayOSPaymentRequest): {
        invoiceId: string;
        patientName: string;
        amount: string;
        description: string;
        paymentMethod: string;
    };
}
//# sourceMappingURL=PayOSGatewayService.d.ts.map