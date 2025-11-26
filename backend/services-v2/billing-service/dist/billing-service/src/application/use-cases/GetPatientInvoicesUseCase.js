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
        this.logger.info("Getting patient invoices", {
            patientId: request.patientId,
        });
        const invoices = await this.invoiceRepository.findByPatientId(request.patientId);
        return {
            invoices: invoices.map((invoice) => ({
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                appointmentId: invoice.getAppointmentId?.() ?? undefined,
                doctorName: invoice.metadata?.doctorName,
                doctorDepartment: invoice.metadata?.doctorDepartment,
                cancellationReason: invoice.metadata?.cancellationReason,
                totalAmount: invoice.totalAmount.amount,
                outstandingAmount: Math.max(0, invoice.totalAmount.amount -
                    Math.max(0, invoice.payments
                        .filter((p) => p.method !== "refund" && p.status === "completed")
                        .reduce((sum, p) => sum + p.amount.amount, 0) -
                        invoice.payments
                            .filter((p) => p.method === "refund" &&
                            (p.status === "completed" ||
                                p.status === "refund_pending"))
                            .reduce((sum, p) => sum + Math.abs(p.amount.amount), 0))),
                paidAmount: Math.max(0, invoice.payments
                    .filter((p) => p.method !== "refund" && p.status === "completed")
                    .reduce((sum, p) => sum + p.amount.amount, 0) -
                    invoice.payments
                        .filter((p) => p.method === "refund" &&
                        (p.status === "completed" || p.status === "refund_pending"))
                        .reduce((sum, p) => sum + Math.abs(p.amount.amount), 0)),
                status: invoice.payments.some((p) => p.method === "refund" &&
                    (p.status === "completed" || p.status === "refund_pending") &&
                    Math.abs(p.amount.amount) >= invoice.totalAmount.amount)
                    ? "refunded"
                    : invoice.status.value,
                createdAt: invoice.createdAt,
                payments: invoice.payments.map((p) => ({
                    id: p.id,
                    amount: p.amount.amount,
                    currency: p.amount.currency,
                    method: p.method,
                    status: p.status,
                    transactionId: p.transactionId,
                    paidAt: p.paidAt,
                    refundedAt: p.refundedAt,
                    refundReason: p.refundReason,
                    refundedBy: p.refundedBy,
                    gatewayRefundId: p.gatewayRefundId,
                })),
            })),
            totalCount: invoices.length,
        };
    }
}
exports.GetPatientInvoicesUseCase = GetPatientInvoicesUseCase;
//# sourceMappingURL=GetPatientInvoicesUseCase.js.map