/**
 * SupabasePatientRepository - Infrastructure Layer
 * Implements IPatientRepository with Supabase PostgreSQL
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IPatientRepository } from '../../domain/repositories/IPatientRepository';
import { Patient } from '../../domain/aggregates/Patient';
import { PatientId } from '../../domain/value-objects/PatientId';
import { PatientMapper, PatientRecord, InsuranceRecord, EmergencyContactRecord, PatientConsentRecord, PatientLinkRecord } from '../mappers/PatientMapper';
import { CircuitBreakerFactory, PatientRegistryCircuitBreaker } from '../resilience/CircuitBreaker';
import { ILogger } from '@shared/application/services/logger.interface';
import { IPatientMatchingService } from '../../application/services/IPatientMatchingService';
import { IDomainEventPublisher } from '@shared/domain/events/IDomainEventPublisher';
import { DomainEvent } from '@shared/domain/base/domain-event';

/**
 * Supabase Patient Repository Implementation
 */
export class SupabasePatientRepository implements IPatientRepository {
  private supabaseClient: SupabaseClient;
  private circuitBreaker = CircuitBreakerFactory.getBreaker('patient-repository');

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    private logger: ILogger,
    private matchingService: IPatientMatchingService,
    private eventPublisher?: IDomainEventPublisher
  ) {
    this.supabaseClient = createClient(supabaseUrl, supabaseKey, {
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
    }) as unknown as SupabaseClient;
  }

  /**
   * Find patient by ID
   */
  async findById(patientId: PatientId): Promise<Patient | null> {
    return await this.circuitBreaker.execute(
      async () => {
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
        return PatientMapper.toDomain(
          patientData as PatientRecord,
          insuranceData,
          emergencyContactsData,
          consentsData,
          linksData
        );
      },
      async () => {
        this.logger.warn('Circuit breaker fallback for findById', { patientId: patientId.getValue() });
        return null;
      }
    );
  }

  /**
   * Find patient by user ID
   */
  async findByUserId(userId: string): Promise<Patient | null> {
    return await this.circuitBreaker.execute(
      async () => {
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

        return PatientMapper.toDomain(
          patientData as PatientRecord,
          insuranceData,
          emergencyContactsData,
          consentsData,
          linksData
        );
      },
      async () => {
        this.logger.warn('Circuit breaker fallback for findByUserId', { userId });
        return null;
      }
    );
  }

  /**
   * Find patient by national ID
   */
  async findByNationalId(nationalId: string): Promise<Patient | null> {
    return await this.circuitBreaker.execute(
      async () => {
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

        return PatientMapper.toDomain(
          patientData as PatientRecord,
          insuranceData,
          emergencyContactsData,
          consentsData,
          linksData
        );
      },
      async () => {
        this.logger.warn('Circuit breaker fallback for findByNationalId', { nationalId });
        return null;
      }
    );
  }

  /**
   * Find patient by BHYT number
   */
  async findByBHYTNumber(bhytNumber: string): Promise<Patient | null> {
    return await this.circuitBreaker.execute(
      async () => {
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
        return await this.findById(PatientId.fromString(insuranceData.patient_id));
      },
      async () => {
        this.logger.warn('Circuit breaker fallback for findByBHYTNumber', { bhytNumber });
        return null;
      }
    );
  }

  /**
   * Save patient (create or update)
   * ✅ FIX TRANSACTION SUPPORT: Use PostgreSQL function for atomic operations
   */
  async save(patient: Patient): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        const { patientRecord, insuranceRecord, emergencyContactRecords, consentRecords, linkRecords } =
          PatientMapper.toPersistence(patient);

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
      }
    );
  }

  /**
   * Delete patient (soft delete)
   */
  async delete(patientId: PatientId): Promise<void> {
    return await this.circuitBreaker.execute(
      async () => {
        const { error } = await this.supabaseClient
          .from('patients')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('patient_id', patientId.getValue());

        if (error) {
          throw new Error(`Failed to delete patient: ${error.message}`);
        }

        this.logger.info('Patient deleted (soft)', { patientId: patientId.getValue() });
      }
    );
  }

  /**
   * Find patients with filters
   */
  async findWithFilters(
    filters: {
      isActive?: boolean;
      registrationDateFrom?: string;
      registrationDateTo?: string;
      city?: string;
      province?: string;
    },
    pagination?: {
      page: number;
      limit: number;
      sorting?: {
        field: string;
        direction: 'asc' | 'desc';
      };
    }
  ): Promise<{ patients: Patient[]; total: number }> {
    return await this.circuitBreaker.execute(
      async () => {
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
        const patientIds = (data || []).map((record: PatientRecord) => record.patient_id);

        const [insuranceMap, contactsMap, consentsMap, linksMap] = await Promise.all([
          this.fetchInsuranceBatch(patientIds),
          this.fetchEmergencyContactsBatch(patientIds),
          this.fetchConsentsBatch(patientIds),
          this.fetchLinksBatch(patientIds)
        ]);

        // Map to domain with pre-fetched data
        const patients = (data || []).map((record: PatientRecord) => {
          const patientId = record.patient_id;
          return PatientMapper.toDomain(
            record as PatientRecord,
            insuranceMap.get(patientId) || null,
            contactsMap.get(patientId) || [],
            consentsMap.get(patientId) || [],
            linksMap.get(patientId) || []
          );
        });

        return {
          patients,
          total: count || 0
        };
      },
      async () => {
        this.logger.warn('Circuit breaker fallback for findWithFilters');
        return { patients: [], total: 0 };
      }
    );
  }

  /**
   * Search patients by term
   */
  async searchPatients(
    searchTerm: string,
    filters?: { isActive?: boolean },
    pagination?: { page: number; limit: number }
  ): Promise<{ patients: Patient[]; total: number }> {
    return await this.circuitBreaker.execute(
      async () => {
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

        if (pagination) {
          const offset = (pagination.page - 1) * pagination.limit;
          query = query.range(offset, offset + pagination.limit - 1);
        }

        const { data, error, count } = await query;

        if (error) {
          throw new Error(`Failed to search patients: ${error.message}`);
        }

        // ✅ FIX N+1 PROBLEM: Batch fetch all related data
        const patientIds = (data || []).map((record: PatientRecord) => record.patient_id);

        const [insuranceMap, contactsMap, consentsMap, linksMap] = await Promise.all([
          this.fetchInsuranceBatch(patientIds),
          this.fetchEmergencyContactsBatch(patientIds),
          this.fetchConsentsBatch(patientIds),
          this.fetchLinksBatch(patientIds)
        ]);

        // Map to domain with pre-fetched data
        const patients = (data || []).map((record: PatientRecord) => {
          const patientId = record.patient_id;
          return PatientMapper.toDomain(
            record as PatientRecord,
            insuranceMap.get(patientId) || null,
            contactsMap.get(patientId) || [],
            consentsMap.get(patientId) || [],
            linksMap.get(patientId) || []
          );
        });

        return { patients, total: count || 0 };
      },
      async () => {
        this.logger.warn('Circuit breaker fallback for searchPatients');
        return { patients: [], total: 0 };
      }
    );
  }

  /**
   * Match patients (PMI $match operation)
   * Delegates to PatientMatchingService
   */
  async matchPatients(
    criteria: {
      fullName?: string;
      dateOfBirth?: Date;
      nationalId?: string;
      primaryPhone?: string;
      email?: string;
    },
    onlyCertainMatches?: boolean,
    limit?: number
  ): Promise<Array<{ patient: Patient; matchGrade: 'certain' | 'probable' | 'possible' | 'certainly-not'; score: number }>> {
    return await this.circuitBreaker.execute(
      async () => {
        // Build query to fetch candidate patients
        let query = this.supabaseClient.from('patients').select('*');

        // Add filters based on criteria
        if (criteria.nationalId) {
          query = query.eq('personal_info->>nationalId', criteria.nationalId);
        } else if (criteria.fullName) {
          query = query.ilike('personal_info->>fullName', `%${criteria.fullName}%`);
        } else if (criteria.primaryPhone) {
          query = query.eq('contact_info->>primaryPhone', criteria.primaryPhone);
        } else if (criteria.email) {
          query = query.eq('contact_info->>email', criteria.email);
        }

        // Limit candidates to 100 for performance
        query = query.limit(100);

        const { data, error } = await query;

        if (error) {
          throw new Error(`Failed to fetch candidate patients: ${error.message}`);
        }

        // ✅ FIX N+1 PROBLEM: Batch fetch all related data
        const patientIds = (data || []).map((record: PatientRecord) => record.patient_id);

        const [insuranceMap, contactsMap, consentsMap, linksMap] = await Promise.all([
          this.fetchInsuranceBatch(patientIds),
          this.fetchEmergencyContactsBatch(patientIds),
          this.fetchConsentsBatch(patientIds),
          this.fetchLinksBatch(patientIds)
        ]);

        // Map to domain with pre-fetched data
        const candidates = (data || []).map((record: PatientRecord) => {
          const patientId = record.patient_id;
          return PatientMapper.toDomain(
            record as PatientRecord,
            insuranceMap.get(patientId) || null,
            contactsMap.get(patientId) || [],
            consentsMap.get(patientId) || [],
            linksMap.get(patientId) || []
          );
        });

        // Use matching service to score and rank
        const matches = await this.matchingService.matchPatients(
          candidates,
          criteria,
          onlyCertainMatches || false,
          limit || 10
        );

        return matches;
      },
      async () => {
        this.logger.warn('Circuit breaker fallback for matchPatients');
        return [];
      }
    );
  }

  /**
   * Get repository health status
   */
  async getHealthStatus(): Promise<RepositoryHealthStatus> {
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
    } catch (error) {
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
  private async fetchInsurance(patientId: string): Promise<InsuranceRecord | null> {
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

    return data as InsuranceRecord | null;
  }

  /**
   * Fetch emergency contacts for patient
   */
  private async fetchEmergencyContacts(patientId: string): Promise<EmergencyContactRecord[]> {
    const { data, error } = await this.supabaseClient
      .from('emergency_contacts')
      .select('*')
      .eq('patient_id', patientId);

    if (error) {
      this.logger.warn('Failed to fetch emergency contacts', { patientId, error: error.message });
      return [];
    }

    return (data || []) as EmergencyContactRecord[];
  }

  /**
   * Fetch consents for patient
   */
  private async fetchConsents(patientId: string): Promise<PatientConsentRecord[]> {
    const { data, error } = await this.supabaseClient
      .from('patient_consents')
      .select('*')
      .eq('patient_id', patientId);

    if (error) {
      this.logger.warn('Failed to fetch consents', { patientId, error: error.message });
      return [];
    }

    return (data || []) as PatientConsentRecord[];
  }

  /**
   * Fetch links for patient
   */
  private async fetchLinks(patientId: string): Promise<PatientLinkRecord[]> {
    const { data, error } = await this.supabaseClient
      .from('patient_links')
      .select('*')
      .eq('patient_id', patientId);

    if (error) {
      this.logger.warn('Failed to fetch links', { patientId, error: error.message });
      return [];
    }

    return (data || []) as PatientLinkRecord[];
  }

  /**
   * ✅ FIX N+1 PROBLEM: Batch fetch insurance for multiple patients
   */
  private async fetchInsuranceBatch(patientIds: string[]): Promise<Map<string, InsuranceRecord | null>> {
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
    const insuranceMap = new Map<string, InsuranceRecord | null>();
    patientIds.forEach(id => insuranceMap.set(id, null));
    (data || []).forEach((record: any) => {
      insuranceMap.set(record.patient_id, record as InsuranceRecord);
    });

    return insuranceMap;
  }

  /**
   * ✅ FIX N+1 PROBLEM: Batch fetch emergency contacts for multiple patients
   */
  private async fetchEmergencyContactsBatch(patientIds: string[]): Promise<Map<string, EmergencyContactRecord[]>> {
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
    const contactsMap = new Map<string, EmergencyContactRecord[]>();
    patientIds.forEach(id => contactsMap.set(id, []));
    (data || []).forEach((record: any) => {
      const contacts = contactsMap.get(record.patient_id) || [];
      contacts.push(record as EmergencyContactRecord);
      contactsMap.set(record.patient_id, contacts);
    });

    return contactsMap;
  }

  /**
   * ✅ FIX N+1 PROBLEM: Batch fetch consents for multiple patients
   */
  private async fetchConsentsBatch(patientIds: string[]): Promise<Map<string, PatientConsentRecord[]>> {
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
    const consentsMap = new Map<string, PatientConsentRecord[]>();
    patientIds.forEach(id => consentsMap.set(id, []));
    (data || []).forEach((record: any) => {
      const consents = consentsMap.get(record.patient_id) || [];
      consents.push(record as PatientConsentRecord);
      consentsMap.set(record.patient_id, consents);
    });

    return consentsMap;
  }

  /**
   * ✅ FIX N+1 PROBLEM: Batch fetch links for multiple patients
   */
  private async fetchLinksBatch(patientIds: string[]): Promise<Map<string, PatientLinkRecord[]>> {
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
    const linksMap = new Map<string, PatientLinkRecord[]>();
    patientIds.forEach(id => linksMap.set(id, []));
    (data || []).forEach((record: any) => {
      const links = linksMap.get(record.patient_id) || [];
      links.push(record as PatientLinkRecord);
      linksMap.set(record.patient_id, links);
    });

    return linksMap;
  }

  /**
   * Save insurance info
   */
  private async saveInsurance(patientId: string, insuranceRecord: Partial<InsuranceRecord>): Promise<void> {
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
   */
  private async saveEmergencyContacts(patientId: string, contacts: Partial<EmergencyContactRecord>[]): Promise<void> {
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
   */
  private async saveConsents(patientId: string, consents: Partial<PatientConsentRecord>[]): Promise<void> {
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
   */
  private async saveLinks(patientId: string, links: Partial<PatientLinkRecord>[]): Promise<void> {
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
  private async publishDomainEvents(patient: Patient): Promise<void> {
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
        eventTypes: events.map((event: DomainEvent) => event.eventType)
      });
    } catch (error) {
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

interface RepositoryHealthStatus {
  status: 'healthy' | 'unhealthy';
  database?: string;
  circuitBreaker?: ReturnType<PatientRegistryCircuitBreaker['getStatus']>;
  timestamp: string;
  error?: string;
}
