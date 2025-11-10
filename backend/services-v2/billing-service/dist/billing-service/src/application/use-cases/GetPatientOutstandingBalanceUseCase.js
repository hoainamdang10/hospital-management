"use strict";
/**
 * GetPatientOutstandingBalanceUseCase - Application Layer
 * Use case for retrieving patient outstanding balance
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPatientOutstandingBalanceUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class GetPatientOutstandingBalanceUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(billingRepository, logger) {
        super();
        this.billingRepository = billingRepository;
        this.logger = logger;
    }
    async executeImpl(request) {
        try {
            this.logger.info('Getting patient outstanding balance', {
                patientId: request.patientId
            });
            // TODO: Implement repository method findOutstandingByPatient()
            const outstandingInvoices = [];
            if (outstandingInvoices.length === 0) {
                return {
                    success: true,
                    data: {
                        patientId: request.patientId,
                        balance: {
                            totalOutstanding: 0,
                            overdueAmount: 0,
                            currentAmount: 0,
                            currency: 'VND'
                        },
                        breakdown: {
                            pendingInvoices: 0,
                            partiallyPaidInvoices: 0,
                            overdueInvoices: 0
                        }
                    },
                    message: 'Bệnh nhân không có công nợ'
                };
            }
            const now = new Date();
            // Calculate balance
            const balance = this.calculateBalance(outstandingInvoices, now);
            // Calculate breakdown
            const breakdown = this.calculateBreakdown(outstandingInvoices, now);
            // Get oldest unpaid invoice
            const oldestUnpaidInvoice = this.getOldestUnpaidInvoice(outstandingInvoices, now);
            // Get upcoming due invoices
            const upcomingDue = this.getUpcomingDue(outstandingInvoices, now);
            return {
                success: true,
                data: {
                    patientId: request.patientId,
                    balance,
                    breakdown,
                    oldestUnpaidInvoice,
                    upcomingDue,
                    paymentPlan: {
                        hasActivePlan: false // TODO: Implement payment plan feature
                    }
                },
                message: 'Lấy số dư nợ bệnh nhân thành công'
            };
        }
        catch (error) {
            this.logger.error('Error getting patient outstanding balance', { error, request });
            throw error;
        }
    }
    calculateBalance(invoices, now) {
        const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.patientPaymentAmount.amount, 0);
        const overdueInvoices = invoices.filter(inv => inv.dueDate && inv.dueDate < now);
        const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + inv.patientPaymentAmount.amount, 0);
        const currentAmount = totalOutstanding - overdueAmount;
        return {
            totalOutstanding,
            overdueAmount,
            currentAmount,
            currency: 'VND'
        };
    }
    calculateBreakdown(invoices, now) {
        return {
            pendingInvoices: invoices.filter(inv => inv.status === 'PENDING').length,
            partiallyPaidInvoices: invoices.filter(inv => inv.status === 'PARTIALLY_PAID').length,
            overdueInvoices: invoices.filter(inv => inv.dueDate && inv.dueDate < now).length
        };
    }
    getOldestUnpaidInvoice(invoices, now) {
        if (invoices.length === 0)
            return undefined;
        const oldest = invoices.reduce((min, inv) => inv.issuedAt < min.issuedAt ? inv : min, invoices[0]);
        const daysOverdue = oldest.dueDate
            ? Math.max(0, Math.floor((now.getTime() - oldest.dueDate.getTime()) / (1000 * 60 * 60 * 24)))
            : 0;
        return {
            invoiceId: oldest.invoiceId.value,
            invoiceNumber: oldest.vietnameseInvoiceNumber || oldest.invoiceId.value,
            amount: oldest.patientPaymentAmount.amount,
            issuedAt: oldest.issuedAt,
            dueDate: oldest.dueDate,
            daysOverdue
        };
    }
    getUpcomingDue(invoices, now) {
        const upcoming = invoices
            .filter(inv => inv.dueDate && inv.dueDate >= now)
            .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
            .slice(0, 5);
        return upcoming.map(inv => {
            const daysUntilDue = Math.floor((inv.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return {
                invoiceId: inv.invoiceId.value,
                invoiceNumber: inv.vietnameseInvoiceNumber || inv.invoiceId.value,
                amount: inv.patientPaymentAmount.amount,
                dueDate: inv.dueDate,
                daysUntilDue
            };
        });
    }
}
exports.GetPatientOutstandingBalanceUseCase = GetPatientOutstandingBalanceUseCase;
//# sourceMappingURL=GetPatientOutstandingBalanceUseCase.js.map