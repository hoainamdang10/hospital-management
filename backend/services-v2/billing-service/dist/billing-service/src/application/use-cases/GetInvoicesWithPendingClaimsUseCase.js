"use strict";
/**
 * GetInvoicesWithPendingClaimsUseCase - Application Layer
 * Use case for retrieving invoices with pending insurance claims
 *
 * @author Hospital Management Team
 * @version 2.0.0
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetInvoicesWithPendingClaimsUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class GetInvoicesWithPendingClaimsUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(billingRepository, logger) {
        super();
        this.billingRepository = billingRepository;
        this.logger = logger;
    }
    async executeImpl(request) {
        try {
            this.logger.info('Getting invoices with pending claims', {
                page: request.page,
                limit: request.limit,
                insuranceType: request.insuranceType
            });
            // Get all invoices with insurance
            const allInvoices = await this.billingRepository.findAll();
            // Filter invoices with pending claims
            const now = new Date();
            const pendingClaimInvoices = allInvoices.filter(inv => {
                if (!inv.insurance)
                    return false;
                return inv.insurance.claimStatus === 'submitted';
            });
            // Filter by insurance type if provided
            let filteredInvoices = pendingClaimInvoices;
            if (request.insuranceType) {
                filteredInvoices = pendingClaimInvoices.filter(inv => inv.insurance?.type === request.insuranceType);
            }
            // Apply pagination
            const page = request.page || 1;
            const limit = request.limit || 20;
            const offset = (page - 1) * limit;
            const paginatedInvoices = filteredInvoices.slice(offset, offset + limit);
            // Map to response format
            const data = paginatedInvoices.map(inv => {
                const claimSubmittedAt = inv.insurance?.claimSubmittedAt || inv.issuedAt;
                const daysPending = Math.floor((now.getTime() - claimSubmittedAt.getTime()) / (1000 * 60 * 60 * 24));
                return {
                    invoiceId: inv.invoiceId.value,
                    invoiceNumber: inv.vietnameseInvoiceNumber || inv.invoiceId.value,
                    patientId: inv.patientId,
                    totalAmount: inv.totalAmount.amount,
                    insuranceCoverage: inv.insuranceCoverageAmount.amount,
                    insuranceType: inv.insurance?.type || '',
                    claimId: inv.insurance?.claimId,
                    claimSubmittedAt,
                    daysPending
                };
            });
            // Calculate summary
            const totalClaimAmount = filteredInvoices.reduce((sum, inv) => sum + inv.insuranceCoverageAmount.amount, 0);
            const totalDaysPending = data.reduce((sum, inv) => sum + inv.daysPending, 0);
            return {
                success: true,
                data,
                total: filteredInvoices.length,
                summary: {
                    totalPendingClaims: filteredInvoices.length,
                    totalClaimAmount,
                    averageDaysPending: data.length > 0 ? Math.round(totalDaysPending / data.length) : 0
                },
                message: `Tìm thấy ${filteredInvoices.length} hóa đơn có yêu cầu bảo hiểm đang chờ`
            };
        }
        catch (error) {
            this.logger.error('Error getting invoices with pending claims', { error, request });
            throw error;
        }
    }
}
exports.GetInvoicesWithPendingClaimsUseCase = GetInvoicesWithPendingClaimsUseCase;
//# sourceMappingURL=GetInvoicesWithPendingClaimsUseCase.js.map