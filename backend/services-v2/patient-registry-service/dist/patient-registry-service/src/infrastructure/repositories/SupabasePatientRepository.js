"use strict";
/**
 * SupabasePatientRepository - Infrastructure Layer
 * Implements IPatientRepository with Supabase PostgreSQL
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabasePatientRepository = void 0;
const Patient_1 = require("../../domain/aggregates/Patient");
const PatientId_1 = require("../../domain/value-objects/PatientId");
const PatientMapper_1 = require("../mappers/PatientMapper");
const CircuitBreaker_1 = require("../resilience/CircuitBreaker");
/**
 * Supabase Patient Repository Implementation
 */
class SupabasePatientRepository {
    constructor(optimizedClient, logger, matchingService, eventPublisher, patientCache, outboxRepository) {
        this.logger = logger;
        this.matchingService = matchingService;
        this.eventPublisher = eventPublisher;
        this.patientCache = patientCache;
        this.outboxRepository = outboxRepository;
        this.circuitBreaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker("patient-repository");
        this.optimizedClient = optimizedClient;
        // Type cast needed due to duplicate @supabase/supabase-js in root and service node_modules
        this.supabaseClient = this.optimizedClient.getConnection();
    }
    /**
     * Find patient by ID
     */
    async findById(patientId) {
        // Try cache first (L1/L2)
        if (this.patientCache) {
            try {
                const cachedPatient = await this.patientCache.get(patientId);
                if (cachedPatient) {
                    if (typeof cachedPatient.isActive === "function") {
                        this.logger.debug("Patient found in cache", {
                            patientId: patientId.getValue(),
                        });
                        return cachedPatient;
                    }
                    this.logger.warn("Cached patient is stale, invalidating entry", {
                        patientId: patientId.getValue(),
                    });
                    await this.patientCache.invalidate(patientId);
                }
            }
            catch (cacheError) {
                this.logger.warn("Cache lookup failed, proceeding to database", {
                    patientId: patientId.getValue(),
                    error: cacheError instanceof Error ? cacheError.message : "Unknown error",
                });
            }
        }
        return await this.circuitBreaker.execute(async () => {
            const patientIdValue = patientId.getValue();
            // Fetch patient record
            const { data: patientData, error: patientError } = await this.supabaseClient
                .from("patients")
                .select("*")
                .eq("patient_id", patientIdValue)
                .single();
            if (patientError) {
                if (patientError.code === "PGRST116") {
                    return null; // Not found
                }
                throw new Error(`Failed to find patient: ${patientError.message}`);
            }
            // Fetch related data
            const [insuranceData, emergencyContactsData, consentsData, linksData] = await Promise.all([
                this.fetchInsurance(patientIdValue),
                this.fetchEmergencyContacts(patientIdValue),
                this.fetchConsents(patientIdValue),
                this.fetchLinks(patientIdValue),
            ]);
            // Map to domain
            const patient = PatientMapper_1.PatientMapper.toDomain(patientData, insuranceData, emergencyContactsData, consentsData, linksData);
            // Cache the result
            if (this.patientCache && patient) {
                try {
                    await this.patientCache.set(patientId, patient);
                }
                catch (cacheError) {
                    this.logger.warn("Failed to cache patient", {
                        patientId: patientId.getValue(),
                        error: cacheError instanceof Error
                            ? cacheError.message
                            : "Unknown error",
                    });
                }
            }
            return patient;
        }, async () => {
            this.logger.warn("Circuit breaker fallback for findById", {
                patientId: patientId.getValue(),
            });
            return null;
        });
    }
    /**
     * Find patient by user ID
     */
    async findByUserId(userId) {
        return await this.circuitBreaker.execute(async () => {
            const { data: patientData, error: patientError } = await this.supabaseClient
                .from("patients")
                .select("*")
                .eq("user_id", userId)
                .single();
            if (patientError) {
                if (patientError.code === "PGRST116") {
                    return null;
                }
                throw new Error(`Failed to find patient by user ID: ${patientError.message}`);
            }
            const patientIdValue = patientData.patient_id;
            const [insuranceData, emergencyContactsData, consentsData, linksData] = await Promise.all([
                this.fetchInsurance(patientIdValue),
                this.fetchEmergencyContacts(patientIdValue),
                this.fetchConsents(patientIdValue),
                this.fetchLinks(patientIdValue),
            ]);
            return PatientMapper_1.PatientMapper.toDomain(patientData, insuranceData, emergencyContactsData, consentsData, linksData);
        }, async () => {
            this.logger.warn("Circuit breaker fallback for findByUserId", {
                userId,
            });
            return null;
        });
    }
    /**
     * Find patient by national ID
     */
    async findByNationalId(nationalId) {
        return await this.circuitBreaker.execute(async () => {
            const { data: patientDataArray, error: patientError } = await this.supabaseClient
                .from("patients")
                .select("*")
                .eq("personal_info->>nationalId", nationalId)
                .order("created_at", { ascending: false })
                .limit(1);
            if (patientError) {
                throw new Error(`Failed to find patient by national ID: ${patientError.message}`);
            }
            if (!patientDataArray || patientDataArray.length === 0) {
                return null;
            }
            const patientData = patientDataArray[0];
            const patientIdValue = patientData.patient_id;
            const [insuranceData, emergencyContactsData, consentsData, linksData] = await Promise.all([
                this.fetchInsurance(patientIdValue),
                this.fetchEmergencyContacts(patientIdValue),
                this.fetchConsents(patientIdValue),
                this.fetchLinks(patientIdValue),
            ]);
            return PatientMapper_1.PatientMapper.toDomain(patientData, insuranceData, emergencyContactsData, consentsData, linksData);
        }, async () => {
            this.logger.warn("Circuit breaker fallback for findByNationalId", {
                nationalId,
            });
            return null;
        });
    }
    /**
     * Find patient by BHYT number
     */
    async findByBHYTNumber(bhytNumber) {
        return await this.circuitBreaker.execute(async () => {
            const { data: insuranceData, error: insuranceError } = await this.supabaseClient
                .from("insurance_info")
                .select("patient_id")
                .eq("bhyt_number", bhytNumber)
                .eq("is_active", true)
                .single();
            if (insuranceError) {
                if (insuranceError.code === "PGRST116") {
                    return null;
                }
                throw new Error(`Failed to find patient by BHYT number: ${insuranceError.message}`);
            }
            // Find patient by patient_id
            return await this.findById(PatientId_1.PatientId.fromString(insuranceData.patient_id));
        }, async () => {
            this.logger.warn("Circuit breaker fallback for findByBHYTNumber", {
                bhytNumber,
            });
            return null;
        });
    }
    /**
     * Create patient from user creation event
     * Auto-creates patient record when Identity Service creates a PATIENT user
     */
    async createFromUserEvent(userData) {
        return await this.circuitBreaker.execute(async () => {
            this.logger.info('Creating patient from user event', {
                userId: userData.userId,
                email: userData.email,
                fullName: userData.fullName
            });
            // Import required value objects
            const PersonalInfo = (await Promise.resolve().then(() => __importStar(require('../../domain/value-objects/PersonalInfo')))).PersonalInfo;
            const ContactInfo = (await Promise.resolve().then(() => __importStar(require('../../domain/value-objects/ContactInfo')))).ContactInfo;
            const BasicMedicalInfo = (await Promise.resolve().then(() => __importStar(require('../../domain/value-objects/BasicMedicalInfo')))).BasicMedicalInfo;
            // Create patient using Patient aggregate factory method
            const patient = Patient_1.Patient.register(userData.userId, PersonalInfo.create({
                fullName: userData.fullName,
                dateOfBirth: userData.dateOfBirth || new Date('2000-01-01'),
                gender: userData.gender || 'other',
                nationalId: userData.citizenId || 'UNKNOWN',
                nationality: 'VN',
                ethnicity: undefined,
                occupation: undefined,
                maritalStatus: undefined
            }), ContactInfo.create({
                primaryPhone: userData.phoneNumber || '0000000000',
                email: userData.email,
                address: {
                    street: userData.address || '',
                    ward: '',
                    district: '',
                    city: '',
                    province: '',
                    postalCode: undefined,
                    country: 'Vietnam'
                },
                preferredContactMethod: 'email'
            }), BasicMedicalInfo.create({
                bloodType: undefined,
                knownAllergies: []
            }), undefined, // insuranceInfo
            [], // emergencyContacts
            'system' // createdBy - auto-created from Identity Service event
            );
            // Save patient to database
            await this.save(patient);
            this.logger.info('Patient created successfully from user event', {
                userId: userData.userId,
                patientId: patient.getPatientId()
            });
            return patient;
        });
    }
    /**
     * Save patient (create or update)
     * ✅ FIX TRANSACTION SUPPORT: Use PostgreSQL function for atomic operations
     */
    async save(patient) {
        return await this.circuitBreaker.execute(async () => {
            const { patientRecord, insuranceRecord, emergencyContactRecords, consentRecords, linkRecords, } = PatientMapper_1.PatientMapper.toPersistence(patient);
            const patientIdValue = patient.getPatientId();
            if (!patientIdValue) {
                throw new Error("Patient ID is required");
            }
            this.logger.info("Persisting patient record", {
                patientId: patientIdValue,
                userId: patientRecord.user_id,
            });
            // ✅ Use PostgreSQL function for transaction support
            const { data, error } = await this.supabaseClient.rpc("save_patient_transaction", {
                p_patient_data: patientRecord,
                p_insurance_data: insuranceRecord || null,
                p_contacts_data: emergencyContactRecords || [],
                p_consents_data: consentRecords || [],
                p_links_data: linkRecords || [],
            });
            if (error) {
                if (this.shouldUseDirectPersistence(error)) {
                    await this.savePatientFallback(patientRecord, insuranceRecord, emergencyContactRecords, consentRecords, linkRecords);
                    this.logger.warn("save_patient_transaction RPC failed, used fallback persistence", {
                        patientId: patientIdValue,
                        error: error.message,
                    });
                }
                else {
                    throw new Error(`Failed to save patient: ${error.message}`);
                }
            }
            else {
                this.logger.info("Patient saved successfully (transaction)", {
                    patientId: patientIdValue,
                    result: data,
                });
            }
            if (this.patientCache) {
                try {
                    await this.patientCache.invalidate(patient.getPatientIdObject());
                }
                catch (cacheError) {
                    this.logger.warn("Patient cache invalidation failed after save", {
                        patientId: patientIdValue,
                        error: cacheError instanceof Error
                            ? cacheError.message
                            : "Unknown error",
                    });
                }
            }
            // Publish domain events
            await this.publishDomainEvents(patient);
        });
    }
    shouldUseDirectPersistence(error) {
        if (!error?.message) {
            return false;
        }
        const normalized = error.message.toLowerCase();
        return (normalized.includes("contact_id") ||
            normalized.includes("save_patient_transaction"));
    }
    async savePatientFallback(patientRecord, insuranceRecord, emergencyContactRecords, consentRecords, linkRecords) {
        const schemaClient = this.supabaseClient.schema("patient_schema");
        const patientResult = await schemaClient
            .from("patients")
            .upsert(patientRecord, { onConflict: "patient_id" });
        if (patientResult.error) {
            throw new Error(`Fallback save failed (patients): ${patientResult.error.message}`);
        }
        const profileRecord = {
            id: patientRecord.id,
            patient_id: patientRecord.patient_id,
            user_id: patientRecord.user_id,
            full_name: patientRecord.personal_info?.fullName,
            date_of_birth: patientRecord.personal_info?.dateOfBirth,
            gender: patientRecord.personal_info?.gender,
            national_id: patientRecord.personal_info?.nationalId,
            nationality: patientRecord.personal_info?.nationality,
            ethnicity: patientRecord.personal_info?.ethnicity,
            occupation: patientRecord.personal_info?.occupation,
            marital_status: patientRecord.personal_info?.maritalStatus,
            primary_phone: patientRecord.contact_info?.primaryPhone,
            secondary_phone: patientRecord.contact_info?.secondaryPhone,
            email: patientRecord.contact_info?.email,
            preferred_contact_method: patientRecord.contact_info?.preferredContactMethod,
            street: patientRecord.contact_info?.address?.street,
            ward: patientRecord.contact_info?.address?.ward,
            district: patientRecord.contact_info?.address?.district,
            city: patientRecord.contact_info?.address?.city,
            province: patientRecord.contact_info?.address?.province,
            postal_code: patientRecord.contact_info?.address?.postalCode || null,
            country: patientRecord.contact_info?.address?.country,
            blood_type: patientRecord.basic_medical_info?.bloodType,
            known_allergies: patientRecord.basic_medical_info?.knownAllergies || [],
            emergency_medical_info: patientRecord.basic_medical_info?.emergencyMedicalInfo || null,
            status: patientRecord.status,
            merged_into_patient_id: patientRecord.merged_into,
            created_at: patientRecord.created_at,
            updated_at: patientRecord.updated_at,
            created_by: patientRecord.created_by,
            updated_by: patientRecord.updated_by,
        };
        const profileResult = await schemaClient
            .from("patient_profiles")
            .upsert(profileRecord, { onConflict: "patient_id" });
        if (profileResult.error) {
            throw new Error(`Fallback save failed (patient_profiles): ${profileResult.error.message}`);
        }
        if (insuranceRecord) {
            const insuranceResult = await schemaClient
                .from("insurance_info")
                .upsert(insuranceRecord, { onConflict: "id" });
            if (insuranceResult.error) {
                throw new Error(`Fallback save failed (insurance_info): ${insuranceResult.error.message}`);
            }
        }
        if (emergencyContactRecords.length > 0) {
            const contactsResult = await schemaClient
                .from("emergency_contacts")
                .upsert(emergencyContactRecords, { onConflict: "id" });
            if (contactsResult.error) {
                throw new Error(`Fallback save failed (emergency_contacts): ${contactsResult.error.message}`);
            }
        }
        if (consentRecords.length > 0) {
            const consentsResult = await schemaClient
                .from("patient_consents")
                .upsert(consentRecords, { onConflict: "id" });
            if (consentsResult.error) {
                throw new Error(`Fallback save failed (patient_consents): ${consentsResult.error.message}`);
            }
        }
        if (linkRecords.length > 0) {
            const linksResult = await schemaClient
                .from("patient_links")
                .upsert(linkRecords, { onConflict: "id" });
            if (linksResult.error) {
                throw new Error(`Fallback save failed (patient_links): ${linksResult.error.message}`);
            }
        }
    }
    /**
     * Delete patient (soft delete)
     */
    async delete(patientId) {
        return await this.circuitBreaker.execute(async () => {
            const { error } = await this.supabaseClient
                .from("patients")
                .update({ status: "inactive", updated_at: new Date().toISOString() })
                .eq("patient_id", patientId.getValue());
            if (error) {
                throw new Error(`Failed to delete patient: ${error.message}`);
            }
            this.logger.info("Patient deleted (soft)", {
                patientId: patientId.getValue(),
            });
        });
    }
    /**
     * Find patients with filters
     */
    async findWithFilters(filters, pagination) {
        return await this.circuitBreaker.execute(async () => {
            try {
                let query = this.supabaseClient
                    .from("patients")
                    .select("*", { count: "exact" });
                // Apply filters
                if (filters.isActive !== undefined) {
                    query = query.eq("status", filters.isActive ? "active" : "inactive");
                }
                if (filters.registrationDateFrom) {
                    query = query.gte("created_at", filters.registrationDateFrom);
                }
                if (filters.registrationDateTo) {
                    query = query.lte("created_at", filters.registrationDateTo);
                }
                if (filters.city) {
                    query = query.eq("contact_info->address->>city", filters.city);
                }
                if (filters.province) {
                    query = query.eq("contact_info->address->>province", filters.province);
                }
                if (filters.hasInsurance !== undefined) {
                    const insuredPatientIds = await this.getActiveInsurancePatientIds();
                    if (filters.hasInsurance) {
                        if (insuredPatientIds.length === 0) {
                            return { patients: [], total: 0 };
                        }
                        query = query.in("patient_id", insuredPatientIds);
                    }
                    else if (insuredPatientIds.length > 0) {
                        query = query.not("patient_id", "in", this.buildInClause(insuredPatientIds));
                    }
                }
                // Apply pagination
                if (pagination) {
                    const offset = (pagination.page - 1) * pagination.limit;
                    query = query.range(offset, offset + pagination.limit - 1);
                    if (pagination.sorting) {
                        query = query.order(pagination.sorting.field, {
                            ascending: pagination.sorting.direction === "asc",
                        });
                    }
                }
                const { data, error, count } = await query;
                if (error) {
                    this.logger.error("[PatientRepository] findWithFilters query failed", {
                        error: error.message,
                        details: error?.details,
                        hint: error?.hint,
                        code: error?.code,
                    });
                    throw new Error(`Failed to find patients with filters: ${error.message}`);
                }
                // ✅ FIX N+1 PROBLEM: Batch fetch all related data
                const patientIds = (data || []).map((record) => record.patient_id);
                const [insuranceMap, contactsMap, consentsMap, linksMap] = await Promise.all([
                    this.fetchInsuranceBatch(patientIds),
                    this.fetchEmergencyContactsBatch(patientIds),
                    this.fetchConsentsBatch(patientIds),
                    this.fetchLinksBatch(patientIds),
                ]);
                // Map to domain with pre-fetched data
                const patients = (data || []).map((record) => {
                    const patientId = record.patient_id;
                    return PatientMapper_1.PatientMapper.toDomain(record, insuranceMap.get(patientId) || null, contactsMap.get(patientId) || [], consentsMap.get(patientId) || [], linksMap.get(patientId) || []);
                });
                return {
                    patients,
                    total: count || 0,
                };
            }
            catch (error) {
                this.logger.error("[PatientRepository] findWithFilters execution failed", {
                    error: error instanceof Error ? error.message : "Unknown error",
                });
                throw error;
            }
        }, async () => {
            this.logger.warn("Circuit breaker fallback for findWithFilters");
            return { patients: [], total: 0 };
        });
    }
    /**
     * Search patients by term
     */
    async searchPatients(searchTerm, filters, pagination) {
        return await this.circuitBreaker.execute(async () => {
            try {
                let query = this.supabaseClient
                    .from("patients")
                    .select("*", { count: "exact" })
                    .or([
                    `personal_info->>fullName.ilike.%${searchTerm}%`,
                    `personal_info->>nationalId.ilike.%${searchTerm}%`,
                    `contact_info->>primaryPhone.ilike.%${searchTerm}%`,
                    `contact_info->>email.ilike.%${searchTerm}%`,
                ].join(","));
                if (filters?.isActive !== undefined) {
                    query = query.eq("status", filters.isActive ? "active" : "inactive");
                }
                if (filters?.hasInsurance !== undefined) {
                    const insuredPatientIds = await this.getActiveInsurancePatientIds();
                    if (filters.hasInsurance) {
                        if (insuredPatientIds.length === 0) {
                            return { patients: [], total: 0 };
                        }
                        query = query.in("patient_id", insuredPatientIds);
                    }
                    else if (insuredPatientIds.length > 0) {
                        query = query.not("patient_id", "in", this.buildInClause(insuredPatientIds));
                    }
                }
                if (pagination) {
                    const offset = (pagination.page - 1) * pagination.limit;
                    query = query.range(offset, offset + pagination.limit - 1);
                }
                const { data, error, count } = await query;
                if (error) {
                    this.logger.error("[PatientRepository] searchPatients query failed", {
                        error: error.message,
                        details: error?.details,
                        hint: error?.hint,
                        code: error?.code,
                    });
                    throw new Error(`Failed to search patients: ${error.message}`);
                }
                // ✅ FIX N+1 PROBLEM: Batch fetch all related data
                const patientIds = (data || []).map((record) => record.patient_id);
                const [insuranceMap, contactsMap, consentsMap, linksMap] = await Promise.all([
                    this.fetchInsuranceBatch(patientIds),
                    this.fetchEmergencyContactsBatch(patientIds),
                    this.fetchConsentsBatch(patientIds),
                    this.fetchLinksBatch(patientIds),
                ]);
                // Map to domain with pre-fetched data
                const patients = (data || []).map((record) => {
                    const patientId = record.patient_id;
                    return PatientMapper_1.PatientMapper.toDomain(record, insuranceMap.get(patientId) || null, contactsMap.get(patientId) || [], consentsMap.get(patientId) || [], linksMap.get(patientId) || []);
                });
                return { patients, total: count || 0 };
            }
            catch (error) {
                this.logger.error("[PatientRepository] searchPatients execution failed", {
                    error: error instanceof Error ? error.message : "Unknown error",
                });
                throw error;
            }
        }, async () => {
            this.logger.warn("Circuit breaker fallback for searchPatients");
            return { patients: [], total: 0 };
        });
    }
    /**
     * Match patients (PMI $match operation)
     * Delegates to PatientMatchingService
     */
    async matchPatients(criteria, onlyCertainMatches, limit) {
        return await this.circuitBreaker.execute(async () => {
            // Build query to fetch candidate patients
            let query = this.supabaseClient.from("patients").select("*");
            // Add filters based on criteria
            if (criteria.nationalId) {
                query = query.eq("personal_info->>nationalId", criteria.nationalId);
            }
            else if (criteria.fullName) {
                query = query.ilike("personal_info->>fullName", `%${criteria.fullName}%`);
            }
            else if (criteria.primaryPhone) {
                query = query.eq("contact_info->>primaryPhone", criteria.primaryPhone);
            }
            else if (criteria.email) {
                query = query.eq("contact_info->>email", criteria.email);
            }
            // Limit candidates to 100 for performance
            query = query.limit(100);
            const { data, error } = await query;
            if (error) {
                throw new Error(`Failed to fetch candidate patients: ${error.message}`);
            }
            // ✅ FIX N+1 PROBLEM: Batch fetch all related data
            const patientIds = (data || []).map((record) => record.patient_id);
            const [insuranceMap, contactsMap, consentsMap, linksMap] = await Promise.all([
                this.fetchInsuranceBatch(patientIds),
                this.fetchEmergencyContactsBatch(patientIds),
                this.fetchConsentsBatch(patientIds),
                this.fetchLinksBatch(patientIds),
            ]);
            // Map to domain with pre-fetched data
            const candidates = (data || []).map((record) => {
                const patientId = record.patient_id;
                return PatientMapper_1.PatientMapper.toDomain(record, insuranceMap.get(patientId) || null, contactsMap.get(patientId) || [], consentsMap.get(patientId) || [], linksMap.get(patientId) || []);
            });
            // Use matching service to score and rank
            const matches = await this.matchingService.matchPatients(candidates, criteria, onlyCertainMatches || false, limit || 10);
            return matches;
        }, async () => {
            this.logger.warn("Circuit breaker fallback for matchPatients");
            return [];
        });
    }
    /**
     * Get repository health status
     */
    async getHealthStatus() {
        try {
            const client = this.supabaseClient;
            const { error } = await client.from("patients").select("count").limit(1);
            return {
                status: error ? "unhealthy" : "healthy",
                database: "patient_schema",
                circuitBreaker: this.circuitBreaker.getStatus(),
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            return {
                status: "unhealthy",
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            };
        }
    }
    // ==================== Private Helper Methods ====================
    /**
     * Fetch insurance info for patient
     */
    async fetchInsurance(patientId) {
        const { data, error } = await this.supabaseClient
            .from("insurance_info")
            .select("*")
            .eq("patient_id", patientId)
            .eq("is_primary", true)
            .eq("is_active", true)
            .single();
        if (error && error.code !== "PGRST116") {
            this.logger.warn("Failed to fetch insurance", {
                patientId,
                error: error.message,
            });
        }
        return data;
    }
    /**
     * Fetch emergency contacts for patient
     */
    async fetchEmergencyContacts(patientId) {
        const { data, error } = await this.supabaseClient
            .from("emergency_contacts")
            .select("*")
            .eq("patient_id", patientId);
        if (error) {
            this.logger.warn("Failed to fetch emergency contacts", {
                patientId,
                error: error.message,
            });
            return [];
        }
        return (data || []);
    }
    /**
     * Fetch consents for patient
     */
    async fetchConsents(patientId) {
        const { data, error } = await this.supabaseClient
            .from("patient_consents")
            .select("*")
            .eq("patient_id", patientId);
        if (error) {
            this.logger.warn("Failed to fetch consents", {
                patientId,
                error: error.message,
            });
            return [];
        }
        return (data || []);
    }
    /**
     * Fetch links for patient
     */
    async fetchLinks(patientId) {
        const { data, error } = await this.supabaseClient
            .from("patient_links")
            .select("*")
            .eq("patient_id", patientId);
        if (error) {
            this.logger.warn("Failed to fetch links", {
                patientId,
                error: error.message,
            });
            return [];
        }
        return (data || []);
    }
    /**
     * ✅ FIX N+1 PROBLEM: Batch fetch insurance for multiple patients
     */
    async fetchInsuranceBatch(patientIds) {
        if (patientIds.length === 0) {
            return new Map();
        }
        const { data, error } = await this.supabaseClient
            .from("insurance_info")
            .select("*")
            .in("patient_id", patientIds);
        if (error) {
            this.logger.warn("Failed to batch fetch insurance", {
                patientIds,
                error: error.message,
            });
            return new Map();
        }
        // Create map: patientId -> insurance record
        const insuranceMap = new Map();
        patientIds.forEach((id) => insuranceMap.set(id, null));
        (data || []).forEach((record) => {
            insuranceMap.set(record.patient_id, record);
        });
        return insuranceMap;
    }
    /**
     * ✅ FIX N+1 PROBLEM: Batch fetch emergency contacts for multiple patients
     */
    async fetchEmergencyContactsBatch(patientIds) {
        if (patientIds.length === 0) {
            return new Map();
        }
        const { data, error } = await this.supabaseClient
            .from("emergency_contacts")
            .select("*")
            .in("patient_id", patientIds);
        if (error) {
            this.logger.warn("Failed to batch fetch emergency contacts", {
                patientIds,
                error: error.message,
            });
            return new Map();
        }
        // Create map: patientId -> contacts array
        const contactsMap = new Map();
        patientIds.forEach((id) => contactsMap.set(id, []));
        (data || []).forEach((record) => {
            const contacts = contactsMap.get(record.patient_id) || [];
            contacts.push(record);
            contactsMap.set(record.patient_id, contacts);
        });
        return contactsMap;
    }
    /**
     * ✅ FIX N+1 PROBLEM: Batch fetch consents for multiple patients
     */
    async fetchConsentsBatch(patientIds) {
        if (patientIds.length === 0) {
            return new Map();
        }
        const { data, error } = await this.supabaseClient
            .from("patient_consents")
            .select("*")
            .in("patient_id", patientIds);
        if (error) {
            this.logger.warn("Failed to batch fetch consents", {
                patientIds,
                error: error.message,
            });
            return new Map();
        }
        // Create map: patientId -> consents array
        const consentsMap = new Map();
        patientIds.forEach((id) => consentsMap.set(id, []));
        (data || []).forEach((record) => {
            const consents = consentsMap.get(record.patient_id) || [];
            consents.push(record);
            consentsMap.set(record.patient_id, consents);
        });
        return consentsMap;
    }
    /**
     * ✅ FIX N+1 PROBLEM: Batch fetch links for multiple patients
     */
    async fetchLinksBatch(patientIds) {
        if (patientIds.length === 0) {
            return new Map();
        }
        const { data, error } = await this.supabaseClient
            .from("patient_links")
            .select("*")
            .in("patient_id", patientIds);
        if (error) {
            this.logger.warn("Failed to batch fetch links", {
                patientIds,
                error: error.message,
            });
            return new Map();
        }
        // Create map: patientId -> links array
        const linksMap = new Map();
        patientIds.forEach((id) => linksMap.set(id, []));
        (data || []).forEach((record) => {
            const links = linksMap.get(record.patient_id) || [];
            links.push(record);
            linksMap.set(record.patient_id, links);
        });
        return linksMap;
    }
    buildInClause(ids) {
        return "(" + ids.map((id) => '"' + id + '"').join(",") + ")";
    }
    async getActiveInsurancePatientIds() {
        const { data, error } = await this.supabaseClient
            .from("insurance_info")
            .select("patient_id")
            .eq("is_active", true);
        if (error) {
            throw new Error(`Failed to fetch insured patient IDs: ${error.message}`);
        }
        const ids = (data || []).map((record) => record.patient_id);
        return Array.from(new Set(ids));
    }
    /**
     * Save insurance info
     * @private - Reserved for future use
     */
    async _saveInsurance(patientId, insuranceRecord) {
        // Delete existing insurance
        await this.supabaseClient
            .from("insurance_info")
            .delete()
            .eq("patient_id", patientId);
        // Insert new insurance
        const { error } = await this.supabaseClient
            .from("insurance_info")
            .insert({ ...insuranceRecord, patient_id: patientId });
        if (error) {
            this.logger.error("Failed to save insurance", {
                patientId,
                error: error.message,
            });
        }
    }
    /**
     * Save emergency contacts
     * @private - Reserved for future use
     */
    async _saveEmergencyContacts(patientId, contacts) {
        // Delete existing contacts
        await this.supabaseClient
            .from("emergency_contacts")
            .delete()
            .eq("patient_id", patientId);
        if (contacts.length > 0) {
            // Insert new contacts
            const { error } = await this.supabaseClient
                .from("emergency_contacts")
                .insert(contacts.map((c) => ({ ...c, patient_id: patientId })));
            if (error) {
                this.logger.error("Failed to save emergency contacts", {
                    patientId,
                    error: error.message,
                });
            }
        }
    }
    /**
     * Save consents
     * @private - Reserved for future use
     */
    async _saveConsents(patientId, consents) {
        // Delete existing consents
        await this.supabaseClient
            .from("patient_consents")
            .delete()
            .eq("patient_id", patientId);
        if (consents.length > 0) {
            // Insert new consents
            const { error } = await this.supabaseClient
                .from("patient_consents")
                .insert(consents.map((c) => ({ ...c, patient_id: patientId })));
            if (error) {
                this.logger.error("Failed to save consents", {
                    patientId,
                    error: error.message,
                });
            }
        }
    }
    /**
     * Save links
     * @private - Reserved for future use
     */
    async _saveLinks(patientId, links) {
        // Delete existing links
        await this.supabaseClient
            .from("patient_links")
            .delete()
            .eq("patient_id", patientId);
        if (links.length > 0) {
            // Insert new links
            const { error } = await this.supabaseClient
                .from("patient_links")
                .insert(links.map((l) => ({ ...l, patient_id: patientId })));
            if (error) {
                this.logger.error("Failed to save links", {
                    patientId,
                    error: error.message,
                });
            }
        }
    }
    /**
     * Publish domain events from aggregate
     * ✅ OUTBOX PATTERN: Save events to outbox table for reliable publishing
     */
    async publishDomainEvents(patient) {
        const events = patient.getUncommittedEvents();
        if (events.length === 0) {
            return;
        }
        try {
            // ✅ PRIORITY 1: Use outbox pattern if available (transactional, reliable)
            if (this.outboxRepository) {
                await this.outboxRepository.saveEvents(events);
                // Mark events as committed after saving to outbox
                patient.markEventsAsCommitted();
                this.logger.info("Domain events saved to outbox", {
                    patientId: patient.getPatientId(),
                    eventCount: events.length,
                    eventTypes: events.map((event) => event.eventType),
                });
                return;
            }
            // ✅ FALLBACK: Direct publishing if outbox not available
            if (!this.eventPublisher) {
                this.logger.debug("Neither outbox nor event publisher configured, skipping event publishing");
                return;
            }
            // Publish events in batch (legacy approach)
            await this.eventPublisher.publishBatch(events);
            // Mark events as committed after successful publishing
            patient.markEventsAsCommitted();
            this.logger.info("Domain events published directly", {
                patientId: patient.getPatientId(),
                eventCount: events.length,
                eventTypes: events.map((event) => event.eventType),
            });
        }
        catch (error) {
            this.logger.error("Failed to publish domain events", {
                patientId: patient.getPatientId(),
                error: error instanceof Error ? error.message : "Unknown error",
                eventCount: events.length,
            });
            // Don't throw - event publishing failure shouldn't fail the transaction
            // Events will be retried via outbox worker or on next save
        }
    }
    /**
     * Get patient statistics for dashboard
     */
    async getStatistics() {
        return this.circuitBreaker.execute(async () => {
            this.logger.info("Getting patient statistics");
            // Get total count
            const { count: total, error: totalError } = await this.supabaseClient
                .from("patients")
                .select("*", { count: "exact", head: true });
            if (totalError) {
                throw new Error(`Failed to get total count: ${totalError.message}`);
            }
            // Get gender distribution
            const { data: genderData, error: genderError } = await this.supabaseClient
                .from("patients")
                .select("personal_info");
            if (genderError) {
                throw new Error(`Failed to get gender data: ${genderError.message}`);
            }
            const byGender = {
                male: 0,
                female: 0,
                other: 0,
                unknown: 0,
            };
            genderData?.forEach((row) => {
                const gender = row.personal_info?.gender?.toLowerCase();
                if (gender === "male")
                    byGender.male++;
                else if (gender === "female")
                    byGender.female++;
                else if (gender === "other")
                    byGender.other++;
                else
                    byGender.unknown++;
            });
            // Get age distribution
            const { data: ageData, error: ageError } = await this.supabaseClient
                .from("patients")
                .select("personal_info");
            if (ageError) {
                throw new Error(`Failed to get age data: ${ageError.message}`);
            }
            const byAgeRange = {
                "0-18": 0,
                "19-40": 0,
                "41-60": 0,
                "60+": 0,
            };
            const currentYear = new Date().getFullYear();
            ageData?.forEach((row) => {
                const dob = row.personal_info?.dateOfBirth;
                if (dob) {
                    const birthYear = new Date(dob).getFullYear();
                    const age = currentYear - birthYear;
                    if (age <= 18)
                        byAgeRange["0-18"]++;
                    else if (age <= 40)
                        byAgeRange["19-40"]++;
                    else if (age <= 60)
                        byAgeRange["41-60"]++;
                    else
                        byAgeRange["60+"]++;
                }
            });
            // Get insurance type distribution
            const { data: insuranceData, error: insuranceError } = await this.supabaseClient
                .from("insurance_info")
                .select("coverage_type");
            if (insuranceError) {
                throw new Error(`Failed to get insurance data: ${insuranceError.message}`);
            }
            const byInsuranceType = {
                bhyt: 0,
                bhtn: 0,
                private: 0,
                selfPay: total || 0,
            };
            insuranceData?.forEach((row) => {
                const type = row.coverage_type?.toLowerCase();
                if (type === "bhyt") {
                    byInsuranceType.bhyt++;
                    byInsuranceType.selfPay--;
                }
                else if (type === "bhtn") {
                    byInsuranceType.bhtn++;
                    byInsuranceType.selfPay--;
                }
                else if (type === "private") {
                    byInsuranceType.private++;
                    byInsuranceType.selfPay--;
                }
            });
            // Get status distribution
            const { data: statusData, error: statusError } = await this.supabaseClient
                .from("patients")
                .select("status");
            if (statusError) {
                throw new Error(`Failed to get status data: ${statusError.message}`);
            }
            const byStatus = {
                active: 0,
                inactive: 0,
                deceased: 0,
                merged: 0,
            };
            statusData?.forEach((row) => {
                const status = row.status?.toLowerCase();
                if (status === "active")
                    byStatus.active++;
                else if (status === "inactive")
                    byStatus.inactive++;
                else if (status === "deceased")
                    byStatus.deceased++;
                else if (status === "merged")
                    byStatus.merged++;
            });
            // Get registration trend (last 12 months)
            const { data: trendData, error: trendError } = await this.supabaseClient
                .from("patients")
                .select("created_at")
                .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
            if (trendError) {
                throw new Error(`Failed to get trend data: ${trendError.message}`);
            }
            const monthCounts = {};
            trendData?.forEach((row) => {
                const month = new Date(row.created_at).toISOString().substring(0, 7); // YYYY-MM
                monthCounts[month] = (monthCounts[month] || 0) + 1;
            });
            const registrationTrend = Object.entries(monthCounts)
                .map(([month, count]) => ({ month, count }))
                .sort((a, b) => a.month.localeCompare(b.month));
            this.logger.info("Patient statistics retrieved successfully", {
                total,
                byGender,
                byAgeRange,
                byInsuranceType,
                byStatus,
                trendMonths: registrationTrend.length,
            });
            return {
                total: total || 0,
                byGender,
                byAgeRange,
                byInsuranceType,
                byStatus,
                registrationTrend,
            };
        });
    }
    /**
     * Get patient history (audit logs and access history)
     * Returns chronological history of patient record changes and accesses
     */
    async getPatientHistory(patientId, options) {
        return this.circuitBreaker.execute(async () => {
            const limit = options?.limit || 50;
            const offset = options?.offset || 0;
            this.logger.info("Retrieving patient history from database", {
                patientId: patientId.getValue(),
                limit,
                offset,
            });
            // Build query for audit_logs (schema already set in client config)
            let auditQuery = this.supabaseClient
                .from("audit_logs")
                .select("*", { count: "exact" })
                .eq("patient_id", patientId.getValue())
                .order("created_at", { ascending: false })
                .range(offset, offset + limit - 1);
            // Apply filters
            if (options?.dateFrom) {
                auditQuery = auditQuery.gte("created_at", options.dateFrom.toISOString());
            }
            if (options?.dateTo) {
                auditQuery = auditQuery.lte("created_at", options.dateTo.toISOString());
            }
            if (options?.eventTypes && options.eventTypes.length > 0) {
                auditQuery = auditQuery.in("event_type", options.eventTypes);
            }
            const { data: auditLogs, error: auditError, count } = await auditQuery;
            if (auditError) {
                this.logger.error("Failed to retrieve audit logs", {
                    error: auditError.message,
                    patientId: patientId.getValue(),
                });
                throw new Error(`Failed to retrieve patient history: ${auditError.message}`);
            }
            // Build query for phi_access_logs (schema already set in client config)
            let phiQuery = this.supabaseClient
                .from("phi_access_logs")
                .select("*")
                .eq("patient_id", patientId.getValue())
                .order("accessed_at", { ascending: false })
                .range(offset, offset + limit - 1);
            if (options?.dateFrom) {
                phiQuery = phiQuery.gte("accessed_at", options.dateFrom.toISOString());
            }
            if (options?.dateTo) {
                phiQuery = phiQuery.lte("accessed_at", options.dateTo.toISOString());
            }
            const { data: phiLogs, error: phiError } = await phiQuery;
            if (phiError) {
                this.logger.warn("Failed to retrieve PHI access logs", {
                    error: phiError.message,
                    patientId: patientId.getValue(),
                });
            }
            // Combine and map results
            const history = [
                ...(auditLogs || []).map((log) => ({
                    eventId: log.event_id,
                    eventType: log.event_type,
                    action: log.action,
                    userId: log.user_id,
                    userRole: log.user_role,
                    timestamp: new Date(log.created_at),
                    changes: log.changes,
                    ipAddress: log.ip_address,
                    userAgent: log.user_agent,
                })),
                ...(phiLogs || []).map((log) => ({
                    eventId: log.event_id,
                    eventType: log.event_type,
                    action: log.action,
                    userId: log.user_id,
                    userRole: log.user_role,
                    timestamp: new Date(log.accessed_at),
                    accessedFields: log.data_accessed?.split(",") || [],
                    ipAddress: log.ip_address,
                    userAgent: log.user_agent,
                })),
            ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            this.logger.info("Patient history retrieved successfully", {
                patientId: patientId.getValue(),
                totalRecords: history.length,
                total: count || 0,
            });
            return {
                history,
                total: count || 0,
            };
        });
    }
}
exports.SupabasePatientRepository = SupabasePatientRepository;
//# sourceMappingURL=SupabasePatientRepository.js.map