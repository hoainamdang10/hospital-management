/**
 * CreatePaymentPlanUseCase - Application Use Case
 * Creates a new payment plan for installment payments
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, CQRS
 */

import { IPaymentPlanRepository } from '../../domain/repositories/IPaymentPlanRepository';
import { PaymentPlan, PaymentFrequency } from '../../domain/aggregates/PaymentPlan.aggregate';
import { logger } from '@shared/infrastructure/logging/logger';

export interface CreatePaymentPlanCommand {
  invoiceId: string;
  patientId: string;
  totalAmount: number;
  downPayment: number;
  numberOfInstallments: number;
  frequency: PaymentFrequency;
  startDate?: Date;
  terms?: string;
  createdBy: string;
}

export interface CreatePaymentPlanResult {
  success: boolean;
  planId?: string;
  error?: string;
}

export class CreatePaymentPlanUseCase {
  constructor(private readonly paymentPlanRepository: IPaymentPlanRepository) {}

  async execute(command: CreatePaymentPlanCommand): Promise<CreatePaymentPlanResult> {
    try {
      // Validate input
      this.validateCommand(command);

      // Check if payment plan already exists for this invoice
      const existingPlan = await this.paymentPlanRepository.findByInvoiceId(command.invoiceId);
      if (existingPlan) {
        return {
          success: false,
          error: 'Payment plan already exists for this invoice',
        };
      }

      // Calculate remaining amount and installment amount
      const remainingAmount = command.totalAmount - command.downPayment;
      const installmentAmount = remainingAmount / command.numberOfInstallments;

      // Calculate end date based on frequency
      const startDate = command.startDate || new Date();
      const endDate = this.calculateEndDate(startDate, command.frequency, command.numberOfInstallments);

      // Create payment plan aggregate
      const plan = PaymentPlan.create({
        invoiceId: command.invoiceId,
        patientId: command.patientId,
        totalAmount: command.totalAmount,
        downPayment: command.downPayment,
        remainingAmount,
        numberOfInstallments: command.numberOfInstallments,
        installmentAmount,
        frequency: command.frequency,
        startDate,
        endDate,
        status: 'active' as any,
        terms: command.terms,
        createdBy: command.createdBy,
      });

      // Validate business rules
      plan.validate();

      // Save to repository
      await this.paymentPlanRepository.save(plan);

      logger.info('Payment plan created successfully', {
        planId: plan.planId.value,
        patientId: command.patientId,
        totalAmount: command.totalAmount,
      });

      return {
        success: true,
        planId: plan.planId.value,
      };
    } catch (error: any) {
      logger.error('Failed to create payment plan', {
        error: error.message,
        command,
      });

      return {
        success: false,
        error: error.message,
      };
    }
  }

  private validateCommand(command: CreatePaymentPlanCommand): void {
    if (!command.invoiceId) {
      throw new Error('Invoice ID is required');
    }

    if (!command.patientId) {
      throw new Error('Patient ID is required');
    }

    if (!command.totalAmount || command.totalAmount <= 0) {
      throw new Error('Total amount must be positive');
    }

    if (command.downPayment < 0) {
      throw new Error('Down payment cannot be negative');
    }

    if (command.downPayment >= command.totalAmount) {
      throw new Error('Down payment must be less than total amount');
    }

    if (!command.numberOfInstallments || command.numberOfInstallments <= 0) {
      throw new Error('Number of installments must be positive');
    }

    if (!command.frequency) {
      throw new Error('Payment frequency is required');
    }

    const validFrequencies = Object.values(PaymentFrequency);
    if (!validFrequencies.includes(command.frequency)) {
      throw new Error(`Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`);
    }

    if (!command.createdBy) {
      throw new Error('Created by is required');
    }
  }

  private calculateEndDate(startDate: Date, frequency: PaymentFrequency, numberOfInstallments: number): Date {
    const date = new Date(startDate);

    switch (frequency) {
      case PaymentFrequency.MONTHLY:
        date.setMonth(date.getMonth() + numberOfInstallments);
        break;
      case PaymentFrequency.WEEKLY:
        date.setDate(date.getDate() + (numberOfInstallments * 7));
        break;
      case PaymentFrequency.BIWEEKLY:
        date.setDate(date.getDate() + (numberOfInstallments * 14));
        break;
    }

    return date;
  }
}

