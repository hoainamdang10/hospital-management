"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPatientBillingSummaryUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class GetPatientBillingSummaryUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info('Getting patient billing summary', { patientId: request.patientId });
        const invoices = await this.invoiceRepository.findByPatientId(request.patientId);
        const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount.amount, 0);
        const totalPaid = invoices.reduce((sum, inv) => {
            const paid = inv.payments
                .filter(p => p.status === 'completed')
                .reduce((pSum, p) => pSum + p.amount.amount, 0);
            return sum + paid;
        }, 0);
        const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.outstandingAmount.amount, 0);
        const overdueAmount = invoices
            .filter(inv => inv.status.value === 'overdue')
            .reduce((sum, inv) => sum + inv.outstandingAmount.amount, 0);
        const invoicesByStatus = {
            draft: invoices.filter(inv => inv.status.value === 'draft').length,
            pending: invoices.filter(inv => inv.status.value === 'pending').length,
            partially_paid: invoices.filter(inv => inv.status.value === 'partially_paid').length,
            paid: invoices.filter(inv => inv.status.value === 'paid').length,
            cancelled: invoices.filter(inv => inv.status.value === 'cancelled').length,
            overdue: invoices.filter(inv => inv.status.value === 'overdue').length
        };
        const recentInvoices = invoices
            .slice(0, 5)
            .map(inv => ({
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            totalAmount: inv.totalAmount.amount,
            outstandingAmount: inv.outstandingAmount.amount,
            status: inv.status.value,
            createdAt: inv.createdAt
        }));
        this.logger.info('Patient billing summary retrieved', {
            patientId: request.patientId,
            totalInvoices: invoices.length
        });
        return {
            patientId: request.patientId,
            totalInvoices: invoices.length,
            totalAmount,
            totalPaid,
            totalOutstanding,
            overdueAmount,
            invoicesByStatus,
            recentInvoices
        };
    }
}
exports.GetPatientBillingSummaryUseCase = GetPatientBillingSummaryUseCase;
//# sourceMappingURL=GetPatientBillingSummaryUseCase.js.map