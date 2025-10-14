"use strict";
/**
 * SupabasePatientRepository - Infrastructure Layer
 * Implements IPatientRepository with Supabase PostgreSQL
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabasePatientRepository = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const PatientId_1 = require("../../domain/value-objects/PatientId");
const PatientMapper_1 = require("../mappers/PatientMapper");
const CircuitBreaker_1 = require("../resilience/CircuitBreaker");
/**
 * Supabase Patient Repository Implementation
 */
class SupabasePatientRepository {
    constructor(supabaseUrl, supabaseKey, logger, matchingService, eventPublisher) {
        this.logger = logger;
        this.matchingService = matchingService;
        this.eventPublisher = eventPublisher;
        this.circuitBreaker = CircuitBreaker_1.CircuitBreakerFactory.getBreaker('patient-repository');
        this.supabaseClient = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
            db: {
                schema: 'patient_schema',
            },
            global: {
                headers: {
                    'X-Client-Info': 'patient-registry-service',
                },
            },
        });
    }
    /**
     * Find patient by ID
     */
    async findById(patientId) {
        return await this.circuitBreaker.execute(async () => {
            const patientIdValue = patientId.getValue();
            // Fetch patient record
            const { data: patientData, error: patientError } = await this.supabaseClient
                .from('patients')
                .select('*')
                .eq('patient_id', patientIdValue)
                .single();
            if (patientError) {
                if (patientError.code === 'PGRST116') {
                    return null; // Not found
                }
                throw new Error(`Failed to find patient: ${patientError.message}`);
            }
            // Fetch related data
            const [insuranceData, emergencyContactsData, consentsData, linksData] = await Promise.all([
                this.fetchInsurance(patientIdValue),
                this.fetchEmergencyContacts(patientIdValue),
                this.fetchConsents(patientIdValue),
                this.fetchLinks(patientIdValue)
            ]);
            // Map to domain
            return PatientMapper_1.PatientMapper.toDomain(patientData, insuranceData, emergencyContactsData, consentsData, linksData);
        }, async () => {
            this.logger.warn('Circuit breaker fallback for findById', { patientId: patientId.getValue() });
            return null;
        });
    }
    /**
     * Find patient by user ID
     */
    async findByUserId(userId) {
        return await this.circuitBreaker.execute(async () => {
            const { data: patientData, error: patientError } = await this.supabaseClient
                .from('patients')
                .select('*')
                .eq('user_id', userId)
                .single();
            if (patientError) {
                if (patientError.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to find patient by user ID: ${patientError.message}`);
            }
            const patientIdValue = patientData.patient_id;
            const [insuranceData, emergencyContactsData, consentsData, linksData] = await Promise.all([
                this.fetchInsurance(patientIdValue),
                this.fetchEmergencyContacts(patientIdValue),
                this.fetchConsents(patientIdValue),
                this.fetchLinks(patientIdValue)
            ]);
            return PatientMapper_1.PatientMapper.toDomain(patientData, insuranceData, emergencyContactsData, consentsData, linksData);
        }, async () => {
            this.logger.warn('Circuit breaker fallback for findByUserId', { userId });
            return null;
        });
    }
    /**
     * Find patient by national ID
     */
    async findByNationalId(nationalId) {
        return await this.circuitBreaker.execute(async () => {
            const { data: patientData, error: patientError } = await this.supabaseClient
                .from('patients')
                .select('*')
                .eq('personal_info->>nationalId', nationalId)
                .single();
            if (patientError) {
                if (patientError.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to find patient by national ID: ${patientError.message}`);
            }
            const patientIdValue = patientData.patient_id;
            const [insuranceData, emergencyContactsData, consentsData, linksData] = await Promise.all([
                this.fetchInsurance(patientIdValue),
                this.fetchEmergencyContacts(patientIdValue),
                this.fetchConsents(patientIdValue),
                this.fetchLinks(patientIdValue)
            ]);
            return PatientMapper_1.PatientMapper.toDomain(patientData, insuranceData, emergencyContactsData, consentsData, linksData);
        }, async () => {
            this.logger.warn('Circuit breaker fallback for findByNationalId', { nationalId });
            return null;
        });
    }
    /**
     * Find patient by BHYT number
     */
    async findByBHYTNumber(bhytNumber) {
        return await this.circuitBreaker.execute(async () => {
            const { data: insuranceData, error: insuranceError } = await this.supabaseClient
                .from('insurance_info')
                .select('patient_id')
                .eq('bhyt_number', bhytNumber)
                .eq('is_active', true)
                .single();
            if (insuranceError) {
                if (insuranceError.code === 'PGRST116') {
                    return null;
                }
                throw new Error(`Failed to find patient by BHYT number: ${insuranceError.message}`);
            }
            // Find patient by patient_id
            return await this.findById(PatientId_1.PatientId.fromString(insuranceData.patient_id));
        }, async () => {
            this.logger.warn('Circuit breaker fallback for findByBHYTNumber', { bhytNumber });
            return null;
        });
    }
    /**
     * Save patient (create or update)
     * ✅ FIX TRANSACTION SUPPORT: Use PostgreSQL function for atomic operations
     */
    async save(patient) {
        return await this.circuitBreaker.execute(async () => {
            const { patientRecord, insuranceRecord, emergencyContactRecords, consentRecords, linkRecords } = PatientMapper_1.PatientMapper.toPersistence(patient);
            const patientIdValue = patient.getPatientId();
            if (!patientIdValue) {
                throw new Error('Patient ID is required');
            }
            // ✅ Use PostgreSQL function for transaction support
            const { data, error } = await this.supabaseClient.rpc('save_patient_transaction', {
                p_patient_data: patientRecord,
                p_insurance_data: insuranceRecord || null,
                p_contacts_data: emergencyContactRecords || [],
                p_consents_data: consentRecords || [],
                p_links_data: linkRecords || []
            });
            if (error) {
                throw new Error(`Failed to save patient: ${error.message}`);
            }
            this.logger.info('Patient saved successfully (transaction)', {
                patientId: patientIdValue,
                result: data
            });
            // Publish domain events
            await this.publishDomainEvents(patient);
        });
    }
    /**
     * Delete patient (soft delete)
     */
    async delete(patientId) {
        return await this.circuitBreaker.execute(async () => {
            const { error } = await this.supabaseClient
                .from('patients')
                .update({ status: 'inactive', updated_at: new Date().toISOString() })
                .eq('patient_id', patientId.getValue());
            if (error) {
                throw new Error(`Failed to delete patient: ${error.message}`);
            }
            this.logger.info('Patient deleted (soft)', { patientId: patientId.getValue() });
        });
    }
    /**
     * Find patients with filters
     */
    async findWithFilters(filters, pagination) {
        return await this.circuitBreaker.execute(async () => {
            let query = this.supabaseClient.from('patients').select('*', { count: 'exact' });
            // Apply filters
            if (filters.isActive !== undefined) {
                query = query.eq('status', filters.isActive ? 'active' : 'inactive');
            }
            if (filters.registrationDateFrom) {
                query = query.gte('created_at', filters.registrationDateFrom);
            }
            if (filters.registrationDateTo) {
                query = query.lte('created_at', filters.registrationDateTo);
            }
            if (filters.city) {
                query = query.eq('contact_info->>city', filters.city);
            }
            if (filters.hasInsurance !== undefined) {
                const insuredPatientIds = await this.getActiveInsurancePatientIds();
                if (filters.hasInsurance) {
                    if (insuredPatientIds.length === 0) {
                        return { patients: [], total: 0 };
                    }
                    query = query.in('patient_id', insuredPatientIds);
                }
                else if (insuredPatientIds.length > 0) {
                    query = query.not('patient_id', 'in', this.buildInClause(insuredPatientIds));
                }
            }
            // Apply pagination
            if (pagination) {
                const offset = (pagination.page - 1) * pagination.limit;
                query = query.range(offset, offset + pagination.limit - 1);
                if (pagination.sorting) {
                    query = query.order(pagination.sorting.field, { ascending: pagination.sorting.direction === 'asc' });
                }
            }
            const { data, error, count } = await query;
            if (error) {
                throw new Error(`Failed to find patients with filters: ${error.message}`);
            }
            // ✅ FIX N+1 PROBLEM: Batch fetch all related data
            const patientIds = (data || []).map((record) => record.patient_id);
            const [insuranceMap, contactsMap, consentsMap, linksMap] = await Promise.all([
                this.fetchInsuranceBatch(patientIds),
                this.fetchEmergencyContactsBatch(patientIds),
                this.fetchConsentsBatch(patientIds),
                this.fetchLinksBatch(patientIds)
            ]);
            // Map to domain with pre-fetched data
            const patients = (data || []).map((record) => {
                const patientId = record.patient_id;
                return PatientMapper_1.PatientMapper.toDomain(record, insuranceMap.get(patientId) || null, contactsMap.get(patientId) || [], consentsMap.get(patientId) || [], linksMap.get(patientId) || []);
            });
            return {
                patients,
                total: count || 0
            };
        }, async () => {
            this.logger.warn('Circuit breaker fallback for findWithFilters');
            return { patients: [], total: 0 };
        });
    }
    /**
     * Search patients by term
     */
    async searchPatients(searchTerm, filters, pagination) {
        return await this.circuitBreaker.execute(async () => {
            let query = this.supabaseClient
                .from('patients')
                .select('*', { count: 'exact' })
                .or([
                `personal_info->>fullName.ilike.%${searchTerm}%`,
                `personal_info->>nationalId.ilike.%${searchTerm}%`,
                `contact_info->>primaryPhone.ilike.%${searchTerm}%`,
                `contact_info->>email.ilike.%${searchTerm}%`
            ].join(','));
            if (filters?.isActive !== undefined) {
                query = query.eq('status', filters.isActive ? 'active' : 'inactive');
            }
            if (filters?.hasInsurance !== undefined) {
                const insuredPatientIds = await this.getActiveInsurancePatientIds();
                if (filters.hasInsurance) {
                    if (insuredPatientIds.length === 0) {
                        return { patients: [], total: 0 };
                    }
                    query = query.in('patient_id', insuredPatientIds);
                }
                else if (insuredPatientIds.length > 0) {
                    query = query.not('patient_id', 'in', this.buildInClause(insuredPatientIds));
                }
            }
            if (pagination) {
                const offset = (pagination.page - 1) * pagination.limit;
                query = query.range(offset, offset + pagination.limit - 1);
            }
            const { data, error, count } = await query;
            if (error) {
                throw new Error(`Failed to search patients: ${error.message}`);
            }
            // ✅ FIX N+1 PROBLEM: Batch fetch all related data
            const patientIds = (data || []).map((record) => record.patient_id);
            const [insuranceMap, contactsMap, consentsMap, linksMap] = await Promise.all([
                this.fetchInsuranceBatch(patientIds),
                this.fetchEmergencyContactsBatch(patientIds),
                this.fetchConsentsBatch(patientIds),
                this.fetchLinksBatch(patientIds)
            ]);
            // Map to domain with pre-fetched data
            const patients = (data || []).map((record) => {
                const patientId = record.patient_id;
                return PatientMapper_1.PatientMapper.toDomain(record, insuranceMap.get(patientId) || null, contactsMap.get(patientId) || [], consentsMap.get(patientId) || [], linksMap.get(patientId) || []);
            });
            return { patients, total: count || 0 };
        }, async () => {
            this.logger.warn('Circuit breaker fallback for searchPatients');
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
            let query = this.supabaseClient.from('patients').select('*');
            // Add filters based on criteria
            if (criteria.nationalId) {
                query = query.eq('personal_info->>nationalId', criteria.nationalId);
            }
            else if (criteria.fullName) {
                query = query.ilike('personal_info->>fullName', `%${criteria.fullName}%`);
            }
            else if (criteria.primaryPhone) {
                query = query.eq('contact_info->>primaryPhone', criteria.primaryPhone);
            }
            else if (criteria.email) {
                query = query.eq('contact_info->>email', criteria.email);
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
                this.fetchLinksBatch(patientIds)
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
            this.logger.warn('Circuit breaker fallback for matchPatients');
            return [];
        });
    }
    /**
     * Get repository health status
     */
    async getHealthStatus() {
        try {
            const client = this.supabaseClient;
            const { error } = await client
                .from('patients')
                .select('count')
                .limit(1);
            return {
                status: error ? 'unhealthy' : 'healthy',
                database: 'patient_schema',
                circuitBreaker: this.circuitBreaker.getStatus(),
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            };
        }
    }
    // ==================== Private Helper Methods ====================
    /**
     * Fetch insurance info for patient
     */
    async fetchInsurance(patientId) {
        const { data, error } = await this.supabaseClient
            .from('insurance_info')
            .select('*')
            .eq('patient_id', patientId)
            .eq('is_primary', true)
            .eq('is_active', true)
            .single();
        if (error && error.code !== 'PGRST116') {
            this.logger.warn('Failed to fetch insurance', { patientId, error: error.message });
        }
        return data;
    }
    /**
     * Fetch emergency contacts for patient
     */
    async fetchEmergencyContacts(patientId) {
        const { data, error } = await this.supabaseClient
            .from('emergency_contacts')
            .select('*')
            .eq('patient_id', patientId);
        if (error) {
            this.logger.warn('Failed to fetch emergency contacts', { patientId, error: error.message });
            return [];
        }
        return (data || []);
    }
    /**
     * Fetch consents for patient
     */
    async fetchConsents(patientId) {
        const { data, error } = await this.supabaseClient
            .from('patient_consents')
            .select('*')
            .eq('patient_id', patientId);
        if (error) {
            this.logger.warn('Failed to fetch consents', { patientId, error: error.message });
            return [];
        }
        return (data || []);
    }
    /**
     * Fetch links for patient
     */
    async fetchLinks(patientId) {
        const { data, error } = await this.supabaseClient
            .from('patient_links')
            .select('*')
            .eq('patient_id', patientId);
        if (error) {
            this.logger.warn('Failed to fetch links', { patientId, error: error.message });
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
            .from('insurance_info')
            .select('*')
            .in('patient_id', patientIds);
        if (error) {
            this.logger.warn('Failed to batch fetch insurance', { patientIds, error: error.message });
            return new Map();
        }
        // Create map: patientId -> insurance record
        const insuranceMap = new Map();
        patientIds.forEach(id => insuranceMap.set(id, null));
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
            .from('emergency_contacts')
            .select('*')
            .in('patient_id', patientIds);
        if (error) {
            this.logger.warn('Failed to batch fetch emergency contacts', { patientIds, error: error.message });
            return new Map();
        }
        // Create map: patientId -> contacts array
        const contactsMap = new Map();
        patientIds.forEach(id => contactsMap.set(id, []));
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
            .from('patient_consents')
            .select('*')
            .in('patient_id', patientIds);
        if (error) {
            this.logger.warn('Failed to batch fetch consents', { patientIds, error: error.message });
            return new Map();
        }
        // Create map: patientId -> consents array
        const consentsMap = new Map();
        patientIds.forEach(id => consentsMap.set(id, []));
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
            .from('patient_links')
            .select('*')
            .in('patient_id', patientIds);
        if (error) {
            this.logger.warn('Failed to batch fetch links', { patientIds, error: error.message });
            return new Map();
        }
        // Create map: patientId -> links array
        const linksMap = new Map();
        patientIds.forEach(id => linksMap.set(id, []));
        (data || []).forEach((record) => {
            const links = linksMap.get(record.patient_id) || [];
            links.push(record);
            linksMap.set(record.patient_id, links);
        });
        return linksMap;
    }
    buildInClause(ids) {
        return '(' + ids.map(id => '"' + id + '"').join(',') + ')';
    }
    async getActiveInsurancePatientIds() {
        const { data, error } = await this.supabaseClient
            .from('insurance_info')
            .select('patient_id')
            .eq('is_active', true);
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
            .from('insurance_info')
            .delete()
            .eq('patient_id', patientId);
        // Insert new insurance
        const { error } = await this.supabaseClient
            .from('insurance_info')
            .insert({ ...insuranceRecord, patient_id: patientId });
        if (error) {
            this.logger.error('Failed to save insurance', { patientId, error: error.message });
        }
    }
    /**
     * Save emergency contacts
     * @private - Reserved for future use
     */
    async _saveEmergencyContacts(patientId, contacts) {
        // Delete existing contacts
        await this.supabaseClient
            .from('emergency_contacts')
            .delete()
            .eq('patient_id', patientId);
        if (contacts.length > 0) {
            // Insert new contacts
            const { error } = await this.supabaseClient
                .from('emergency_contacts')
                .insert(contacts.map(c => ({ ...c, patient_id: patientId })));
            if (error) {
                this.logger.error('Failed to save emergency contacts', { patientId, error: error.message });
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
            .from('patient_consents')
            .delete()
            .eq('patient_id', patientId);
        if (consents.length > 0) {
            // Insert new consents
            const { error } = await this.supabaseClient
                .from('patient_consents')
                .insert(consents.map(c => ({ ...c, patient_id: patientId })));
            if (error) {
                this.logger.error('Failed to save consents', { patientId, error: error.message });
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
            .from('patient_links')
            .delete()
            .eq('patient_id', patientId);
        if (links.length > 0) {
            // Insert new links
            const { error } = await this.supabaseClient
                .from('patient_links')
                .insert(links.map(l => ({ ...l, patient_id: patientId })));
            if (error) {
                this.logger.error('Failed to save links', { patientId, error: error.message });
            }
        }
    }
    /**
     * Publish domain events from aggregate
     */
    async publishDomainEvents(patient) {
        if (!this.eventPublisher) {
            this.logger.debug('Event publisher not configured, skipping event publishing');
            return;
        }
        const events = patient.getUncommittedEvents();
        if (events.length === 0) {
            return;
        }
        try {
            // Publish events in batch
            await this.eventPublisher.publishBatch(events);
            // Mark events as committed after successful publishing
            patient.markEventsAsCommitted();
            this.logger.info('Domain events published', {
                patientId: patient.getPatientId(),
                eventCount: events.length,
                eventTypes: events.map((event) => event.eventType)
            });
        }
        catch (error) {
            this.logger.error('Failed to publish domain events', {
                patientId: patient.getPatientId(),
                error: error instanceof Error ? error.message : 'Unknown error',
                eventCount: events.length
            });
            // Don't throw - event publishing failure shouldn't fail the transaction
            // Events will be retried on next save or can be published via outbox pattern
        }
    }
}
exports.SupabasePatientRepository = SupabasePatientRepository;
//# sourceMappingURL=SupabasePatientRepository.js.map