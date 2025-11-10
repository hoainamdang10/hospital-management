"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPatientInvoicesUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class GetPatientInvoicesUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info('Getting patient invoices', { patientId: request.patientId });
        const invoices = await this.invoiceRepository.findByPatientId(request.patientId);
        return {
            invoices: invoices.map(invoice => ({
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                totalAmount: invoice.totalAmount.amount,
                outstandingAmount: invoice.outstandingAmount.amount,
                status: invoice.status.value,
                createdAt: invoice.createdAt
            })),
            totalCount: invoices.length
        };
    }
}
exports.GetPatientInvoicesUseCase = GetPatientInvoicesUseCase;
//# sourceMappingURL=GetPatientInvoicesUseCase.js.map