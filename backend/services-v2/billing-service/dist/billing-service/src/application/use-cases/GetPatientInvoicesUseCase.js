"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPatientInvoicesUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
const patient_invoice_mapper_1 = require("../mappers/patient-invoice.mapper");
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
            invoices: invoices.map(patient_invoice_mapper_1.mapInvoiceForPatientResponse),
            totalCount: invoices.length,
        };
    }
}
exports.GetPatientInvoicesUseCase = GetPatientInvoicesUseCase;
//# sourceMappingURL=GetPatientInvoicesUseCase.js.map