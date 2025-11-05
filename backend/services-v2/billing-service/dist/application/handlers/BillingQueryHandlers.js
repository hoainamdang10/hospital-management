"use strict";
/**
 * BillingQueryHandlers - Application Query Handlers
 * V2 Clean Architecture + DDD Implementation
 * CQRS query handlers for billing operations with Vietnamese healthcare compliance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS, DDD, Vietnamese Healthcare Standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingQueryHandlers = void 0;
const InvoiceId_1 = require("../../domain/value-objects/InvoiceId");
/**
 * Billing Query Handlers
 * Implements CQRS query handling for billing operations
 */
class BillingQueryHandlers {
    constructor(getBillingHistoryUseCase, billingRepository, logger) {
        this.getBillingHistoryUseCase = getBillingHistoryUseCase;
        this.billingRepository = billingRepository;
        this.logger = logger;
    }
    /**
     * Handle get invoice query
     */
    async handleGetInvoice(query) {
        try {
            this.logger.info('Handling get invoice query', {
                queryId: query.queryId,
                invoiceId: query.invoiceId
            });
            const invoiceId = InvoiceId_1.InvoiceId.create(query.invoiceId);
            const billingAggregate = await this.billingRepository.findById(invoiceId);
            if (!billingAggregate) {
                return {
                    success: false,
                    message: 'Không tìm thấy hóa đơn'
                };
            }
            // Transform to response format
            const response = {
                success: true,
                message: 'Lấy thông tin hóa đơn thành công',
                data: {
                    invoiceId: billingAggregate.invoiceId.value,
                    invoiceNumber: billingAggregate.invoiceNumber,
                    patientId: billingAggregate.patientId,
                    patientName: billingAggregate.patientName,
                    doctorId: billingAggregate.doctorId,
                    doctorName: billingAggregate.doctorName,
                    totalAmount: billingAggregate.totalAmount.amount,
                    paidAmount: billingAggregate.totalPaid?.amount || 0,
                    remainingBalance: billingAggregate.remainingBalance.amount,
                    insuranceCoverage: billingAggregate.insuranceCoverage?.amount || 0,
                    status: billingAggregate.status,
                    createdAt: billingAggregate.createdAt,
                    dueDate: billingAggregate.dueDate,
                    items: billingAggregate.items.map(item => ({
                        description: item.description,
                        vietnameseDescription: item.vietnameseDescription,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice.amount,
                        totalPrice: item.totalPrice.amount,
                        category: item.category
                    })),
                    notes: billingAggregate.notes
                }
            };
            // Include payment history if requested
            if (query.includePaymentHistory && billingAggregate.paymentHistory) {
                response.data.paymentHistory = billingAggregate.paymentHistory.map(payment => ({
                    paymentId: payment.paymentId,
                    amount: payment.amount.amount,
                    method: payment.method,
                    processedAt: payment.processedAt,
                    transactionId: payment.transactionId
                }));
            }
            // Include refund history if requested
            if (query.includeRefundHistory && billingAggregate.refundHistory) {
                response.data.refundHistory = billingAggregate.refundHistory.map(refund => ({
                    refundId: refund.refundId,
                    amount: refund.amount.amount,
                    reason: refund.reason,
                    processedAt: refund.processedAt,
                    method: refund.method
                }));
            }
            // Include insurance information
            if (billingAggregate.insurance) {
                response.data.insurance = {
                    type: billingAggregate.insurance.type,
                    number: billingAggregate.insurance.number,
                    coverageLevel: billingAggregate.insurance.coverageLevel,
                    coverageAmount: billingAggregate.insuranceCoverage?.amount || 0
                };
            }
            this.logger.info('Get invoice query handled successfully', {
                queryId: query.queryId,
                invoiceId: query.invoiceId
            });
            return response;
        }
        catch (error) {
            this.logger.error('Error handling get invoice query', {
                queryId: query.queryId,
                invoiceId: query.invoiceId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: `Lỗi lấy thông tin hóa đơn: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
            };
        }
    }
    /**
     * Handle get billing history query
     */
    async handleGetBillingHistory(query) {
        try {
            this.logger.info('Handling get billing history query', {
                queryId: query.queryId,
                patientId: query.patientId,
                doctorId: query.doctorId,
                page: query.page || 1
            });
            return await this.getBillingHistoryUseCase.execute(query);
        }
        catch (error) {
            this.logger.error('Error handling get billing history query', {
                queryId: query.queryId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw new Error(`Lỗi lấy lịch sử thanh toán: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        }
    }
    /**
     * Handle get overdue invoices query
     */
    async handleGetOverdueInvoices(query) {
        try {
            this.logger.info('Handling get overdue invoices query', {
                queryId: query.queryId,
                daysOverdue: query.daysOverdue,
                minimumAmount: query.minimumAmount
            });
            const searchCriteria = {
                isOverdue: true,
                daysOverdue: query.daysOverdue || 1,
                minimumAmount: query.minimumAmount,
                patientId: query.patientId,
                doctorId: query.doctorId,
                page: query.page || 1,
                pageSize: query.pageSize || 20
            };
            const result = await this.billingRepository.searchOverdueInvoices(searchCriteria);
            // Calculate summary statistics
            const totalOverdueAmount = result.items.reduce((sum, item) => sum + item.remainingBalance.amount, 0);
            const averageDaysOverdue = result.items.length > 0
                ? result.items.reduce((sum, item) => sum + item.daysOverdue, 0) / result.items.length
                : 0;
            return {
                success: true,
                message: 'Lấy danh sách hóa đơn quá hạn thành công',
                data: {
                    invoices: result.items.map(item => ({
                        invoiceId: item.invoiceId.value,
                        invoiceNumber: item.invoiceNumber,
                        patientId: item.patientId,
                        patientName: item.patientName,
                        totalAmount: item.totalAmount.amount,
                        remainingBalance: item.remainingBalance.amount,
                        dueDate: item.dueDate,
                        daysOverdue: item.daysOverdue,
                        lastContactDate: item.lastContactDate
                    })),
                    pagination: {
                        page: query.page || 1,
                        pageSize: query.pageSize || 20,
                        totalItems: result.totalCount,
                        totalPages: Math.ceil(result.totalCount / (query.pageSize || 20))
                    },
                    summary: {
                        totalOverdueInvoices: result.totalCount,
                        totalOverdueAmount,
                        averageDaysOverdue
                    }
                }
            };
        }
        catch (error) {
            this.logger.error('Error handling get overdue invoices query', {
                queryId: query.queryId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                message: `Lỗi lấy danh sách hóa đơn quá hạn: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`
            };
        }
    }
}
exports.BillingQueryHandlers = BillingQueryHandlers;
//# sourceMappingURL=BillingQueryHandlers.js.map