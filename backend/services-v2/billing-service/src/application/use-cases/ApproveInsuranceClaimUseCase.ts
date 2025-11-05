/**
 * ApproveInsuranceClaimUseCase - Application Layer
 * Use case for approving insurance claim
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface ApproveInsuranceClaimRequest {
  claimId: string;
  approvedAmount: number;
  approvedBy: string;
  notes?: string;
}

export interface ApproveInsuranceClaimResponse {
  success: boolean;
  data?: {
    claimId: string;
    invoiceId: string;
    approvedAmount: number;
    originalClaimAmount: number;
    approvedAt: Date;
    approvedBy: string;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class ApproveInsuranceClaimUseCase extends BaseHealthcareUseCase<ApproveInsuranceClaimRequest, ApproveInsuranceClaimResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: ApproveInsuranceClaimRequest): Promise<ApproveInsuranceClaimResponse> {
    try {
      this.logger.info('Approving insurance claim', { 
        claimId: request.claimId,
        approvedAmount: request.approvedAmount,
        approvedBy: request.approvedBy
      });

      // TODO: Extract invoiceId from claimId (format: CLAIM-INV-YYYYMM-XXXXXX)
      const invoiceId = request.claimId.replace('CLAIM-', '');

      // Get invoice
      // const billing = await this.billingRepository.findById(InvoiceId.create(invoiceId));

      // For now, return mock response
      // TODO: Implement full logic when repository is ready

      // Validate approved amount
      if (request.approvedAmount <= 0) {
        return {
          success: false,
          message: 'Số tiền duyệt phải lớn hơn 0',
          errors: [{
            field: 'approvedAmount',
            message: 'Số tiền không hợp lệ',
            code: 'INVALID_AMOUNT'
          }]
        };
      }

      // TODO: Validate claim exists and is in submitted status
      // TODO: Validate approved amount <= claim amount
      // TODO: Update claim status to 'approved'
      // TODO: Update invoice insurance coverage
      // TODO: Publish InsuranceClaimApprovedEvent

      return {
        success: true,
        data: {
          claimId: request.claimId,
          invoiceId,
          approvedAmount: request.approvedAmount,
          originalClaimAmount: request.approvedAmount,
          approvedAt: new Date(),
          approvedBy: request.approvedBy
        },
        message: 'Duyệt yêu cầu bảo hiểm thành công'
      };

    } catch (error) {
      this.logger.error('Error approving insurance claim', { error, request });
      throw error;
    }
  }
}

