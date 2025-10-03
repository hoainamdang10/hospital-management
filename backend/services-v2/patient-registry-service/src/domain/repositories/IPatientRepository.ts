/**
 * IPatientRepository - Repository Interface
 * Defines contract for patient data access
 * 
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern
 */

import { Patient } from '../aggregates/Patient';
import { PatientId } from '../value-objects/PatientId';

export interface IPatientRepository {
  /**
   * Find patient by ID
   */
  findById(patientId: PatientId): Promise<Patient | null>;

  /**
   * Find patient by user ID
   */
  findByUserId(userId: string): Promise<Patient | null>;

  /**
   * Find patient by national ID
   */
  findByNationalId(nationalId: string): Promise<Patient | null>;

  /**
   * Save patient (create or update)
   */
  save(patient: Patient): Promise<void>;

  /**
   * Delete patient (soft delete)
   */
  delete(patientId: PatientId): Promise<void>;

  /**
   * Find patients with filters
   */
  findWithFilters(
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
  ): Promise<{
    patients: Patient[];
    total: number;
  }>;

  /**
   * Search patients by term
   */
  searchPatients(
    searchTerm: string,
    filters?: {
      isActive?: boolean;
    },
    pagination?: {
      page: number;
      limit: number;
    }
  ): Promise<{
    patients: Patient[];
    total: number;
  }>;

  /**
   * Get repository health status
   */
  getHealthStatus(): Promise<any>;
}

