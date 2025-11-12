/**
 * IDegradationService - Application Service Interface
 * V2 Clean Architecture + DDD Implementation
 * Defines contract for graceful degradation operations
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, HIPAA
 */

export enum ServiceMode {
  FULL_SERVICE = 'FULL_SERVICE',
  DEGRADED_SERVICE = 'DEGRADED_SERVICE',
  READ_ONLY = 'READ_ONLY',
  EMERGENCY_MODE = 'EMERGENCY_MODE'
}

export interface PatientOperationResult {
  success: boolean;
  patientId?: string;
  message?: string;
  errors?: string[];
  mode: ServiceMode;
  degradationReason?: string;
  metadata?: Record<string, unknown>;
}

export interface PatientSearchCriteria {
  patientId?: string;
  userId?: string;
  nationalId?: string;
  bhytNumber?: string;
}

export interface IDegradationService {
  /**
   * Get patient with graceful degradation
   * Falls back to cache if database is unavailable
   */
  getPatient(criteria: PatientSearchCriteria): Promise<PatientOperationResult>;

  /**
   * Search patients with graceful degradation
   * Falls back to cached results if database is unavailable
   */
  searchPatients(searchTerm: string): Promise<PatientOperationResult>;

  /**
   * Get current service mode
   */
  getCurrentMode(): ServiceMode;

  /**
   * Check if service is healthy
   */
  isHealthy(): Promise<boolean>;

  /**
   * Get service status
   */
  getStatus(): {
    mode: ServiceMode;
    degradationStartTime?: Date;
    cacheSize: number;
    config: any;
  };

  /**
   * Force recovery to full service
   */
  forceRecovery(): void;

  /**
   * Check if we should exit degraded mode
   */
  checkRecovery(): void;
}

