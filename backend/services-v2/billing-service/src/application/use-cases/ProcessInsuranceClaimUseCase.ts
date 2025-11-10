import { BaseHealthcareUseCase } from '@shared/application/base/base-healthcare-use-case';
import { IInvoiceRepository } from '../../domain/repositories/IInvoiceRepository';
import { IEventBus } from '@shared/application/services/event-bus.interface';
import { ILogger } from '@shared/application/services/logger.interface';

export interface ProcessInsuranceClaimRequest {
  invoiceId: string;
}

export interface ProcessInsuranceClaimResponse {
  invoiceId: string;
  claimAmount: number;
  approved: boolean;
  message: string;
}

export class ProcessInsuranceClaimUseCase extends BaseHealthcareUseCase<ProcessInsuranceClaimRequest, ProcessInsuranceClaimResponse> {
  protected readonly logger: ILogger;

  constructor(
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super();
    this.logger = logger;
  }

  protected async executeImpl(request: ProcessInsuranceClaimRequest): Promise<ProcessInsuranceClaimResponse> {
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
