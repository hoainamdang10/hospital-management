"use strict";
/**
 * GetAllPaymentsUseCase - Application Layer
 * Use case for retrieving all payments with filters
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAllPaymentsUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class GetAllPaymentsUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(billingRepository, logger) {
        super();
        this.billingRepository = billingRepository;
        this.logger = logger;
    }
    async executeImpl(request) {
        try {
            this.logger.info('Getting all payments', {
                page: request.page,
                limit: request.limit
            });
            // Validate pagination
            if (request.page < 1 || request.limit < 1 || request.limit > 100) {
                return {
                    success: false,
                    total: 0,
                    summary: { totalAmount: 0, paymentCount: 0, byMethod: {} },
                    message: 'Tham số phân trang không hợp lệ',
                    errors: [{
                            field: 'pagination',
                            message: 'Page must be >= 1, limit must be 1-100',
                            code: 'INVALID_PAGINATION'
                        }]
                };
            }
            // Get all invoices
            const allInvoices = await this.billingRepository.findAll();
            // Extract all payments
            const allPayments = [];
            for (const invoice of allInvoices) {
                if (invoice.payments && invoice.payments.length > 0) {
                    for (const payment of invoice.payments) {
                        allPayments.push({
                            ...payment,
                            invoiceId: invoice.invoiceId.value,
                            invoiceNumber: invoice.vietnameseInvoiceNumber || invoice.invoiceId.value
                        });
                    }
                }
            }
            // Apply filters
            let filteredPayments = allPayments;
            if (request.dateFrom) {
                filteredPayments = filteredPayments.filter(p => new Date(p.processedAt) >= request.dateFrom);
            }
            if (request.dateTo) {
                filteredPayments = filteredPayments.filter(p => new Date(p.processedAt) <= request.dateTo);
            }
            if (request.paymentMethod) {
                filteredPayments = filteredPayments.filter(p => p.method === request.paymentMethod);
            }
            // Sort by processed date (newest first)
            filteredPayments.sort((a, b) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime());
            // Apply pagination
            const offset = (request.page - 1) * request.limit;
            const paginatedPayments = filteredPayments.slice(offset, offset + request.limit);
            // Calculate summary
            const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
            const byMethod = {};
            for (const payment of filteredPayments) {
                byMethod[payment.method] = (byMethod[payment.method] || 0) + payment.amount;
            }
            return {
                success: true,
                data: paginatedPayments.map(p => ({
                    paymentId: p.paymentId,
                    invoiceId: p.invoiceId,
                    invoiceNumber: p.invoiceNumber,
                    amount: p.amount,
                    currency: p.currency || 'VND',
                    method: p.method,
                    transactionId: p.transactionId,
                    processedAt: new Date(p.processedAt),
                    processedBy: p.processedBy,
                    status: 'COMPLETED'
                })),
                total: filteredPayments.length,
                summary: {
                    totalAmount,
                    paymentCount: filteredPayments.length,
                    byMethod
                },
                message: `Tìm thấy ${filteredPayments.length} giao dịch thanh toán`
            };
        }
        catch (error) {
            this.logger.error('Error getting all payments', { error, request });
            throw error;
        }
    }
}
exports.GetAllPaymentsUseCase = GetAllPaymentsUseCase;
//# sourceMappingURL=GetAllPaymentsUseCase.js.map