"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetInvoicesByAppointmentUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
const patient_invoice_mapper_1 = require("../mappers/patient-invoice.mapper");
class GetInvoicesByAppointmentUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.logger = logger;
    }
    async executeImpl(request) {
        if (!request.appointmentId) {
            throw new Error("Appointment ID is required");
        }
        this.logger.info("Getting invoices for appointment", {
            appointmentId: request.appointmentId,
        });
        const invoices = await this.invoiceRepository.findAllByAppointmentId(request.appointmentId);
        if (!invoices || invoices.length === 0) {
            return {
                invoices: [],
                totalCount: 0,
            };
        }
        return {
            invoices: invoices.map(patient_invoice_mapper_1.mapInvoiceForPatientResponse),
            totalCount: invoices.length,
        };
    }
}
exports.GetInvoicesByAppointmentUseCase = GetInvoicesByAppointmentUseCase;
//# sourceMappingURL=GetInvoicesByAppointmentUseCase.js.map