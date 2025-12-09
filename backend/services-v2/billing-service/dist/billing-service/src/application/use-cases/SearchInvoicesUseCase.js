"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchInvoicesUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class SearchInvoicesUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info("Searching invoices", { criteria: request });
        const invoices = await this.invoiceRepository.search(request);
        const invoiceSummaries = invoices.map((invoice) => {
            const metadata = invoice.metadata || {};
            const patientName = metadata.patientName ||
                metadata.patient_name ||
                metadata.patientFullName ||
                metadata.patient_full_name ||
                metadata.patientDisplayName ||
                metadata.patient_display_name ||
                metadata.patient?.fullName ||
                metadata.patient?.name ||
                metadata.patientInfo?.fullName ||
                metadata.patient_info?.fullName ||
                metadata.patientInfo?.name ||
                metadata.patient_info?.name;
            return {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                patientId: invoice.patientId,
                patientName,
                totalAmount: invoice.totalAmount.amount,
                outstandingAmount: invoice.outstandingAmount.amount,
                status: invoice.status.value,
                createdAt: invoice.createdAt,
                finalizedAt: undefined, // Will be added when we expose this property
            };
        });
        this.logger.info("Search completed", { count: invoiceSummaries.length });
        return {
            invoices: invoiceSummaries,
            total: invoiceSummaries.length,
        };
    }
}
exports.SearchInvoicesUseCase = SearchInvoicesUseCase;
//# sourceMappingURL=SearchInvoicesUseCase.js.map