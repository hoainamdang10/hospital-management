/**
 * Patient Read Model Repository
 * Maintains denormalized patient data for appointments service
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance CQRS, Event-Driven Architecture, Eventual Consistency
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

export interface PatientReadModel {
  patientId: string;
  tenantId: string;
  fullName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: string;
  nationalId?: string;
  insuranceNumber?: string;
  insuranceType?: string;
  address?: any;
  syncedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Patient Read Model Repository
 * Query-side repository for patient data (CQRS pattern)
 */
export class PatientReadModelRepository {
  private supabase: SupabaseClient;
  private schemaClient: ReturnType<SupabaseClient["schema"]>;
  private readonly table = "patient_read_model";
  private readonly schema = "appointments_schema";
  private readonly fallbackSchema = "patient_schema";
  private readonly fallbackTable = "patients";

  constructor(supabaseUrl: string, supabaseKey: string) {
    // Create client without schema restriction for fallback queries
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { "X-Client-Info": "appointments-patient-read" } },
    });
    this.schemaClient = this.supabase.schema(this.schema);
  }

  /**
   * Upsert patient read model (idempotent)
   */
  async upsert(patient: PatientReadModel): Promise<void> {
    const nowIso = new Date().toISOString();
    const { error } = await this.schemaClient.from(this.table).upsert(
      {
        patient_id: patient.patientId,
        tenant_id: patient.tenantId,
        full_name: patient.fullName,
        phone: patient.phone || null,
        email: patient.email || null,
        date_of_birth: patient.dateOfBirth?.toISOString().split("T")[0] || null,
        gender: patient.gender || null,
        national_id: patient.nationalId || null,
        insurance_number: patient.insuranceNumber || null,
        insurance_type: patient.insuranceType || null,
        address: patient.address || null,
        synced_at: nowIso,
        updated_at: nowIso,
      },
      {
        onConflict: "patient_id",
      },
    );

    if (error) {
      throw new Error(`Failed to upsert patient read model: ${error.message}`);
    }

    console.debug(
      `[PatientReadModelRepo] ✓ Upserted patient ${patient.patientId}`,
    );
  }

  /**
   * Find patient by ID
   * Falls back to patient_schema.patients if read model is empty
   */
  async findById(patientId: string): Promise<PatientReadModel | null> {
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
      return this.mapToModel(data);
    }

    // Fallback to patient_schema.patients
    console.debug(
      `[PatientReadModelRepo] Patient ${patientId} not found in read model, trying fallback`,
    );
    const fallback = await this.findByIdFallback(patientId);
    if (fallback) {
      try {
        await this.upsert(fallback);
      } catch (error) {
        console.error(
          "[PatientReadModelRepo] Failed to upsert fallback patient",
          {
            patientId,
            error,
          },
        );
      }
    }
    return fallback;
  }

  /**
   * Fallback: Query patient_schema.patients directly
   */
  private async findByIdFallback(
    patientId: string,
  ): Promise<PatientReadModel | null> {
    try {
      const { data, error } = await this.supabase
        .schema(this.fallbackSchema)
        .from(this.fallbackTable)
        .select("patient_id, personal_info, contact_info, basic_medical_info")
        .eq("patient_id", patientId)
        .maybeSingle();

      if (error) {
        console.error(
          `[PatientReadModelRepo] Fallback query failed: ${error.message}`,
        );
        return null;
      }

      if (!data) {
        console.debug(
          `[PatientReadModelRepo] Patient ${patientId} not found in fallback`,
        );
        return null;
      }

      // Map JSONB fields to PatientReadModel
      const personalInfo = data.personal_info || {};
      const contactInfo = data.contact_info || {};
      const medicalInfo = data.basic_medical_info || {};
      const resolvePhone = (): string | undefined => {
        return (
          contactInfo.primaryPhone ||
          contactInfo.primary_phone ||
          contactInfo.phone ||
          contactInfo.phoneNumber ||
          contactInfo.phone_number ||
          undefined
        );
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
    } catch (error) {
      console.error(`[PatientReadModelRepo] Fallback error:`, error);
      return null;
    }
  }

  /**
   * Find multiple patients by IDs
   */
  async findByIds(patientIds: string[]): Promise<PatientReadModel[]> {
    if (patientIds.length === 0) return [];

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
  async findByTenant(
    tenantId: string,
    limit = 100,
  ): Promise<PatientReadModel[]> {
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
  async search(
    query: string,
    tenantId: string,
    limit = 20,
  ): Promise<PatientReadModel[]> {
    const searchPattern = `%${query}%`;

    const { data, error } = await this.schemaClient
      .from(this.table)
      .select("*")
      .eq("tenant_id", tenantId)
      .or(
        `full_name.ilike.${searchPattern},phone.ilike.${searchPattern},email.ilike.${searchPattern}`,
      )
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
  async delete(patientId: string): Promise<void> {
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
  async getSyncStats(): Promise<{
    totalPatients: number;
    lastSyncedAt: Date | null;
    oldestSyncedAt: Date | null;
    syncLagSeconds: number | null;
  }> {
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
  async exists(patientId: string): Promise<boolean> {
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

  /**
   * Count patients by tenant
   */
  async countByTenant(tenantId: string): Promise<number> {
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
  private mapToModel(row: any): PatientReadModel {
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
