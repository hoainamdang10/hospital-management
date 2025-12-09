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
        this.table = "patient_read_model";
        this.schema = "appointments_schema";
        this.fallbackSchema = "patient_schema";
        this.fallbackTable = "patients";
        // Create client without schema restriction for fallback queries
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false },
            global: { headers: { "X-Client-Info": "appointments-patient-read" } },
        });
        this.schemaClient = this.supabase.schema(this.schema);
    }
    /**
     * Upsert patient read model (idempotent)
     */
    async upsert(patient) {
        let hydratedPatient = patient;
        if (this.shouldHydrateFromFallback(patient)) {
            const fallback = await this.findByIdFallback(patient.patientId);
            if (fallback) {
                hydratedPatient = this.mergePatientProfiles(fallback, patient);
            }
        }
        const nowIso = new Date().toISOString();
        const { error } = await this.schemaClient.from(this.table).upsert({
            patient_id: hydratedPatient.patientId,
            tenant_id: hydratedPatient.tenantId,
            full_name: hydratedPatient.fullName,
            phone: hydratedPatient.phone || null,
            email: hydratedPatient.email || null,
            date_of_birth: hydratedPatient.dateOfBirth?.toISOString().split("T")[0] || null,
            gender: hydratedPatient.gender || null,
            national_id: hydratedPatient.nationalId || null,
            insurance_number: hydratedPatient.insuranceNumber || null,
            insurance_type: hydratedPatient.insuranceType || null,
            address: hydratedPatient.address || null,
            synced_at: nowIso,
            updated_at: nowIso,
        }, {
            onConflict: "patient_id",
        });
        if (error) {
            throw new Error(`Failed to upsert patient read model: ${error.message}`);
        }
        console.debug(`[PatientReadModelRepo] ✓ Upserted patient ${patient.patientId}`);
    }
    /**
     * Find patient by ID
     * Falls back to patient_schema.patients if read model is empty
     */
    async findById(patientId) {
        // Try read model first
        const { data, error } = await this.schemaClient
            .from(this.table)
            .select("*")
            .eq("patient_id", patientId)
            .maybeSingle();
        if (error && error.code !== "PGRST116" && error.code !== "42P01") {
            throw new Error(`Failed to fetch patient read model: ${error.message}`);
        }
        if (data) {
            const mapped = this.mapToModel(data);
            if (this.shouldHydrateFromFallback(mapped)) {
                const fallback = await this.findByIdFallback(patientId);
                if (fallback) {
                    const merged = this.mergePatientProfiles(fallback, mapped);
                    await this.upsert(merged);
                    return merged;
                }
            }
            return mapped;
        }
        // Fallback to patient_schema.patients
        console.debug(`[PatientReadModelRepo] Patient ${patientId} not found in read model, trying fallback`);
        const fallback = await this.findByIdFallback(patientId);
        if (fallback) {
            try {
                await this.upsert(fallback);
            }
            catch (error) {
                console.error("[PatientReadModelRepo] Failed to upsert fallback patient", {
                    patientId,
                    error,
                });
            }
        }
        return fallback;
    }
    /**
     * Fallback: Query patient_schema.patients directly
     */
    async findByIdFallback(patientId) {
        try {
            const { data, error } = await this.supabase
                .schema(this.fallbackSchema)
                .from(this.fallbackTable)
                .select("patient_id, personal_info, contact_info, basic_medical_info")
                .eq("patient_id", patientId)
                .maybeSingle();
            if (error) {
                console.error(`[PatientReadModelRepo] Fallback query failed: ${error.message}`);
                return null;
            }
            if (!data) {
                console.debug(`[PatientReadModelRepo] Patient ${patientId} not found in fallback`);
                return null;
            }
            // Map JSONB fields to PatientReadModel
            const personalInfo = data.personal_info || {};
            const contactInfo = data.contact_info || {};
            const medicalInfo = data.basic_medical_info || {};
            const resolvePhone = () => {
                return (contactInfo.primaryPhone ||
                    contactInfo.primary_phone ||
                    contactInfo.phone ||
                    contactInfo.phoneNumber ||
                    contactInfo.phone_number ||
                    undefined);
            };
            return {
                patientId: data.patient_id,
                tenantId: "hospital-1", // Default tenant
                fullName: personalInfo.fullName || "",
                phone: resolvePhone(),
                email: contactInfo.email,
                dateOfBirth: personalInfo.dateOfBirth
                    ? new Date(personalInfo.dateOfBirth)
                    : undefined,
                gender: personalInfo.gender,
                nationalId: personalInfo.nationalId,
                insuranceNumber: medicalInfo.insuranceNumber,
                insuranceType: medicalInfo.insuranceType,
                address: contactInfo.address,
            };
        }
        catch (error) {
            console.error(`[PatientReadModelRepo] Fallback error:`, error);
            return null;
        }
    }
    /**
     * Find multiple patients by IDs
     */
    async findByIds(patientIds) {
        if (patientIds.length === 0)
            return [];
        const { data, error } = await this.schemaClient
            .from(this.table)
            .select("*")
            .in("patient_id", patientIds);
        if (error) {
            throw new Error(`Failed to fetch patients read model: ${error.message}`);
        }
        return (data || []).map(this.mapToModel);
    }
    /**
     * Find patients by tenant
     */
    async findByTenant(tenantId, limit = 100) {
        const { data, error } = await this.schemaClient
            .from(this.table)
            .select("*")
            .eq("tenant_id", tenantId)
            .order("full_name", { ascending: true })
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
        const { data, error } = await this.schemaClient
            .from(this.table)
            .select("*")
            .eq("tenant_id", tenantId)
            .or(`full_name.ilike.${searchPattern},phone.ilike.${searchPattern},email.ilike.${searchPattern}`)
            .order("full_name", { ascending: true })
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
        const { error } = await this.schemaClient
            .from(this.table)
            .delete()
            .eq("patient_id", patientId);
        if (error) {
            throw new Error(`Failed to delete patient read model: ${error.message}`);
        }
        console.debug(`[PatientReadModelRepo] ✓ Deleted patient ${patientId}`);
    }
    /**
     * Get sync statistics
     */
    async getSyncStats() {
        const { data, error } = await this.schemaClient
            .from(this.table)
            .select("synced_at");
        if (error) {
            throw new Error(`Failed to get sync stats: ${error.message}`);
        }
        if (!data || data.length === 0) {
            return {
                totalPatients: 0,
                lastSyncedAt: null,
                oldestSyncedAt: null,
                syncLagSeconds: null,
            };
        }
        const syncTimes = data.map((row) => new Date(row.synced_at).getTime());
        const lastSyncedAt = new Date(Math.max(...syncTimes));
        const oldestSyncedAt = new Date(Math.min(...syncTimes));
        const syncLagSeconds = (Date.now() - lastSyncedAt.getTime()) / 1000;
        return {
            totalPatients: data.length,
            lastSyncedAt,
            oldestSyncedAt,
            syncLagSeconds,
        };
    }
    /**
     * Check if patient exists
     */
    async exists(patientId) {
        const { data, error } = await this.schemaClient
            .from(this.table)
            .select("patient_id")
            .eq("patient_id", patientId)
            .maybeSingle();
        if (error && error.code !== "PGRST116") {
            throw new Error(`Failed to check patient existence: ${error.message}`);
        }
        return data !== null;
    }
    shouldHydrateFromFallback(patient) {
        if (!patient) {
            return true;
        }
        const fullName = patient.fullName?.trim();
        if (!fullName || fullName.toLowerCase() === "unknown") {
            return true;
        }
        if (!patient.phone &&
            !patient.email &&
            !patient.dateOfBirth &&
            !patient.nationalId) {
            return true;
        }
        return false;
    }
    mergePatientProfiles(fallback, incoming) {
        const pickValue = (current, fallbackValue) => {
            if (!current)
                return fallbackValue;
            if (typeof current === "string" &&
                current.trim().toLowerCase() === "unknown" &&
                fallbackValue) {
                return fallbackValue;
            }
            return current;
        };
        return {
            patientId: incoming.patientId || fallback.patientId,
            tenantId: incoming.tenantId || fallback.tenantId,
            fullName: pickValue(incoming.fullName, fallback.fullName) || "",
            phone: incoming.phone ?? fallback.phone,
            email: incoming.email ?? fallback.email,
            dateOfBirth: incoming.dateOfBirth ?? fallback.dateOfBirth,
            gender: incoming.gender ?? fallback.gender,
            nationalId: incoming.nationalId ?? fallback.nationalId,
            insuranceNumber: incoming.insuranceNumber ?? fallback.insuranceNumber,
            insuranceType: incoming.insuranceType ?? fallback.insuranceType,
            address: incoming.address ?? fallback.address,
            syncedAt: incoming.syncedAt ?? fallback.syncedAt,
            createdAt: incoming.createdAt ?? fallback.createdAt,
            updatedAt: incoming.updatedAt ?? fallback.updatedAt,
        };
    }
    /**
     * Count patients by tenant
     */
    async countByTenant(tenantId) {
        const { count, error } = await this.schemaClient
            .from(this.table)
            .select("patient_id", { count: "exact", head: true })
            .eq("tenant_id", tenantId);
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
            updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        };
    }
}
exports.PatientReadModelRepository = PatientReadModelRepository;
//# sourceMappingURL=PatientReadModelRepository.js.map