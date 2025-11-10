"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessInsuranceClaimUseCase = void 0;
const base_healthcare_use_case_1 = require("../../../../shared/application/base/base-healthcare-use-case");
class ProcessInsuranceClaimUseCase extends base_healthcare_use_case_1.BaseHealthcareUseCase {
    constructor(invoiceRepository, eventBus, logger) {
        super();
        this.invoiceRepository = invoiceRepository;
        this.eventBus = eventBus;
        this.logger = logger;
    }
    async executeImpl(request) {
        this.logger.info('Processing insurance claim', { invoiceId: request.invoiceId });
        const invoice = await this.invoiceRepository.findById(request.invoiceId);
        if (!invoice) {
            throw new Error('Invoice not found');
        }
        if (!invoice.insurance) {
            throw new Error('No insurance information available');
        }
        // Auto-approve BHYT and BHTN
        const approved = invoice.insurance.provider === 'BHYT' || invoice.insurance.provider === 'BHTN';
        invoice.processInsuranceClaim();
        await this.invoiceRepository.save(invoice);
        const events = invoice.getUncommittedEvents();
        for (const event of events) {
            await this.eventBus.publish(event);
        }
        invoice.markEventsAsCommitted();
        this.logger.info('Insurance claim processed', {
            invoiceId: invoice.id,
            approved
        });
        return {
            invoiceId: invoice.id,
            claimAmount: invoice.insuranceCoverage.amount,
            approved,
            message: approved
                ? 'Insurance claim approved automatically'
                : 'Insurance claim requires manual review'
        };
    }
}
exports.ProcessInsuranceClaimUseCase = ProcessInsuranceClaimUseCase;
//# sourceMappingURL=ProcessInsuranceClaimUseCase.js.map