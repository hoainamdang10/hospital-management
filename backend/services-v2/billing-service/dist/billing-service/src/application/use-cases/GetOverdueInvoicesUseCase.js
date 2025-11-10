"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetOverdueInvoicesUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class GetOverdueInvoicesUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info('Getting overdue invoices', { criteria: request });
        // Pass daysOverdue to repository for filtering
        const invoices = await this.invoiceRepository.findOverdueInvoices(request.daysOverdue);
        const now = new Date();
        const overdueInvoices = invoices
            .filter(invoice => {
            if (request.patientId && invoice.patientId !== request.patientId) {
                return false;
            }
            return true;
        })
            .map(invoice => {
            const createdDate = new Date(invoice.createdAt);
            const daysOverdue = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            return {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                patientId: invoice.patientId,
                totalAmount: invoice.totalAmount.amount,
                outstandingAmount: invoice.outstandingAmount.amount,
                daysOverdue,
                createdAt: invoice.createdAt,
                finalizedAt: undefined // Will be added when we expose this property
            };
        })
            .filter(invoice => {
            if (request.daysOverdue && invoice.daysOverdue < request.daysOverdue) {
                return false;
            }
            return true;
        });
        const totalAmount = overdueInvoices.reduce((sum, inv) => sum + inv.outstandingAmount, 0);
        this.logger.info('Overdue invoices retrieved', { count: overdueInvoices.length });
        return {
            invoices: overdueInvoices,
            totalOverdue: overdueInvoices.length,
            totalAmount
        };
    }
}
exports.GetOverdueInvoicesUseCase = GetOverdueInvoicesUseCase;
//# sourceMappingURL=GetOverdueInvoicesUseCase.js.map