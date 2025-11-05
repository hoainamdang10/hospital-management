/**
 * GetPaymentPlanUseCase - Application Use Case
 * Retrieves a payment plan by ID
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { IPaymentPlanRepository } from '../../domain/repositories/IPaymentPlanRepository';
import { PaymentPlan } from '../../domain/aggregates/PaymentPlan.aggregate';
import { logger } from '@shared/infrastructure/logging/logger';

export interface GetPaymentPlanQuery {
  planId: string;
}

export interface GetPaymentPlanResult {
  success: boolean;
  plan?: any;
  error?: string;
}

export class GetPaymentPlanUseCase {
  constructor(private readonly paymentPlanRepository: IPaymentPlanRepository) {}

  async execute(query: GetPaymentPlanQuery): Promise<GetPaymentPlanResult> {
    try {
      if (!query.planId) {
        throw new Error('Plan ID is required');
      }

      const plan = await this.paymentPlanRepository.findById(query.planId);

      if (!plan) {
        return {
          success: false,
          error: 'Payment plan not found',
        };
      }

      logger.info('Payment plan retrieved', {
        planId: query.planId,
      });

      return {
        success: true,
        plan: this.toDTO(plan),
      };
    } catch (error: any) {
      logger.error('Failed to get payment plan', {
        error: error.message,
        query,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private toDTO(plan: PaymentPlan): any {
    const props = (plan as any).props;
    return {
      planId: props.planId.value,
      invoiceId: props.invoiceId,
      patientId: props.patientId,
      totalAmount: props.totalAmount,
      downPayment: props.downPayment,
      remainingAmount: props.remainingAmount,
      numberOfInstallments: props.numberOfInstallments,
      installmentAmount: props.installmentAmount,
      frequency: props.frequency,
      startDate: props.startDate,
      endDate: props.endDate,
      status: props.status,
      terms: props.terms,
      notes: props.notes,
      installments: props.installments.map((inst: any) => ({
        installmentId: inst.installmentId.value,
        installmentNumber: inst.installmentNumber,
        dueDate: inst.dueDate,
        amount: inst.amount,
        paidAmount: inst.paidAmount,
        remainingAmount: inst.remainingAmount,
        status: inst.status,
        paymentMethod: inst.paymentMethod,
        paymentDate: inst.paymentDate,
        transactionId: inst.transactionId,
        notes: inst.notes,
      })),
      paymentProgress: plan.getPaymentProgress(),
      nextDueInstallment: plan.getNextDueInstallment(),
      overdueInstallments: plan.getOverdueInstallments().length,
      paidInstallments: plan.getPaidInstallments().length,
      createdBy: props.createdBy,
      createdAt: props.createdAt,
      updatedBy: props.updatedBy,
      updatedAt: props.updatedAt,
    };
  }
}

