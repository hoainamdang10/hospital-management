"use strict";
/**
 * Patient Read Model Repository
 * Maintains denormalized patient data for appointments service
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance CQRS, Event-Driven Architecture, Eventual Consistency
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientReadModelRepository = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
/**
 * Patient Read Model Repository
 * Query-side repository for patient data (CQRS pattern)
 */
class PatientReadModelRepository {
    constructor(supabaseUrl, supabaseKey) {
        this.table = 'patient_read_model';
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false },
            db: { schema: 'appointments_schema' },
            global: { headers: { 'X-Client-Info': 'appointments-patient-read' } }
        });
    }
    /**
     * Upsert patient read model (idempotent)
     */
    async upsert(patient) {
        const { error } = await this.supabase.from(this.table).upsert({
            patient_id: patient.patientId,
            tenant_id: patient.tenantId,
            full_name: patient.fullName,
            phone: patient.phone || null,
            email: patient.email || null,
            date_of_birth: patient.dateOfBirth?.toISOString().split('T')[0] || null,
            gender: patient.gender || null,
            national_id: patient.nationalId || null,
            insurance_number: patient.insuranceNumber || null,
            insurance_type: patient.insuranceType || null,
            address: patient.address || null,
            synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'patient_id'
        });
        if (error) {
            throw new Error(`Failed to upsert patient read model: ${error.message}`);
        }
        console.debug(`[PatientReadModelRepo] ✓ Upserted patient ${patient.patientId}`);
    }
    /**
     * Find patient by ID
     */
    async findById(patientId) {
        const { data, error } = await this.supabase
            .from(this.table)
            .select('*')
            .eq('patient_id', patientId)
            .maybeSingle();
        if (error) {
            throw new Error(`Failed to fetch patient read model: ${error.message}`);
        }
        if (!data) {
            console.debug(`[PatientReadModelRepo] Patient ${patientId} not found in read model`);
            return null;
        }
        return this.mapToModel(data);
    }
    /**
     * Find multiple patients by IDs
     */
    async findByIds(patientIds) {
        if (patientIds.length === 0)
            return [];
        const { data, error } = await this.supabase
            .from(this.table)
            .select('*')
            .in('patient_id', patientIds);
        if (error) {
            throw new Error(`Failed to fetch patients read model: ${error.message}`);
        }
        return (data || []).map(this.mapToModel);
    }
    /**
     * Find patients by tenant
     */
    async findByTenant(tenantId, limit = 100) {
        const { data, error } = await this.supabase
            .from(this.table)
            .select('*')
            .eq('tenant_id', tenantId)
            .order('full_name', { ascending: true })
            .limit(limit);
        if (error) {
            throw new Error(`Failed to fetch patients by tenant: ${error.message}`);
        }
        return (data || []).map(this.mapToModel);
    }
    /**
     * Search patients by name/phone/email
     */
    async search(query, tenantId, limit = 20) {
        const searchPattern = `%${query}%`;
        const { data, error } = await this.supabase
            .from(this.table)
            .select('*')
            .eq('tenant_id', tenantId)
            .or(`full_name.ilike.${searchPattern},phone.ilike.${searchPattern},email.ilike.${searchPattern}`)
            .order('full_name', { ascending: true })
            .limit(limit);
        if (error) {
            throw new Error(`Failed to search patients: ${error.message}`);
        }
        return (data || []).map(this.mapToModel);
    }
    /**
     * Delete patient read model
     */
    async delete(patientId) {
        const { error } = await this.supabase
            .from(this.table)
            .delete()
            .eq('patient_id', patientId);
        if (error) {
            throw new Error(`Failed to delete patient read model: ${error.message}`);
        }
        console.debug(`[PatientReadModelRepo] ✓ Deleted patient ${patientId}`);
    }
    /**
     * Get sync statistics
     */
    async getSyncStats() {
        const { data, error } = await this.supabase
            .from(this.table)
            .select('synced_at');
        if (error) {
            throw new Error(`Failed to get sync stats: ${error.message}`);
        }
        if (!data || data.length === 0) {
            return {
                totalPatients: 0,
                lastSyncedAt: null,
                oldestSyncedAt: null,
                syncLagSeconds: null
            };
        }
        const syncTimes = data.map(row => new Date(row.synced_at).getTime());
        const lastSyncedAt = new Date(Math.max(...syncTimes));
        const oldestSyncedAt = new Date(Math.min(...syncTimes));
        const syncLagSeconds = (Date.now() - lastSyncedAt.getTime()) / 1000;
        return {
            totalPatients: data.length,
            lastSyncedAt,
            oldestSyncedAt,
            syncLagSeconds
        };
    }
    /**
     * Check if patient exists
     */
    async exists(patientId) {
        const { data, error } = await this.supabase
            .from(this.table)
            .select('patient_id')
            .eq('patient_id', patientId)
            .maybeSingle();
        if (error && error.code !== 'PGRST116') {
            throw new Error(`Failed to check patient existence: ${error.message}`);
        }
        return data !== null;
    }
    /**
     * Count patients by tenant
     */
    async countByTenant(tenantId) {
        const { count, error } = await this.supabase
            .from(this.table)
            .select('patient_id', { count: 'exact', head: true })
            .eq('tenant_id', tenantId);
        if (error) {
            throw new Error(`Failed to count patients: ${error.message}`);
        }
        return count || 0;
    }
    /**
     * Map database row to domain model
     */
    mapToModel(row) {
        return {
            patientId: row.patient_id,
            tenantId: row.tenant_id,
            fullName: row.full_name,
            phone: row.phone || undefined,
            email: row.email || undefined,
            dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : undefined,
            gender: row.gender || undefined,
            nationalId: row.national_id || undefined,
            insuranceNumber: row.insurance_number || undefined,
            insuranceType: row.insurance_type || undefined,
            address: row.address || undefined,
            syncedAt: row.synced_at ? new Date(row.synced_at) : undefined,
            createdAt: row.created_at ? new Date(row.created_at) : undefined,
            updatedAt: row.updated_at ? new Date(row.updated_at) : undefined
        };
    }
}
exports.PatientReadModelRepository = PatientReadModelRepository;
//# sourceMappingURL=PatientReadModelRepository.js.map