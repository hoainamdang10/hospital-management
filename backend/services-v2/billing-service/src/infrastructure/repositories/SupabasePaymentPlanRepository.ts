/**
 * SupabasePaymentPlanRepository - Infrastructure Layer
 * Supabase implementation of IPaymentPlanRepository
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Repository Pattern
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  IPaymentPlanRepository,
  PaymentPlanFilterCriteria,
} from '../../domain/repositories/IPaymentPlanRepository';
import {
  PaymentPlan,
  PaymentPlanProps,
  PaymentPlanStatus,
  PaymentFrequency,
} from '../../domain/aggregates/PaymentPlan.aggregate';
import { PaymentPlanId } from '../../domain/value-objects/PaymentPlanId';
import { Installment, InstallmentStatus, PaymentMethod } from '../../domain/entities/Installment.entity';
import { InstallmentId } from '../../domain/value-objects/InstallmentId';
import { logger } from '@shared/infrastructure/logging/logger';

export class SupabasePaymentPlanRepository implements IPaymentPlanRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async save(plan: PaymentPlan): Promise<void> {
    try {
      const planData = this.planToDatabase(plan);
      const { error: planError } = await this.supabase
        .from('payment_plans')
        .insert(planData);

      if (planError) {
        throw new Error(`Failed to save payment plan: ${planError.message}`);
      }

      // Save installments
      const installmentsData = plan.installments.map((inst) => this.installmentToDatabase(inst));
      const { error: installmentsError } = await this.supabase
        .from('installments')
        .insert(installmentsData);

      if (installmentsError) {
        throw new Error(`Failed to save installments: ${installmentsError.message}`);
      }
    } catch (error: any) {
      logger.error('Error saving payment plan', { error: error.message });
      throw error;
    }
  }

  async update(plan: PaymentPlan): Promise<void> {
    try {
      const planData = this.planToDatabase(plan);
      const { error: planError } = await this.supabase
        .from('payment_plans')
        .update(planData)
        .eq('plan_id', plan.planId.value);

      if (planError) {
        throw new Error(`Failed to update payment plan: ${planError.message}`);
      }

      // Update installments
      for (const installment of plan.installments) {
        const installmentData = this.installmentToDatabase(installment);
        const { error: instError } = await this.supabase
          .from('installments')
          .update(installmentData)
          .eq('installment_id', installment.installmentId.value);

        if (instError) {
          throw new Error(`Failed to update installment: ${instError.message}`);
        }
      }
    } catch (error: any) {
      logger.error('Error updating payment plan', { error: error.message });
      throw error;
    }
  }

  async findById(planId: string): Promise<PaymentPlan | null> {
    try {
      const { data: planData, error: planError } = await this.supabase
        .from('payment_plans')
        .select('*')
        .eq('plan_id', planId)
        .single();

      if (planError) {
        if (planError.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find payment plan: ${planError.message}`);
      }

      if (!planData) {
        return null;
      }

      // Fetch installments
      const { data: installmentsData, error: installmentsError } = await this.supabase
        .from('installments')
        .select('*')
        .eq('plan_id', planId)
        .order('installment_number', { ascending: true });

      if (installmentsError) {
        throw new Error(`Failed to fetch installments: ${installmentsError.message}`);
      }

      return this.toDomain(planData, installmentsData || []);
    } catch (error: any) {
      logger.error('Error finding payment plan by ID', { error: error.message });
      throw error;
    }
  }

  async findByPatientId(patientId: string, limit = 50, offset = 0): Promise<PaymentPlan[]> {
    try {
      const { data: plansData, error: plansError } = await this.supabase
        .from('payment_plans')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (plansError) {
        throw new Error(`Failed to find payment plans by patient: ${plansError.message}`);
      }

      if (!plansData || plansData.length === 0) {
        return [];
      }

      // Fetch all installments for these plans
      const planIds = plansData.map((p) => p.plan_id);
      const { data: installmentsData, error: installmentsError } = await this.supabase
        .from('installments')
        .select('*')
        .in('plan_id', planIds)
        .order('installment_number', { ascending: true });

      if (installmentsError) {
        throw new Error(`Failed to fetch installments: ${installmentsError.message}`);
      }

      // Group installments by plan_id
      const installmentsByPlan = new Map<string, any[]>();
      (installmentsData || []).forEach((inst) => {
        if (!installmentsByPlan.has(inst.plan_id)) {
          installmentsByPlan.set(inst.plan_id, []);
        }
        installmentsByPlan.get(inst.plan_id)!.push(inst);
      });

      return plansData.map((planData) =>
        this.toDomain(planData, installmentsByPlan.get(planData.plan_id) || [])
      );
    } catch (error: any) {
      logger.error('Error finding payment plans by patient', { error: error.message });
      throw error;
    }
  }

  async findByInvoiceId(invoiceId: string): Promise<PaymentPlan | null> {
    try {
      const { data: planData, error: planError } = await this.supabase
        .from('payment_plans')
        .select('*')
        .eq('invoice_id', invoiceId)
        .single();

      if (planError) {
        if (planError.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Failed to find payment plan by invoice: ${planError.message}`);
      }

      if (!planData) {
        return null;
      }

      const { data: installmentsData, error: installmentsError } = await this.supabase
        .from('installments')
        .select('*')
        .eq('plan_id', planData.plan_id)
        .order('installment_number', { ascending: true });

      if (installmentsError) {
        throw new Error(`Failed to fetch installments: ${installmentsError.message}`);
      }

      return this.toDomain(planData, installmentsData || []);
    } catch (error: any) {
      logger.error('Error finding payment plan by invoice', { error: error.message });
      throw error;
    }
  }

  async findWithFilters(
    criteria: PaymentPlanFilterCriteria,
    limit = 50,
    offset = 0
  ): Promise<PaymentPlan[]> {
    try {
      let query = this.supabase.from('payment_plans').select('*');

      if (criteria.patientId) {
        query = query.eq('patient_id', criteria.patientId);
      }

      if (criteria.invoiceId) {
        query = query.eq('invoice_id', criteria.invoiceId);
      }

      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }

      if (criteria.fromDate) {
        query = query.gte('start_date', criteria.fromDate.toISOString());
      }

      if (criteria.toDate) {
        query = query.lte('end_date', criteria.toDate.toISOString());
      }

      const { data: plansData, error: plansError } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (plansError) {
        throw new Error(`Failed to find payment plans with filters: ${plansError.message}`);
      }

      if (!plansData || plansData.length === 0) {
        return [];
      }

      const planIds = plansData.map((p) => p.plan_id);
      const { data: installmentsData, error: installmentsError } = await this.supabase
        .from('installments')
        .select('*')
        .in('plan_id', planIds)
        .order('installment_number', { ascending: true });

      if (installmentsError) {
        throw new Error(`Failed to fetch installments: ${installmentsError.message}`);
      }

      const installmentsByPlan = new Map<string, any[]>();
      (installmentsData || []).forEach((inst) => {
        if (!installmentsByPlan.has(inst.plan_id)) {
          installmentsByPlan.set(inst.plan_id, []);
        }
        installmentsByPlan.get(inst.plan_id)!.push(inst);
      });

      return plansData.map((planData) =>
        this.toDomain(planData, installmentsByPlan.get(planData.plan_id) || [])
      );
    } catch (error: any) {
      logger.error('Error finding payment plans with filters', { error: error.message });
      throw error;
    }
  }

  async count(criteria: PaymentPlanFilterCriteria): Promise<number> {
    try {
      let query = this.supabase.from('payment_plans').select('*', { count: 'exact', head: true });

      if (criteria.patientId) {
        query = query.eq('patient_id', criteria.patientId);
      }

      if (criteria.invoiceId) {
        query = query.eq('invoice_id', criteria.invoiceId);
      }

      if (criteria.status) {
        query = query.eq('status', criteria.status);
      }

      if (criteria.fromDate) {
        query = query.gte('start_date', criteria.fromDate.toISOString());
      }

      if (criteria.toDate) {
        query = query.lte('end_date', criteria.toDate.toISOString());
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(`Failed to count payment plans: ${error.message}`);
      }

      return count || 0;
    } catch (error: any) {
      logger.error('Error counting payment plans', { error: error.message });
      throw error;
    }
  }

  async delete(planId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('payment_plans')
        .delete()
        .eq('plan_id', planId);

      if (error) {
        throw new Error(`Failed to delete payment plan: ${error.message}`);
      }
    } catch (error: any) {
      logger.error('Error deleting payment plan', { error: error.message });
      throw error;
    }
  }

  async exists(planId: string): Promise<boolean> {
    try {
      const { count, error } = await this.supabase
        .from('payment_plans')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', planId);

      if (error) {
        throw new Error(`Failed to check payment plan existence: ${error.message}`);
      }

      return (count || 0) > 0;
    } catch (error: any) {
      logger.error('Error checking payment plan existence', { error: error.message });
      throw error;
    }
  }

  private toDomain(planRecord: any, installmentsRecords: any[]): PaymentPlan {
    const installments = installmentsRecords.map((record) =>
      Installment.reconstitute(
        {
          installmentId: InstallmentId.fromString(record.installment_id),
          planId: record.plan_id,
          installmentNumber: record.installment_number,
          dueDate: new Date(record.due_date),
          amount: parseFloat(record.amount),
          paidAmount: parseFloat(record.paid_amount),
          remainingAmount: parseFloat(record.remaining_amount),
          status: record.status as InstallmentStatus,
          paymentMethod: record.payment_method as PaymentMethod | undefined,
          paymentDate: record.payment_date ? new Date(record.payment_date) : undefined,
          transactionId: record.transaction_id,
          notes: record.notes,
          createdAt: new Date(record.created_at),
          updatedAt: new Date(record.updated_at),
        },
        record.installment_id
      )
    );

    return PaymentPlan.reconstitute(
      {
        planId: PaymentPlanId.fromString(planRecord.plan_id),
        invoiceId: planRecord.invoice_id,
        patientId: planRecord.patient_id,
        totalAmount: parseFloat(planRecord.total_amount),
        downPayment: parseFloat(planRecord.down_payment),
        remainingAmount: parseFloat(planRecord.remaining_amount),
        numberOfInstallments: planRecord.number_of_installments,
        installmentAmount: parseFloat(planRecord.installment_amount),
        frequency: planRecord.frequency as PaymentFrequency,
        startDate: new Date(planRecord.start_date),
        endDate: new Date(planRecord.end_date),
        status: planRecord.status as PaymentPlanStatus,
        terms: planRecord.terms,
        notes: planRecord.notes,
        installments,
        createdBy: planRecord.created_by,
        createdAt: new Date(planRecord.created_at),
        updatedBy: planRecord.updated_by,
        updatedAt: new Date(planRecord.updated_at),
      },
      planRecord.plan_id
    );
  }

  private planToDatabase(plan: PaymentPlan): any {
    const props = (plan as any).props;
    return {
      plan_id: props.planId.value,
      invoice_id: props.invoiceId,
      patient_id: props.patientId,
      total_amount: props.totalAmount,
      down_payment: props.downPayment,
      remaining_amount: props.remainingAmount,
      number_of_installments: props.numberOfInstallments,
      installment_amount: props.installmentAmount,
      frequency: props.frequency,
      start_date: props.startDate.toISOString(),
      end_date: props.endDate.toISOString(),
      status: props.status,
      terms: props.terms,
      notes: props.notes,
      created_by: props.createdBy,
      created_at: props.createdAt.toISOString(),
      updated_by: props.updatedBy,
      updated_at: props.updatedAt.toISOString(),
    };
  }

  private installmentToDatabase(installment: Installment): any {
    const props = (installment as any).props;
    return {
      installment_id: props.installmentId.value,
      plan_id: props.planId,
      installment_number: props.installmentNumber,
      due_date: props.dueDate.toISOString(),
      amount: props.amount,
      paid_amount: props.paidAmount,
      remaining_amount: props.remainingAmount,
      status: props.status,
      payment_method: props.paymentMethod,
      payment_date: props.paymentDate?.toISOString(),
      transaction_id: props.transactionId,
      notes: props.notes,
      created_at: props.createdAt.toISOString(),
      updated_at: props.updatedAt.toISOString(),
    };
  }
}
