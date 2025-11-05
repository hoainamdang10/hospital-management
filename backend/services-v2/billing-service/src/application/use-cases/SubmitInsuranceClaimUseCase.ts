/**
 * SubmitInsuranceClaimUseCase - Application Layer
 * Use case for submitting insurance claim for invoice
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { InvoiceId } from '../../domain/value-objects/InvoiceId';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface SubmitInsuranceClaimRequest {
  invoiceId: string;
  submittedBy: string;
}

export interface SubmitInsuranceClaimResponse {
  success: boolean;
  data?: {
    invoiceId: string;
    claimId: string;
    claimAmount: number;
    insuranceType: string;
    insuranceNumber: string;
    claimStatus: string;
    submittedAt: Date;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class SubmitInsuranceClaimUseCase extends BaseHealthcareUseCase<SubmitInsuranceClaimRequest, SubmitInsuranceClaimResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: SubmitInsuranceClaimRequest): Promise<SubmitInsuranceClaimResponse> {
    try {
      this.logger.info('Submitting insurance claim', { 
        invoiceId: request.invoiceId,
        submittedBy: request.submittedBy
      });

      // Validate invoice ID
      const invoiceId = InvoiceId.create(request.invoiceId);

      // Get invoice
      const billing = await this.billingRepository.findById(invoiceId);

      if (!billing) {
        return {
          success: false,
          message: 'Không tìm thấy hóa đơn',
          errors: [{
            field: 'invoiceId',
            message: 'Hóa đơn không tồn tại',
            code: 'INVOICE_NOT_FOUND'
          }]
        };
      }

      // Check if invoice has insurance
      if (!billing.insurance) {
        return {
          success: false,
          message: 'Hóa đơn không có thông tin bảo hiểm',
          errors: [{
            field: 'insurance',
            message: 'Không tìm thấy thông tin bảo hiểm',
            code: 'NO_INSURANCE'
          }]
        };
      }

      // Check if insurance is valid
      if (!billing.insurance.isValid()) {
        return {
          success: false,
          message: 'Bảo hiểm đã hết hạn',
          errors: [{
            field: 'insurance',
            message: 'Bảo hiểm không còn hiệu lực',
            code: 'INSURANCE_EXPIRED'
          }]
        };
      }

      // Check if claim already submitted
      if (billing.insurance.claimStatus === 'submitted' || billing.insurance.claimStatus === 'approved') {
        return {
          success: false,
          message: 'Yêu cầu bảo hiểm đã được gửi trước đó',
          errors: [{
            field: 'claimStatus',
            message: `Trạng thái hiện tại: ${billing.insurance.claimStatus}`,
            code: 'CLAIM_ALREADY_SUBMITTED'
          }]
        };
      }

      // Submit claim
      billing.submitInsuranceClaim();

      // Save updated invoice
      await this.billingRepository.save(billing);

      // Publish events
      const events = billing.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      billing.markEventsAsCommitted();

      return {
        success: true,
        data: {
          invoiceId: billing.invoiceId.value,
          claimId: `CLAIM-${billing.invoiceId.value}`,
          claimAmount: billing.insurance.coverageAmount,
          insuranceType: billing.insurance.type,
          insuranceNumber: billing.insurance.number,
          claimStatus: billing.insurance.claimStatus || 'submitted',
          submittedAt: new Date()
        },
        message: 'Gửi yêu cầu bảo hiểm thành công'
      };

    } catch (error) {
      this.logger.error('Error submitting insurance claim', { error, request });
      throw error;
    }
  }
}

