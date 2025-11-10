"use strict";
/**
 * BillingApplicationService - Application Service Layer
 * V2 Clean Architecture + DDD Implementation
 * Orchestrates billing operations with PayOS integration and Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, CQRS, Vietnamese Healthcare Standards, PayOS Integration
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingApplicationService = void 0;
/**
 * Billing Application Service
 * Orchestrates all billing operations with Vietnamese healthcare compliance
 */
class BillingApplicationService {
    constructor(config) {
        this.createInvoiceUseCase = config.createInvoiceUseCase;
        this.processPaymentUseCase = config.processPaymentUseCase;
        this.refundPaymentUseCase = config.refundPaymentUseCase;
        this.getBillingHistoryUseCase = config.getBillingHistoryUseCase;
        this.commandHandlers = config.commandHandlers;
        this.queryHandlers = config.queryHandlers;
        this.payosService = config.payosService;
        this.logger = config.logger;
    }
    // ==================== INVOICE OPERATIONS ====================
    /**
     * Create new invoice
     */
    async createInvoice(request, userId) {
        try {
            this.logger.info('BillingApplicationService: Creating invoice', {
                patientId: request.patientId,
                doctorId: request.doctorId,
                userId
            });
            const command = {
                ...request,
                commandId: `create-invoice-${Date.now()}`,
                timestamp: new Date(),
                userId
            };
            return await this.commandHandlers.handleCreateInvoice(command);
        }
        catch (error) {
            this.logger.error('BillingApplicationService: Error creating invoice', {
                patientId: request.patientId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Get invoice details
     */
    async getInvoice(invoiceId, options, userId) {
        try {
            this.logger.info('BillingApplicationService: Getting invoice', {
                invoiceId,
                userId
            });
            const query = {
                invoiceId,
                includePaymentHistory: options?.includePaymentHistory,
                includeRefundHistory: options?.includeRefundHistory,
                queryId: `get-invoice-${Date.now()}`,
                timestamp: new Date(),
                userId
            };
            return await this.queryHandlers.handleGetInvoice(query);
        }
        catch (error) {
            this.logger.error('BillingApplicationService: Error getting invoice', {
                invoiceId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Cancel invoice
     */
    async cancelInvoice(invoiceId, reason, cancelledBy, userId) {
        try {
            this.logger.info('BillingApplicationService: Cancelling invoice', {
                invoiceId,
                reason,
                cancelledBy,
                userId
            });
            const command = {
                invoiceId,
                reason,
                cancelledBy,
                commandId: `cancel-invoice-${Date.now()}`,
                timestamp: new Date(),
                userId
            };
            return await this.commandHandlers.handleCancelInvoice(command);
        }
        catch (error) {
            this.logger.error('BillingApplicationService: Error cancelling invoice', {
                invoiceId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    // ==================== PAYMENT OPERATIONS ====================
    /**
     * Process payment with PayOS integration
     */
    async processPayment(request, userId) {
        try {
            this.logger.info('BillingApplicationService: Processing payment', {
                invoiceId: request.invoiceId,
                amount: request.amount,
                paymentMethod: request.paymentMethod,
                userId
            });
            // If PayOS payment method, integrate with PayOS
            if (request.paymentMethod === 'payos' && request.payosData) {
                const payosResult = await this.payosService.processPayment({
                    orderCode: request.payosData.orderCode,
                    amount: request.amount,
                    description: `Thanh toán hóa đơn ${request.invoiceId}`,
                    returnUrl: process.env.PAYOS_RETURN_URL || '',
                    cancelUrl: process.env.PAYOS_CANCEL_URL || ''
                });
                if (!payosResult.success) {
                    return {
                        success: false,
                        message: `Lỗi PayOS: ${payosResult.message}`
                    };
                }
                // Update request with PayOS transaction data
                request.transactionId = payosResult.data?.transactionId;
                request.payosData = {
                    ...request.payosData,
                    checkoutUrl: payosResult.data?.checkoutUrl,
                    qrCode: payosResult.data?.qrCode
                };
            }
            const command = {
                ...request,
                commandId: `process-payment-${Date.now()}`,
                timestamp: new Date(),
                userId
            };
            return await this.commandHandlers.handleProcessPayment(command);
        }
        catch (error) {
            this.logger.error('BillingApplicationService: Error processing payment', {
                invoiceId: request.invoiceId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Process refund
     */
    async processRefund(request, userId) {
        try {
            this.logger.info('BillingApplicationService: Processing refund', {
                invoiceId: request.invoiceId,
                refundAmount: request.refundAmount,
                refundReason: request.refundReason,
                userId
            });
            const command = {
                ...request,
                commandId: `refund-payment-${Date.now()}`,
                timestamp: new Date(),
                userId
            };
            return await this.commandHandlers.handleRefundPayment(command);
        }
        catch (error) {
            this.logger.error('BillingApplicationService: Error processing refund', {
                invoiceId: request.invoiceId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    // ==================== QUERY OPERATIONS ====================
    /**
     * Get billing history
     */
    async getBillingHistory(request, userId) {
        try {
            this.logger.info('BillingApplicationService: Getting billing history', {
                patientId: request.patientId,
                doctorId: request.doctorId,
                page: request.page || 1,
                userId
            });
            const query = {
                ...request,
                queryId: `get-billing-history-${Date.now()}`,
                timestamp: new Date(),
                userId
            };
            return await this.queryHandlers.handleGetBillingHistory(query);
        }
        catch (error) {
            this.logger.error('BillingApplicationService: Error getting billing history', {
                patientId: request.patientId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Get overdue invoices
     */
    async getOverdueInvoices(options, userId) {
        try {
            this.logger.info('BillingApplicationService: Getting overdue invoices', {
                daysOverdue: options?.daysOverdue,
                minimumAmount: options?.minimumAmount,
                userId
            });
            const query = {
                ...options,
                queryId: `get-overdue-invoices-${Date.now()}`,
                timestamp: new Date(),
                userId
            };
            return await this.queryHandlers.handleGetOverdueInvoices(query);
        }
        catch (error) {
            this.logger.error('BillingApplicationService: Error getting overdue invoices', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    // ==================== BULK OPERATIONS ====================
    /**
     * Create multiple invoices
     */
    async createBulkInvoices(invoices, createdBy, userId) {
        try {
            this.logger.info('BillingApplicationService: Creating bulk invoices', {
                invoiceCount: invoices.length,
                createdBy,
                userId
            });
            const command = {
                invoices,
                batchId: `batch-${Date.now()}`,
                createdBy,
                commandId: `bulk-create-invoices-${Date.now()}`,
                timestamp: new Date(),
                userId
            };
            return await this.commandHandlers.handleBulkInvoiceCreation(command);
        }
        catch (error) {
            this.logger.error('BillingApplicationService: Error creating bulk invoices', {
                invoiceCount: invoices.length,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    // ==================== VIETNAMESE HEALTHCARE INTEGRATION ====================
    /**
     * Process BHYT insurance claim
     */
    async processBHYTClaim(invoiceId, bhytData, processedBy, userId) {
        try {
            this.logger.info('BillingApplicationService: Processing BHYT claim', {
                invoiceId,
                cardNumber: bhytData.cardNumber,
                hospitalCode: bhytData.hospitalCode,
                userId
            });
            // Get invoice details
            const invoiceResponse = await this.getInvoice(invoiceId, { includePaymentHistory: false }, userId);
            if (!invoiceResponse.success || !invoiceResponse.data) {
                return {
                    success: false,
                    message: 'Không tìm thấy hóa đơn'
                };
            }
            // Calculate BHYT coverage based on beneficiary type and coverage level
            const coveragePercentage = this.calculateBHYTCoverage(bhytData.beneficiaryType);
            const coverageAmount = invoiceResponse.data.totalAmount * (coveragePercentage / 100);
            // Process as insurance payment
            const paymentRequest = {
                invoiceId,
                amount: coverageAmount,
                paymentMethod: 'insurance_direct',
                notes: `BHYT claim - Card: ${bhytData.cardNumber}`,
                processedBy
            };
            return await this.processPayment(paymentRequest, userId);
        }
        catch (error) {
            this.logger.error('BillingApplicationService: Error processing BHYT claim', {
                invoiceId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    /**
     * Calculate BHYT coverage percentage based on beneficiary type
     */
    calculateBHYTCoverage(beneficiaryType) {
        const coverageMap = {
            'group1': 100, // Nhóm 1: Trẻ em dưới 6 tuổi
            'group2': 95, // Nhóm 2: Người nghèo, dân tộc thiểu số
            'group3': 80, // Nhóm 3: Người lao động
            'group4': 95, // Nhóm 4: Người cao tuổi
            'group5': 100 // Nhóm 5: Người có công với cách mạng
        };
        return coverageMap[beneficiaryType] || 80; // Default 80%
    }
    // ==================== HEALTH CHECK ====================
    /**
     * Get service health status
     */
    async getHealthStatus() {
        try {
            const payosStatus = await this.payosService.checkHealth();
            return {
                status: payosStatus ? 'healthy' : 'unhealthy',
                services: {
                    payos: payosStatus,
                    database: true, // Would check repository health
                    eventBus: true // Would check event bus health
                },
                timestamp: new Date()
            };
        }
        catch (error) {
            this.logger.error('BillingApplicationService: Error checking health status', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                status: 'unhealthy',
                services: {
                    payos: false,
                    database: false,
                    eventBus: false
                },
                timestamp: new Date()
            };
        }
    }
}
exports.BillingApplicationService = BillingApplicationService;
//# sourceMappingURL=BillingApplicationService.js.map