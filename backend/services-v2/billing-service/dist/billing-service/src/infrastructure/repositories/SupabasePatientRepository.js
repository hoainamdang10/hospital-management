"use strict";
/**
 * SupabasePatientRepository - Patient repository implementation for Billing Service
 * Provides patient data access for billing operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabasePatientRepository = void 0;
exports.createSupabasePatientRepository = createSupabasePatientRepository;
/**
 * SupabasePatientRepository - Implementation for Supabase database
 */
class SupabasePatientRepository {
    constructor(supabase, loggerInstance) {
        this.supabase = supabase;
        this.loggerInstance = loggerInstance;
        this.schemaName = "patient_schema";
        this.tableName = "patients";
    }
    /**
     * Find patient by ID
     */
    async findById(id) {
        try {
            this.loggerInstance.debug("Finding patient by ID", { patientId: id });
            const { column, value } = this.resolvePatientIdentifier(id);
            const { data, error } = await this.fromTable()
                .select("*")
                .eq(column, value)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    // No rows returned
                    return null;
                }
                throw error;
            }
            if (!data) {
                return null;
            }
            const insuranceInfo = await this.fetchInsuranceInfo(data.patient_id || data.id);
            return this.mapToPatient(data, insuranceInfo);
        }
        catch (error) {
            this.loggerInstance.error("Failed to find patient by ID", {
                patientId: id,
                error: error instanceof Error ? error.message : "Unknown error",
                rawError: error,
            });
            throw error;
        }
    }
    /**
     * Find patient by user ID
     */
    async findByUserId(userId) {
        try {
            this.loggerInstance.debug("Finding patient by user ID", { userId });
            const { data, error } = await this.fromTable()
                .select("*")
                .eq("user_id", userId)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    // No rows returned
                    return null;
                }
                throw error;
            }
            if (!data) {
                return null;
            }
            const insuranceInfo = await this.fetchInsuranceInfo(data.patient_id || data.id);
            return this.mapToPatient(data, insuranceInfo);
        }
        catch (error) {
            this.loggerInstance.error("Failed to find patient by user ID", {
                userId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Find patient by national ID
     */
    async findByNationalId(nationalId) {
        try {
            this.loggerInstance.debug("Finding patient by national ID", {
                nationalId,
            });
            const { data, error } = await this.fromTable()
                .select("*")
                .eq("national_id", nationalId)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    // No rows returned
                    return null;
                }
                throw error;
            }
            if (!data) {
                return null;
            }
            const insuranceInfo = await this.fetchInsuranceInfo(data.patient_id || data.id);
            return this.mapToPatient(data, insuranceInfo);
        }
        catch (error) {
            this.loggerInstance.error("Failed to find patient by national ID", {
                nationalId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Check if patient exists
     */
    async exists(id) {
        try {
            this.loggerInstance.debug("Checking if patient exists", {
                patientId: id,
            });
            const { column, value } = this.resolvePatientIdentifier(id);
            const { data, error } = await this.fromTable()
                .select("id")
                .eq(column, value)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    return false;
                }
                throw error;
            }
            return data !== null;
        }
        catch (error) {
            this.loggerInstance.error("Failed to check patient existence", {
                patientId: id,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Get patient insurance information
     */
    async getInsuranceInfo(patientId) {
        try {
            this.loggerInstance.debug("Getting patient insurance info", {
                patientId,
            });
            const insuranceInfo = await this.fetchInsuranceInfo(patientId);
            return insuranceInfo;
        }
        catch (error) {
            this.loggerInstance.error("Failed to get patient insurance info", {
                patientId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Update patient insurance information
     */
    async updateInsuranceInfo(patientId, insuranceInfo) {
        try {
            this.loggerInstance.debug("Updating patient insurance info", {
                patientId,
            });
            const { column, value } = this.resolvePatientIdentifier(patientId);
            const { error } = await this.fromTable()
                .update({
                insurance_info: insuranceInfo,
                updated_at: new Date().toISOString(),
            })
                .eq(column, value);
            if (error) {
                throw error;
            }
            this.loggerInstance.info("Patient insurance info updated", { patientId });
        }
        catch (error) {
            this.loggerInstance.error("Failed to update patient insurance info", {
                patientId,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Map database record to Patient entity
     */
    mapToPatient(data, insuranceInfo) {
        const personalInfo = data.personal_info || {};
        const contactInfo = data.contact_info || {};
        const firstName = personalInfo.firstName ||
            personalInfo.first_name ||
            personalInfo.givenName ||
            "";
        const lastName = personalInfo.lastName ||
            personalInfo.last_name ||
            personalInfo.familyName ||
            "";
        const fullNameRaw = data.full_name ||
            personalInfo.fullName ||
            personalInfo.full_name ||
            `${firstName} ${lastName}`.trim();
        const fullName = (fullNameRaw && fullNameRaw.trim()) || "Khách vãng lai";
        const dateOfBirthRaw = personalInfo.dateOfBirth ||
            personalInfo.date_of_birth ||
            data.date_of_birth;
        const dateOfBirth = dateOfBirthRaw ? new Date(dateOfBirthRaw) : new Date();
        const genderRaw = personalInfo.gender || data.gender || "other";
        const normalizedGender = genderRaw === "male" || genderRaw === "female" ? genderRaw : "other";
        const nationalId = personalInfo.nationalId ||
            personalInfo.national_id ||
            data.national_id ||
            "";
        const primaryPhone = contactInfo.primaryPhone ||
            contactInfo.primary_phone ||
            contactInfo.phone ||
            data.phone;
        const email = contactInfo.email ||
            contactInfo.primaryEmail ||
            contactInfo.contactEmail ||
            data.email;
        const addressObject = contactInfo.address;
        const address = typeof addressObject === "string"
            ? addressObject
            : addressObject
                ? [
                    addressObject.street,
                    addressObject.ward,
                    addressObject.district,
                    addressObject.city ||
                        addressObject.province ||
                        addressObject.state,
                    addressObject.country,
                ]
                    .filter(Boolean)
                    .join(", ")
                : data.address;
        const status = (data.status || "").toLowerCase();
        const isActive = typeof data.is_active === "boolean"
            ? data.is_active
            : status
                ? status !== "inactive" && status !== "archived"
                : true;
        return {
            id: data.id,
            userId: data.user_id,
            fullName,
            dateOfBirth,
            gender: normalizedGender,
            nationalId,
            phone: primaryPhone,
            email,
            address,
            insuranceInfo: this.mergeInsuranceInfo(data.insurance_info, insuranceInfo),
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
            isActive,
        };
    }
    /**
     * Fetch primary & active insurance info for patient
     */
    async fetchInsuranceInfo(patientId) {
        if (!patientId) {
            return null;
        }
        const { data, error } = await this.supabase
            .getRawClient()
            .schema(this.schemaName)
            .from("insurance_info")
            .select("*")
            .eq("patient_id", patientId)
            .eq("is_primary", true)
            .eq("is_active", true)
            .single();
        if (error) {
            if (error.code === "PGRST116") {
                // no active insurance
                return null;
            }
            this.loggerInstance.warn("Failed to fetch insurance info", {
                patientId,
                error: error.message,
            });
            return null;
        }
        return data;
    }
    /**
     * Merge insurance info from patients table and insurance_info table
     * - Preserve rich coverage object from patients.insurance_info if present
     * - Normalize snake_case fields from insurance_info table to camelCase
     */
    mergeInsuranceInfo(patientInsurance, fetchedInsurance) {
        const normalizedFetched = fetchedInsurance
            ? {
                ...fetchedInsurance,
                coverageType: fetchedInsurance.coverageType || fetchedInsurance.coverage_type,
                policyNumber: fetchedInsurance.policyNumber || fetchedInsurance.policy_number,
                providerName: fetchedInsurance.providerName || fetchedInsurance.provider,
                provider: fetchedInsurance.provider || fetchedInsurance.providerName,
                isActive: fetchedInsurance.isActive ?? fetchedInsurance.is_active,
            }
            : undefined;
        const normalizedPatient = patientInsurance
            ? {
                ...patientInsurance,
                coverageType: patientInsurance.coverageType || patientInsurance.coverage_type,
                providerName: patientInsurance.providerName || patientInsurance.provider,
                provider: patientInsurance.provider || patientInsurance.providerName,
            }
            : undefined;
        const merged = {
            ...(normalizedPatient || {}),
            ...(normalizedFetched || {}),
        };
        return Object.keys(merged).length > 0 ? merged : undefined;
    }
    /**
     * Determine whether provided identifier is UUID or patient_code (PAT-YYYYMM-XXX)
     */
    resolvePatientIdentifier(id) {
        if (!id) {
            return { column: "id", value: id };
        }
        if (this.isUUID(id)) {
            return { column: "id", value: id };
        }
        // Fallback to patient_id (human readable code)
        return { column: "patient_id", value: id };
    }
    isUUID(value) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(value);
    }
    fromTable() {
        return this.supabase
            .getRawClient()
            .schema(this.schemaName)
            .from(this.tableName);
    }
}
exports.SupabasePatientRepository = SupabasePatientRepository;
// Default constructor for dependency injection
function createSupabasePatientRepository(supabase, loggerInstance) {
    return new SupabasePatientRepository(supabase, loggerInstance);
}
//# sourceMappingURL=SupabasePatientRepository.js.map