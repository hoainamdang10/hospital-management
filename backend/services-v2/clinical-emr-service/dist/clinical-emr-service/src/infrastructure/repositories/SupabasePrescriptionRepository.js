"use strict";
/**
 * SupabasePrescriptionRepository - Supabase Implementation
 * @compliance Clean Architecture, DDD, Repository Pattern
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabasePrescriptionRepository = void 0;
const Prescription_aggregate_1 = require("../../domain/aggregates/Prescription.aggregate");
const PrescriptionId_1 = require("../../domain/value-objects/PrescriptionId");
class SupabasePrescriptionRepository {
    constructor(supabase) {
        this.supabase = supabase;
        this.tableName = 'prescriptions';
        this.schema = 'clinical_schema';
    }
    async save(prescription) {
        const record = this.toDatabase(prescription);
        const { error } = await this.supabase.schema(this.schema).from(this.tableName).upsert(record);
        if (error)
            throw new Error(`Failed to save prescription: ${error.message}`);
    }
    async findById(prescriptionId) {
        const { data, error } = await this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('prescription_id', prescriptionId.value)
            .single();
        if (error) {
            if (error.code === 'PGRST116')
                return null;
            throw new Error(`Failed to find prescription: ${error.message}`);
        }
        return data ? this.toDomain(data) : null;
    }
    async findByMedicalRecordId(medicalRecordId, options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('medical_record_id', medicalRecordId)
            .order('prescribed_date', { ascending: false });
        if (options?.limit)
            query = query.limit(options.limit);
        if (options?.offset)
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find prescriptions by medical record: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findByPatientId(patientId, options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('patient_id', patientId)
            .order('prescribed_date', { ascending: false });
        if (options?.limit)
            query = query.limit(options.limit);
        if (options?.offset)
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find prescriptions by patient: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findByPrescribedBy(doctorId, options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('prescribed_by', doctorId)
            .order('prescribed_date', { ascending: false });
        if (options?.status)
            query = query.eq('status', options.status);
        if (options?.limit)
            query = query.limit(options.limit);
        if (options?.offset)
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find prescriptions by doctor: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findByStatus(status, options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('status', status)
            .order('prescribed_date', { ascending: false });
        if (options?.limit)
            query = query.limit(options.limit);
        if (options?.offset)
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find prescriptions by status: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findActivePrescriptionsByPatient(patientId) {
        const { data, error } = await this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('patient_id', patientId)
            .in('status', ['active', 'dispensed'])
            .order('prescribed_date', { ascending: false });
        if (error)
            throw new Error(`Failed to find active prescriptions: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findExpiredPrescriptions(options) {
        const now = new Date().toISOString();
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .lt('valid_until', now)
            .in('status', ['active', 'draft'])
            .order('valid_until', { ascending: true });
        if (options?.limit)
            query = query.limit(options.limit);
        if (options?.offset)
            query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find expired prescriptions: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async findPrescriptionsNeedingRefill(patientId) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .eq('status', 'active')
            .gt('refills_remaining', 0)
            .order('prescribed_date', { ascending: false });
        if (patientId)
            query = query.eq('patient_id', patientId);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find prescriptions needing refill: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async search(filters) {
        let query = this.supabase.schema(this.schema).from(this.tableName).select('*');
        if (filters.patientId)
            query = query.eq('patient_id', filters.patientId);
        if (filters.medicalRecordId)
            query = query.eq('medical_record_id', filters.medicalRecordId);
        if (filters.prescribedBy)
            query = query.eq('prescribed_by', filters.prescribedBy);
        if (filters.status)
            query = query.eq('status', filters.status);
        if (filters.statuses && filters.statuses.length > 0)
            query = query.in('status', filters.statuses);
        if (filters.pharmacyId)
            query = query.eq('pharmacy_id', filters.pharmacyId);
        if (filters.fromDate)
            query = query.gte('prescribed_date', filters.fromDate.toISOString());
        if (filters.toDate)
            query = query.lte('prescribed_date', filters.toDate.toISOString());
        if (filters.hasRefills !== undefined) {
            if (filters.hasRefills)
                query = query.gt('refills_remaining', 0);
            else
                query = query.eq('refills_remaining', 0);
        }
        if (filters.isExpired) {
            const now = new Date().toISOString();
            query = query.lt('valid_until', now);
        }
        query = query.order('prescribed_date', { ascending: false });
        if (filters.limit)
            query = query.limit(filters.limit);
        if (filters.offset)
            query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to search prescriptions: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    async count(filters) {
        let query = this.supabase.schema(this.schema).from(this.tableName).select('*', { count: 'exact', head: true });
        if (filters.patientId)
            query = query.eq('patient_id', filters.patientId);
        if (filters.medicalRecordId)
            query = query.eq('medical_record_id', filters.medicalRecordId);
        if (filters.prescribedBy)
            query = query.eq('prescribed_by', filters.prescribedBy);
        if (filters.status)
            query = query.eq('status', filters.status);
        if (filters.pharmacyId)
            query = query.eq('pharmacy_id', filters.pharmacyId);
        const { count, error } = await query;
        if (error)
            throw new Error(`Failed to count prescriptions: ${error.message}`);
        return count || 0;
    }
    async delete(prescriptionId) {
        const { error } = await this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .delete()
            .eq('prescription_id', prescriptionId.value);
        if (error)
            throw new Error(`Failed to delete prescription: ${error.message}`);
    }
    async exists(prescriptionId) {
        const { count, error } = await this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*', { count: 'exact', head: true })
            .eq('prescription_id', prescriptionId.value);
        if (error)
            throw new Error(`Failed to check prescription existence: ${error.message}`);
        return (count || 0) > 0;
    }
    async getNextSequence(yearMonth) {
        const { data, error } = await this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('prescription_id')
            .like('prescription_id', `PRESC-${yearMonth}-%`)
            .order('prescription_id', { ascending: false })
            .limit(1);
        if (error)
            throw new Error(`Failed to get next sequence: ${error.message}`);
        if (!data || data.length === 0)
            return 1;
        const lastId = data[0].prescription_id;
        const lastSeq = parseInt(lastId.split('-')[2], 10);
        return lastSeq + 1;
    }
    async findByDateRange(startDate, endDate, options) {
        let query = this.supabase
            .schema(this.schema)
            .from(this.tableName)
            .select('*')
            .gte('prescribed_date', startDate.toISOString())
            .lte('prescribed_date', endDate.toISOString())
            .order('prescribed_date', { ascending: false });
        if (options?.patientId)
            query = query.eq('patient_id', options.patientId);
        if (options?.doctorId)
            query = query.eq('prescribed_by', options.doctorId);
        const { data, error } = await query;
        if (error)
            throw new Error(`Failed to find prescriptions by date range: ${error.message}`);
        return data ? data.map(r => this.toDomain(r)) : [];
    }
    toDatabase(prescription) {
        return {
            prescription_id: prescription.prescriptionId.value,
            medical_record_id: prescription.medicalRecordId,
            patient_id: prescription.patientId,
            prescribed_by: prescription.prescribedBy,
            medications: prescription.medications,
            prescribed_date: prescription.prescribedDate.toISOString(),
            diagnosis: prescription.diagnosis,
            diagnosis_code: prescription.diagnosisCode,
            general_instructions: prescription.generalInstructions,
            precautions: prescription.precautions,
            valid_until: prescription.validUntil?.toISOString(),
            dispensed_by: prescription.dispensedBy,
            dispensed_at: prescription.dispensedAt?.toISOString(),
            pharmacy_id: prescription.pharmacyId,
            refills_allowed: prescription.refillsAllowed,
            refills_remaining: prescription.refillsRemaining,
            refill_history: prescription.refillHistory,
            status: prescription.status,
            created_by: prescription.createdBy,
            created_at: prescription.createdAt.toISOString(),
            updated_by: prescription.updatedBy,
            updated_at: prescription.updatedAt?.toISOString(),
            access_log: prescription.accessLog,
        };
    }
    toDomain(record) {
        const prescriptionId = PrescriptionId_1.PrescriptionId.create(record.prescription_id);
        const props = {
            prescriptionId,
            medicalRecordId: record.medical_record_id,
            patientId: record.patient_id,
            prescribedBy: record.prescribed_by,
            diagnosis: record.diagnosis,
            diagnosisCode: record.diagnosis_code,
            medications: record.medications,
            generalInstructions: record.general_instructions,
            precautions: record.precautions,
            prescribedDate: new Date(record.prescribed_date),
            validUntil: record.valid_until ? new Date(record.valid_until) : undefined,
            dispensedBy: record.dispensed_by,
            dispensedAt: record.dispensed_at ? new Date(record.dispensed_at) : undefined,
            pharmacyId: record.pharmacy_id,
            refillsAllowed: record.refills_allowed,
            refillsRemaining: record.refills_remaining,
            refillHistory: record.refill_history,
            status: record.status,
            createdAt: new Date(record.created_at),
            updatedAt: record.updated_at ? new Date(record.updated_at) : undefined,
            createdBy: record.created_by,
            updatedBy: record.updated_by,
            accessLog: record.access_log,
        };
        return Prescription_aggregate_1.PrescriptionAggregate.reconstitute(props, record.prescription_id);
    }
}
exports.SupabasePrescriptionRepository = SupabasePrescriptionRepository;
//# sourceMappingURL=SupabasePrescriptionRepository.js.map