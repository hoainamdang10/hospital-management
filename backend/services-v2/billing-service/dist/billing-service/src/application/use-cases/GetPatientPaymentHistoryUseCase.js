"use strict";
/**
 * GetPatientPaymentHistoryUseCase - Application Layer
 * Use case for retrieving patient payment history
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPatientPaymentHistoryUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class GetPatientPaymentHistoryUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(billingRepository, logger) {
        super();
        this.billingRepository = billingRepository;
        this.logger = logger;
    }
    async executeImpl(request) {
        try {
            this.logger.info('Getting patient payment history', {
                patientId: request.patientId,
                page: request.page,
                limit: request.limit
            });
            // Validate pagination
            if (request.page < 1 || request.limit < 1 || request.limit > 100) {
                return {
                    success: false,
                    total: 0,
                    summary: {
                        totalPaid: 0,
                        paymentCount: 0,
                        averagePayment: 0,
                        byMethod: { cash: 0, card: 0, bankTransfer: 0, payos: 0, insurance: 0 }
                    },
                    message: 'Tham số phân trang không hợp lệ',
                    errors: [{
                            field: 'pagination',
                            message: 'Page phải >= 1, limit phải từ 1-100',
                            code: 'INVALID_PAGINATION'
                        }]
                };
            }
            // TODO: Implement repository method getPaymentsByPatient()
            const payments = [];
            const total = 0;
            // Map to response format
            const data = payments.map(payment => ({
                paymentId: payment.paymentId,
                invoiceId: payment.invoiceId,
                invoiceNumber: payment.invoiceNumber,
                amount: payment.amount,
                currency: payment.currency || 'VND',
                method: payment.method,
                transactionId: payment.transactionId,
                processedAt: payment.processedAt,
                processedBy: payment.processedBy,
                notes: payment.notes,
                payosData: payment.payosData
            }));
            // Calculate summary
            const summary = this.calculateSummary(payments);
            return {
                success: true,
                data,
                total,
                summary,
                message: 'Lấy lịch sử thanh toán bệnh nhân thành công'
            };
        }
        catch (error) {
            this.logger.error('Error getting patient payment history', { error, request });
            throw error;
        }
    }
    calculateSummary(payments) {
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const byMethod = {
            cash: payments.filter(p => p.method === 'CASH').reduce((sum, p) => sum + p.amount, 0),
            card: payments.filter(p => p.method === 'CARD').reduce((sum, p) => sum + p.amount, 0),
            bankTransfer: payments.filter(p => p.method === 'BANK_TRANSFER').reduce((sum, p) => sum + p.amount, 0),
            payos: payments.filter(p => p.method === 'PAYOS').reduce((sum, p) => sum + p.amount, 0),
            insurance: payments.filter(p => p.method === 'INSURANCE_DIRECT').reduce((sum, p) => sum + p.amount, 0)
        };
        return {
            totalPaid,
            paymentCount: payments.length,
            averagePayment: payments.length > 0 ? totalPaid / payments.length : 0,
            byMethod
        };
    }
}
exports.GetPatientPaymentHistoryUseCase = GetPatientPaymentHistoryUseCase;
//# sourceMappingURL=GetPatientPaymentHistoryUseCase.js.map