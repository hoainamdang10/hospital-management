/**
 * GetPatientPaymentPlansUseCase - Application Use Case
 * Retrieves all payment plans for a patient with filters
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { IPaymentPlanRepository, PaymentPlanFilterCriteria } from '../../domain/repositories/IPaymentPlanRepository';
import { PaymentPlan, PaymentPlanStatus } from '../../domain/aggregates/PaymentPlan.aggregate';
import { logger } from '@shared/infrastructure/logging/logger';

export interface GetPatientPaymentPlansQuery {
  patientId: string;
  status?: PaymentPlanStatus;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface GetPatientPaymentPlansResult {
  success: boolean;
  plans?: any[];
  total?: number;
  limit?: number;
  offset?: number;
  error?: string;
}

export class GetPatientPaymentPlansUseCase {
  constructor(private readonly paymentPlanRepository: IPaymentPlanRepository) {}

  async execute(query: GetPatientPaymentPlansQuery): Promise<GetPatientPaymentPlansResult> {
    try {
      if (!query.patientId) {
        throw new Error('Patient ID is required');
      }

      const criteria: PaymentPlanFilterCriteria = {
        patientId: query.patientId,
        status: query.status,
        fromDate: query.fromDate,
        toDate: query.toDate,
      };

      const limit = query.limit || 50;
      const offset = query.offset || 0;

      const plans = await this.paymentPlanRepository.findWithFilters(criteria, limit, offset);
      const total = await this.paymentPlanRepository.count(criteria);

      logger.info('Patient payment plans retrieved', {
        patientId: query.patientId,
        count: plans.length,
        total,
      });

      return {
        success: true,
        plans: plans.map((plan) => this.toSummaryDTO(plan)),
        total,
        limit,
        offset,
      };
    } catch (error: any) {
      logger.error('Failed to get patient payment plans', {
        error: error.message,
        query,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private toSummaryDTO(plan: PaymentPlan): any {
    const props = (plan as any).props;
    return {
      planId: props.planId.value,
      invoiceId: props.invoiceId,
      totalAmount: props.totalAmount,
      downPayment: props.downPayment,
      remainingAmount: props.remainingAmount,
      numberOfInstallments: props.numberOfInstallments,
      installmentAmount: props.installmentAmount,
      frequency: props.frequency,
      startDate: props.startDate,
      endDate: props.endDate,
      status: props.status,
      paymentProgress: plan.getPaymentProgress(),
      paidInstallments: plan.getPaidInstallments().length,
      overdueInstallments: plan.getOverdueInstallments().length,
      createdAt: props.createdAt,
    };
  }
}

