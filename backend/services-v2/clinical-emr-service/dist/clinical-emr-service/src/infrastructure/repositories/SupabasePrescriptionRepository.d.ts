/**
 * SupabasePrescriptionRepository - Supabase Implementation
 * @compliance Clean Architecture, DDD, Repository Pattern
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { IPrescriptionRepository, PrescriptionSearchFilters } from '../../domain/repositories/IPrescriptionRepository';
import { PrescriptionAggregate, PrescriptionStatus } from '../../domain/aggregates/Prescription.aggregate';
import { PrescriptionId } from '../../domain/value-objects/PrescriptionId';
export declare class SupabasePrescriptionRepository implements IPrescriptionRepository {
    private readonly supabase;
    private readonly tableName;
    private readonly schema;
    constructor(supabase: SupabaseClient);
    save(prescription: PrescriptionAggregate): Promise<void>;
    findById(prescriptionId: PrescriptionId): Promise<PrescriptionAggregate | null>;
    findByMedicalRecordId(medicalRecordId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<PrescriptionAggregate[]>;
    findByPatientId(patientId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<PrescriptionAggregate[]>;
    findByPrescribedBy(doctorId: string, options?: {
        status?: PrescriptionStatus;
        limit?: number;
        offset?: number;
    }): Promise<PrescriptionAggregate[]>;
    findByStatus(status: PrescriptionStatus, options?: {
        limit?: number;
        offset?: number;
    }): Promise<PrescriptionAggregate[]>;
    findActivePrescriptionsByPatient(patientId: string): Promise<PrescriptionAggregate[]>;
    findExpiredPrescriptions(options?: {
        limit?: number;
        offset?: number;
    }): Promise<PrescriptionAggregate[]>;
    findPrescriptionsNeedingRefill(patientId?: string): Promise<PrescriptionAggregate[]>;
    search(filters: PrescriptionSearchFilters): Promise<PrescriptionAggregate[]>;
    count(filters: Partial<PrescriptionSearchFilters>): Promise<number>;
    delete(prescriptionId: PrescriptionId): Promise<void>;
    exists(prescriptionId: PrescriptionId): Promise<boolean>;
    getNextSequence(yearMonth: string): Promise<number>;
    findByDateRange(startDate: Date, endDate: Date, options?: {
        patientId?: string;
        doctorId?: string;
    }): Promise<PrescriptionAggregate[]>;
    private toDatabase;
    private toDomain;
}
//# sourceMappingURL=SupabasePrescriptionRepository.d.ts.map