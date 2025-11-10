/**
 * SupabasePaymentPlanRepository - Infrastructure Layer
 * Supabase implementation of IPaymentPlanRepository
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Repository Pattern
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { IPaymentPlanRepository, PaymentPlanFilterCriteria } from '../../domain/repositories/IPaymentPlanRepository';
import { PaymentPlan } from '../../domain/aggregates/PaymentPlan.aggregate';
export declare class SupabasePaymentPlanRepository implements IPaymentPlanRepository {
    private readonly supabase;
    constructor(supabase: SupabaseClient);
    save(plan: PaymentPlan): Promise<void>;
    update(plan: PaymentPlan): Promise<void>;
    findById(planId: string): Promise<PaymentPlan | null>;
    findByPatientId(patientId: string, limit?: number, offset?: number): Promise<PaymentPlan[]>;
    findByInvoiceId(invoiceId: string): Promise<PaymentPlan | null>;
    findWithFilters(criteria: PaymentPlanFilterCriteria, limit?: number, offset?: number): Promise<PaymentPlan[]>;
    count(criteria: PaymentPlanFilterCriteria): Promise<number>;
    delete(planId: string): Promise<void>;
    exists(planId: string): Promise<boolean>;
    private toDomain;
    private planToDatabase;
    private installmentToDatabase;
}
//# sourceMappingURL=SupabasePaymentPlanRepository.d.ts.map