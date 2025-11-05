/**
 * UpdatePaymentPlanUseCase - Application Use Case
 * Updates payment plan status and notes
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { IPaymentPlanRepository } from '../../domain/repositories/IPaymentPlanRepository';
import { PaymentPlanStatus } from '../../domain/aggregates/PaymentPlan.aggregate';
import { logger } from '@shared/infrastructure/logging/logger';

export interface UpdatePaymentPlanCommand {
  planId: string;
  status?: PaymentPlanStatus;
  notes?: string;
  updatedBy: string;
}

export interface UpdatePaymentPlanResult {
  success: boolean;
  planId?: string;
  error?: string;
}

export class UpdatePaymentPlanUseCase {
  constructor(private readonly paymentPlanRepository: IPaymentPlanRepository) {}

  async execute(command: UpdatePaymentPlanCommand): Promise<UpdatePaymentPlanResult> {
    try {
      if (!command.planId) {
        throw new Error('Plan ID is required');
      }

      if (!command.updatedBy) {
        throw new Error('Updated by is required');
      }

      const plan = await this.paymentPlanRepository.findById(command.planId);

      if (!plan) {
        return {
          success: false,
          error: 'Payment plan not found',
        };
      }

      if (command.status) {
        plan.updateStatus(command.status, command.notes, command.updatedBy);
      } else if (command.notes) {
        (plan as any).props.notes = command.notes;
        (plan as any).props.updatedBy = command.updatedBy;
        (plan as any).props.updatedAt = new Date();
      }

      await this.paymentPlanRepository.update(plan);

      logger.info('Payment plan updated successfully', {
        planId: command.planId,
        status: command.status,
        updatedBy: command.updatedBy,
      });

      return {
        success: true,
        planId: plan.planId.value,
      };
    } catch (error: any) {
      logger.error('Failed to update payment plan', {
        error: error.message,
        command,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }
}

