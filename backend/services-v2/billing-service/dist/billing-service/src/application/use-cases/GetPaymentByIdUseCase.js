"use strict";
/**
 * GetPaymentByIdUseCase - Application Layer
 * Use case for retrieving payment by ID
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPaymentByIdUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class GetPaymentByIdUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(billingRepository, logger) {
        super();
        this.billingRepository = billingRepository;
        this.logger = logger;
    }
    async executeImpl(request) {
        try {
            this.logger.info('Getting payment by ID', {
                paymentId: request.paymentId
            });
            // Get all invoices and search for payment
            const allInvoices = await this.billingRepository.findAll();
            for (const invoice of allInvoices) {
                if (invoice.payments && invoice.payments.length > 0) {
                    const payment = invoice.payments.find(p => p.paymentId === request.paymentId);
                    if (payment) {
                        return {
                            success: true,
                            data: {
                                paymentId: payment.paymentId,
                                invoiceId: invoice.invoiceId.value,
                                invoiceNumber: invoice.vietnameseInvoiceNumber || invoice.invoiceId.value,
                                amount: payment.amount,
                                currency: payment.currency || 'VND',
                                method: payment.method,
                                transactionId: payment.transactionId,
                                processedAt: new Date(payment.processedAt),
                                processedBy: payment.processedBy,
                                status: 'COMPLETED',
                                notes: payment.notes,
                                payosData: payment.payosData
                            },
                            message: 'Lấy thông tin giao dịch thành công'
                        };
                    }
                }
            }
            // Payment not found
            return {
                success: false,
                message: 'Không tìm thấy giao dịch thanh toán',
                errors: [{
                        field: 'paymentId',
                        message: 'Payment not found',
                        code: 'PAYMENT_NOT_FOUND'
                    }]
            };
        }
        catch (error) {
            this.logger.error('Error getting payment by ID', { error, request });
            throw error;
        }
    }
}
exports.GetPaymentByIdUseCase = GetPaymentByIdUseCase;
//# sourceMappingURL=GetPaymentByIdUseCase.js.map