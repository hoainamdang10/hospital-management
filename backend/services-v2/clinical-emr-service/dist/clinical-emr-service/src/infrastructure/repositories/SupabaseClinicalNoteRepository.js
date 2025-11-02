"use strict";
/**
 * SupabaseClinicalNoteRepository - Supabase Implementation
 * Maps between domain aggregates and database records
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseClinicalNoteRepository = void 0;
const ClinicalNote_aggregate_1 = require("../../domain/aggregates/ClinicalNote.aggregate");
const NoteId_1 = require("../../domain/value-objects/NoteId");
class SupabaseClinicalNoteRepository {
    constructor(supabase) {
        this.supabase = supabase;
        this.tableName = 'clinical_notes';
        this.schema = 'clinical_schema';
    }
    async save(note) {
        const record = this.toDatabase(note);
        const { error } = await this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .upsert(record);
        if (error)
            throw new Error(`Failed to save clinical note: ${error.message}`);
    }
    async findById(noteId) {
        const { data, error } = await this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('note_id', noteId.value)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            throw new Error(`Failed to find clinical note: ${error.message}`);
        }
        return data ? this.toDomain(data) : null;
    }
    async findByMedicalRecordId(medicalRecordId, options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('medical_record_id', medicalRecordId)
            .order('created_at', { ascending: false });
        if (options?.limit)
            query = query.limit(options.limit);
        if (options?.offset)
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find notes by medical record: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findByPatientId(patientId, options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });
        if (options?.noteType)
            query = query.eq('note_type', options.noteType);
        if (options?.limit)
            query = query.limit(options.limit);
        if (options?.offset)
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find notes by patient: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findByEncounterId(encounterId) {
        const { data, error } = await this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('encounter_id', encounterId)
            .order('created_at', { ascending: false });
        if (error)
            throw new Error(`Failed to find notes by encounter: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findByCreatedBy(authorId, options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('created_by', authorId)
            .order('created_at', { ascending: false });
        if (options?.noteType)
            query = query.eq('note_type', options.noteType);
        if (options?.status)
            query = query.eq('status', options.status);
        if (options?.limit)
            query = query.limit(options.limit);
        if (options?.offset)
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find notes by author: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findUnsignedNotes(options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('status', 'draft')
            .is('signed_by', null)
            .order('created_at', { ascending: false });
        if (options?.authorId)
            query = query.eq('created_by', options.authorId);
        if (options?.limit)
            query = query.limit(options.limit);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find unsigned notes: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findPendingCosignNotes(cosignerId, options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('status', 'pending_cosign')
            .is('cosigned_by', null)
            .order('created_at', { ascending: false });
        if (options?.limit)
            query = query.limit(options.limit);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find pending cosign notes: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findByDateRange(startDate, endDate, options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .gte('created_at', startDate.toISOString())
            .lte('created_at', endDate.toISOString())
            .order('created_at', { ascending: false });
        if (options?.patientId)
            query = query.eq('patient_id', options.patientId);
        if (options?.noteType)
            query = query.eq('note_type', options.noteType);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find notes by date range: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findByTemplateId(templateId, options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('template_id', templateId)
            .order('created_at', { ascending: false });
        if (options?.limit)
            query = query.limit(options.limit);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find notes by template: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async search(filters) {
        let query = this.supabase.schema(this.schema).from(this.tableName).select('*');
        if (filters.patientId)
            query = query.eq('patient_id', filters.patientId);
        if (filters.noteType)
            query = query.eq('note_type', filters.noteType);
        if (filters.status)
            query = query.eq('status', filters.status);
        if (filters.authorId)
            query = query.eq('created_by', filters.authorId);
        if (filters.fromDate)
            query = query.gte('created_at', filters.fromDate.toISOString());
        if (filters.toDate)
            query = query.lte('created_at', filters.toDate.toISOString());
        if (filters.tags && filters.tags.length > 0)
            query = query.contains('tags', filters.tags);
        if (filters.searchText)
            query = query.or(`title.ilike.%${filters.searchText}%,content->>text.ilike.%${filters.searchText}%`);
        query = query.order('created_at', { ascending: false });
        if (filters.limit)
            query = query.limit(filters.limit);
        if (filters.offset)
            query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to search notes: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async count(filters) {
        let query = this.supabase.schema(this.schema).from(this.tableName).select('*', { count: 'exact', head: true });
        if (filters.patientId)
            query = query.eq('patient_id', filters.patientId);
        if (filters.noteType)
            query = query.eq('note_type', filters.noteType);
        if (filters.status)
            query = query.eq('status', filters.status);
        const { count, error } = await query;
        if (error)
            throw new Error(`Failed to count notes: ${error.message}`);
        return count || 0;
    }
    async delete(noteId) {
        const { error } = await this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .delete()
            .eq('note_id', noteId.value);
        if (error)
            throw new Error(`Failed to delete clinical note: ${error.message}`);
    }
    async exists(noteId) {
        const { count, error } = await this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*', { count: 'exact', head: true })
            .eq('note_id', noteId.value);
        if (error)
            throw new Error(`Failed to check note existence: ${error.message}`);
        return (count || 0) > 0;
    }
    async getNextSequence(yearMonth) {
        const { data, error } = await this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('note_id')
            .like('note_id', `NOTE-${yearMonth}-%`)
            .order('note_id', { ascending: false })
            .limit(1);
        if (error)
            throw new Error(`Failed to get next sequence: ${error.message}`);
        if (!data || data.length === 0)
            return 1;
        const lastId = data[0].note_id;
        const lastSeq = parseInt(lastId.split('-')[2], 10);
        return lastSeq + 1;
    }
    async findNoteVersions(originalNoteId) {
        const { data, error } = await this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .or(`note_id.eq.${originalNoteId.value},previous_version_id.eq.${originalNoteId.value}`)
            .order('version', { ascending: true });
        if (error)
            throw new Error(`Failed to find note versions: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    toDatabase(note) {
        return {
            note_id: note.noteId.value,
            medical_record_id: note.medicalRecordId,
            patient_id: note.patientId,
            encounter_id: note.encounterId,
            note_type: note.noteType,
            title: note.title,
            content: note.content,
            template_id: note.templateId,
            soap_format: note.soapFormat,
            created_by: note.createdBy,
            created_at: note.createdAt.toISOString(),
            updated_by: note.updatedBy,
            updated_at: note.updatedAt?.toISOString(),
            signed_by: note.signedBy,
            signed_at: note.signedAt?.toISOString(),
            cosigned_by: note.cosignedBy,
            cosigned_at: note.cosignedAt?.toISOString(),
            status: note.status,
            tags: note.tags,
            attachments: note.attachments,
            version: note.version,
            previous_version_id: note.previousVersionId,
            is_locked: note.isLocked,
            locked_by: note.lockedBy,
            locked_at: note.lockedAt?.toISOString(),
            access_log: note.accessLog,
        };
    }
    toDomain(record) {
        const noteId = NoteId_1.NoteId.create(record.note_id);
        const props = {
            noteId,
            medicalRecordId: record.medical_record_id,
            patientId: record.patient_id,
            authorId: record.created_by,
            noteType: record.note_type,
            noteTitle: record.title,
            noteContent: typeof record.content === 'string' ? record.content : JSON.stringify(record.content),
            clinicalFindings: record.soap_format?.subjective || record.soap_format?.objective,
            assessment: record.soap_format?.assessment,
            plan: record.soap_format?.plan,
            requiresCosign: !!record.cosigned_by || record.status === 'pending_cosign',
            cosignedBy: record.cosigned_by,
            cosignedAt: record.cosigned_at ? new Date(record.cosigned_at) : undefined,
            cosignComment: undefined,
            status: record.status,
            createdAt: new Date(record.created_at),
            updatedAt: record.updated_at ? new Date(record.updated_at) : new Date(record.created_at),
            createdBy: record.created_by,
            updatedBy: record.updated_by,
            accessLog: record.access_log,
            lastAccessedAt: record.access_log?.[record.access_log.length - 1]?.accessedAt,
            lastAccessedBy: record.access_log?.[record.access_log.length - 1]?.accessedBy,
        };
        return ClinicalNote_aggregate_1.ClinicalNoteAggregate.reconstitute(props, record.note_id);
    }
}
exports.SupabaseClinicalNoteRepository = SupabaseClinicalNoteRepository;
//# sourceMappingURL=SupabaseClinicalNoteRepository.js.map