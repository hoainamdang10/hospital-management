/**
 * SupabaseTreatmentPlanRepository - Supabase Implementation
 * @compliance Clean Architecture, DDD, Repository Pattern
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { ITreatmentPlanRepository } from '../../domain/repositories/ITreatmentPlanRepository';
import { TreatmentPlanAggregate, TreatmentPlanStatus } from '../../domain/aggregates/TreatmentPlan.aggregate';
import { TreatmentPlanId } from '../../domain/value-objects/TreatmentPlanId';
export declare class SupabaseTreatmentPlanRepository implements ITreatmentPlanRepository {
    private readonly supabase;
    private readonly tableName;
    private readonly schema;
    constructor(supabase: SupabaseClient);
    save(plan: TreatmentPlanAggregate): Promise<void>;
    findById(planId: TreatmentPlanId): Promise<TreatmentPlanAggregate | null>;
    findByMedicalRecordId(medicalRecordId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<TreatmentPlanAggregate[]>;
    findByPatientId(patientId: string, options?: {
        status?: TreatmentPlanStatus;
        limit?: number;
        offset?: number;
    }): Promise<TreatmentPlanAggregate[]>;
    findByCreatedBy(doctorId: string, options?: {
        status?: TreatmentPlanStatus;
        limit?: number;
        offset?: number;
    }): Promise<TreatmentPlanAggregate[]>;
    findByStatus(status: TreatmentPlanStatus, options?: {
        limit?: number;
        offset?: number;
    }): Promise<TreatmentPlanAggregate[]>;
    findActivePlansByPatient(patientId: string): Promise<TreatmentPlanAggregate[]>;
    findPendingConsentPlans(options?: {
        patientId?: string;
        limit?: number;
    }): Promise<TreatmentPlanAggregate[]>;
    search(filters: {
        patientId?: string;
        status?: TreatmentPlanStatus;
        createdBy?: string;
        fromDate?: Date;
        toDate?: Date;
        diagnosisCode?: string;
        hasConsent?: boolean;
        searchText?: string;
        limit?: number;
        offset?: number;
    }): Promise<TreatmentPlanAggregate[]>;
    count(filters: Partial<{
        patientId: string;
        status: TreatmentPlanStatus;
    }>): Promise<number>;
    delete(planId: TreatmentPlanId): Promise<void>;
    exists(planId: TreatmentPlanId): Promise<boolean>;
    getNextSequence(yearMonth: string): Promise<number>;
    findByDateRange(startDate: Date, endDate: Date, options?: {
        patientId?: string;
        status?: TreatmentPlanStatus;
    }): Promise<TreatmentPlanAggregate[]>;
    private toDatabase;
    private toDomain;
}
//# sourceMappingURL=SupabaseTreatmentPlanRepository.d.ts.map