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
    calculatePaymentStats(inv) {
        const paidCompleted = inv.payments
            .filter((p) => p.method !== "refund" && p.status === "completed")
            .reduce((sum, p) => sum + p.amount.amount, 0);
        const refunds = inv.payments
            .filter((p) => p.method === "refund" &&
            (p.status === "completed" || p.status === "refund_pending"))
            .reduce((sum, p) => sum + Math.abs(p.amount.amount), 0);
        const netPaid = Math.max(0, paidCompleted - refunds);
        const outstanding = Math.max(0, inv.totalAmount.amount - netPaid);
        return { paidCompleted, refunds, netPaid, outstanding };
    }
    async executeImpl(request) {
        this.logger.info("Getting patient billing summary", {
            patientId: request.patientId,
        });
        const invoices = await this.invoiceRepository.findByPatientId(request.patientId);
        // Loại bỏ hóa đơn đã hủy khỏi các phép cộng tiền
        const activeInvoices = invoices.filter((inv) => inv.status.value !== "cancelled");
        const totalAmount = activeInvoices.reduce((sum, inv) => {
            const { refunds } = this.calculatePaymentStats(inv);
            const net = Math.max(0, inv.totalAmount.amount - refunds);
            return sum + net;
        }, 0);
        const totalPaid = activeInvoices.reduce((sum, inv) => {
            const { netPaid } = this.calculatePaymentStats(inv);
            return sum + netPaid;
        }, 0);
        const totalOutstanding = activeInvoices
            .filter((inv) => ["pending", "partially_paid", "overdue", "draft"].includes(inv.status.value))
            .reduce((sum, inv) => {
            const { outstanding } = this.calculatePaymentStats(inv);
            return sum + outstanding;
        }, 0);
        const overdueAmount = activeInvoices
            .filter((inv) => inv.status.value === "overdue")
            .reduce((sum, inv) => {
            const { outstanding } = this.calculatePaymentStats(inv);
            return sum + outstanding;
        }, 0);
        const invoicesByStatus = {
            draft: invoices.filter((inv) => inv.status.value === "draft").length,
            pending: invoices.filter((inv) => inv.status.value === "pending").length,
            partially_paid: invoices.filter((inv) => inv.status.value === "partially_paid").length,
            paid: invoices.filter((inv) => inv.status.value === "paid").length,
            cancelled: invoices.filter((inv) => inv.status.value === "cancelled")
                .length,
            overdue: invoices.filter((inv) => inv.status.value === "overdue").length,
        };
        const recentInvoices = invoices.slice(0, 5).map((inv) => ({
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            totalAmount: inv.totalAmount.amount,
            outstandingAmount: inv.outstandingAmount.amount,
            status: inv.status.value,
            createdAt: inv.createdAt,
        }));
        this.logger.info("Patient billing summary retrieved", {
            patientId: request.patientId,
            totalInvoices: invoices.length,
        });
        return {
            patientId: request.patientId,
            totalInvoices: invoices.length,
            totalAmount,
            totalPaid,
            totalOutstanding,
            overdueAmount,
            invoicesByStatus,
            recentInvoices,
        };
    }
}
exports.GetPatientBillingSummaryUseCase = GetPatientBillingSummaryUseCase;
//# sourceMappingURL=GetPatientBillingSummaryUseCase.js.map