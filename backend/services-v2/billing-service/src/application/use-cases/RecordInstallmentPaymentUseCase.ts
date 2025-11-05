/**
 * RecordInstallmentPaymentUseCase - Application Use Case
 * Records payment for a specific installment
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { IPaymentPlanRepository } from '../../domain/repositories/IPaymentPlanRepository';
import { PaymentMethod } from '../../domain/entities/Installment.entity';
import { logger } from '@shared/infrastructure/logging/logger';

export interface RecordInstallmentPaymentCommand {
  planId: string;
  installmentNumber: number;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
}

export interface RecordInstallmentPaymentResult {
  success: boolean;
  planId?: string;
  installmentNumber?: number;
  planStatus?: string;
  error?: string;
}

export class RecordInstallmentPaymentUseCase {
  constructor(private readonly paymentPlanRepository: IPaymentPlanRepository) {}

  async execute(command: RecordInstallmentPaymentCommand): Promise<RecordInstallmentPaymentResult> {
    try {
      // Validate input
      this.validateCommand(command);

      // Find payment plan
      const plan = await this.paymentPlanRepository.findById(command.planId);

      if (!plan) {
        return {
          success: false,
          error: 'Payment plan not found',
        };
      }

      // Record installment payment
      plan.recordInstallmentPayment(
        command.installmentNumber,
        command.amount,
        command.paymentMethod,
        command.transactionId,
        command.notes
      );

      // Save changes
      await this.paymentPlanRepository.update(plan);

      logger.info('Installment payment recorded successfully', {
        planId: command.planId,
        installmentNumber: command.installmentNumber,
        amount: command.amount,
        planStatus: plan.status,
      });

      return {
        success: true,
        planId: plan.planId.value,
        installmentNumber: command.installmentNumber,
        planStatus: plan.status,
      };
    } catch (error: any) {
      logger.error('Failed to record installment payment', {
        error: error.message,
        command,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private validateCommand(command: RecordInstallmentPaymentCommand): void {
    if (!command.planId) {
      throw new Error('Plan ID is required');
    }

    if (!command.installmentNumber || command.installmentNumber <= 0) {
      throw new Error('Installment number must be positive');
    }

    if (!command.amount || command.amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    if (!command.paymentMethod) {
      throw new Error('Payment method is required');
    }

    const validMethods = Object.values(PaymentMethod);
    if (!validMethods.includes(command.paymentMethod)) {
      throw new Error(`Invalid payment method. Must be one of: ${validMethods.join(', ')}`);
    }
  }
}

