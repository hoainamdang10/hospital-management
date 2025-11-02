/**
 * ITreatmentPlanRepository - Repository Interface
 * Defines contract for treatment plan persistence
 *
 * @author Hospital Management Team
 * @version 2.0.0
 * @compliance Clean Architecture, DDD, Repository Pattern
 */

import { TreatmentPlanAggregate, TreatmentPlanStatus } from '../aggregates/TreatmentPlan.aggregate';
import { TreatmentPlanId } from '../value-objects/TreatmentPlanId';

export interface TreatmentPlanSearchFilters {
  patientId?: string;
  medicalRecordId?: string;
  primaryDoctorId?: string;
  consultingDoctorId?: string;
  status?: TreatmentPlanStatus;
  statuses?: TreatmentPlanStatus[];
  diagnosis?: string;
  diagnosisCode?: string;
  fromDate?: Date;
  toDate?: Date;
  hasConsent?: boolean;
  minProgress?: number;
  maxProgress?: number;
  limit?: number;
  offset?: number;
}

export interface ITreatmentPlanRepository {
  /**
   * Save treatment plan (create or update)
   */
  save(treatmentPlan: TreatmentPlanAggregate): Promise<void>;

  /**
   * Find treatment plan by ID
   */
  findById(planId: TreatmentPlanId): Promise<TreatmentPlanAggregate | null>;

  /**
   * Find treatment plans by medical record
   */
  findByMedicalRecordId(
    medicalRecordId: string,
    options?: {
      limit?: number;
      offset?: number;
      includeArchived?: boolean;
    }
  ): Promise<TreatmentPlanAggregate[]>;

  /**
   * Find treatment plans by patient
   */
  findByPatientId(
    patientId: string,
    options?: {
      limit?: number;
      offset?: number;
      includeCompleted?: boolean;
      includeArchived?: boolean;
    }
  ): Promise<TreatmentPlanAggregate[]>;

  /**
   * Find treatment plans by primary doctor
   */
  findByPrimaryDoctor(
    doctorId: string,
    options?: {
      status?: TreatmentPlanStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<TreatmentPlanAggregate[]>;

  /**
   * Find treatment plans by consulting doctor
   */
  findByConsultingDoctor(
    doctorId: string,
    options?: {
      status?: TreatmentPlanStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<TreatmentPlanAggregate[]>;

  /**
   * Find treatment plans by status
   */
  findByStatus(
    status: TreatmentPlanStatus,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<TreatmentPlanAggregate[]>;

  /**
   * Find active treatment plans for patient
   */
  findActivePlansByPatient(patientId: string): Promise<TreatmentPlanAggregate[]>;

  /**
   * Find treatment plans pending consent
   */
  findPendingConsent(
    options?: {
      patientId?: string;
      doctorId?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<TreatmentPlanAggregate[]>;

  /**
   * Find treatment plans by diagnosis
   */
  findByDiagnosis(
    diagnosisCode: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<TreatmentPlanAggregate[]>;

  /**
   * Search treatment plans with advanced filters
   */
  search(filters: TreatmentPlanSearchFilters): Promise<TreatmentPlanAggregate[]>;

  /**
   * Count treatment plans matching filters
   */
  count(filters: Partial<TreatmentPlanSearchFilters>): Promise<number>;

  /**
   * Delete treatment plan (soft delete - archive)
   */
  delete(planId: TreatmentPlanId): Promise<void>;

  /**
   * Check if treatment plan exists
   */
  exists(planId: TreatmentPlanId): Promise<boolean>;

  /**
   * Get next sequence number for ID generation
   */
  getNextSequence(yearMonth: string): Promise<number>;

  /**
   * Find treatment plans by date range
   */
  findByDateRange(
    startDate: Date,
    endDate: Date,
    options?: {
      patientId?: string;
      doctorId?: string;
      status?: TreatmentPlanStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<TreatmentPlanAggregate[]>;

  /**
   * Get treatment plan summary statistics
   */
  getStatistics(filters?: {
    patientId?: string;
    doctorId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<{
    total: number;
    byStatus: Record<TreatmentPlanStatus, number>;
    withConsent: number;
    withoutConsent: number;
    averageProgress: number;
    completionRate: number;
  }>;
}
