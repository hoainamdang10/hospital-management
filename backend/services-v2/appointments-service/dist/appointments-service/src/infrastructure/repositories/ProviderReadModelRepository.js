"use strict";
/**
 * Provider Read Model Repository
 * Maintains denormalized provider/staff data for appointments service
 *
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance CQRS, Event-Driven Architecture, Eventual Consistency
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProviderReadModelRepository = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
/**
 * Provider Read Model Repository
 * Query-side repository for provider/staff data (CQRS pattern)
 */
class ProviderReadModelRepository {
    constructor(supabaseUrl, supabaseKey) {
        this.table = "provider_read_model";
        this.schema = "appointments_schema";
        this.fallbackSchema = "provider_schema";
        this.fallbackTable = "staff_profiles";
        // Create client without schema restriction for fallback queries
        this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false },
            global: { headers: { "X-Client-Info": "appointments-provider-read" } },
        });
    }
    /**
     * Upsert provider read model (idempotent)
     */
    async upsert(provider) {
        const { error } = await this.supabase.from(this.table).upsert({
            provider_id: provider.providerId,
            tenant_id: provider.tenantId,
            full_name: provider.fullName,
            specialization: provider.specialization || null,
            department: provider.department || null,
            license_number: provider.licenseNumber || null,
            phone: provider.phone || null,
            email: provider.email || null,
            is_active: provider.isActive,
            synced_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }, {
            onConflict: "provider_id",
        });
        if (error) {
            throw new Error(`Failed to upsert provider read model: ${error.message}`);
        }
        console.debug(`[ProviderReadModelRepo] ✓ Upserted provider ${provider.providerId}`);
    }
    /**
     * Find provider by ID
     * Falls back to provider_schema.staff_profiles if read model is empty
     */
    async findById(providerId) {
        // Try read model first
        const { data, error } = await this.supabase
            .schema(this.schema)
            .from(this.table)
            .select("*")
            .eq("provider_id", providerId)
            .maybeSingle();
        if (error && error.code !== "PGRST116" && error.code !== "42P01") {
            throw new Error(`Failed to fetch provider read model: ${error.message}`);
        }
        if (data) {
            return this.mapToModel(data);
        }
        // Fallback to provider_schema.staff_profiles
        console.debug(`[ProviderReadModelRepo] Provider ${providerId} not found in read model, trying fallback`);
        return await this.findByIdFallback(providerId);
    }
    /**
     * Fallback: Query provider_schema.staff_profiles directly
     */
    async findByIdFallback(providerId) {
        try {
            const { data, error } = await this.supabase
                .schema(this.fallbackSchema)
                .from(this.fallbackTable)
                // Schema không còn contact_info, phone/email nằm trong personal_info
                .select("staff_id, personal_info, professional_info, status")
                .eq("staff_id", providerId)
                .maybeSingle();
            if (error) {
                console.error(`[ProviderReadModelRepo] Fallback query failed: ${error.message}`);
                return null;
            }
            if (!data) {
                console.debug(`[ProviderReadModelRepo] Provider ${providerId} not found in fallback`);
                return null;
            }
            // Map JSONB fields to ProviderReadModel
            const personalInfo = data.personal_info || {};
            const professionalInfo = data.professional_info || {};
            return {
                providerId: data.staff_id,
                tenantId: "hospital-1", // Default tenant
                fullName: personalInfo.fullName || "",
                specialization: professionalInfo.specialization,
                department: professionalInfo.department,
                licenseNumber: professionalInfo.licenseNumber,
                phone: personalInfo.phoneNumber || personalInfo.phone,
                email: personalInfo.email,
                isActive: data.status === "ACTIVE",
            };
        }
        catch (error) {
            console.error(`[ProviderReadModelRepo] Fallback error:`, error);
            return null;
        }
    }
    /**
     * Find multiple providers by IDs
     */
    async findByIds(providerIds) {
        if (providerIds.length === 0)
            return [];
        const { data, error } = await this.supabase
            .from(this.table)
            .select("*")
            .in("provider_id", providerIds);
        if (error) {
            throw new Error(`Failed to fetch providers read model: ${error.message}`);
        }
        return (data || []).map(this.mapToModel);
    }
    /**
     * Find providers by tenant
     */
    async findByTenant(tenantId, limit = 100) {
        const { data, error } = await this.supabase
            .from(this.table)
            .select("*")
            .eq("tenant_id", tenantId)
            .order("full_name", { ascending: true })
            .limit(limit);
        if (error) {
            throw new Error(`Failed to fetch providers by tenant: ${error.message}`);
        }
        return (data || []).map(this.mapToModel);
    }
    /**
     * Find active providers by specialization
     */
    async findBySpecialization(specialization, tenantId, limit = 50) {
        const { data, error } = await this.supabase
            .from(this.table)
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("specialization", specialization)
            .eq("is_active", true)
            .order("full_name", { ascending: true })
            .limit(limit);
        if (error) {
            throw new Error(`Failed to fetch providers by specialization: ${error.message}`);
        }
        return (data || []).map(this.mapToModel);
    }
    /**
     * Find active providers by department
     */
    async findByDepartment(department, tenantId, limit = 50) {
        const { data, error } = await this.supabase
            .from(this.table)
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("department", department)
            .eq("is_active", true)
            .order("full_name", { ascending: true })
            .limit(limit);
        if (error) {
            throw new Error(`Failed to fetch providers by department: ${error.message}`);
        }
        return (data || []).map(this.mapToModel);
    }
    /**
     * Search providers by name/email/license
     */
    async search(query, tenantId, limit = 20) {
        const searchPattern = `%${query}%`;
        const { data, error } = await this.supabase
            .from(this.table)
            .select("*")
            .eq("tenant_id", tenantId)
            .or(`full_name.ilike.${searchPattern},email.ilike.${searchPattern},license_number.ilike.${searchPattern}`)
            .order("full_name", { ascending: true })
            .limit(limit);
        if (error) {
            throw new Error(`Failed to search providers: ${error.message}`);
        }
        return (data || []).map(this.mapToModel);
    }
    /**
     * Find all active providers
     */
    async findActive(tenantId, limit = 100) {
        const { data, error } = await this.supabase
            .from(this.table)
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("is_active", true)
            .order("full_name", { ascending: true })
            .limit(limit);
        if (error) {
            throw new Error(`Failed to fetch active providers: ${error.message}`);
        }
        return (data || []).map(this.mapToModel);
    }
    /**
     * Delete provider read model
     */
    async delete(providerId) {
        const { error } = await this.supabase
            .from(this.table)
            .delete()
            .eq("provider_id", providerId);
        if (error) {
            throw new Error(`Failed to delete provider read model: ${error.message}`);
        }
        console.debug(`[ProviderReadModelRepo] ✓ Deleted provider ${providerId}`);
    }
    /**
     * Get sync statistics
     */
    async getSyncStats() {
        const { data, error } = await this.supabase
            .from(this.table)
            .select("is_active, synced_at");
        if (error) {
            throw new Error(`Failed to get sync stats: ${error.message}`);
        }
        if (!data || data.length === 0) {
            return {
                totalProviders: 0,
                activeProviders: 0,
                lastSyncedAt: null,
                oldestSyncedAt: null,
                syncLagSeconds: null,
            };
        }
        const syncTimes = data.map((row) => new Date(row.synced_at).getTime());
        const lastSyncedAt = new Date(Math.max(...syncTimes));
        const oldestSyncedAt = new Date(Math.min(...syncTimes));
        const syncLagSeconds = (Date.now() - lastSyncedAt.getTime()) / 1000;
        const activeProviders = data.filter((row) => row.is_active).length;
        return {
            totalProviders: data.length,
            activeProviders,
            lastSyncedAt,
            oldestSyncedAt,
            syncLagSeconds,
        };
    }
    /**
     * Check if provider exists
     */
    async exists(providerId) {
        const { data, error } = await this.supabase
            .from(this.table)
            .select("provider_id")
            .eq("provider_id", providerId)
            .maybeSingle();
        if (error && error.code !== "PGRST116") {
            throw new Error(`Failed to check provider existence: ${error.message}`);
        }
        return data !== null;
    }
    /**
     * Count providers by tenant
     */
    async countByTenant(tenantId) {
        const { count, error } = await this.supabase
            .from(this.table)
            .select("provider_id", { count: "exact", head: true })
            .eq("tenant_id", tenantId);
        if (error) {
            throw new Error(`Failed to count providers: ${error.message}`);
        }
        return count || 0;
    }
    /**
     * Map database row to domain model
     */
    mapToModel(row) {
        return {
            providerId: row.provider_id,
            tenantId: row.tenant_id,
            fullName: row.full_name,
            specialization: row.specialization || undefined,
            department: row.department || undefined,
            licenseNumber: row.license_number || undefined,
            phone: row.phone || undefined,
            email: row.email || undefined,
            isActive: row.is_active,
            syncedAt: row.synced_at ? new Date(row.synced_at) : undefined,
            createdAt: row.created_at ? new Date(row.created_at) : undefined,
            updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
        };
    }
}
exports.ProviderReadModelRepository = ProviderReadModelRepository;
//# sourceMappingURL=ProviderReadModelRepository.js.map