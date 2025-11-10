"use strict";
/**
 * GetInvoicesUseCase - Application Layer
 * Use case for retrieving invoices with filters and pagination
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetInvoicesUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class GetInvoicesUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(billingRepository, logger) {
        super();
        this.billingRepository = billingRepository;
        this.logger = logger;
    }
    async executeImpl(request) {
        try {
            this.logger.info('Getting invoices', {
                page: request.page,
                limit: request.limit,
                filters: {
                    status: request.status,
                    patientId: request.patientId,
                    doctorId: request.doctorId
                }
            });
            // Validate pagination
            if (request.page < 1 || request.limit < 1 || request.limit > 100) {
                return {
                    success: false,
                    total: 0,
                    message: 'Tham số phân trang không hợp lệ',
                    errors: [{
                            field: 'pagination',
                            message: 'Page phải >= 1, limit phải từ 1-100',
                            code: 'INVALID_PAGINATION'
                        }]
                };
            }
            // Get invoices from repository
            // TODO: Implement repository method findByFilters()
            const invoices = [];
            const total = 0;
            // Map to response format
            const data = invoices.map(billing => {
                const now = new Date();
                const isOverdue = billing.dueDate && billing.dueDate < now && billing.status === 'PENDING';
                return {
                    invoiceId: billing.invoiceId.value,
                    invoiceNumber: billing.vietnameseInvoiceNumber || billing.invoiceId.value,
                    patientId: billing.patientId,
                    doctorId: billing.doctorId,
                    status: billing.status,
                    totalAmount: billing.totalAmount.amount,
                    insuranceCoverage: billing.insuranceCoverageAmount.amount,
                    patientPayable: billing.patientPaymentAmount.amount,
                    currency: billing.totalAmount.currency,
                    dueDate: billing.dueDate,
                    issuedAt: billing.issuedAt,
                    isOverdue
                };
            });
            return {
                success: true,
                data,
                total,
                message: 'Lấy danh sách hóa đơn thành công'
            };
        }
        catch (error) {
            this.logger.error('Error getting invoices', { error, request });
            throw error;
        }
    }
}
exports.GetInvoicesUseCase = GetInvoicesUseCase;
//# sourceMappingURL=GetInvoicesUseCase.js.map