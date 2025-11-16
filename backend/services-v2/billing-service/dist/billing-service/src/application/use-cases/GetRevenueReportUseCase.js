"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRevenueReportUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class GetRevenueReportUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info('Generating revenue report', {
            fromDate: request.fromDate,
            toDate: request.toDate
        });
        const invoices = await this.invoiceRepository.search({
            fromDate: request.fromDate,
            toDate: request.toDate
        });
        const paidInvoices = invoices.filter(inv => inv.status.value === 'paid');
        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount.amount, 0);
        const summary = {
            totalRevenue,
            totalInvoices: invoices.length,
            averageInvoiceAmount: paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0,
            paidInvoices: paidInvoices.length,
            pendingInvoices: invoices.filter(inv => inv.status.value === 'pending').length
        };
        const breakdown = this.groupByPeriod(paidInvoices, request.groupBy || 'month');
        const byPaymentMethod = {};
        paidInvoices.forEach(invoice => {
            invoice.payments.forEach(payment => {
                if (payment.status === 'completed') {
                    byPaymentMethod[payment.method] = (byPaymentMethod[payment.method] || 0) + payment.amount.amount;
                }
            });
        });
        // REMOVED (Phase 1 Prepaid Model): Insurance breakdown - no insurance coverage in MVP
        const byInsuranceType = {};
        this.logger.info('Revenue report generated', {
            totalRevenue,
            totalInvoices: invoices.length
        });
        return {
            period: {
                from: request.fromDate,
                to: request.toDate
            },
            summary,
            breakdown,
            byPaymentMethod,
            byInsuranceType
        };
    }
    groupByPeriod(invoices, groupBy) {
        const groups = {};
        invoices.forEach(invoice => {
            const date = new Date(invoice.createdAt);
            let key;
            if (groupBy === 'day') {
                key = date.toISOString().split('T')[0];
            }
            else if (groupBy === 'week') {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
            }
            else {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(invoice);
        });
        return Object.entries(groups).map(([period, periodInvoices]) => {
            const totalRevenue = periodInvoices.reduce((sum, inv) => sum + inv.totalAmount.amount, 0);
            return {
                period,
                totalRevenue,
                invoiceCount: periodInvoices.length,
                averageInvoiceAmount: totalRevenue / periodInvoices.length
            };
        }).sort((a, b) => a.period.localeCompare(b.period));
    }
}
exports.GetRevenueReportUseCase = GetRevenueReportUseCase;
//# sourceMappingURL=GetRevenueReportUseCase.js.map