/**
 * SupabaseLabResultRepository - Supabase Implementation
 * @compliance Clean Architecture, DDD, Repository Pattern, FHIR R4
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { ILabResultRepository, LabResultFilterCriteria } from '../../domain/repositories/ILabResultRepository';
import { LabResult } from '../../domain/aggregates/LabResult.aggregate';
export declare class SupabaseLabResultRepository implements ILabResultRepository {
    private readonly supabase;
    private readonly tableName;
    private readonly schema;
    constructor(supabase: SupabaseClient);
    save(labResult: LabResult): Promise<void>;
    update(labResult: LabResult): Promise<void>;
    findById(resultId: string): Promise<LabResult | null>;
    findByPatientId(patientId: string, limit?: number, offset?: number): Promise<LabResult[]>;
    findByMedicalRecordId(medicalRecordId: string): Promise<LabResult[]>;
    findWithFilters(criteria: LabResultFilterCriteria, limit?: number, offset?: number): Promise<LabResult[]>;
    count(criteria: LabResultFilterCriteria): Promise<number>;
    delete(resultId: string): Promise<void>;
    exists(resultId: string): Promise<boolean>;
    private toDomain;
    private toDatabase;
}
//# sourceMappingURL=SupabaseLabResultRepository.d.ts.map