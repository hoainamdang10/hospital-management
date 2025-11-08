/**
 * SupabaseMedicalImagingRepository - Infrastructure Layer
 * Supabase implementation of IMedicalImagingRepository
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, Repository Pattern
 */
import { SupabaseClient } from "@supabase/supabase-js";
import { IMedicalImagingRepository, MedicalImagingFilterCriteria } from "../../domain/repositories/IMedicalImagingRepository";
import { MedicalImaging } from "../../domain/aggregates/MedicalImaging.aggregate";
export declare class SupabaseMedicalImagingRepository implements IMedicalImagingRepository {
    private readonly supabase;
    constructor(supabase: SupabaseClient);
    save(imaging: MedicalImaging): Promise<void>;
    update(imaging: MedicalImaging): Promise<void>;
    findById(imagingId: string): Promise<MedicalImaging | null>;
    findByPatientId(patientId: string, limit?: number, offset?: number): Promise<MedicalImaging[]>;
    findByMedicalRecordId(medicalRecordId: string): Promise<MedicalImaging[]>;
    findWithFilters(criteria: MedicalImagingFilterCriteria, limit?: number, offset?: number): Promise<MedicalImaging[]>;
    count(criteria: MedicalImagingFilterCriteria): Promise<number>;
    delete(imagingId: string): Promise<void>;
    exists(imagingId: string): Promise<boolean>;
    private toDomain;
    private toDatabase;
}
//# sourceMappingURL=SupabaseMedicalImagingRepository.d.ts.map