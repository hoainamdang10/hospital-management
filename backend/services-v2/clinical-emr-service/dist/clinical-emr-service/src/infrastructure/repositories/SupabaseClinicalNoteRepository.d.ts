/**
 * SupabaseClinicalNoteRepository - Supabase Implementation
 * Maps between domain aggregates and database records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { IClinicalNoteRepository } from '../../domain/repositories/IClinicalNoteRepository';
import { ClinicalNoteAggregate, ClinicalNoteType, ClinicalNoteStatus } from '../../domain/aggregates/ClinicalNote.aggregate';
import { NoteId } from '../../domain/value-objects/NoteId';
export declare class SupabaseClinicalNoteRepository implements IClinicalNoteRepository {
    private readonly supabase;
    private readonly tableName;
    private readonly schema;
    constructor(supabase: SupabaseClient);
    save(note: ClinicalNoteAggregate): Promise<void>;
    findById(noteId: NoteId): Promise<ClinicalNoteAggregate | null>;
    findByMedicalRecordId(medicalRecordId: string, options?: {
        limit?: number;
        offset?: number;
    }): Promise<ClinicalNoteAggregate[]>;
    findByPatientId(patientId: string, options?: {
        noteType?: ClinicalNoteType;
        limit?: number;
        offset?: number;
    }): Promise<ClinicalNoteAggregate[]>;
    findByEncounterId(encounterId: string): Promise<ClinicalNoteAggregate[]>;
    findByCreatedBy(authorId: string, options?: {
        noteType?: ClinicalNoteType;
        status?: ClinicalNoteStatus;
        limit?: number;
        offset?: number;
    }): Promise<ClinicalNoteAggregate[]>;
    findUnsignedNotes(options?: {
        authorId?: string;
        limit?: number;
    }): Promise<ClinicalNoteAggregate[]>;
    findPendingCosignNotes(cosignerId: string, options?: {
        limit?: number;
    }): Promise<ClinicalNoteAggregate[]>;
    findByDateRange(startDate: Date, endDate: Date, options?: {
        patientId?: string;
        noteType?: ClinicalNoteType;
    }): Promise<ClinicalNoteAggregate[]>;
    findByTemplateId(templateId: string, options?: {
        limit?: number;
    }): Promise<ClinicalNoteAggregate[]>;
    search(filters: {
        patientId?: string;
        noteType?: ClinicalNoteType;
        status?: ClinicalNoteStatus;
        authorId?: string;
        fromDate?: Date;
        toDate?: Date;
        tags?: string[];
        searchText?: string;
        limit?: number;
        offset?: number;
    }): Promise<ClinicalNoteAggregate[]>;
    count(filters: Partial<{
        patientId: string;
        noteType: ClinicalNoteType;
        status: ClinicalNoteStatus;
    }>): Promise<number>;
    delete(noteId: NoteId): Promise<void>;
    exists(noteId: NoteId): Promise<boolean>;
    getNextSequence(yearMonth: string): Promise<number>;
    findNoteVersions(originalNoteId: NoteId): Promise<ClinicalNoteAggregate[]>;
    private toDatabase;
    private toDomain;
}
//# sourceMappingURL=SupabaseClinicalNoteRepository.d.ts.map