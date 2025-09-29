/**
 * Patient Repository Interface - Domain Layer
 * Repository pattern for Patient aggregate persistence
 * 
 * @author Hospital Management Team
 * @version 1.0.0
 * @compliance DDD, Repository Pattern, HIPAA
 */

import { Patient } from '../aggregates/patient.aggregate';
import { PatientId } from '../value-objects/patient-id';

/**
 * Patient Repository Interface
 * Defines contract for Patient aggregate persistence
 */
export interface IPatientRepository {
  /**
   * Save patient aggregate
   */
  save(patient: Patient): Promise<void>;

  /**
   * Find patient by ID
   */
  findById(patientId: PatientId): Promise<Patient | null>;

  /**
   * Find patient by phone number
   */
  findByPhoneNumber(phoneNumber: string): Promise<Patient | null>;

  /**
   * Find patient by email
   */
  findByEmail(email: string): Promise<Patient | null>;

  /**
   * Find patient by national ID
   */
  findByNationalId(nationalId: string): Promise<Patient | null>;

  /**
   * Find patient by insurance policy number
   */
  findByInsurancePolicyNumber(policyNumber: string): Promise<Patient | null>;

  /**
   * Find patients by criteria
   */
  findByCriteria(criteria: PatientSearchCriteria): Promise<Patient[]>;

  /**
   * Check if patient exists
   */
  exists(patientId: PatientId): Promise<boolean>;

  /**
   * Delete patient (soft delete for HIPAA compliance)
   */
  delete(patientId: PatientId): Promise<void>;

  /**
   * Get patient count
   */
  count(): Promise<number>;

  /**
   * Get patients with pagination
   */
  findWithPagination(
    offset: number, 
    limit: number, 
    criteria?: PatientSearchCriteria
  ): Promise<PaginatedPatients>;
}

/**
 * Patient search criteria
 */
export interface PatientSearchCriteria {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  nationalId?: string;
  dateOfBirthFrom?: Date;
  dateOfBirthTo?: Date;
  gender?: 'male' | 'female' | 'other';
  bloodType?: string;
  hasAllergies?: boolean;
  hasChronicConditions?: boolean;
  hasInsurance?: boolean;
  status?: 'active' | 'inactive' | 'suspended';
  registrationDateFrom?: Date;
  registrationDateTo?: Date;
  ageFrom?: number;
  ageTo?: number;
  city?: string;
  state?: string;
  insuranceProvider?: string;
  emergencyContactRequired?: boolean;
}

/**
 * Paginated patients result
 */
export interface PaginatedPatients {
  patients: Patient[];
  totalCount: number;
  offset: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Patient statistics interface
 */
export interface PatientStatistics {
  totalPatients: number;
  activePatients: number;
  inactivePatients: number;
  patientsWithInsurance: number;
  patientsWithAllergies: number;
  patientsWithChronicConditions: number;
  averageAge: number;
  genderDistribution: {
    male: number;
    female: number;
    other: number;
  };
  bloodTypeDistribution: Record<string, number>;
  registrationsByMonth: Array<{
    month: string;
    count: number;
  }>;
}

/**
 * Extended Patient Repository Interface
 * Additional methods for analytics and reporting
 */
export interface IPatientAnalyticsRepository extends IPatientRepository {
  /**
   * Get patient statistics
   */
  getStatistics(): Promise<PatientStatistics>;

  /**
   * Get patients by age group
   */
  findByAgeGroup(minAge: number, maxAge: number): Promise<Patient[]>;

  /**
   * Get patients with specific allergies
   */
  findByAllergies(allergies: string[]): Promise<Patient[]>;

  /**
   * Get patients with chronic conditions
   */
  findByChronicConditions(conditions: string[]): Promise<Patient[]>;

  /**
   * Get patients without insurance
   */
  findWithoutInsurance(): Promise<Patient[]>;

  /**
   * Get patients registered in date range
   */
  findByRegistrationDateRange(startDate: Date, endDate: Date): Promise<Patient[]>;

  /**
   * Get high-risk patients
   */
  findHighRiskPatients(): Promise<Patient[]>;

  /**
   * Get patients due for follow-up
   */
  findDueForFollowUp(): Promise<Patient[]>;

  /**
   * Get patients with incomplete profiles
   */
  findWithIncompleteProfiles(): Promise<Patient[]>;
}

/**
 * Patient Repository Events
 * Events that can be emitted by repository operations
 */
export interface PatientRepositoryEvents {
  patientSaved: {
    patientId: string;
    isNewPatient: boolean;
    timestamp: Date;
  };
  patientDeleted: {
    patientId: string;
    timestamp: Date;
  };
  patientNotFound: {
    searchCriteria: any;
    timestamp: Date;
  };
}

/**
 * Patient Repository Configuration
 */
export interface PatientRepositoryConfig {
  connectionString: string;
  schema: string;
  tableName: string;
  enableSoftDelete: boolean;
  enableAuditLog: boolean;
  cacheEnabled: boolean;
  cacheTTL: number;
  maxRetries: number;
  retryDelay: number;
}

/**
 * Patient Repository Error Types
 */
export class PatientRepositoryError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'PatientRepositoryError';
  }
}

export class PatientNotFoundError extends PatientRepositoryError {
  constructor(patientId: string) {
    super(`Patient not found: ${patientId}`, 'PATIENT_NOT_FOUND');
  }
}

export class DuplicatePatientError extends PatientRepositoryError {
  constructor(field: string, value: string) {
    super(`Patient already exists with ${field}: ${value}`, 'DUPLICATE_PATIENT');
  }
}

export class PatientValidationError extends PatientRepositoryError {
  constructor(message: string) {
    super(message, 'PATIENT_VALIDATION_ERROR');
  }
}

/**
 * Patient Repository Factory
 */
export interface IPatientRepositoryFactory {
  create(config: PatientRepositoryConfig): IPatientRepository;
  createAnalytics(config: PatientRepositoryConfig): IPatientAnalyticsRepository;
}
