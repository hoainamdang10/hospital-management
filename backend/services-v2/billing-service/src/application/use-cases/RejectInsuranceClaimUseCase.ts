/**
 * RejectInsuranceClaimUseCase - Application Layer
 * Use case for rejecting insurance claim
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 */

import { IBillingRepository } from '../../domain/repositories/IBillingRepository';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { ILogger } from '../../../../shared/infrastructure/logging/logger.interface';
import { BaseHealthcareUseCase } from '../../../../shared/application/base/BaseHealthcareUseCase';

export interface RejectInsuranceClaimRequest {
  claimId: string;
  rejectionReason: string;
  rejectedBy: string;
}

export interface RejectInsuranceClaimResponse {
  success: boolean;
  data?: {
    claimId: string;
    invoiceId: string;
    rejectionReason: string;
    rejectedAt: Date;
    rejectedBy: string;
  };
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export class RejectInsuranceClaimUseCase extends BaseHealthcareUseCase<RejectInsuranceClaimRequest, RejectInsuranceClaimResponse> {
  constructor(
    private readonly billingRepository: IBillingRepository,
    private readonly eventBus: IEventBus,
    logger: ILogger
  ) {
    super(logger);
  }

  protected async executeCore(request: RejectInsuranceClaimRequest): Promise<RejectInsuranceClaimResponse> {
    try {
      this.logger.info('Rejecting insurance claim', { 
        claimId: request.claimId,
        rejectionReason: request.rejectionReason,
        rejectedBy: request.rejectedBy
      });

      // Validate rejection reason
      if (!request.rejectionReason || request.rejectionReason.trim().length < 10) {
        return {
          success: false,
          message: 'Lý do từ chối phải có ít nhất 10 ký tự',
          errors: [{
            field: 'rejectionReason',
            message: 'Lý do từ chối không hợp lệ',
            code: 'INVALID_REASON'
          }]
        };
      }

      // TODO: Extract invoiceId from claimId
      const invoiceId = request.claimId.replace('CLAIM-', '');

      // TODO: Get invoice and validate claim exists
      // TODO: Validate claim is in submitted status
      // TODO: Update claim status to 'rejected'
      // TODO: Update invoice to remove insurance coverage
      // TODO: Publish InsuranceClaimRejectedEvent

      return {
        success: true,
        data: {
          claimId: request.claimId,
          invoiceId,
          rejectionReason: request.rejectionReason,
          rejectedAt: new Date(),
          rejectedBy: request.rejectedBy
        },
        message: 'Từ chối yêu cầu bảo hiểm thành công'
      };

    } catch (error) {
      this.logger.error('Error rejecting insurance claim', { error, request });
      throw error;
    }
  }
}

