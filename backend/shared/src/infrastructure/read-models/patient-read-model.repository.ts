/**
 * Patient Read Model Repository Interface - CQRS Infrastructure
 * Repository for optimized patient read models
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance CQRS, Performance Optimization, HIPAA
 */

/**
 * Patient Healthcare View - Optimized read model
 */
export interface PatientHealthcareView {
  // Basic patient information
  patient_id: string;
  full_name: string;
  date_of_birth: Date;
  gender: string;
  phone_number: string;
  email?: string;
  status: string;

  // Medical information
  blood_type?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  current_medications?: any;
  medical_history?: string;
  family_medical_history?: string;

  // Healthcare metrics
  total_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  last_appointment_date?: Date;
  next_appointment_date?: Date;
  total_medical_records: number;
  last_medical_record_date?: Date;

  // FHIR compliance
  fhir_compliance_score: number;
  fhir_last_validated: Date;

  // Emergency contact
  emergency_contact_name?: string;
  emergency_contact_relationship?: string;
  emergency_contact_phone?: string;
  emergency_contact_alternate_phone?: string;
  emergency_contact_email?: string;

  // Insurance information
  insurance_provider?: string;
  insurance_policy_number?: string;
  insurance_coverage_type?: string;
  insurance_is_active?: boolean;
  insurance_expiration_date?: Date;

  // Audit information
  created_at: Date;
  updated_at: Date;
  last_sync_at: Date;
}

/**
 * Patient Appointment Summary - Optimized for appointment queries
 */
export interface PatientAppointmentSummary {
  patient_id: string;
  upcoming_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  next_appointment_date?: Date;
  last_appointment_date?: Date;
  total_appointment_duration: number; // in minutes
  average_appointment_duration: number;
  preferred_appointment_time?: string;
  most_visited_department?: string;
  last_sync_at: Date;
}

/**
 * Patient Medical Records Summary - Optimized for medical history queries
 */
export interface PatientMedicalRecordsSummary {
  patient_id: string;
  total_records: number;
  last_record_date?: Date;
  record_types: Record<string, number>;
  diagnoses_count: number;
  prescriptions_count: number;
  lab_results_count: number;
  imaging_studies_count: number;
  procedures_count: number;
  most_recent_diagnosis?: string;
  most_recent_prescription?: string;
  critical_alerts_count: number;
  last_sync_at: Date;
}

/**
 * Patient Search Result - Optimized for search operations
 */
export interface PatientSearchResult {
  patient_id: string;
  full_name: string;
  date_of_birth: Date;
  age: number;
  gender: string;
  phone_number: string;
  email?: string;
  status: string;
  has_allergies: boolean;
  has_chronic_conditions: boolean;
  has_insurance: boolean;
  last_appointment_date?: Date;
  registration_date: Date;
  search_score?: number; // For relevance ranking
}

/**
 * Patient Analytics Data - For dashboard and reporting
 */
export interface PatientAnalyticsData {
  patient_id: string;
  age_group: string;
  gender: string;
  has_insurance: boolean;
  insurance_provider?: string;
  chronic_conditions_count: number;
  allergies_count: number;
  total_appointments: number;
  total_medical_records: number;
  registration_month: string;
  last_visit_month?: string;
  risk_level: 'low' | 'medium' | 'high';
  fhir_compliance_score: number;
}

/**
 * Patient Read Model Repository Interface
 */
export interface IPatientReadModelRepository {
  /**
   * Get patient healthcare view by ID
   */
  getPatientHealthcareView(patientId: string): Promise<PatientHealthcareView | null>;

  /**
   * Get multiple patient healthcare views
   */
  getPatientHealthcareViews(patientIds: string[]): Promise<PatientHealthcareView[]>;

  /**
   * Get patient appointment summary
   */
  getPatientAppointmentSummary(patientId: string): Promise<PatientAppointmentSummary | null>;

  /**
   * Get patient medical records summary
   */
  getPatientMedicalRecordsSummary(patientId: string): Promise<PatientMedicalRecordsSummary | null>;

  /**
   * Search patients with optimized query
   */
  searchPatients(criteria: PatientSearchCriteria): Promise<PatientSearchResult[]>;

  /**
   * Search patients with pagination
   */
  searchPatientsWithPagination(
    criteria: PatientSearchCriteria,
    offset: number,
    limit: number
  ): Promise<{
    results: PatientSearchResult[];
    totalCount: number;
    hasNextPage: boolean;
  }>;

  /**
   * Get patient analytics data
   */
  getPatientAnalyticsData(patientIds?: string[]): Promise<PatientAnalyticsData[]>;

  /**
   * Get patients by age group
   */
  getPatientsByAgeGroup(minAge: number, maxAge: number): Promise<PatientSearchResult[]>;

  /**
   * Get patients with specific conditions
   */
  getPatientsWithConditions(conditions: string[]): Promise<PatientSearchResult[]>;

  /**
   * Get patients without insurance
   */
  getPatientsWithoutInsurance(): Promise<PatientSearchResult[]>;

  /**
   * Get high-risk patients
   */
  getHighRiskPatients(): Promise<PatientSearchResult[]>;

  /**
   * Get patients due for follow-up
   */
  getPatientsDueForFollowUp(): Promise<PatientSearchResult[]>;

  /**
   * Refresh patient read model data
   */
  refreshPatientData(patientId: string): Promise<void>;

  /**
   * Bulk refresh patient read model data
   */
  bulkRefreshPatientData(patientIds: string[]): Promise<void>;

  /**
   * Get read model sync status
   */
  getSyncStatus(patientId: string): Promise<{
    lastSyncAt: Date;
    syncStatus: 'synced' | 'pending' | 'error';
    errorMessage?: string;
  }>;
}

/**
 * Patient Search Criteria for read models
 */
export interface PatientSearchCriteria {
  // Basic search
  searchTerm?: string; // Full-text search across name, phone, email
  patientId?: string;
  fullName?: string;
  phoneNumber?: string;
  email?: string;

  // Demographics
  ageFrom?: number;
  ageTo?: number;
  gender?: 'male' | 'female' | 'other';
  dateOfBirthFrom?: Date;
  dateOfBirthTo?: Date;

  // Medical criteria
  bloodType?: string;
  hasAllergies?: boolean;
  allergies?: string[];
  hasChronicConditions?: boolean;
  chronicConditions?: string[];
  riskLevel?: 'low' | 'medium' | 'high';

  // Insurance criteria
  hasInsurance?: boolean;
  insuranceProvider?: string;
  insuranceStatus?: 'active' | 'expired' | 'pending';

  // Appointment criteria
  hasUpcomingAppointments?: boolean;
  lastAppointmentFrom?: Date;
  lastAppointmentTo?: Date;
  appointmentCountFrom?: number;
  appointmentCountTo?: number;

  // Status criteria
  status?: 'active' | 'inactive' | 'suspended';
  registrationDateFrom?: Date;
  registrationDateTo?: Date;

  // FHIR compliance
  fhirComplianceScoreFrom?: number;
  fhirComplianceScoreTo?: number;

  // Sorting and pagination
  sortBy?: 'name' | 'age' | 'registration_date' | 'last_appointment' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  includeInactive?: boolean;
}

/**
 * Read Model Update Events
 */
export interface ReadModelUpdateEvent {
  patientId: string;
  eventType: 'patient_registered' | 'patient_updated' | 'patient_deactivated' | 'medical_history_updated';
  eventData: any;
  timestamp: Date;
  version: number;
}

/**
 * Read Model Projection Interface
 */
export interface IPatientReadModelProjection {
  /**
   * Handle domain events and update read models
   */
  handleEvent(event: ReadModelUpdateEvent): Promise<void>;

  /**
   * Rebuild read model from event stream
   */
  rebuildFromEvents(patientId: string): Promise<void>;

  /**
   * Get projection status
   */
  getProjectionStatus(): Promise<{
    lastProcessedEvent: string;
    lastProcessedAt: Date;
    isHealthy: boolean;
    errorCount: number;
  }>;
}

/**
 * Read Model Repository Configuration
 */
export interface ReadModelRepositoryConfig {
  connectionString: string;
  readSchema: string;
  cacheEnabled: boolean;
  cacheTTL: number;
  maxConcurrentQueries: number;
  queryTimeout: number;
  enableQueryLogging: boolean;
  enablePerformanceMetrics: boolean;
}

/**
 * Read Model Repository Factory
 */
export interface IPatientReadModelRepositoryFactory {
  create(config: ReadModelRepositoryConfig): IPatientReadModelRepository;
  createProjection(config: ReadModelRepositoryConfig): IPatientReadModelProjection;
}
