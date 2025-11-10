/**
 * IPaymentPlanRepository - Repository Interface
 * Defines persistence operations for payment plans
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance DDD, Repository Pattern
 */
import { PaymentPlan, PaymentPlanStatus } from '../aggregates/PaymentPlan.aggregate';
export interface PaymentPlanFilterCriteria {
    patientId?: string;
    invoiceId?: string;
    status?: PaymentPlanStatus;
    fromDate?: Date;
    toDate?: Date;
}
export interface IPaymentPlanRepository {
    /**
     * Save new payment plan
     */
    save(plan: PaymentPlan): Promise<void>;
    /**
     * Update existing payment plan
     */
    update(plan: PaymentPlan): Promise<void>;
    /**
     * Find payment plan by ID
     */
    findById(planId: string): Promise<PaymentPlan | null>;
    /**
     * Find all payment plans for a patient
     */
    findByPatientId(patientId: string, limit?: number, offset?: number): Promise<PaymentPlan[]>;
    /**
     * Find payment plan by invoice ID
     */
    findByInvoiceId(invoiceId: string): Promise<PaymentPlan | null>;
    /**
     * Find payment plans with filters
     */
    findWithFilters(criteria: PaymentPlanFilterCriteria, limit?: number, offset?: number): Promise<PaymentPlan[]>;
    /**
     * Count payment plans with filters
     */
    count(criteria: PaymentPlanFilterCriteria): Promise<number>;
    /**
     * Delete payment plan
     */
    delete(planId: string): Promise<void>;
    /**
     * Check if payment plan exists
     */
    exists(planId: string): Promise<boolean>;
}
//# sourceMappingURL=IPaymentPlanRepository.d.ts.map